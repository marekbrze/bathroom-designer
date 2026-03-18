const CATALOG = [
  { id: 'sink-cabinet', name: 'Umywalka z szafką', width: 60, depth: 46, height: 85, wallMounted: false, category: 'basic', icon: '🚰', frontSide: 'bottom', clearance: { front: 60, sides: 0 } },
  { id: 'toilet', name: 'Kompakt WC', width: 40, depth: 65, height: 40, wallMounted: false, category: 'basic', icon: '🚽', frontSide: 'bottom', clearance: { front: 60, sides: 15 } },
  { id: 'bathtub', name: 'Wanna', width: 170, depth: 75, height: 60, wallMounted: false, category: 'basic', icon: '🛁', frontSide: 'bottom', clearance: { front: 60, sides: 0 } },
  { id: 'washing-machine', name: 'Pralka', width: 60, depth: 60, height: 85, wallMounted: false, category: 'basic', icon: '🫧', frontSide: 'bottom', clearance: { front: 70, sides: 0 } },
  { id: 'shower', name: 'Prysznic', width: 90, depth: 90, height: 200, wallMounted: false, category: 'extended', icon: '🚿', frontSide: 'bottom', clearance: { front: 60, sides: 0 } },
  { id: 'bidet', name: 'Bidet', width: 37, depth: 55, height: 40, wallMounted: false, category: 'extended', icon: '💧', frontSide: 'bottom', clearance: { front: 60, sides: 10 } },
  { id: 'wall-cabinet', name: 'Szafka wisząca', width: 60, depth: 20, height: 70, wallMounted: true, category: 'extended', icon: '🗄', frontSide: 'bottom', clearance: { front: 40, sides: 0 } },
  { id: 'mirror', name: 'Lustro', width: 60, depth: 3, height: 80, wallMounted: true, category: 'extended', icon: '🪞', frontSide: 'bottom', clearance: { front: 50, sides: 0 } },
  { id: 'radiator', name: 'Grzejnik', width: 80, depth: 10, height: 60, wallMounted: true, category: 'extended', icon: '♨', frontSide: 'bottom', clearance: { front: 10, sides: 0 } },
  { id: 'laundry-basket', name: 'Kosz na pranie', width: 40, depth: 30, height: 60, wallMounted: false, category: 'extended', icon: '🧺', frontSide: 'bottom', clearance: { front: 40, sides: 0 } },
  { id: 'door-60', name: 'Drzwi 60 cm', width: 60, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 60, clearance: { type: 'arc' } },
  { id: 'door-70', name: 'Drzwi 70 cm', width: 70, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 70, clearance: { type: 'arc' } },
  { id: 'door-80', name: 'Drzwi 80 cm', width: 80, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 80, clearance: { type: 'arc' } },
  { id: 'door-90', name: 'Drzwi 90 cm', width: 90, depth: 10, height: 200, wallMounted: false, category: 'doors', icon: '🚪', isDoor: true, doorWidth: 90, clearance: { type: 'arc' } },
];

const customItems = [];

export function getCatalog() {
  return [...CATALOG, ...customItems];
}

export function getCatalogItem(id) {
  return getCatalog().find(item => item.id === id);
}

export function addCustomItem(item) {
  customItems.push({ ...item, category: 'custom' });
}

export function getCustomItems() {
  return customItems;
}

export const CATEGORIES = {
  basic: 'Podstawowe',
  extended: 'Rozszerzone',
  doors: 'Drzwi',
  custom: 'Własne',
};
