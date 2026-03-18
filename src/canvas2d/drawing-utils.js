import { COLORS } from '../core/constants.js';

function getClearancePosition(fixture, frontSide, clearanceFront) {
  const { x, y, width, depth, rotation } = fixture;
  const rot = rotation || 0;
  
  const baseFrontSide = frontSide || 'bottom';
  const rotSteps = Math.round(rot / 90) % 4;
  
  const isRotated = rot === 90 || rot === 270;
  const effWidth = isRotated ? depth : width;
  const effDepth = isRotated ? width : depth;
  
  const sideOrder = { bottom: 0, right: 1, top: 2, left: 3 };
  const sides = ['bottom', 'right', 'top', 'left'];
  const actualSideIndex = (sideOrder[baseFrontSide] + rotSteps) % 4;
  const actualSide = sides[actualSideIndex];
  
  let cx, cy, cw, cd;
  
  switch (actualSide) {
    case 'bottom':
      cx = x;
      cy = y + effDepth;
      cw = effWidth;
      cd = clearanceFront;
      break;
    case 'right':
      cx = x + effWidth;
      cy = y;
      cw = clearanceFront;
      cd = effDepth;
      break;
    case 'top':
      cx = x;
      cy = y - clearanceFront;
      cw = effWidth;
      cd = clearanceFront;
      break;
    case 'left':
      cx = x - clearanceFront;
      cy = y;
      cw = clearanceFront;
      cd = effDepth;
      break;
  }
  
  return { x: cx, y: cy, width: cw, depth: cd, side: actualSide };
}

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

  const rot = fixture.rotation || 0;
  const left = fixture.openSide === 'left';
  const inward = fixture.openDirection === 'inward';

  const baseAngles = {
    'left-inward': { start: 0, end: Math.PI / 2 },
    'right-inward': { start: Math.PI / 2, end: Math.PI },
    'left-outward': { start: -Math.PI / 2, end: 0 },
    'right-outward': { start: Math.PI, end: Math.PI * 1.5 }
  };
  
  const key = `${left ? 'left' : 'right'}-${inward ? 'inward' : 'outward'}`;
  const angles = baseAngles[key];
  let startAngle = angles.start;
  let endAngle = angles.end;

  const rotRad = (rot * Math.PI) / 180;
  startAngle += rotRad;
  endAngle += rotRad;

  const pivotMap = {
    0:   { left: [x, y],         right: [x + w, y] },
    90:  { left: [x + w, y],     right: [x + w, y + d] },
    180: { left: [x + w, y + d], right: [x, y + d] },
    270: { left: [x, y + d],     right: [x, y] }
  };
  const [rotatedPivotX, rotatedPivotY] = pivotMap[rot][left ? 'left' : 'right'];

  ctx.beginPath();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = COLORS.doorSwing;
  ctx.lineWidth = 1.5;
  ctx.arc(rotatedPivotX, rotatedPivotY, radius, startAngle, endAngle);
  ctx.stroke();

  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.strokeStyle = COLORS.doorSwing;
  ctx.lineWidth = 2;
  ctx.moveTo(rotatedPivotX, rotatedPivotY);
  const leafX = rotatedPivotX + Math.cos(endAngle) * radius;
  const leafY = rotatedPivotY + Math.sin(endAngle) * radius;
  ctx.lineTo(leafX, leafY);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawClearanceZone(ctx, fixture, zoom, panOffset) {
  const catalogItem = fixture._catalog;
  const clearance = catalogItem?.clearance;
  if (!clearance || clearance.type === 'arc') return;
  if (clearance.front <= 0 && clearance.sides <= 0) return;

  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const w = (isRotated ? fixture.depth : fixture.width) * zoom;
  const d = (isRotated ? fixture.width : fixture.depth) * zoom;
  const baseX = fixture.x * zoom + panOffset.x;
  const baseY = fixture.y * zoom + panOffset.y;
  const frontPx = (clearance.front || 0) * zoom;
  const sidesPx = (clearance.sides || 0) * zoom;

  if (frontPx > 0) {
    const pos = getClearancePosition(fixture, fixture.frontSide, clearance.front);
    const zoneX = pos.x * zoom + panOffset.x;
    const zoneY = pos.y * zoom + panOffset.y;
    const zoneW = pos.width * zoom;
    const zoneH = pos.depth * zoom;

    ctx.beginPath();
    if (pos.side === 'bottom') {
      const r = Math.min(zoneH, zoneW / 2);
      ctx.moveTo(zoneX, zoneY);
      ctx.lineTo(zoneX, zoneY + zoneH - r);
      ctx.quadraticCurveTo(zoneX, zoneY + zoneH, zoneX + r, zoneY + zoneH);
      ctx.lineTo(zoneX + zoneW - r, zoneY + zoneH);
      ctx.quadraticCurveTo(zoneX + zoneW, zoneY + zoneH, zoneX + zoneW, zoneY + zoneH - r);
      ctx.lineTo(zoneX + zoneW, zoneY);
    } else if (pos.side === 'top') {
      const r = Math.min(zoneH, zoneW / 2);
      ctx.moveTo(zoneX, zoneY + zoneH);
      ctx.lineTo(zoneX, zoneY + r);
      ctx.quadraticCurveTo(zoneX, zoneY, zoneX + r, zoneY);
      ctx.lineTo(zoneX + zoneW - r, zoneY);
      ctx.quadraticCurveTo(zoneX + zoneW, zoneY, zoneX + zoneW, zoneY + r);
      ctx.lineTo(zoneX + zoneW, zoneY + zoneH);
    } else if (pos.side === 'right') {
      const r = Math.min(zoneW, zoneH / 2);
      ctx.moveTo(zoneX, zoneY);
      ctx.lineTo(zoneX, zoneY + zoneH);
      ctx.lineTo(zoneX + zoneW - r, zoneY + zoneH);
      ctx.quadraticCurveTo(zoneX + zoneW, zoneY + zoneH, zoneX + zoneW, zoneY + zoneH - r);
      ctx.lineTo(zoneX + zoneW, zoneY + r);
      ctx.quadraticCurveTo(zoneX + zoneW, zoneY, zoneX + zoneW - r, zoneY);
    } else {
      const r = Math.min(zoneW, zoneH / 2);
      ctx.moveTo(zoneX + zoneW, zoneY);
      ctx.lineTo(zoneX + zoneW, zoneY + zoneH);
      ctx.lineTo(zoneX + r, zoneY + zoneH);
      ctx.quadraticCurveTo(zoneX, zoneY + zoneH, zoneX, zoneY + zoneH - r);
      ctx.lineTo(zoneX, zoneY + r);
      ctx.quadraticCurveTo(zoneX, zoneY, zoneX + r, zoneY);
    }
    ctx.closePath();

    ctx.fillStyle = COLORS.clearanceZone;
    ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.clearanceZoneStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (sidesPx > 0) {
    const pos = getClearancePosition(fixture, fixture.frontSide, clearance.front);
    const fx = fixture.x * zoom + panOffset.x;
    const fy = fixture.y * zoom + panOffset.y;
    
    if (pos.side === 'bottom' || pos.side === 'top') {
      ctx.fillStyle = COLORS.clearanceZone;
      ctx.fillRect(fx - sidesPx, fy, sidesPx, d);
      ctx.fillRect(fx + w, fy, sidesPx, d);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLORS.clearanceZoneStroke;
      ctx.strokeRect(fx - sidesPx, fy, sidesPx, d);
      ctx.strokeRect(fx + w, fy, sidesPx, d);
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = COLORS.clearanceZone;
      ctx.fillRect(fx, fy - sidesPx, w, sidesPx);
      ctx.fillRect(fx, fy + d, w, sidesPx);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COLORS.clearanceZoneStroke;
      ctx.strokeRect(fx, fy - sidesPx, w, sidesPx);
      ctx.strokeRect(fx, fy + d, w, sidesPx);
      ctx.setLineDash([]);
    }
  }
}

export function getClearanceRect(fixture, catalog) {
  const clearance = catalog?.clearance;
  if (!clearance || clearance.type === 'arc' || clearance.front <= 0) return null;

  return getClearancePosition(fixture, fixture.frontSide, clearance.front);
}

export function drawDoorClearanceZone(ctx, fixture, zoom, panOffset) {
  if (!fixture.isDoor) return;
  
  const isRotated = fixture.rotation === 90 || fixture.rotation === 270;
  const w = (isRotated ? fixture.depth : fixture.width) * zoom;
  const d = (isRotated ? fixture.width : fixture.depth) * zoom;
  const x = fixture.x * zoom + panOffset.x;
  const y = fixture.y * zoom + panOffset.y;
  const radius = fixture.doorWidth * zoom;

  const rot = fixture.rotation || 0;
  const left = fixture.openSide === 'left';
  const inward = fixture.openDirection === 'inward';

  const baseAngles = {
    'left-inward': { start: 0, end: Math.PI / 2 },
    'right-inward': { start: Math.PI / 2, end: Math.PI },
    'left-outward': { start: -Math.PI / 2, end: 0 },
    'right-outward': { start: Math.PI, end: Math.PI * 1.5 }
  };
  
  const key = `${left ? 'left' : 'right'}-${inward ? 'inward' : 'outward'}`;
  const angles = baseAngles[key];
  let startAngle = angles.start;
  let endAngle = angles.end;

  const rotRad = (rot * Math.PI) / 180;
  startAngle += rotRad;
  endAngle += rotRad;

  const pivotMap = {
    0:   { left: [x, y],         right: [x + w, y] },
    90:  { left: [x + w, y],     right: [x + w, y + d] },
    180: { left: [x + w, y + d], right: [x, y + d] },
    270: { left: [x, y + d],     right: [x, y] }
  };
  const [rotatedPivotX, rotatedPivotY] = pivotMap[rot][left ? 'left' : 'right'];

  ctx.beginPath();
  ctx.moveTo(rotatedPivotX, rotatedPivotY);
  ctx.arc(rotatedPivotX, rotatedPivotY, radius, startAngle, endAngle);
  ctx.closePath();
  ctx.fillStyle = COLORS.clearanceZone;
  ctx.fill();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = COLORS.clearanceZoneStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
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
