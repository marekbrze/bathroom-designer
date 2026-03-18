export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function cmToM(cm) {
  return cm / 100;
}

export function getAABB(fixture) {
  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const w = isRotated ? fixture.depth : fixture.width;
  const d = isRotated ? fixture.width : fixture.depth;
  return {
    x: fixture.x,
    y: fixture.y,
    width: w,
    depth: d,
  };
}

export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.depth &&
    a.y + a.depth > b.y
  );
}

export function isInsideRoom(fixture, room) {
  const bb = getAABB(fixture);
  return bb.x >= 0 && bb.y >= 0 && bb.x + bb.width <= room.width && bb.y + bb.depth <= room.depth;
}

export function screenToWorld(sx, sy, zoom, panOffset) {
  return {
    x: (sx - panOffset.x) / zoom,
    y: (sy - panOffset.y) / zoom,
  };
}

export function worldToScreen(wx, wy, zoom, panOffset) {
  return {
    x: wx * zoom + panOffset.x,
    y: wy * zoom + panOffset.y,
  };
}
