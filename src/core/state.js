import { DEFAULTS } from './constants.js';
import { events } from './events.js';
import { generateId } from './utils.js';

const STORAGE_KEY = 'bathroom-designer-state';

const SERIALIZABLE_KEYS = ['rooms', 'currentRoomId', 'tileSets', 'customCatalogItems', 'ui'];

function makeRoom(id, name) {
  return {
    id,
    name,
    room: { ...DEFAULTS.room },
    fixtures: [],
    surfaceAssignments: {},
    tileZones: [],
    tileFronts: [],
  };
}

const initial = () => ({
  rooms: [makeRoom('room-1', 'Łazienka')],
  currentRoomId: 'room-1',
  tileSets: [],
  customCatalogItems: [],
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
    tileFixtureOverlay: {
      visible: true,
      opacity: 0.35,
      hidden: [],
    },
  },
});

function migrateIfNeeded(data) {
  if (data.room && !data.rooms) {
    const id = 'room-1';
    data.rooms = [{
      id,
      name: 'Łazienka',
      room: data.room,
      fixtures: data.fixtures ?? [],
      surfaceAssignments: data.surfaceAssignments ?? {},
      tileZones: data.tileZones ?? [],
      tileFronts: data.tileFronts ?? [],
    }];
    data.currentRoomId = id;
    delete data.room;
    delete data.fixtures;
    delete data.surfaceAssignments;
    delete data.tileZones;
    delete data.tileFronts;
  }
  return data;
}

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
    let data = JSON.parse(raw);
    data = migrateIfNeeded(data);
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

function currentRoom() {
  return current.rooms.find(r => r.id === current.currentRoomId) ?? current.rooms[0];
}

function emitAllRoomEvents() {
  const r = currentRoom();
  events.emit('state:room', r.room);
  events.emit('state:fixtures', r.fixtures);
  events.emit('state:surfaceAssignments', r.surfaceAssignments);
  events.emit('state:tileZones', r.tileZones);
  events.emit('state:tileFronts', r.tileFronts);
  events.emit('state:ui', current.ui);
}

