import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { DEFAULTS, COLORS } from '../core/constants.js';
import { clamp, screenToWorld } from '../core/utils.js';

export function createRenderer(canvasEl) {
  const ctx = canvasEl.getContext('2d');
  let dirty = true;
  let drawFn = null;
  let animId = null;

  function resize() {
    const parent = canvasEl.parentElement;
    const tabsHeight = 30;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight - tabsHeight;
    canvasEl.width = w * dpr;
    canvasEl.height = h * dpr;
    canvasEl.style.width = w + 'px';
    canvasEl.style.height = h + 'px';
    canvasEl.style.marginTop = tabsHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }

  function markDirty() {
    dirty = true;
  }

  function loop() {
    if (dirty && drawFn) {
      dirty = false;
      const w = canvasEl.clientWidth;
      const h = canvasEl.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, w, h);
      drawFn(ctx, w, h);
    }
    animId = requestAnimationFrame(loop);
  }

  // Pan & Zoom
  let isPanning = false;
  let lastMouse = { x: 0, y: 0 };

  canvasEl.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning = true;
      lastMouse = { x: e.clientX, y: e.clientY };
      canvasEl.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning) {
      const ui = state.getUI();
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      state.update('ui.panOffset', { x: ui.panOffset.x + dx, y: ui.panOffset.y + dy });
      lastMouse = { x: e.clientX, y: e.clientY };
      dirty = true;
    }
    // Update statusbar coords
    const rect = canvasEl.getBoundingClientRect();
    const ui = state.getUI();
    const world = screenToWorld(
      e.clientX - rect.left,
      e.clientY - rect.top,
      ui.zoom,
      ui.panOffset
    );
    const coordsEl = document.getElementById('status-coords');
    if (coordsEl) {
      coordsEl.textContent = `X: ${Math.round(world.x)} Y: ${Math.round(world.y)} cm`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      canvasEl.style.cursor = '';
    }
  });

  canvasEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    const ui = state.getUI();
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const oldZoom = ui.zoom;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = clamp(oldZoom * factor, DEFAULTS.zoom.min, DEFAULTS.zoom.max);

    const newPan = {
      x: mx - (mx - ui.panOffset.x) * (newZoom / oldZoom),
      y: my - (my - ui.panOffset.y) * (newZoom / oldZoom),
    };

    state.update('ui.zoom', newZoom);
    state.update('ui.panOffset', newPan);

    const zoomEl = document.getElementById('status-zoom');
    if (zoomEl) zoomEl.textContent = `Zoom: ${Math.round(newZoom * 100)}%`;

    dirty = true;
  }, { passive: false });

  // React to state changes
  events.on('state:change', markDirty);

  window.addEventListener('resize', resize);
  resize();

  return {
    ctx,
    canvas: canvasEl,
    setDraw(fn) { drawFn = fn; dirty = true; },
    start() { if (!animId) loop(); },
    stop() { cancelAnimationFrame(animId); animId = null; },
    markDirty,
    resize,
  };
}
