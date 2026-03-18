import { DEFAULTS } from './constants.js';
import { events } from './events.js';

const STORAGE_KEY = 'bathroom-designer-state';

const SERIALIZABLE_KEYS = ['room', 'fixtures', 'tileSets', 'surfaceAssignments', 'ui', 'customCatalogItems', 'tileZones', 'tileFronts'];

const initial = () => ({
  room: { ...DEFAULTS.room },
  fixtures: [],
  tileSets: [],
  surfaceAssignments: {},
  customCatalogItems: [],
  tileZones: [],
  tileFronts: [],
  ui: {
    activeView: 'top',
    selectedFixtureId: null,
    selectedTileZoneId: null,
    activeTileSetId: null,
    zoom: DEFAULTS.zoom.initial,
    panOffset: { x: 0, y: 0 },
    tilesZoom: DEFAULTS.zoom.initial,
    tilesPanOffset: { x: 0, y: 0 },
    sidebarTab: 'fixtures',
    showClearance: true,
  },
});

function saveToStorage() {
  try {
    const data = {};
    SERIALIZABLE_KEYS.forEach(key => { data[key] = current[key]; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const base = initial();
    SERIALIZABLE_KEYS.forEach(key => {
      if (data[key] !== undefined) base[key] = data[key];
    });
    return base;
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
    return null;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

let current = loadFromStorage() || initial();

events.on('state:change', saveToStorage);

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

  getTileSets() {
    return current.tileSets;
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

  getTileZones() {
    return current.tileZones;
  },

  addTileZone(zone) {
    current.tileZones.push(zone);
    events.emit('state:change', { path: 'tileZones' });
    events.emit('state:tileZones', current.tileZones);
  },

  updateTileZone(id, partial) {
    const z = current.tileZones.find(z => z.id === id);
    if (!z) return;
    Object.assign(z, partial);
    events.emit('state:change', { path: 'tileZones' });
    events.emit('state:tileZones', current.tileZones);
  },

  removeTileZone(id) {
    current.tileZones = current.tileZones.filter(z => z.id !== id);
    if (current.ui.selectedTileZoneId === id) {
      current.ui.selectedTileZoneId = null;
      events.emit('state:ui', current.ui);
    }
    events.emit('state:change', { path: 'tileZones' });
    events.emit('state:tileZones', current.tileZones);
  },

  getTileFronts() {
    return current.tileFronts;
  },

  assignTileFront(fixtureId, tileSetId, color = null) {
    const existing = current.tileFronts.find(f => f.fixtureId === fixtureId);
    if (existing) {
      existing.tileSetId = tileSetId;
      if (color !== null) existing.color = color;
    } else {
      current.tileFronts.push({ fixtureId, tileSetId, color });
    }
    events.emit('state:change', { path: 'tileFronts' });
    events.emit('state:tileFronts', current.tileFronts);
  },

  removeTileFront(fixtureId) {
    current.tileFronts = current.tileFronts.filter(f => f.fixtureId !== fixtureId);
    events.emit('state:change', { path: 'tileFronts' });
    events.emit('state:tileFronts', current.tileFronts);
  },

  setActiveTileSet(tileSetId) {
    current.ui.activeTileSetId = tileSetId;
    events.emit('state:ui', current.ui);
  },

  selectTileZone(zoneId) {
    current.ui.selectedTileZoneId = zoneId;
    events.emit('state:ui', current.ui);
  },

  addCustomCatalogItem(item) {
    current.customCatalogItems.push({ ...item, category: 'custom' });
    events.emit('state:change', { path: 'customCatalogItems' });
    events.emit('state:customCatalogItems', current.customCatalogItems);
  },

  getCustomCatalogItems() {
    return current.customCatalogItems;
  },

  exportToJSON() {
    const data = {};
    SERIALIZABLE_KEYS.forEach(key => { data[key] = current[key]; });
    return JSON.stringify(data, null, 2);
  },

  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const base = initial();
      SERIALIZABLE_KEYS.forEach(key => {
        if (data[key] !== undefined) base[key] = data[key];
      });
      current = base;
      saveToStorage();
      events.emit('state:import', current);
      events.emit('state:room', current.room);
      events.emit('state:fixtures', current.fixtures);
      events.emit('state:tileSets', current.tileSets);
      events.emit('state:surfaceAssignments', current.surfaceAssignments);
      events.emit('state:customCatalogItems', current.customCatalogItems);
      events.emit('state:tileZones', current.tileZones);
      events.emit('state:tileFronts', current.tileFronts);
      events.emit('state:ui', current.ui);
      return true;
    } catch (e) {
      console.error('Failed to import JSON:', e);
      return false;
    }
  },

  reset() {
    clearStorage();
    current = initial();
    events.emit('state:reset', current);
    events.emit('state:room', current.room);
    events.emit('state:fixtures', current.fixtures);
    events.emit('state:tileSets', current.tileSets);
    events.emit('state:surfaceAssignments', current.surfaceAssignments);
    events.emit('state:customCatalogItems', current.customCatalogItems);
    events.emit('state:tileZones', current.tileZones);
    events.emit('state:tileFronts', current.tileFronts);
    events.emit('state:ui', current.ui);
  },
};
