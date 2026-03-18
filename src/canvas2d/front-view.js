import { state } from '../core/state.js';
import { COLORS, DEFAULTS } from '../core/constants.js';
import { drawGrid } from './drawing-utils.js';

export function drawFrontView(ctx, w, h) {
  const ui = state.getUI();
  const room = state.getRoom();
  const fixtures = state.getFixtures();
  const zoom = ui.zoom;
  const pan = ui.panOffset;

  drawGrid(ctx, w, h, zoom, pan, DEFAULTS.grid.size);

  // Room outline (front elevation: width × height)
  const rx = pan.x;
  const ry = pan.y;
  const rw = room.width * zoom;
  const rh = room.height * zoom;

  ctx.fillStyle = COLORS.room;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.strokeStyle = COLORS.roomStroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, ry, rw, rh);

  // Dimensions
  ctx.fillStyle = COLORS.dimension;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${room.width} cm`, rx + rw / 2, ry - 6);

  ctx.save();
  ctx.translate(rx - 10, ry + rh / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${room.height} cm`, 0, 0);
  ctx.restore();

  // Draw fixtures visible from the front (north wall)
  // Project: x stays, y maps to z (bottom = floor)
  fixtures.forEach(f => {
    const isRotated = f.rotation === 90 || f.rotation === 270;
    const fw = (isRotated ? f.depth : f.width) * zoom;
    const fh = f.height * zoom;
    const fx = f.x * zoom + pan.x;
    // y-axis: bottom of room = ry + rh, fixture z=0 is floor
    const fy = ry + rh - (f.z + f.height) * zoom;

    const isSelected = f.id === ui.selectedFixtureId;
    ctx.fillStyle = isSelected ? COLORS.fixtureSelected : (f.wallMounted ? COLORS.wallMounted : COLORS.fixture);
    ctx.strokeStyle = isSelected ? COLORS.fixtureSelectedStroke : (f.wallMounted ? COLORS.wallMountedStroke : COLORS.fixtureStroke);
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeRect(fx, fy, fw, fh);

    // Label
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = `${Math.min(10, 10 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (fw > 20 && fh > 12) {
      ctx.fillText(f.label || f.catalogId, fx + fw / 2, fy + fh / 2, fw - 4);
    }
  });
}
