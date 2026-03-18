import { generateId } from '../core/utils.js';
import { DEFAULTS } from '../core/constants.js';

export function createTileSet(overrides = {}) {
  return {
    id: generateId(),
    name: 'Nowy zestaw',
    tileWidth: 30,
    tileHeight: 60,
    groutGap: DEFAULTS.groutGap,
    wastePercent: DEFAULTS.waste,
    ...overrides,
  };
}
