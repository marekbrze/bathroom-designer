import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { createTileSet } from '../calculator/tile-set.js';
import { aggregateTileCounts } from './tiles-calc.js';

export function createTilesPanel(container) {
  const wrapper = document.createElement('div');
  wrapper.id = 'tiles-panel';
  container.appendChild(wrapper);
  
  function render() {
    const tileSets = state.getTileSets();
    const zones = state.getTileZones();
    const fronts = state.getTileFronts();
    const fixtures = state.getFixtures();
    const ui = state.getUI();
    
    const aggregated = aggregateTileCounts(zones, fronts, tileSets, fixtures);
    
    let html = `
      <div class="panel">
        <div class="panel__header">Zestawy płytek</div>
        <div class="panel__body">
    `;
    
    tileSets.forEach(ts => {
      const isActive = ts.id === ui.activeTileSetId;
      html += `
        <div class="tileset-item ${isActive ? 'tileset-item--active' : ''}" data-ts-id="${ts.id}" style="border-left:4px solid ${ts.color};">
          <div class="tileset-item__header">
            <span class="tileset-item__name">${ts.name}</span>
            <button class="btn btn--small btn--danger" data-remove-ts="${ts.id}">×</button>
          </div>
          <div class="tileset-item__specs">
            ${ts.tileWidth}×${ts.tileHeight} mm | fuga ${ts.groutGap} mm | naddatek ${ts.wastePercent}%
          </div>
          <div class="tileset-item__actions">
            <input type="color" data-color-ts="${ts.id}" value="${ts.color}" title="Zmień kolor">
            <button class="btn btn--small ${isActive ? 'btn--primary' : ''}" data-select-ts="${ts.id}">
              ${isActive ? '✓ Aktywny' : 'Użyj'}
            </button>
            <button class="btn btn--small" data-edit-ts="${ts.id}">Edytuj</button>
          </div>
        </div>
      `;
    });
    
    html += `<button class="btn btn--small btn--primary" id="add-tileset-btn">+ Dodaj zestaw</button>`;
    
    html += `
        </div>
      </div>
      
      <div class="panel" style="margin-top:12px;">
        <div class="panel__header">Podsumowanie</div>
        <div class="panel__body">
    `;
    
    if (aggregated.length === 0) {
      html += `<p style="font-size:12px;color:var(--text-secondary);">Dodaj zestawy płytek i narysuj strefy na ścianach.</p>`;
    } else {
      html += `<table class="calc-table">
        <tr><th>Zestaw</th><th>Strefy</th><th>Pow. (m²)</th><th>Płytki</th></tr>`;
      
      aggregated.forEach(item => {
        html += `
          <tr>
            <td>
              <span style="display:inline-block;width:12px;height:12px;background:${item.tileSet.color};border-radius:2px;margin-right:4px;"></span>
              ${item.tileSet.name}
            </td>
            <td>${item.zoneCount + item.frontCount}</td>
            <td>${item.netArea.toFixed(2)}</td>
            <td>${item.tilesWithWaste}</td>
          </tr>
        `;
      });
      
      html += `</table>`;
    }
    
    const selectedZoneId = ui.selectedTileZoneId;
    if (selectedZoneId) {
      const zone = zones.find(z => z.id === selectedZoneId);
      if (zone) {
        html += `
          <div style="margin-top:12px;padding:8px;border:1px solid var(--border);border-radius:var(--radius);">
            <strong>Wybrana strefa</strong>
            <div style="font-size:11px;margin-top:4px;">
              Pozycja: (${zone.x}, ${zone.y}) cm<br>
              Wymiary: ${zone.width}×${zone.height} cm<br>
              Powierzchnia: ${((zone.width * zone.height) / 10000).toFixed(2)} m²
            </div>
            <div class="form-group" style="margin-top:8px;">
              <label>Przypisz zestaw:</label>
              <select data-zone-tileset="${zone.id}">
                <option value="">— brak —</option>
                ${tileSets.map(ts => `<option value="${ts.id}" ${zone.tileSetId === ts.id ? 'selected' : ''}>${ts.name}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn--small btn--danger" data-delete-zone="${zone.id}" style="margin-top:8px;">Usuń strefę</button>
          </div>
        `;
      }
    }
    
    html += `</div></div>`;

    const overlay = ui.tileFixtureOverlay ?? { visible: true, opacity: 0.35, hidden: [] };
    if (fixtures.length > 0) {
      html += `
        <div class="panel" style="margin-top:12px;">
          <div class="panel__header">Elementy na ścianach</div>
          <div class="panel__body">
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
              <input type="checkbox" id="fixture-overlay-toggle" ${overlay.visible ? 'checked' : ''}>
              Pokaż elementy
            </label>
            <div class="form-group" style="margin-top:8px;">
              <label style="font-size:11px;">Przezroczystość: ${Math.round(overlay.opacity * 100)}%</label>
              <input type="range" id="fixture-overlay-opacity" min="10" max="100" value="${Math.round(overlay.opacity * 100)}" style="width:100%;" ${overlay.visible ? '' : 'disabled'}>
            </div>
            <div style="margin-top:8px;font-size:11px;">
      `;
      fixtures.forEach(f => {
        const hidden = (overlay.hidden || []).includes(f.id);
        html += `
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:2px 0;">
            <input type="checkbox" data-fixture-vis="${f.id}" ${!hidden ? 'checked' : ''} ${overlay.visible ? '' : 'disabled'}>
            <span>${f.label || f.catalogId}</span>
          </label>
        `;
      });
      html += `</div></div></div>`;
    }

    wrapper.innerHTML = html;
    bindEvents();
  }
  
  function bindEvents() {
    wrapper.querySelector('#add-tileset-btn')?.addEventListener('click', showAddTileSetDialog);
    
    wrapper.querySelectorAll('[data-remove-ts]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.removeTileSet(btn.dataset.removeTs);
      });
    });
    
    wrapper.querySelectorAll('[data-select-ts]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.setActiveTileSet(btn.dataset.selectTs);
      });
    });
    
    wrapper.querySelectorAll('[data-color-ts]').forEach(input => {
      input.addEventListener('input', () => {
        state.updateTileSet(input.dataset.colorTs, { color: input.value });
      });
    });
    
    wrapper.querySelectorAll('[data-edit-ts]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ts = state.getTileSets().find(t => t.id === btn.dataset.editTs);
        if (ts) showEditTileSetDialog(ts);
      });
    });
    
    wrapper.querySelectorAll('[data-zone-tileset]').forEach(sel => {
      sel.addEventListener('change', () => {
        state.updateTileZone(sel.dataset.zoneTileset, { tileSetId: sel.value || null });
      });
    });
    
    wrapper.querySelectorAll('[data-delete-zone]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.removeTileZone(btn.dataset.deleteZone);
      });
    });

    const overlayToggle = wrapper.querySelector('#fixture-overlay-toggle');
    if (overlayToggle) {
      overlayToggle.addEventListener('change', () => {
        const cur = state.getUI().tileFixtureOverlay ?? { visible: true, opacity: 0.35, hidden: [] };
        state.update('ui.tileFixtureOverlay', { ...cur, visible: overlayToggle.checked });
      });
    }

    const opacitySlider = wrapper.querySelector('#fixture-overlay-opacity');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', () => {
        const cur = state.getUI().tileFixtureOverlay ?? { visible: true, opacity: 0.35, hidden: [] };
        state.update('ui.tileFixtureOverlay', { ...cur, opacity: parseInt(opacitySlider.value) / 100 });
      });
    }

    wrapper.querySelectorAll('[data-fixture-vis]').forEach(cb => {
      cb.addEventListener('change', () => {
        const cur = state.getUI().tileFixtureOverlay ?? { visible: true, opacity: 0.35, hidden: [] };
        const id = cb.dataset.fixtureVis;
        let hidden = [...(cur.hidden || [])];
        if (cb.checked) {
          hidden = hidden.filter(h => h !== id);
        } else {
          hidden.push(id);
        }
        state.update('ui.tileFixtureOverlay', { ...cur, hidden });
      });
    });
  }
  
  function showAddTileSetDialog() {
    showDialog('Nowy zestaw płytek', createTileSet(), (data) => {
      const ts = createTileSet(data);
      state.addTileSet(ts);
      state.setActiveTileSet(ts.id);
    });
  }
  
  function showEditTileSetDialog(ts) {
    showDialog('Edytuj zestaw płytek', ts, (data) => {
      state.updateTileSet(ts.id, data);
    });
  }
  
  function showDialog(title, ts, onSave) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__title">${title}</div>
        <div class="form-group">
          <label>Nazwa</label>
          <input type="text" id="ts-name" value="${ts.name}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Szer. płytki (mm)</label>
            <input type="number" id="ts-tw" value="${ts.tileWidth}" min="10">
          </div>
          <div class="form-group">
            <label>Wys. płytki (mm)</label>
            <input type="number" id="ts-th" value="${ts.tileHeight}" min="10">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Fuga (mm)</label>
            <input type="number" id="ts-grout" value="${ts.groutGap}" min="0" step="0.5">
          </div>
          <div class="form-group">
            <label>Naddatek (%)</label>
            <input type="number" id="ts-waste" value="${ts.wastePercent}" min="0" max="50">
          </div>
        </div>
        <div class="form-group">
          <label>Kolor</label>
          <input type="color" id="ts-color" value="${ts.color}">
        </div>
        <div class="modal__actions">
          <button class="btn" id="ts-cancel">Anuluj</button>
          <button class="btn btn--primary" id="ts-save">Zapisz</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    overlay.querySelector('#ts-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    
    overlay.querySelector('#ts-save').addEventListener('click', () => {
      onSave({
        name: overlay.querySelector('#ts-name').value.trim() || 'Zestaw płytek',
        tileWidth: parseInt(overlay.querySelector('#ts-tw').value) || 300,
        tileHeight: parseInt(overlay.querySelector('#ts-th').value) || 600,
        groutGap: parseFloat(overlay.querySelector('#ts-grout').value) || 2,
        wastePercent: parseInt(overlay.querySelector('#ts-waste').value) || 10,
        color: overlay.querySelector('#ts-color').value,
      });
      overlay.remove();
    });
  }
  
  events.on('state:tileSets', render);
  events.on('state:tileZones', render);
  events.on('state:tileFronts', render);
  events.on('state:ui', render);
  events.on('state:fixtures', render);
  
  render();
  
  return { render };
}
