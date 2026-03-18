import { state } from '../core/state.js';
import { events } from '../core/events.js';
import { calcTilesForFront } from './tiles-calc.js';

const TILEABLE_CATEGORIES = ['bathtub', 'shower'];

function isTileable(fixture) {
  return fixture.type === 'bathtub' || fixture.type === 'shower' || 
         fixture.id?.includes('bathtub') || fixture.id?.includes('shower');
}

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
      html += `<p style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">Wybierz zestaw płytek dla frontów armatury.</p>`;
      
      tileableFixtures.forEach(fixture => {
        const front = tileFronts.find(f => f.fixtureId === fixture.id);
        const assignedSet = front ? tileSets.find(ts => ts.id === front.tileSetId) : null;
        const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
        const frontWidth = isRotated ? fixture.depth : fixture.width;
        const area = (frontWidth * fixture.height) / 10000;
        
        html += `
          <div class="front-item" style="border:1px solid var(--border);padding:8px;border-radius:var(--radius);margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <strong style="font-size:12px;">${fixture.name || fixture.type}</strong>
              ${assignedSet ? `<span style="display:inline-block;width:12px;height:12px;background:${assignedSet.color};border-radius:2px;"></span>` : ''}
            </div>
            <div style="font-size:11px;color:var(--text-secondary);">
              Front: ${frontWidth}×${fixture.height} cm = ${area.toFixed(2)} m²
            </div>
            <div class="form-group" style="margin-top:6px;">
              <select data-front-fixture="${fixture.id}">
                <option value="">— bez płytek —</option>
                ${tileSets.map(ts => `<option value="${ts.id}" ${front?.tileSetId === ts.id ? 'selected' : ''}>${ts.name}</option>`).join('')}
              </select>
            </div>
        `;
        
        if (assignedSet) {
          const calc = calcTilesForFront(fixture, assignedSet);
          if (calc) {
            html += `
              <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">
                Płytki: ${calc.tilesWithWaste} szt.
              </div>
            `;
          }
        }
        
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
        const tileSetId = sel.value || null;
        if (tileSetId) {
          state.assignTileFront(fixtureId, tileSetId);
        } else {
          state.removeTileFront(fixtureId);
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
