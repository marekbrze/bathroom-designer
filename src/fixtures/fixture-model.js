import { generateId } from '../core/utils.js';
import { getCatalogItem } from './fixture-catalog.js';

export function createFixture(catalogId, x, y, overrides = {}) {
  const template = getCatalogItem(catalogId);
  if (!template) return null;
  const fixture = {
    id: generateId(),
    catalogId,
    label: template.name,
    x,
    y,
    z: template.wallMounted ? 120 : 0,
    width: template.width,
    depth: template.depth,
    height: template.height,
    rotation: template.defaultRotation || 0,
    wallMounted: template.wallMounted,
    snapWall: null,
    frontSide: template.frontSide || 'bottom',
    ...overrides,
  };

  if (template.isDoor) {
    fixture.isDoor = true;
    fixture.doorWidth = template.doorWidth;
    fixture.openDirection = fixture.openDirection || template.defaultOpenDirection || 'inward';
    fixture.openSide = fixture.openSide || template.defaultOpenSide || 'left';
  }

  return fixture;
}
