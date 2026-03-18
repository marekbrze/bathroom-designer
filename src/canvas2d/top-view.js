import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { DEFAULTS } from '../core/constants.js';
import { drawGrid, drawRoom, drawFixture, drawDoor, drawClearanceZone, drawClearanceOverlaps, drawDoorClearanceZone } from './drawing-utils.js';
import { getCatalogItem } from '../fixtures/fixture-catalog.js';
import { getAABB, aabbOverlap, isInsideRoom, screenToWorld } from '../core/utils.js';

export function createTopView(renderer) {
  let draggingFixture = null;
  let dragOffset = { x: 0, y: 0 };
  let isPanning = false;
  let lastMouse = { x: 0, y: 0 };

  function draw(ctx, w, h) {
    const ui = state.getUI();
    const room = state.getRoom();
    const fixtures = state.getFixtures();

    drawGrid(ctx, w, h, ui.zoom, ui.panOffset, DEFAULTS.grid.size);
    drawRoom(ctx, room, ui.zoom, ui.panOffset);

    // Build catalog map for clearance lookups
    const catalogMap = new Map();
    fixtures.forEach(f => {
      if (!catalogMap.has(f.catalogId)) {
        catalogMap.set(f.catalogId, getCatalogItem(f.catalogId));
      }
    });

    // Draw clearance zones (behind fixtures)
    if (ui.showClearance) {
      fixtures.forEach(f => {
        const cat = catalogMap.get(f.catalogId);
        if (cat) {
          f._catalog = cat;
          if (f.isDoor) {
            drawDoorClearanceZone(ctx, f, ui.zoom, ui.panOffset);
          } else {
            drawClearanceZone(ctx, f, ui.zoom, ui.panOffset);
          }
        }
      });
      drawClearanceOverlaps(ctx, fixtures, catalogMap, ui.zoom, ui.panOffset);
    }

    // Draw fixtures
    fixtures.forEach(f => {
      const isSelected = f.id === ui.selectedFixtureId;
      const hasCollision = checkCollision(f, fixtures, room);
      drawFixture(ctx, f, ui.zoom, ui.panOffset, isSelected, hasCollision);
      if (f.isDoor) {
        drawDoor(ctx, f, ui.zoom, ui.panOffset, isSelected);
      }
    });
  }

  function checkCollision(fixture, fixtures, room) {
    if (!isInsideRoom(fixture, room)) return true;
    const bb = getAABB(fixture);
    for (const other of fixtures) {
      if (other.id === fixture.id) continue;
      if (aabbOverlap(bb, getAABB(other))) return true;
    }
    return false;
  }

  // Click to select fixture
  renderer.canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.altKey) return;
    const ui = state.getUI();
    if (ui.activeView !== 'top') return;

    const rect = renderer.canvas.getBoundingClientRect();
    const world = screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      ui.zoom,
      ui.panOffset
    );

    const fixtures = state.getFixtures();
    let hit = null;
    // Reverse order so top-most first
    for (let i = fixtures.length - 1; i >= 0; i--) {
      const f = fixtures[i];
      const bb = getAABB(f);
      if (world.x >= bb.x && world.x <= bb.x + bb.width &&
          world.y >= bb.y && world.y <= bb.y + bb.depth) {
        hit = f;
        break;
      }
    }

    if (hit) {
      state.update('ui.selectedFixtureId', hit.id);
      draggingFixture = hit;
      dragOffset = { x: world.x - hit.x, y: world.y - hit.y };
      renderer.canvas.style.cursor = 'move';
    } else {
      state.update('ui.selectedFixtureId', null);
      isPanning = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      renderer.canvas.style.cursor = 'grabbing';
    }
  });

  renderer.canvas.addEventListener('mousemove', (e) => {
    const ui = state.getUI();
    const rect = renderer.canvas.getBoundingClientRect();

    if (isPanning) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      state.update('ui.panOffset', { x: ui.panOffset.x + dx, y: ui.panOffset.y + dy });
      lastMouse = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!draggingFixture) return;

    const world = screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      ui.zoom,
      ui.panOffset
    );

    const snap = DEFAULTS.grid.size;
    const newX = Math.round((world.x - dragOffset.x) / snap) * snap;
    const newY = Math.round((world.y - dragOffset.y) / snap) * snap;

    state.updateFixture(draggingFixture.id, { x: newX, y: newY });
  });

  window.addEventListener('mouseup', () => {
    if (draggingFixture) {
      draggingFixture = null;
      renderer.canvas.style.cursor = '';
    }
    if (isPanning) {
      isPanning = false;
      renderer.canvas.style.cursor = '';
    }
  });

  renderer.setDraw(draw);
  renderer.start();

  // Auto-center room on load and room change
  function centerRoom() {
    const room = state.getRoom();
    const cw = renderer.canvas.clientWidth;
    const ch = renderer.canvas.clientHeight;
    const margin = 80;
    const scaleX = (cw - margin * 2) / room.width;
    const scaleY = (ch - margin * 2) / room.depth;
    const zoom = Math.min(scaleX, scaleY, DEFAULTS.zoom.max);
    const panX = (cw - room.width * zoom) / 2;
    const panY = (ch - room.depth * zoom) / 2;
    state.update('ui.zoom', zoom);
    state.update('ui.panOffset', { x: panX, y: panY });
    const zoomEl = document.getElementById('status-zoom');
    if (zoomEl) zoomEl.textContent = `Zoom: ${Math.round(zoom * 100)}%`;
  }

  events.on('state:room', centerRoom);
  setTimeout(centerRoom, 50);

  return { draw };
}
