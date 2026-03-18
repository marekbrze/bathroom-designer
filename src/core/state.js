import { DEFAULTS } from './constants.js';
import { events } from './events.js';

const initial = () => ({
  room: { ...DEFAULTS.room },
  fixtures: [],
  tileSets: [],
  surfaceAssignments: {},
  ui: {
    activeView: 'top',
    selectedFixtureId: null,
    zoom: DEFAULTS.zoom.initial,
    panOffset: { x: 0, y: 0 },
    sidebarTab: 'fixtures',
    showClearance: true,
  },
});

let current = initial();

export const state = {
  get() {
    return current;
  },

  getRoom() {
    return current.room;
  },

  getFixtures() {
    return current.fixtures;
  },

  getUI() {
    return current.ui;
  },

  update(path, value) {
    const parts = path.split('.');
    let obj = current;
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
    }
    const last = parts[parts.length - 1];
    const old = obj[last];
    if (old === value) return;
    obj[last] = value;
    events.emit('state:change', { path, value, old });
    events.emit(`state:${parts[0]}`, current[parts[0]]);
  },

  updateRoom(partial) {
    Object.assign(current.room, partial);
    events.emit('state:change', { path: 'room' });
    events.emit('state:room', current.room);
  },

  addFixture(fixture) {
    current.fixtures.push(fixture);
    events.emit('state:change', { path: 'fixtures' });
    events.emit('state:fixtures', current.fixtures);
  },

  removeFixture(id) {
    current.fixtures = current.fixtures.filter(f => f.id !== id);
    if (current.ui.selectedFixtureId === id) {
      current.ui.selectedFixtureId = null;
      events.emit('state:ui', current.ui);
    }
    events.emit('state:change', { path: 'fixtures' });
    events.emit('state:fixtures', current.fixtures);
  },

  updateFixture(id, partial) {
    const f = current.fixtures.find(f => f.id === id);
    if (!f) return;
    Object.assign(f, partial);
    events.emit('state:change', { path: 'fixtures' });
    events.emit('state:fixtures', current.fixtures);
  },

  addTileSet(tileSet) {
    current.tileSets.push(tileSet);
    events.emit('state:change', { path: 'tileSets' });
    events.emit('state:tileSets', current.tileSets);
  },

  updateTileSet(id, partial) {
    const ts = current.tileSets.find(t => t.id === id);
    if (!ts) return;
    Object.assign(ts, partial);
    events.emit('state:change', { path: 'tileSets' });
    events.emit('state:tileSets', current.tileSets);
  },

  removeTileSet(id) {
    current.tileSets = current.tileSets.filter(t => t.id !== id);
    Object.keys(current.surfaceAssignments).forEach(k => {
      if (current.surfaceAssignments[k] === id) delete current.surfaceAssignments[k];
    });
    events.emit('state:change', { path: 'tileSets' });
    events.emit('state:tileSets', current.tileSets);
  },

  assignSurface(surfaceId, tileSetId) {
    current.surfaceAssignments[surfaceId] = tileSetId;
    events.emit('state:change', { path: 'surfaceAssignments' });
    events.emit('state:surfaceAssignments', current.surfaceAssignments);
  },

  reset() {
    current = initial();
    events.emit('state:reset', current);
  },
};
