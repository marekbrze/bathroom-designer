import { generateId } from '../core/utils.js';

export function createTileZone(overrides = {}) {
  return {
    id: generateId(),
    wallId: 'floor',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    tileSetId: null,
    ...overrides,
  };
}

export function getZoneArea(zone) {
  return (zone.width * zone.height) / 10000;
}

export function clampZoneToWall(zone, wallWidth, wallHeight) {
  const x = Math.max(0, Math.min(zone.x, wallWidth - zone.width));
  const y = Math.max(0, Math.min(zone.y, wallHeight - zone.height));
  const width = Math.min(zone.width, wallWidth - x);
  const height = Math.min(zone.height, wallHeight - y);
  return { ...zone, x, y, width: Math.max(10, width), height: Math.max(10, height) };
}

export function zonesOverlap(z1, z2) {
  if (z1.wallId !== z2.wallId) return false;
  return !(
    z1.x + z1.width <= z2.x ||
    z2.x + z2.width <= z1.x ||
    z1.y + z1.height <= z2.y ||
    z2.y + z2.height <= z1.y
  );
}

export function getZonesForWall(zones, wallId) {
  return zones.filter(z => z.wallId === wallId);
}
