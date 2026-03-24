import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { calcTilesForFront } from './tiles-calc.js';

function isTileable(fixture) {
  return fixture.catalogId === 'bathtub' || fixture.catalogId === 'shower';
}

export const FIXTURE_SIDES = {
  bathtub: [
    { id: 'front', label: 'Przód',        getDims: f => ({ w: f.width, h: f.height }) },
    { id: 'left',  label: 'Lewa strona',  getDims: f => ({ w: f.depth, h: f.height }) },
    { id: 'right', label: 'Prawa strona', getDims: f => ({ w: f.depth, h: f.height }) },
  ],
  shower: [
    { id: 'back',  label: 'Tylna ściana', getDims: f => ({ w: f.width,  h: f.height }) },
    { id: 'left',  label: 'Lewa ściana',  getDims: f => ({ w: f.depth, h: f.height }) },
    { id: 'right', label: 'Prawa ściana', getDims: f => ({ w: f.depth, h: f.height }) },
  ],
};

export function createFrontsPanel(container) {
  const wrapper = document.createElement('div');
  wrapper.id = 'fronts-panel';
  container.appendChild(wrapper);

  function render() {
    const fixtures = state.getFixtures();
    const tileFronts = state.getTileFronts();
    const tileSets = state.getTileSets();

    const tileableFixtures = fixtures.filter(f => isTileable(f));

    let html = `
      <div class="panel">
        <div class="panel__header">Fronty (płytkowanie armatury)</div>
        <div class="panel__body">
    `;

    if (tileableFixtures.length === 0) {
      html += `<p style="font-size:12px;color:var(--text-secondary);">Dodaj wannę lub prysznic, aby pokryć je płytkami.</p>`;
    } else {
      tileableFixtures.forEach(fixture => {
        const sides = FIXTURE_SIDES[fixture.catalogId] || [];
        const fixtureName = fixture.label || fixture.catalogId;

        html += `
          <div style="border:1px solid var(--border);padding:8px;border-radius:var(--radius);margin-bottom:10px;">
            <strong style="font-size:12px;display:block;margin-bottom:6px;">${fixtureName}</strong>
        `;

        sides.forEach(side => {
          const front = tileFronts.find(f => f.fixtureId === fixture.id && f.side === side.id);
          const assignedSet = front ? tileSets.find(ts => ts.id === front.tileSetId) : null;
          const { w, h } = side.getDims(fixture);
          const area = (w * h) / 10000;

          html += `
            <div style="margin-bottom:6px;padding:6px;background:var(--surface-alt,#f8f8f8);border-radius:var(--radius);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;">${side.label}</span>
                <span style="font-size:10px;color:var(--text-secondary);">${w}×${h} cm = ${area.toFixed(2)} m²</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <select data-front-fixture="${fixture.id}" data-front-side="${side.id}" style="flex:1;">
                  <option value="">— bez płytek —</option>
                  ${tileSets.map(ts => `<option value="${ts.id}" ${front?.tileSetId === ts.id ? 'selected' : ''}>${ts.name}</option>`).join('')}
                </select>
                ${assignedSet ? `<span style="display:inline-block;width:12px;height:12px;background:${assignedSet.color};border-radius:2px;flex-shrink:0;"></span>` : ''}
              </div>
          `;

          if (assignedSet) {
            const calc = calcTilesForFront(fixture, assignedSet, side.id);
            if (calc) {
              html += `<div style="font-size:10px;color:var(--text-secondary);margin-top:3px;">Płytki: ${calc.tilesWithWaste} szt.</div>`;
            }
          }

          html += `</div>`;
        });

        html += `</div>`;
      });
    }

    html += `</div></div>`;

    wrapper.innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    wrapper.querySelectorAll('[data-front-fixture]').forEach(sel => {
      sel.addEventListener('change', () => {
        const fixtureId = sel.dataset.frontFixture;
        const side = sel.dataset.frontSide;
        const tileSetId = sel.value || null;
        if (tileSetId) {
          state.assignTileFront(fixtureId, side, tileSetId);
        } else {
          state.removeTileFront(fixtureId, side);
        }
      });
    });
  }

  events.on('state:fixtures', render);
  events.on('state:tileFronts', render);
  events.on('state:tileSets', render);

  render();

  return { render };
}
