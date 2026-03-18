import { state } from '../core/state.js';
import { DEFAULTS } from '../core/constants.js';

export function snapToGrid(value, gridSize = DEFAULTS.grid.size) {
  return Math.round(value / gridSize) * gridSize;
}

export function snapToWall(fixture, room) {
  const threshold = 15;
  const result = { ...fixture, snapWall: null };

  // Check proximity to each wall
  if (fixture.y <= threshold) {
    result.y = 0;
    result.snapWall = 'north';
  } else if (fixture.y + fixture.depth >= room.depth - threshold) {
    result.y = room.depth - fixture.depth;
    result.snapWall = 'south';
  }

  if (fixture.x <= threshold) {
    result.x = 0;
    result.snapWall = 'west';
  } else if (fixture.x + fixture.width >= room.width - threshold) {
    result.x = room.width - fixture.width;
    result.snapWall = 'east';
  }

  return result;
}
