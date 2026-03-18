import { state } from '../core/state.js';
import { events } from '../core/events.js';

const VIEWS = [
  { id: 'top', label: 'Góra' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Bok' },
  { id: '3d', label: '3D' },
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

  // Update view tabs on state change
  events.on('state:ui', (ui) => {
    viewTabs.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === ui.activeView);
    });
    const canvas = document.getElementById('main-canvas');
    const three = document.getElementById('three-container');
    if (ui.activeView === '3d') {
      canvas.style.display = 'none';
      three.style.display = 'block';
    } else {
      canvas.style.display = 'block';
      three.style.display = 'none';
    }
    // Update clearance button label
    const cb = document.getElementById('toggle-clearance');
    if (cb) cb.textContent = ui.showClearance ? 'Strefy ✓' : 'Strefy';
  });

  return { toolbar, left, right, canvasArea, statusbar };
}
