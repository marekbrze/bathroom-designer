import { COLORS } from '../core/constants.js';

export function drawGrid(ctx, w, h, zoom, panOffset, gridSize) {
  const step = gridSize * zoom;
  if (step < 3) return;

  const offsetX = panOffset.x % step;
  const offsetY = panOffset.y % step;

  ctx.beginPath();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 0.5;

  for (let x = offsetX; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = offsetY; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Major grid (every 10 cells = 100cm = 1m)
  const majorStep = step * 10;
  if (majorStep > 30) {
    const majorOffX = panOffset.x % majorStep;
    const majorOffY = panOffset.y % majorStep;
    ctx.beginPath();
    ctx.strokeStyle = COLORS.gridMajor;
    ctx.lineWidth = 1;
    for (let x = majorOffX; x < w; x += majorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = majorOffY; y < h; y += majorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }
}

export function drawRoom(ctx, room, zoom, panOffset) {
  const x = panOffset.x;
  const y = panOffset.y;
  const w = room.width * zoom;
  const d = room.depth * zoom;

  ctx.fillStyle = COLORS.room;
  ctx.fillRect(x, y, w, d);
  ctx.strokeStyle = COLORS.roomStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, d);

  // Dimension labels
  ctx.fillStyle = COLORS.dimension;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  // Width on top
  ctx.fillText(`${room.width} cm`, x + w / 2, y - 6);

  // Depth on right
  ctx.save();
  ctx.translate(x + w + 16, y + d / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText(`${room.depth} cm`, 0, 0);
  ctx.restore();

  // Wall labels
  ctx.font = '10px sans-serif';
  ctx.fillStyle = COLORS.dimension;
  ctx.textAlign = 'center';
  ctx.fillText('N', x + w / 2, y + 12);
  ctx.fillText('S', x + w / 2, y + d - 4);

  ctx.save();
  ctx.translate(x + 10, y + d / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('W', 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(x + w - 4, y + d / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText('E', 0, 0);
  ctx.restore();
}

export function drawFixture(ctx, fixture, zoom, panOffset, isSelected, hasCollision) {
  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const w = (isRotated ? fixture.depth : fixture.width) * zoom;
  const d = (isRotated ? fixture.width : fixture.depth) * zoom;
  const x = fixture.x * zoom + panOffset.x;
  const y = fixture.y * zoom + panOffset.y;

  let fill, stroke;
  if (hasCollision) {
    fill = COLORS.fixtureCollision;
    stroke = COLORS.fixtureCollisionStroke;
  } else if (isSelected) {
    fill = COLORS.fixtureSelected;
    stroke = COLORS.fixtureSelectedStroke;
  } else if (fixture.wallMounted) {
    fill = COLORS.wallMounted;
    stroke = COLORS.wallMountedStroke;
  } else {
    fill = COLORS.fixture;
    stroke = COLORS.fixtureStroke;
  }

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, d);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeRect(x, y, w, d);

  // Label
  ctx.fillStyle = stroke;
  ctx.font = `${Math.min(10, 10 * zoom)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = fixture.label || fixture.catalogId;
  if (w > 20 && d > 12) {
    ctx.fillText(label, x + w / 2, y + d / 2, w - 4);
  }
}

export function drawDoor(ctx, fixture, zoom, panOffset, isSelected) {
  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const w = (isRotated ? fixture.depth : fixture.width) * zoom;
  const d = (isRotated ? fixture.width : fixture.depth) * zoom;
  const x = fixture.x * zoom + panOffset.x;
  const y = fixture.y * zoom + panOffset.y;
  const radius = fixture.doorWidth * zoom;

  // Determine pivot point and arc angles based on rotation, openSide, openDirection
  const rot = fixture.rotation || 0;
  const left = fixture.openSide === 'left';
  const inward = fixture.openDirection === 'inward';

  // Pivot is at left or right corner of the frame
  let pivotX, pivotY;
  let startAngle, endAngle;

  // For rotation 0: frame is horizontal at top, door swings downward (inward)
  // We compute base angles then rotate
  if (left) {
    pivotX = x;
    pivotY = y;
  } else {
    pivotX = x + w;
    pivotY = y;
  }

  // Base arc: from frame edge going 90° into room
  if (left && inward) {
    startAngle = 0;         // along frame to the right
    endAngle = Math.PI / 2; // downward
  } else if (!left && inward) {
    startAngle = Math.PI / 2;
    endAngle = Math.PI;
  } else if (left && !inward) {
    startAngle = -Math.PI / 2;
    endAngle = 0;
  } else {
    startAngle = Math.PI;
    endAngle = Math.PI * 1.5;
  }

  // Apply fixture rotation around fixture center
  const cx = x + w / 2;
  const cy = y + d / 2;
  const rotRad = (rot * Math.PI) / 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotRad);
  ctx.translate(-cx, -cy);

  // Draw arc
  ctx.beginPath();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = COLORS.doorSwing;
  ctx.lineWidth = 1.5;
  ctx.arc(pivotX, pivotY, radius, startAngle, endAngle);
  ctx.stroke();

  // Draw line from pivot to arc end (door leaf position)
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.strokeStyle = COLORS.doorSwing;
  ctx.lineWidth = 2;
  ctx.moveTo(pivotX, pivotY);
  const leafX = pivotX + Math.cos(endAngle) * radius;
  const leafY = pivotY + Math.sin(endAngle) * radius;
  ctx.lineTo(leafX, leafY);
  ctx.stroke();

  ctx.restore();
  ctx.setLineDash([]);
}

export function drawClearanceZone(ctx, fixture, zoom, panOffset) {
  const catalogItem = fixture._catalog;
  const clearance = catalogItem?.clearance;
  if (!clearance || (clearance.front <= 0 && clearance.sides <= 0)) return;

  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const w = (isRotated ? fixture.depth : fixture.width) * zoom;
  const d = (isRotated ? fixture.width : fixture.depth) * zoom;
  const x = fixture.x * zoom + panOffset.x;
  const y = fixture.y * zoom + panOffset.y;
  const frontPx = clearance.front * zoom;
  const sidesPx = clearance.sides * zoom;
  const rot = fixture.rotation || 0;

  ctx.save();

  // Front zone: semicircle/rect extending from the "front" side of the element
  // Front = bottom side at rotation 0 (the side the user faces)
  if (frontPx > 0) {
    const cx = x + w / 2;
    const cy = y + d / 2;
    const rotRad = (rot * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);
    ctx.translate(-cx, -cy);

    // Draw rounded rect extending below the fixture (front = +Y at rot 0)
    ctx.beginPath();
    const zoneX = x;
    const zoneY = y + d;
    const zoneW = w;
    const zoneH = frontPx;

    // Rounded bottom corners
    const r = Math.min(zoneH, zoneW / 2);
    ctx.moveTo(zoneX, zoneY);
    ctx.lineTo(zoneX, zoneY + zoneH - r);
    ctx.quadraticCurveTo(zoneX, zoneY + zoneH, zoneX + r, zoneY + zoneH);
    ctx.lineTo(zoneX + zoneW - r, zoneY + zoneH);
    ctx.quadraticCurveTo(zoneX + zoneW, zoneY + zoneH, zoneX + zoneW, zoneY + zoneH - r);
    ctx.lineTo(zoneX + zoneW, zoneY);
    ctx.closePath();

    ctx.fillStyle = COLORS.clearanceZone;
    ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.clearanceZoneStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  // Side zones
  if (sidesPx > 0) {
    const cx = x + w / 2;
    const cy = y + d / 2;
    const rotRad = (rot * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);
    ctx.translate(-cx, -cy);

    // Left side
    ctx.fillStyle = COLORS.clearanceZone;
    ctx.fillRect(x - sidesPx, y, sidesPx, d);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.clearanceZoneStroke;
    ctx.strokeRect(x - sidesPx, y, sidesPx, d);

    // Right side
    ctx.fillRect(x + w, y, sidesPx, d);
    ctx.strokeRect(x + w, y, sidesPx, d);
    ctx.setLineDash([]);

    ctx.restore();
  }

  ctx.restore();
}

export function getClearanceRect(fixture, catalog) {
  const clearance = catalog?.clearance;
  if (!clearance || clearance.front <= 0) return null;

  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const fw = isRotated ? fixture.depth : fixture.width;
  const fd = isRotated ? fixture.width : fixture.depth;
  const rot = fixture.rotation || 0;

  // At rotation 0, clearance extends in +Y direction from bottom of fixture
  let cx, cy, cw, cd;
  if (rot === 0) {
    cx = fixture.x;
    cy = fixture.y + fd;
    cw = fw;
    cd = clearance.front;
  } else if (rot === 90) {
    cx = fixture.x - clearance.front;
    cy = fixture.y;
    cw = clearance.front;
    cd = fd;
  } else if (rot === 180) {
    cx = fixture.x;
    cy = fixture.y - clearance.front;
    cw = fw;
    cd = clearance.front;
  } else {
    cx = fixture.x + fw;
    cy = fixture.y;
    cw = clearance.front;
    cd = fd;
  }
  return { x: cx, y: cy, width: cw, depth: cd };
}

export function drawClearanceOverlaps(ctx, fixtures, catalogMap, zoom, panOffset) {
  const rects = [];
  for (const f of fixtures) {
    const cat = catalogMap.get(f.catalogId);
    const r = getClearanceRect(f, cat);
    if (r) rects.push(r);
  }

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      // AABB overlap
      const ox = Math.max(a.x, b.x);
      const oy = Math.max(a.y, b.y);
      const ox2 = Math.min(a.x + a.width, b.x + b.width);
      const oy2 = Math.min(a.y + a.depth, b.y + b.depth);
      if (ox < ox2 && oy < oy2) {
        const sx = ox * zoom + panOffset.x;
        const sy = oy * zoom + panOffset.y;
        const sw = (ox2 - ox) * zoom;
        const sh = (oy2 - oy) * zoom;
        ctx.fillStyle = COLORS.clearanceOverlap;
        ctx.fillRect(sx, sy, sw, sh);
      }
    }
  }
}
