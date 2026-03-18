const CATALOG = [
  { id: 'sink-cabinet', name: 'Umywalka z szafką', width: 80, depth: 45, height: 84, wallMounted: false, category: 'basic', icon: '🚰', frontSide: 'bottom', clearance: { front: 60, sides: 0 } },
  { id: 'toilet', name: 'Kompakt WC', width: 40, depth: 65, height: 40, wallMounted: false, category: 'basic', icon: '🚽', frontSide: 'bottom', clearance: { front: 60, sides: 15 }, defaultRotation: 90 },
  { id: 'bathtub', name: 'Wanna', width: 140, depth: 70, height: 60, wallMounted: false, category: 'basic', icon: '🛁', frontSide: 'top', clearance: { front: 60, sides: 0 }, defaultRotation: 90 },
  { id: 'washing-machine', name: 'Pralka', width: 60, depth: 60, height: 85, wallMounted: false, category: 'basic', icon: '🫧', frontSide: 'bottom', clearance: { front: 70, sides: 0 }, defaultRotation: 270 },
  { id: 'shower', name: 'Prysznic', width: 90, depth: 90, height: 200, wallMounted: false, category: 'extended', icon: '🚿', frontSide: 'bottom', clearance: { front: 60, sides: 0 } },
  { id: 'bidet', name: 'Bidet', width: 37, depth: 55, height: 40, wallMounted: false, category: 'extended', icon: '💧', frontSide: 'bottom', clearance: { front: 60, sides: 10 } },
  { id: 'wall-cabinet', name: 'Szafka wisząca', width: 60, depth: 20, height: 70, wallMounted: true, category: 'extended', icon: '🗄', frontSide: 'bottom', clearance: { front: 40, sides: 0 } },
  { id: 'mirror', name: 'Lustro', width: 60, depth: 3, height: 80, wallMounted: true, category: 'extended', icon: '🪞', frontSide: 'bottom', clearance: { front: 50, sides: 0 } },
  { id: 'radiator', name: 'Grzejnik', width: 80, depth: 10, height: 60, wallMounted: true, category: 'extended', icon: '♨', frontSide: 'bottom', clearance: { front: 10, sides: 0 } },
  { id: 'laundry-basket', name: 'Kosz na pranie', width: 40, depth: 30, height: 60, wallMounted: false, category: 'extended', icon: '🧺', frontSide: 'bottom', clearance: { front: 40, sides: 0 } },
  { id: 'door-60', name: 'Drzwi 60 cm', width: 60, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 60, clearance: { type: 'arc' }, defaultRotation: 270, defaultOpenDirection: 'inward', defaultOpenSide: 'left' },
  { id: 'door-70', name: 'Drzwi 70 cm', width: 70, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 70, clearance: { type: 'arc' }, defaultRotation: 270, defaultOpenDirection: 'inward', defaultOpenSide: 'left' },
  { id: 'door-80', name: 'Drzwi 80 cm', width: 80, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 80, clearance: { type: 'arc' }, defaultRotation: 270, defaultOpenDirection: 'inward', defaultOpenSide: 'left' },
  { id: 'door-90', name: 'Drzwi 90 cm', width: 90, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 90, clearance: { type: 'arc' }, defaultRotation: 270, defaultOpenDirection: 'inward', defaultOpenSide: 'left' },
];

import { state } from '../core/state.js';

export function getCatalog() {
  const customItems = state.getCustomCatalogItems ? state.getCustomCatalogItems() : [];
  return [...CATALOG, ...customItems];
}

export function getCatalogItem(id) {
  return getCatalog().find(item => item.id === id);
}

export function addCustomItem(item) {
  if (state.addCustomCatalogItem) {
    state.addCustomCatalogItem({ ...item, category: 'custom' });
  }
}

export function getCustomItems() {
  return state.getCustomCatalogItems ? state.getCustomCatalogItems() : [];
}

export const CATEGORIES = {
  basic: 'Podstawowe',
  extended: 'Rozszerzone',
  doors: 'Drzwi',
  custom: 'Własne',
};
