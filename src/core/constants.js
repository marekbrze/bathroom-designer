export const DEFAULTS = {
  room: { width: 245, depth: 225, height: 260 },
  grid: { size: 10 },
  zoom: { min: 0.2, max: 5, initial: 1 },
  waste: 10,
  groutGap: 2,
};

export const MATERIAL_RATES = {
  glue: { rate: 4.5, unit: 'kg/m²', label: 'Klej' },
  grout: { rate: 0.5, unit: 'kg/m²', label: 'Fuga' },
  primer: { rate: 0.2, unit: 'L/m²', label: 'Grunt' },
  waterproofing: { rate: 0.8, unit: 'kg/m²', label: 'Hydroizolacja' },
  plaster: { rate: 1.0, unit: 'kg/m²', label: 'Gładź' },
};

export const WALL_IDS = ['north', 'east', 'south', 'west'];
export const SURFACE_FLOOR = 'floor';

export const COLORS = {
  grid: '#e0e0e0',
  gridMajor: '#bdbdbd',
  room: '#ffffff',
  roomStroke: '#333333',
  fixture: '#90caf9',
  fixtureStroke: '#1565c0',
  fixtureSelected: '#ffcc80',
  fixtureSelectedStroke: '#e65100',
  fixtureCollision: '#ef9a9a',
  fixtureCollisionStroke: '#c62828',
  wallMounted: '#a5d6a7',
  wallMountedStroke: '#2e7d32',
  door: '#8d6e63',
  doorSwing: 'rgba(141, 110, 99, 0.4)',
  clearanceZone: 'rgba(33, 150, 243, 0.1)',
  clearanceZoneStroke: 'rgba(33, 150, 243, 0.3)',
  clearanceOverlap: 'rgba(255, 152, 0, 0.15)',
  dimension: '#757575',
  background: '#f5f5f5',
};
