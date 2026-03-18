import { state } from '../core/state.js';
import { events } from '../core/events.js';

export function createFixtureProperties(container) {
  const wrapper = document.createElement('div');
  wrapper.id = 'fixture-properties';
  container.appendChild(wrapper);

  function render() {
    const ui = state.getUI();
    const fixture = state.getFixtures().find(f => f.id === ui.selectedFixtureId);

    if (!fixture) {
      wrapper.innerHTML = `<div class="properties-empty">Zaznacz element na planie, aby zobaczyć jego właściwości</div>`;
      return;
    }

    wrapper.innerHTML = `
      <div class="panel">
        <div class="panel__header">Właściwości: ${fixture.label}</div>
        <div class="panel__body">
          <div class="form-row">
            <div class="form-group">
              <label>X (cm)</label>
              <input type="number" id="prop-x" value="${fixture.x}" step="1">
            </div>
            <div class="form-group">
              <label>Y (cm)</label>
              <input type="number" id="prop-y" value="${fixture.y}" step="1">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Szer (cm)</label>
              <input type="number" id="prop-w" value="${fixture.width}" min="5">
            </div>
            <div class="form-group">
              <label>Głęb (cm)</label>
              <input type="number" id="prop-d" value="${fixture.depth}" min="5">
            </div>
          </div>
          <div class="form-group">
            <label>Wysokość (cm)</label>
            <input type="number" id="prop-h" value="${fixture.height}" min="5">
          </div>
          ${fixture.wallMounted ? `
          <div class="form-group">
            <label>Wysokość od podłogi (cm)</label>
            <input type="number" id="prop-z" value="${fixture.z}" min="0">
          </div>
          ` : ''}
          <div class="form-group">
            <label>Rotacja: ${fixture.rotation}°</label>
            <button class="btn btn--small" id="prop-rotate">Obróć 90° (R)</button>
          </div>
          ${!fixture.isDoor ? `
          <div class="form-group">
            <label>Strefa użytkowania</label>
            <select id="prop-front-side">
              <option value="bottom" ${fixture.frontSide === 'bottom' ? 'selected' : ''}>Dół (przód)</option>
              <option value="top" ${fixture.frontSide === 'top' ? 'selected' : ''}>Góra (tył)</option>
              <option value="left" ${fixture.frontSide === 'left' ? 'selected' : ''}>Lewo</option>
              <option value="right" ${fixture.frontSide === 'right' ? 'selected' : ''}>Prawo</option>
            </select>
          </div>
          ` : ''}
          ${fixture.isDoor ? `
          <div class="form-group">
            <label>Kierunek otwarcia</label>
            <select id="prop-open-dir">
              <option value="inward" ${fixture.openDirection === 'inward' ? 'selected' : ''}>Do wewnątrz</option>
              <option value="outward" ${fixture.openDirection === 'outward' ? 'selected' : ''}>Na zewnątrz</option>
            </select>
          </div>
          <div class="form-group">
            <label>Strona zawiasów</label>
            <select id="prop-open-side">
              <option value="left" ${fixture.openSide === 'left' ? 'selected' : ''}>Lewo</option>
              <option value="right" ${fixture.openSide === 'right' ? 'selected' : ''}>Prawo</option>
            </select>
          </div>
          ` : ''}
          <div style="margin-top:8px">
            <button class="btn btn--small btn--danger" id="prop-delete">Usuń element</button>
          </div>
        </div>
      </div>
    `;

    const bind = (id, prop, parse = parseInt) => {
      const el = wrapper.querySelector(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const val = parse(el.value);
        if (!isNaN(val)) state.updateFixture(fixture.id, { [prop]: val });
      });
    };

    bind('#prop-x', 'x');
    bind('#prop-y', 'y');
    bind('#prop-w', 'width');
    bind('#prop-d', 'depth');
    bind('#prop-h', 'height');
    bind('#prop-z', 'z');

    wrapper.querySelector('#prop-rotate')?.addEventListener('click', () => {
      state.updateFixture(fixture.id, { rotation: (fixture.rotation + 90) % 360 });
    });

    wrapper.querySelector('#prop-open-dir')?.addEventListener('change', (e) => {
      state.updateFixture(fixture.id, { openDirection: e.target.value });
    });

    wrapper.querySelector('#prop-open-side')?.addEventListener('change', (e) => {
      state.updateFixture(fixture.id, { openSide: e.target.value });
    });

    wrapper.querySelector('#prop-front-side')?.addEventListener('change', (e) => {
      state.updateFixture(fixture.id, { frontSide: e.target.value });
    });

    wrapper.querySelector('#prop-delete')?.addEventListener('click', () => {
      state.removeFixture(fixture.id);
    });
  }

  events.on('state:fixtures', render);
  events.on('state:ui', render);
  render();
}
