import { generateId } from '../core/utils.js';
import { DEFAULTS } from '../core/constants.js';

const DEFAULT_COLORS = [
  '#4a90d9', '#e67e22', '#27ae60', '#9b59b6', '#e74c3c',
  '#1abc9c', '#34495e', '#f39c12', '#8e44ad', '#16a085'
];
let colorIndex = 0;

export function createTileSet(overrides = {}) {
  const color = overrides.color || DEFAULT_COLORS[colorIndex++ % DEFAULT_COLORS.length];
  return {
    id: generateId(),
    name: 'Nowy zestaw',
    tileWidth: 300,
    tileHeight: 600,
    groutGap: DEFAULTS.groutGap,
    wastePercent: DEFAULTS.waste,
    color,
    ...overrides,
  };
}
