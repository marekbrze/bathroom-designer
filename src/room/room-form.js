import { state } from '../core/state.js';
import { events } from '../core/events.js';

export function createRoomForm(container) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel__header">Wymiary pomieszczenia</div>
    <div class="panel__body">
      <div class="form-row">
        <div class="form-group">
          <label>Szerokość (cm)</label>
          <input type="number" id="room-width" min="50" max="1000" step="1">
        </div>
        <div class="form-group">
          <label>Głębokość (cm)</label>
          <input type="number" id="room-depth" min="50" max="1000" step="1">
        </div>
      </div>
      <div class="form-group">
        <label>Wysokość (cm)</label>
        <input type="number" id="room-height" min="100" max="400" step="1">
      </div>
    </div>
  `;
  container.appendChild(panel);

  const widthInput = panel.querySelector('#room-width');
  const depthInput = panel.querySelector('#room-depth');
  const heightInput = panel.querySelector('#room-height');

  function syncFromState() {
    const room = state.getRoom();
    widthInput.value = room.width;
    depthInput.value = room.depth;
    heightInput.value = room.height;
    updateStatusbar(room);
  }

  function updateStatusbar(room) {
    const el = document.getElementById('status-room');
    if (el) {
      el.textContent = `Pomieszczenie: ${room.width} × ${room.depth} × ${room.height} cm`;
    }
  }

  function onInput() {
    const w = parseInt(widthInput.value) || 0;
    const d = parseInt(depthInput.value) || 0;
    const h = parseInt(heightInput.value) || 0;
    if (w >= 50 && w <= 1000 && d >= 50 && d <= 1000 && h >= 100 && h <= 400) {
      state.updateRoom({ width: w, depth: d, height: h });
    }
  }

  widthInput.addEventListener('input', onInput);
  depthInput.addEventListener('input', onInput);
  heightInput.addEventListener('input', onInput);

  events.on('state:room', () => syncFromState());

  // Toggle collapse
  panel.querySelector('.panel__header').addEventListener('click', () => {
    panel.classList.toggle('panel--collapsed');
  });

  syncFromState();
}
