import { getZoneArea } from './tile-zone.js';

export function calcTilesForZone(zone, tileSet) {
  if (!tileSet || !zone.tileSetId) return null;
  
  const areaM2 = getZoneArea(zone);
  const tileW = (tileSet.tileWidth + tileSet.groutGap) / 1000;
  const tileH = (tileSet.tileHeight + tileSet.groutGap) / 1000;
  const tileArea = tileW * tileH;
  
  const tiles = Math.ceil(areaM2 / tileArea);
  const tilesWithWaste = Math.ceil(tiles * (1 + tileSet.wastePercent / 100));
  
  return {
    netArea: areaM2,
    tiles,
    tilesWithWaste,
    tileAreaM2: (tileSet.tileWidth / 1000) * (tileSet.tileHeight / 1000),
  };
}

function getSideDims(fixture, side) {
  switch (side) {
    case 'left':
    case 'right': return { w: fixture.depth, h: fixture.height };
    default:      return { w: fixture.width, h: fixture.height };
  }
}

export function calcTilesForFront(fixture, tileSet, side = 'front') {
  if (!tileSet) return null;

  const { w, h } = getSideDims(fixture, side);
  const areaM2 = (w * h) / 10000;
  
  const tileW = (tileSet.tileWidth + tileSet.groutGap) / 1000;
  const tileH = (tileSet.tileHeight + tileSet.groutGap) / 1000;
  const tileArea = tileW * tileH;
  
  const tiles = Math.ceil(areaM2 / tileArea);
  const tilesWithWaste = Math.ceil(tiles * (1 + tileSet.wastePercent / 100));
  
  return {
    netArea: areaM2,
    tiles,
    tilesWithWaste,
    tileAreaM2: (tileSet.tileWidth / 1000) * (tileSet.tileHeight / 1000),
  };
}

export function aggregateTileCounts(zones, fronts, tileSets, fixtures) {
  const result = {};
  
  tileSets.forEach(ts => {
    result[ts.id] = {
      tileSet: ts,
      netArea: 0,
      tiles: 0,
      tilesWithWaste: 0,
      zoneCount: 0,
      frontCount: 0,
    };
  });
  
  zones.forEach(zone => {
    const ts = tileSets.find(t => t.id === zone.tileSetId);
    if (!ts) return;
    const calc = calcTilesForZone(zone, ts);
    if (!calc) return;
    result[ts.id].netArea += calc.netArea;
    result[ts.id].tiles += calc.tiles;
    result[ts.id].tilesWithWaste += calc.tilesWithWaste;
    result[ts.id].zoneCount++;
  });
  
  fronts.forEach(front => {
    const ts = tileSets.find(t => t.id === front.tileSetId);
    const fixture = fixtures.find(f => f.id === front.fixtureId);
    if (!ts || !fixture) return;
    const calc = calcTilesForFront(fixture, ts, front.side || 'front');
    if (!calc) return;
    result[ts.id].netArea += calc.netArea;
    result[ts.id].tiles += calc.tiles;
    result[ts.id].tilesWithWaste += calc.tilesWithWaste;
    result[ts.id].frontCount++;
  });
  
  return Object.values(result).filter(r => r.zoneCount > 0 || r.frontCount > 0);
}
