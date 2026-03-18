import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { DEFAULTS } from '../core/constants.js';

const VIEWS = [
  { id: 'top', label: 'Góra' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Bok' },
  { id: '3d', label: '3D' },
  { id: 'tiles', label: 'Płytki' },
];

export function createShell() {
  const app = document.getElementById('app');

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';
  toolbar.innerHTML = `<span class="toolbar__title">Projektant Łazienki</span>
    <button class="btn btn--small" id="toggle-clearance" title="Pokaż/ukryj strefy użytkowania (C)">Strefy ✓</button>`;
  app.appendChild(toolbar);

  // Left sidebar
  const left = document.createElement('div');
  left.className = 'left-sidebar';
  left.id = 'left-sidebar';
  app.appendChild(left);

  // Canvas area
  const canvasArea = document.createElement('div');
  canvasArea.className = 'canvas-area';
  canvasArea.id = 'canvas-area';

  // View tabs
  const viewTabs = document.createElement('div');
  viewTabs.className = 'view-tabs';
  viewTabs.id = 'view-tabs';
  VIEWS.forEach(v => {
    const btn = document.createElement('button');
    btn.textContent = v.label;
    btn.dataset.view = v.id;
    if (v.id === state.getUI().activeView) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.update('ui.activeView', v.id);
    });
    viewTabs.appendChild(btn);
  });
  canvasArea.appendChild(viewTabs);

  // Canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'main-canvas';
  canvasArea.appendChild(canvas);

  // 3D container (hidden by default)
  const container3d = document.createElement('div');
  container3d.id = 'three-container';
  container3d.style.cssText = 'position:absolute;inset:0;top:30px;display:none;';
  canvasArea.appendChild(container3d);

  // Tiles container (hidden by default)
  const containerTiles = document.createElement('div');
  containerTiles.id = 'tiles-container';
  containerTiles.style.cssText = 'position:absolute;inset:0;top:30px;display:none;background:var(--bg);overflow:hidden;';
  canvasArea.appendChild(containerTiles);

  app.appendChild(canvasArea);

  // Right sidebar
  const right = document.createElement('div');
  right.className = 'right-sidebar';
  right.id = 'right-sidebar';
  app.appendChild(right);

  // Statusbar
  const statusbar = document.createElement('div');
  statusbar.className = 'statusbar';
  statusbar.id = 'statusbar';
  statusbar.innerHTML = `
    <span class="zoom-controls">
      <button class="btn-zoom" id="zoom-out" title="Oddal (−)">−</button>
      <button class="btn-zoom" id="zoom-reset" title="Wycentruj (⌂)">⌂</button>
      <button class="btn-zoom" id="zoom-in" title="Przybliż (+)">+</button>
    </span>
    <span id="status-coords">X: — Y: —</span>
    <span id="status-zoom">Zoom: 100%</span>
    <span id="status-room"></span>
  `;
  app.appendChild(statusbar);

  // Toggle clearance button
  const clearanceBtn = document.getElementById('toggle-clearance');
  clearanceBtn.addEventListener('click', () => {
    const ui = state.getUI();
    state.update('ui.showClearance', !ui.showClearance);
  });

  function getZoomState() {
    const ui = state.getUI();
    if (ui.activeView === 'tiles') {
      return { zoom: ui.tilesZoom, panOffset: ui.tilesPanOffset, zoomKey: 'ui.tilesZoom', panKey: 'ui.tilesPanOffset' };
    }
    return { zoom: ui.zoom, panOffset: ui.panOffset, zoomKey: 'ui.zoom', panKey: 'ui.panOffset' };
  }

  function applyZoom(factor) {
    const { zoom, zoomKey } = getZoomState();
    const newZoom = Math.max(DEFAULTS.zoom.min, Math.min(DEFAULTS.zoom.max, zoom * factor));
    state.update(zoomKey, newZoom);
    const zoomEl = document.getElementById('status-zoom');
    if (zoomEl) zoomEl.textContent = `Zoom: ${Math.round(newZoom * 100)}%`;
  }

  function resetZoom() {
    const ui = state.getUI();
    const room = state.getRoom();
    
    if (ui.activeView === 'tiles') {
      state.update('ui.tilesZoom', DEFAULTS.zoom.initial);
      state.update('ui.tilesPanOffset', { x: 0, y: 0 });
      const zoomEl = document.getElementById('status-zoom');
      if (zoomEl) zoomEl.textContent = `Zoom: ${Math.round(DEFAULTS.zoom.initial * 100)}%`;
    } else {
      const canvas = document.getElementById('main-canvas');
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
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
  }

  document.getElementById('zoom-in').addEventListener('click', () => applyZoom(1.25));
  document.getElementById('zoom-out').addEventListener('click', () => applyZoom(0.8));
  document.getElementById('zoom-reset').addEventListener('click', resetZoom);

  // Update view tabs on state change
  events.on('state:ui', (ui) => {
    viewTabs.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === ui.activeView);
    });
    const canvas = document.getElementById('main-canvas');
    const three = document.getElementById('three-container');
    const tiles = document.getElementById('tiles-container');
    
    canvas.style.display = 'none';
    three.style.display = 'none';
    tiles.style.display = 'none';
    
    if (ui.activeView === '3d') {
      three.style.display = 'block';
    } else if (ui.activeView === 'tiles') {
      tiles.style.display = 'block';
    } else {
      canvas.style.display = 'block';
    }
    
    // Update clearance button label
    const cb = document.getElementById('toggle-clearance');
    if (cb) cb.textContent = ui.showClearance ? 'Strefy ✓' : 'Strefy';

    // Update zoom display based on active view
    const zoomEl = document.getElementById('status-zoom');
    if (zoomEl) {
      const zoomValue = ui.activeView === 'tiles' ? ui.tilesZoom : ui.zoom;
      zoomEl.textContent = `Zoom: ${Math.round(zoomValue * 100)}%`;
    }
  });

  return { toolbar, left, right, canvasArea, statusbar };
}
