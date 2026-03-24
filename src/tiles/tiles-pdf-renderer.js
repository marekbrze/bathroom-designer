const WALL_COLORS = {
  floor: '#d4c4a8',
  north: '#e8e0d8',
  east: '#e0d8e8',
  south: '#d8e0e8',
  west: '#e8e8d8',
};

const WALL_LABELS = {
  floor: 'Podłoga',
  north: 'Ściana Północ',
  east: 'Ściana Wschód',
  south: 'Ściana Południe',
  west: 'Ściana Zachód',
};

const RULER_W = 18; // px — ruler strip width

function drawGrid(ctx, x, y, w, h, surfaceW, surfaceH, scale) {
  const minorStep = 10 * scale;
  const majorEvery = 5; // major line every 50 cm

  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 0.5;
  for (let col = 1; col * 10 < surfaceW; col++) {
    if (col % majorEvery === 0) continue;
    const lx = x + col * minorStep;
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y + h); ctx.stroke();
  }
  for (let row = 1; row * 10 < surfaceH; row++) {
    if (row % majorEvery === 0) continue;
    const ly = y + row * minorStep;
    ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 0.8;
  for (let col = majorEvery; col * 10 < surfaceW; col += majorEvery) {
    const lx = x + col * minorStep;
    ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, y + h); ctx.stroke();
  }
  for (let row = majorEvery; row * 10 < surfaceH; row += majorEvery) {
    const ly = y + row * minorStep;
    ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke();
  }
}

function drawRuler(ctx, x, y, w, h, surfaceW, surfaceH, scale, fontSize, isVerticalWall = false) {
  const minorStep = 10 * scale;

  // Top ruler (horizontal — shows width in cm)
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(x, y - RULER_W, w, RULER_W);
  ctx.strokeStyle = '#aaaaaa';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y - RULER_W, w, RULER_W);

  ctx.fillStyle = '#555555';
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let col = 0; col * 10 <= surfaceW; col++) {
    const lx = x + col * minorStep;
    const isMajor = col % 5 === 0;
    const tickH = isMajor ? 7 : 3;
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = isMajor ? 0.8 : 0.4;
    ctx.beginPath();
    ctx.moveTo(lx, y - tickH);
    ctx.lineTo(lx, y);
    ctx.stroke();
    if (isMajor && col > 0) {
      ctx.fillStyle = '#444444';
      ctx.fillText(`${col * 10}`, lx, y - RULER_W + 2);
      ctx.fillStyle = '#555555';
    }
  }

  // Left ruler (vertical — shows height in cm)
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(x - RULER_W, y, RULER_W, h);
  ctx.strokeStyle = '#aaaaaa';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x - RULER_W, y, RULER_W, h);

  ctx.fillStyle = '#555555';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let row = 0; row * 10 <= surfaceH; row++) {
    const ly = y + row * minorStep;
    const isMajor = row % 5 === 0;
    const tickW = isMajor ? 7 : 3;
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = isMajor ? 0.8 : 0.4;
    ctx.beginPath();
    ctx.moveTo(x - tickW, ly);
    ctx.lineTo(x, ly);
    ctx.stroke();
    const label = isVerticalWall ? surfaceH - row * 10 : row * 10;
    const showLabel = isMajor && (isVerticalWall || row > 0);
    if (showLabel) {
      ctx.fillStyle = '#444444';
      ctx.fillText(`${label}`, x - 2, ly);
      ctx.fillStyle = '#555555';
    }
  }
}

/**
 * Renders the cross-shaped tile plan onto a 2D canvas context.
 * Pure function — no DOM state, no events, no zoom/pan.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {{ width: number, depth: number, height: number }} room - dimensions in cm
 * @param {Array} zones - TileZone[]
 * @param {Array} tileSets - TileSet[]
 */
export function renderTilePlanToContext(ctx, canvasW, canvasH, room, zones, tileSets) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const padding = 60; // extra space for rulers at canvas edges
  const gapCm = 20;
  const labelHeight = 32;

  const crossW = room.depth + gapCm + room.width + gapCm + room.depth;
  const crossH = room.height + gapCm + room.depth + gapCm + room.height;

  const availW = canvasW - padding * 2;
  const availH = canvasH - padding * 2 - labelHeight;
  const scale = Math.min(availW / crossW, availH / crossH);

  const gap = gapCm * scale;

  const floorW = room.width * scale;
  const floorH = room.depth * scale;
  const wallNH = room.height * scale;
  const wallSH = room.height * scale;
  const wallWW = room.depth * scale;
  const wallWH = room.height * scale;
  const wallEW = room.depth * scale;
  const wallEH = room.height * scale;

  const totalW = wallWW + gap + floorW + gap + wallEW;
  const totalH = wallNH + gap + floorH + gap + wallSH;
  const cx = (canvasW - totalW) / 2;
  const cy = (canvasH - totalH) / 2;

  const floorX = cx + wallWW + gap;
  const floorY = cy + wallNH + gap;

  const positions = {
    floor: { x: floorX, y: floorY, w: floorW, h: floorH, wallW: room.width, wallH: room.depth },
    north: { x: floorX, y: cy, w: room.width * scale, h: wallNH, wallW: room.width, wallH: room.height },
    south: { x: floorX, y: floorY + floorH + gap, w: room.width * scale, h: wallSH, wallW: room.width, wallH: room.height },
    west:  { x: cx, y: floorY + floorH - wallWH, w: wallWW, h: wallWH, wallW: room.depth, wallH: room.height },
    east:  { x: floorX + floorW + gap, y: floorY + floorH - wallEH, w: wallEW, h: wallEH, wallW: room.depth, wallH: room.height },
  };

  const wallIds = ['floor', 'north', 'south', 'west', 'east'];
  const labelFontSize = Math.max(10, Math.min(16, scale * 6));
  const rulerFontSize = Math.max(8, Math.min(13, scale * 4.5));

  wallIds.forEach(wallId => {
    const pos = positions[wallId];
    const { x, y, w, h } = pos;

    // 1. Wall background
    ctx.fillStyle = WALL_COLORS[wallId];
    ctx.fillRect(x, y, w, h);

    // 2. Grid
    drawGrid(ctx, x, y, w, h, pos.wallW, pos.wallH, scale);

    // 3. Rulers
    drawRuler(ctx, x, y, w, h, pos.wallW, pos.wallH, scale, rulerFontSize, wallId !== 'floor');

    // 4. Border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // 5. Label above the wall
    ctx.font = `${labelFontSize}px system-ui, sans-serif`;
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      `${WALL_LABELS[wallId]} (${pos.wallW}×${pos.wallH} cm)`,
      x,
      y - RULER_W - 4,
    );

    // 6. Tile zones
    zones.forEach(zone => {
      if (zone.wallId !== wallId) return;

      const ts = tileSets.find(t => t.id === zone.tileSetId);
      const zx = x + zone.x * scale;
      const zy = y + zone.y * scale;
      const zw = zone.width * scale;
      const zh = zone.height * scale;

      ctx.fillStyle = ts ? ts.color + 'bb' : '#ccccccbb';
      ctx.fillRect(zx, zy, zw, zh);

      ctx.strokeStyle = ts ? ts.color : '#aaaaaa';
      ctx.lineWidth = 2;
      ctx.strokeRect(zx, zy, zw, zh);

      if (ts && zw > 20 && zh > 12) {
        const zoneLabelSize = Math.max(9, Math.min(12, scale * 5));
        ctx.font = `bold ${zoneLabelSize}px system-ui, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ts.name, zx + zw / 2, zy + zh / 2);
      }
    });
  });

  ctx.textBaseline = 'alphabetic';
}
