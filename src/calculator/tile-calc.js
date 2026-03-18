import { cmToM } from '../core/utils.js';

export function calcTilesForSurface(surfaceAreaM2, tileSet, exclusionsM2 = 0) {
  const netArea = Math.max(0, surfaceAreaM2 - exclusionsM2);
  if (netArea === 0) return { net: 0, tiles: 0, tilesWithWaste: 0 };

  const tileW = (tileSet.tileWidth + tileSet.groutGap) / 1000; // mm → m
  const tileH = (tileSet.tileHeight + tileSet.groutGap) / 1000;
  const tileArea = tileW * tileH;

  const tiles = Math.ceil(netArea / tileArea);
  const tilesWithWaste = Math.ceil(tiles * (1 + tileSet.wastePercent / 100));

  return {
    net: netArea,
    tiles,
    tilesWithWaste,
    tileAreaM2: (tileSet.tileWidth / 1000) * (tileSet.tileHeight / 1000),
    totalAreaM2: tilesWithWaste * (tileSet.tileWidth / 1000) * (tileSet.tileHeight / 1000),
  };
}

export function calcFixtureExclusions(fixtures, surfaceId, room) {
  // For floor: sum of fixture footprint areas
  if (surfaceId === 'floor') {
    return fixtures
      .filter(f => !f.wallMounted)
      .reduce((sum, f) => sum + (f.width * f.depth) / 10000, 0);
  }

  // For walls: fixtures touching that wall reduce the tiled area
  const wallFixtures = fixtures.filter(f => {
    if (f.wallMounted) return false; // wall-mounted don't reduce wall tile area
    switch (surfaceId) {
      case 'north': return f.y === 0;
      case 'south': return f.y + f.depth >= room.depth - 1;
      case 'west': return f.x === 0;
      case 'east': return f.x + f.width >= room.width - 1;
      default: return false;
    }
  });

  return wallFixtures.reduce((sum, f) => {
    const isRotated = f.rotation === 90 || f.rotation === 270;
    const w = isRotated ? f.depth : f.width;
    return sum + (w * f.height) / 10000;
  }, 0);
}
