import { getAABB, aabbOverlap, isInsideRoom } from '../core/utils.js';

export function findCollisions(fixture, allFixtures, room) {
  const collisions = [];
  if (!isInsideRoom(fixture, room)) {
    collisions.push({ type: 'out-of-bounds' });
  }
  const bb = getAABB(fixture);
  for (const other of allFixtures) {
    if (other.id === fixture.id) continue;
    if (aabbOverlap(bb, getAABB(other))) {
      collisions.push({ type: 'overlap', fixtureId: other.id });
    }
  }
  return collisions;
}

export function hasAnyCollision(fixture, allFixtures, room) {
  return findCollisions(fixture, allFixtures, room).length > 0;
}
