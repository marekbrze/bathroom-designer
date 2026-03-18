import { getCatalog, CATEGORIES, addCustomItem } from './fixture-catalog.js';
import { createFixture } from './fixture-model.js';
import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { generateId } from '../core/utils.js';

export function createFixturePanel(container) {
  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <div class="panel__header">Wyposażenie</div>
    <div class="panel__body">
      <div class="catalog-list" id="fixture-catalog"></div>
      <div style="margin-top:8px">
        <button class="btn btn--small btn--primary" id="add-custom-btn">+ Własny element</button>
      </div>
    </div>
  `;
  container.appendChild(panel);

  const catalogEl = panel.querySelector('#fixture-catalog');

  function render() {
    const items = getCatalog();
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    catalogEl.innerHTML = '';
    for (const [cat, catItems] of Object.entries(grouped)) {
      const header = document.createElement('div');
      header.className = 'catalog-category';
      header.textContent = CATEGORIES[cat] || cat;
      catalogEl.appendChild(header);

      catItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'catalog-item';
        el.draggable = true;
        el.dataset.catalogId = item.id;
        el.innerHTML = `
          <div class="catalog-item__icon">${item.icon || '📦'}</div>
          <div class="catalog-item__info">
            <div class="catalog-item__name">${item.name}</div>
            <div class="catalog-item__dims">${item.width}×${item.depth}×${item.height} cm</div>
          </div>
        `;

        el.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', item.id);
          e.dataTransfer.effectAllowed = 'copy';
        });

        // Double-click to place at center
        el.addEventListener('dblclick', () => {
          const room = state.getRoom();
          const f = createFixture(item.id, Math.round((room.width - item.width) / 2), Math.round((room.depth - item.depth) / 2));
          if (f) {
            state.addFixture(f);
            state.update('ui.selectedFixtureId', f.id);
          }
        });

        catalogEl.appendChild(el);
      });
    }
  }

  // Custom element button
  panel.querySelector('#add-custom-btn').addEventListener('click', () => {
    showCustomDialog();
  });

  // Toggle collapse
  panel.querySelector('.panel__header').addEventListener('click', () => {
    panel.classList.toggle('panel--collapsed');
  });

  render();
  events.on('state:fixtures', render);

  // Drop on canvas
  const canvasArea = document.getElementById('canvas-area');
  canvasArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvasArea.addEventListener('drop', (e) => {
    e.preventDefault();
    const catalogId = e.dataTransfer.getData('text/plain');
    if (!catalogId) return;

    const canvas = document.getElementById('main-canvas');
    const rect = canvas.getBoundingClientRect();
    const ui = state.getUI();

    const worldX = (e.clientX - rect.left - ui.panOffset.x) / ui.zoom;
    const worldY = (e.clientY - rect.top - ui.panOffset.y) / ui.zoom;

    const snap = 10;
    const x = Math.round(worldX / snap) * snap;
    const y = Math.round(worldY / snap) * snap;

    const f = createFixture(catalogId, x, y);
    if (f) {
      state.addFixture(f);
      state.update('ui.selectedFixtureId', f.id);
    }
  });
}

function showCustomDialog() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__title">Dodaj własny element</div>
      <div class="form-group">
        <label>Nazwa</label>
        <input type="text" id="custom-name" value="Własny element">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Szerokość (cm)</label>
          <input type="number" id="custom-width" value="50" min="5" max="500">
        </div>
        <div class="form-group">
          <label>Głębokość (cm)</label>
          <input type="number" id="custom-depth" value="50" min="5" max="500">
        </div>
        <div class="form-group">
          <label>Wysokość (cm)</label>
          <input type="number" id="custom-height" value="80" min="5" max="300">
        </div>
      </div>
      <div class="form-group">
        <label><input type="checkbox" id="custom-wall"> Montaż na ścianie</label>
      </div>
      <div class="modal__actions">
        <button class="btn" id="custom-cancel">Anuluj</button>
        <button class="btn btn--primary" id="custom-add">Dodaj</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#custom-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#custom-add').addEventListener('click', () => {
    const name = overlay.querySelector('#custom-name').value.trim() || 'Własny element';
    const width = parseInt(overlay.querySelector('#custom-width').value) || 50;
    const depth = parseInt(overlay.querySelector('#custom-depth').value) || 50;
    const height = parseInt(overlay.querySelector('#custom-height').value) || 80;
    const wallMounted = overlay.querySelector('#custom-wall').checked;

    addCustomItem({
      id: 'custom-' + generateId(),
      name,
      width,
      depth,
      height,
      wallMounted,
      icon: '📦',
    });

    overlay.remove();
    // Re-render catalog
    events.emit('state:fixtures', state.getFixtures());
  });
}
