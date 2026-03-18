import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { DEFAULTS } from '../core/constants.js';
import { createTileZone, getZonesForWall, clampZoneToWall } from './tile-zone.js';

const WALL_COLORS = {
  floor: '#d4c4a8',
  north: '#e8e0d8',
  east: '#e0d8e8',
  south: '#d8e0e8',
  west: '#e8e8d8',
};

const WALL_LABELS = {
  floor: 'Podłoga',
  north: 'Ściana Północ',
  east: 'Ściana Wschód',
  south: 'Ściana Południe',
  west: 'Ściana Zachód',
};

const WALL_ORDER = ['north', 'east', 'south', 'west', 'floor'];
const GRID_SIZE = 10;

export function createTilesView(container) {
  let canvas = null;
  let ctx = null;
  let walls = [];
  let drawing = null;
  let dragging = null;
  let dragStart = { x: 0, y: 0 };
  let isPanning = false;
  let lastMouse = { x: 0, y: 0 };
  
  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'tiles-canvas';
    canvas.style.cssText = 'width:100%;height:100%;cursor:crosshair;';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');
    
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('dblclick', onDoubleClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    
    window.addEventListener('resize', resize);
    
    events.on('state:room', buildWalls);
    events.on('state:tileZones', render);
    events.on('state:tileSets', render);
    events.on('state:ui', onUIChange);
    
    buildWalls();
    resize();
    updateZoomDisplay();
  }

  function onUIChange(ui) {
    render();
    updateZoomDisplay();
  }

  function updateZoomDisplay() {
    const ui = state.getUI();
    if (ui.activeView === 'tiles') {
      const zoomEl = document.getElementById('status-zoom');
      if (zoomEl) zoomEl.textContent = `Zoom: ${Math.round(ui.tilesZoom * 100)}%`;
    }
  }
  
  function buildWalls() {
    const room = state.getRoom();
    walls = [
      { id: 'north', label: WALL_LABELS.north, width: room.width, height: room.height, color: WALL_COLORS.north },
      { id: 'east', label: WALL_LABELS.east, width: room.depth, height: room.height, color: WALL_COLORS.east },
      { id: 'south', label: WALL_LABELS.south, width: room.width, height: room.height, color: WALL_COLORS.south },
      { id: 'west', label: WALL_LABELS.west, width: room.depth, height: room.height, color: WALL_COLORS.west },
      { id: 'floor', label: WALL_LABELS.floor, width: room.width, height: room.depth, color: WALL_COLORS.floor },
    ];
    render();
  }
  
  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  
  function getLayout() {
    const w = canvas.clientWidth || container.clientWidth || 800;
    const h = canvas.clientHeight || container.clientHeight || 600;
    const ui = state.getUI();
    const zoom = ui.tilesZoom ?? DEFAULTS.zoom.initial;
    const pan = ui.tilesPanOffset ?? { x: 0, y: 0 };
    
    const padding = 20;
    const gap = 16;
    const labelHeight = 24;
    
    const room = state.getRoom();
    const maxWallWidth = Math.max(room.width, room.depth);
    const maxWallHeight = room.height;
    
    const availableWidth = w - padding * 2 - gap * 4;
    const availableHeight = h - padding * 2 - labelHeight - gap;
    
    const wallPixelWidth = availableWidth / 4;
    const scaleW = wallPixelWidth / maxWallWidth;
    const scaleH = (availableHeight * 0.7) / maxWallHeight;
    const baseScale = Math.min(scaleW, scaleH, 1);
    const scale = baseScale * zoom;
    
    const layout = [];
    let x = padding;
    const wallY = padding + labelHeight + gap;
    
    walls.forEach((wall, i) => {
      const w = wall.width * scale;
      const h = wall.height * scale;
      layout.push({
        wall,
        x: x + pan.x,
        y: wallY + pan.y,
        width: w,
        height: h,
        scale,
        baseScale,
      });
      x += w + gap * zoom;
    });
    
    const floorLayout = layout.find(l => l.wall.id === 'floor');
    if (floorLayout) {
      const firstWallHeight = layout[0].height;
      floorLayout.y = wallY + firstWallHeight + gap * 2 * zoom + pan.y;
    }
    
    return { layout, scale, baseScale };
  }
  
  function render() {
    if (!ctx) return;
    
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    
    const { layout, scale, baseScale } = getLayout();
    const zones = state.getTileZones();
    const tileSets = state.getTileSets();
    const ui = state.getUI();
    
    layout.forEach(item => {
      const { wall, x, y, width, height, baseScale: itemBaseScale } = item;
      
      ctx.fillStyle = wall.color;
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
      
      drawGrid(x, y, width, height, wall.width, wall.height, scale);
      
      ctx.font = '12px system-ui';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText(`${wall.label} (${wall.width}×${wall.height} cm)`, x, y - 6);
      
      const wallZones = getZonesForWall(zones, wall.id);
      wallZones.forEach(zone => {
        const ts = tileSets.find(t => t.id === zone.tileSetId);
        const isSelected = zone.id === ui.selectedTileZoneId;
        
        const zx = x + zone.x * scale;
        const zy = y + zone.y * scale;
        const zw = zone.width * scale;
        const zh = zone.height * scale;
        
        ctx.fillStyle = ts ? ts.color + 'aa' : '#88888888';
        ctx.fillRect(zx, zy, zw, zh);
        
        ctx.strokeStyle = isSelected ? '#ff6600' : (ts ? ts.color : '#888');
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(zx, zy, zw, zh);
        
        if (ts) {
          ctx.font = '10px system-ui';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText(ts.name, zx + zw / 2, zy + zh / 2 + 4);
        }
      });
    });
    
    if (drawing) {
      const { wallId, startX, startY, endX, endY } = drawing;
      const item = layout.find(l => l.wall.id === wallId);
      if (item) {
        const zx = item.x + Math.min(startX, endX) * item.scale;
        const zy = item.y + Math.min(startY, endY) * item.scale;
        const zw = Math.abs(endX - startX) * item.scale;
        const zh = Math.abs(endY - startY) * item.scale;
        
        ctx.fillStyle = 'rgba(68, 170, 255, 0.3)';
        ctx.strokeStyle = '#4af';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.fillRect(zx, zy, zw, zh);
        ctx.strokeRect(zx, zy, zw, zh);
        ctx.setLineDash([]);
      }
    }
  }
  
  function drawGrid(x, y, width, height, wallW, wallH, scale) {
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    
    const step = GRID_SIZE * scale;
    const cols = Math.ceil(wallW / GRID_SIZE);
    const rows = Math.ceil(wallH / GRID_SIZE);
    
    for (let i = 0; i <= cols; i++) {
      const px = x + i * step;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + height);
      ctx.stroke();
    }
    
    for (let i = 0; i <= rows; i++) {
      const py = y + i * step;
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x + width, py);
      ctx.stroke();
    }
  }
  
  function getWallAt(px, py) {
    const { layout } = getLayout();
    for (const item of layout) {
      if (px >= item.x && px <= item.x + item.width &&
          py >= item.y && py <= item.y + item.height) {
        return item;
      }
    }
    return null;
  }
  
  function getZoneAt(px, py) {
    const { layout } = getLayout();
    const zones = state.getTileZones();
    
    for (const item of layout) {
      if (px >= item.x && px <= item.x + item.width &&
          py >= item.y && py <= item.y + item.height) {
        const wallZones = getZonesForWall(zones, item.wall.id);
        for (const zone of wallZones) {
          const zx = item.x + zone.x * item.scale;
          const zy = item.y + zone.y * item.scale;
          const zw = zone.width * item.scale;
          const zh = zone.height * item.scale;
          if (px >= zx && px <= zx + zw && py >= zy && py <= zy + zh) {
            return { zone, layout: item };
          }
        }
      }
    }
    return null;
  }
  
  function snapToGrid(value) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  function onWheel(e) {
    e.preventDefault();
    const ui = state.getUI();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const oldZoom = ui.tilesZoom ?? DEFAULTS.zoom.initial;
    const oldPan = ui.tilesPanOffset ?? { x: 0, y: 0 };
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = Math.max(DEFAULTS.zoom.min, Math.min(DEFAULTS.zoom.max, oldZoom * factor));

    const newPan = {
      x: mx - (mx - oldPan.x) * (newZoom / oldZoom),
      y: my - (my - oldPan.y) * (newZoom / oldZoom),
    };

    state.update('ui.tilesZoom', newZoom);
    state.update('ui.tilesPanOffset', newPan);
    updateZoomDisplay();
    render();
  }
  
  function onMouseDown(e) {
    if (e.button !== 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const hit = getZoneAt(px, py);
    if (hit) {
      state.selectTileZone(hit.zone.id);
      dragging = hit;
      dragStart = { x: px, y: py };
      return;
    }
    
    state.selectTileZone(null);
    
    const wallItem = getWallAt(px, py);
    if (wallItem) {
      const activeTileSetId = state.getUI().activeTileSetId;
      if (activeTileSetId) {
        const wallX = (px - wallItem.x) / wallItem.scale;
        const wallY = (py - wallItem.y) / wallItem.scale;
        
        drawing = {
          wallId: wallItem.wall.id,
          startX: snapToGrid(wallX),
          startY: snapToGrid(wallY),
          endX: snapToGrid(wallX),
          endY: snapToGrid(wallY),
        };
        
        render();
        return;
      }
    }
    
    isPanning = true;
    lastMouse = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
  }
  
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (isPanning) {
      const ui = state.getUI();
      const oldPan = ui.tilesPanOffset ?? { x: 0, y: 0 };
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      state.update('ui.tilesPanOffset', { x: oldPan.x + dx, y: oldPan.y + dy });
      lastMouse = { x: e.clientX, y: e.clientY };
      render();
      return;
    }
    
    if (drawing) {
      const wallItem = getWallAt(px, py);
      if (wallItem && wallItem.wall.id === drawing.wallId) {
        const wallX = (px - wallItem.x) / wallItem.scale;
        const wallY = (py - wallItem.y) / wallItem.scale;
        drawing.endX = snapToGrid(wallX);
        drawing.endY = snapToGrid(wallY);
      }
      render();
      return;
    }
    
    if (dragging) {
      const dx = (px - dragStart.x) / dragging.layout.scale;
      const dy = (py - dragStart.y) / dragging.layout.scale;
      
      const wall = dragging.layout.wall;
      const zone = dragging.zone;
      
      const newX = Math.max(0, Math.min(snapToGrid(zone.x + dx), wall.width - zone.width));
      const newY = Math.max(0, Math.min(snapToGrid(zone.y + dy), wall.height - zone.height));
      
      state.updateTileZone(zone.id, { x: newX, y: newY });
      dragging.zone = { ...zone, x: newX, y: newY };
      dragStart = { x: px, y: py };
    }
  }
  
  function onMouseUp(e) {
    if (isPanning) {
      isPanning = false;
      canvas.style.cursor = 'crosshair';
      return;
    }

    if (drawing) {
      const wall = walls.find(w => w.id === drawing.wallId);
      if (wall) {
        const x = Math.min(drawing.startX, drawing.endX);
        const y = Math.min(drawing.startY, drawing.endY);
        const width = Math.abs(drawing.endX - drawing.startX);
        const height = Math.abs(drawing.endY - drawing.startY);
        
        if (width >= GRID_SIZE && height >= GRID_SIZE) {
          const activeTileSetId = state.getUI().activeTileSetId;
          const zone = createTileZone({
            wallId: drawing.wallId,
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.min(width, wall.width - x),
            height: Math.min(height, wall.height - y),
            tileSetId: activeTileSetId,
          });
          const clamped = clampZoneToWall(zone, wall.width, wall.height);
          state.addTileZone(clamped);
        }
      }
      drawing = null;
      render();
    }
    
    dragging = null;
  }
  
  function onDoubleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const hit = getZoneAt(px, py);
    if (hit) {
      state.removeTileZone(hit.zone.id);
    }
  }
  
  init();
  
  return {
    render,
    destroy() {
      window.removeEventListener('resize', resize);
    },
  };
}
