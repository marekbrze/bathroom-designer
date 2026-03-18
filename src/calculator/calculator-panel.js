import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { createTileSet } from './tile-set.js';
import { getAllSurfaces } from './surface-assignment.js';
import { calcTilesForSurface, calcFixtureExclusions } from './tile-calc.js';
import { calcMaterials } from './material-calc.js';

export function createCalculatorPanel(container) {
  const wrapper = document.createElement('div');
  wrapper.id = 'calculator-panel';
  container.appendChild(wrapper);

  function render() {
    const { tileSets, surfaceAssignments } = state.get();
    const room = state.getRoom();
    const fixtures = state.getFixtures();
    const surfaces = getAllSurfaces(room);

    let html = `
      <div class="panel">
        <div class="panel__header">Kalkulator materiałów</div>
        <div class="panel__body">
          <h4 style="font-size:12px;margin-bottom:8px;">Zestawy kafelków</h4>
    `;

    tileSets.forEach(ts => {
      html += `
        <div class="calc-result" style="border:1px solid var(--border);padding:8px;border-radius:var(--radius);margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="font-size:12px;">${ts.name}</strong>
            <button class="btn btn--small btn--danger" data-remove-ts="${ts.id}">×</button>
          </div>
          <div style="font-size:11px;color:var(--text-secondary)">
            ${ts.tileWidth}×${ts.tileHeight} mm | fuga ${ts.groutGap} mm | naddatek ${ts.wastePercent}%
          </div>
        </div>
      `;
    });

    html += `<button class="btn btn--small btn--primary" id="add-tileset-btn">+ Dodaj zestaw</button>`;

    // Surface assignments
    html += `<h4 style="font-size:12px;margin:12px 0 8px;">Przypisania powierzchni</h4>`;
    surfaces.forEach(s => {
      const assigned = surfaceAssignments[s.id] || '';
      html += `
        <div class="form-group" style="margin-bottom:6px;">
          <label>${s.label} (${s.area.toFixed(2)} m²)</label>
          <select data-surface="${s.id}">
            <option value="">— brak —</option>
            ${tileSets.map(ts => `<option value="${ts.id}" ${assigned === ts.id ? 'selected' : ''}>${ts.name}</option>`).join('')}
          </select>
        </div>
      `;
    });

    // Results
    html += `<h4 style="font-size:12px;margin:12px 0 8px;">Wyniki obliczeń</h4>`;

    let totalTiledArea = 0;
    let totalWallArea = 0;

    surfaces.forEach(s => {
      const tsId = surfaceAssignments[s.id];
      if (!tsId) return;
      const ts = tileSets.find(t => t.id === tsId);
      if (!ts) return;

      const exclusions = calcFixtureExclusions(fixtures, s.id, room);
      const result = calcTilesForSurface(s.area, ts, exclusions);
      totalTiledArea += result.net;
      if (s.id !== 'floor') totalWallArea += result.net;

      html += `
        <div style="font-size:12px;margin-bottom:6px;padding:4px 0;border-bottom:1px solid var(--border);">
          <strong>${s.label}</strong> → ${ts.name}<br>
          Netto: ${result.net.toFixed(2)} m² | Kafelki: ${result.tilesWithWaste} szt.
        </div>
      `;
    });

    // Ancillary materials
    const materials = calcMaterials(totalTiledArea, totalWallArea, totalTiledArea);
    html += `
      <h4 style="font-size:12px;margin:12px 0 8px;">Materiały pomocnicze</h4>
      <table class="calc-table">
        <tr><th>Materiał</th><th>Ilość</th></tr>
        ${Object.values(materials).map(m =>
          `<tr><td>${m.label}</td><td>${m.amount} ${m.unit.split('/')[0]}</td></tr>`
        ).join('')}
      </table>
    `;

    html += `</div></div>`;
    wrapper.innerHTML = html;

    // Bind events
    wrapper.querySelector('#add-tileset-btn')?.addEventListener('click', () => {
      showTileSetDialog();
    });

    wrapper.querySelectorAll('[data-remove-ts]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.removeTileSet(btn.dataset.removeTs);
      });
    });

    wrapper.querySelectorAll('[data-surface]').forEach(sel => {
      sel.addEventListener('change', () => {
        state.assignSurface(sel.dataset.surface, sel.value || null);
      });
    });
  }

  events.on('state:change', render);
  render();
}

function showTileSetDialog() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal__title">Nowy zestaw kafelków</div>
      <div class="form-group">
        <label>Nazwa</label>
        <input type="text" id="ts-name" value="Zestaw kafelków">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Szer. kafelka (mm)</label>
          <input type="number" id="ts-tw" value="300" min="10">
        </div>
        <div class="form-group">
          <label>Wys. kafelka (mm)</label>
          <input type="number" id="ts-th" value="600" min="10">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Fuga (mm)</label>
          <input type="number" id="ts-grout" value="2" min="0" step="0.5">
        </div>
        <div class="form-group">
          <label>Naddatek (%)</label>
          <input type="number" id="ts-waste" value="10" min="0" max="50">
        </div>
      </div>
      <div class="modal__actions">
        <button class="btn" id="ts-cancel">Anuluj</button>
        <button class="btn btn--primary" id="ts-add">Dodaj</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#ts-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector('#ts-add').addEventListener('click', () => {
    const ts = createTileSet({
      name: overlay.querySelector('#ts-name').value.trim() || 'Zestaw kafelków',
      tileWidth: parseInt(overlay.querySelector('#ts-tw').value) || 300,
      tileHeight: parseInt(overlay.querySelector('#ts-th').value) || 600,
      groutGap: parseFloat(overlay.querySelector('#ts-grout').value) || 2,
      wastePercent: parseInt(overlay.querySelector('#ts-waste').value) || 10,
    });
    state.addTileSet(ts);
    overlay.remove();
  });
}