export const state = {
  get() {
    const r = currentRoom();
    return {
      ...current,
      room: r.room,
      fixtures: r.fixtures,
      surfaceAssignments: r.surfaceAssignments,
      tileZones: r.tileZones,
      tileFronts: r.tileFronts,
    };
  },

  getRoom() {
    return currentRoom().room;
  },

  getFixtures() {
    return currentRoom().fixtures;
  },

  getTileSets() {
    return current.tileSets;
  },

  getUI() {
    return current.ui;
  },

  getRooms() {
    return current.rooms;
  },

  getCurrentRoomId() {
    return current.currentRoomId;
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
    Object.assign(currentRoom().room, partial);
    events.emit('state:change', { path: 'room' });
    events.emit('state:room', currentRoom().room);
  },

  addFixture(fixture) {
    currentRoom().fixtures.push(fixture);
    events.emit('state:change', { path: 'fixtures' });
    events.emit('state:fixtures', currentRoom().fixtures);
  },

  removeFixture(id) {
    const r = currentRoom();
    r.fixtures = r.fixtures.filter(f => f.id !== id);
    if (current.ui.selectedFixtureId === id) {
      current.ui.selectedFixtureId = null;
      events.emit('state:ui', current.ui);
    }
    events.emit('state:change', { path: 'fixtures' });
    events.emit('state:fixtures', r.fixtures);
  },

  updateFixture(id, partial) {
    const f = currentRoom().fixtures.find(f => f.id === id);
    if (!f) return;
    Object.assign(f, partial);
    events.emit('state:change', { path: 'fixtures' });
    events.emit('state:fixtures', currentRoom().fixtures);
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
    current.rooms.forEach(r => {
      Object.keys(r.surfaceAssignments).forEach(k => {
        if (r.surfaceAssignments[k] === id) delete r.surfaceAssignments[k];
      });
    });
    events.emit('state:change', { path: 'tileSets' });
    events.emit('state:tileSets', current.tileSets);
  },

  assignSurface(surfaceId, tileSetId) {
    currentRoom().surfaceAssignments[surfaceId] = tileSetId;
    events.emit('state:change', { path: 'surfaceAssignments' });
    events.emit('state:surfaceAssignments', currentRoom().surfaceAssignments);
  },

  getTileZones() {
    return currentRoom().tileZones;
  },

  addTileZone(zone) {
    currentRoom().tileZones.push(zone);
    events.emit('state:change', { path: 'tileZones' });
    events.emit('state:tileZones', currentRoom().tileZones);
  },

  updateTileZone(id, partial) {
    const z = currentRoom().tileZones.find(z => z.id === id);
    if (!z) return;
    Object.assign(z, partial);
    events.emit('state:change', { path: 'tileZones' });
    events.emit('state:tileZones', currentRoom().tileZones);
  },

  removeTileZone(id) {
    const r = currentRoom();
    r.tileZones = r.tileZones.filter(z => z.id !== id);
    if (current.ui.selectedTileZoneId === id) {
      current.ui.selectedTileZoneId = null;
      events.emit('state:ui', current.ui);
    }
    events.emit('state:change', { path: 'tileZones' });
    events.emit('state:tileZones', r.tileZones);
  },

  getTileFronts() {
    return currentRoom().tileFronts;
  },

  assignTileFront(fixtureId, side, tileSetId) {
    const fronts = currentRoom().tileFronts;
    const existing = fronts.find(f => f.fixtureId === fixtureId && f.side === side);
    if (existing) {
      existing.tileSetId = tileSetId;
    } else {
      fronts.push({ fixtureId, side, tileSetId });
    }
    events.emit('state:change', { path: 'tileFronts' });
    events.emit('state:tileFronts', currentRoom().tileFronts);
  },

  removeTileFront(fixtureId, side) {
    const r = currentRoom();
    r.tileFronts = r.tileFronts.filter(
      f => !(f.fixtureId === fixtureId && f.side === side)
    );
    events.emit('state:change', { path: 'tileFronts' });
    events.emit('state:tileFronts', r.tileFronts);
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

  addRoom(name) {
    const id = 'room-' + generateId();
    current.rooms.push(makeRoom(id, name));
    events.emit('state:change', { path: 'rooms' });
    events.emit('state:rooms', current.rooms);
    // Auto-switch to new room
    current.ui.selectedFixtureId = null;
    current.ui.selectedTileZoneId = null;
    current.currentRoomId = id;
    emitAllRoomEvents();
    return id;
  },

  renameRoom(id, name) {
    const r = current.rooms.find(r => r.id === id);
    if (!r) return;
    r.name = name;
    events.emit('state:change', { path: 'rooms' });
    events.emit('state:rooms', current.rooms);
  },

  removeRoom(id) {
    if (current.rooms.length <= 1) return;
    current.rooms = current.rooms.filter(r => r.id !== id);
    if (current.currentRoomId === id) {
      current.ui.selectedFixtureId = null;
      current.ui.selectedTileZoneId = null;
      current.currentRoomId = current.rooms[0].id;
      emitAllRoomEvents();
    }
    events.emit('state:change', { path: 'rooms' });
    events.emit('state:rooms', current.rooms);
  },

  switchRoom(id) {
    if (current.currentRoomId === id) return;
    const target = current.rooms.find(r => r.id === id);
    if (!target) return;
    current.ui.selectedFixtureId = null;
    current.ui.selectedTileZoneId = null;
    current.currentRoomId = id;
    events.emit('state:change', { path: 'currentRoomId' });
    events.emit('state:rooms', current.rooms);
    emitAllRoomEvents();
  },

  exportToJSON() {
    const data = {};
    SERIALIZABLE_KEYS.forEach(key => { data[key] = current[key]; });
    return JSON.stringify(data, null, 2);
  },

  importFromJSON(jsonString) {
    try {
      let data = JSON.parse(jsonString);
      data = migrateIfNeeded(data);
      const base = initial();
      SERIALIZABLE_KEYS.forEach(key => {
        if (data[key] !== undefined) base[key] = data[key];
      });
      current = base;
      saveToStorage();
      events.emit('state:import', current);
      events.emit('state:tileSets', current.tileSets);
      events.emit('state:customCatalogItems', current.customCatalogItems);
      events.emit('state:rooms', current.rooms);
      emitAllRoomEvents();
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
    events.emit('state:tileSets', current.tileSets);
    events.emit('state:customCatalogItems', current.customCatalogItems);
    events.emit('state:rooms', current.rooms);
    emitAllRoomEvents();
  },
};
