import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { state } from '../core/state.js';
import { aggregateTileCounts, calcTilesForFront } from './tiles-calc.js';
import { MATERIAL_RATES } from '../core/constants.js';
import { renderTilePlanToContext } from './tiles-pdf-renderer.js';
import { FIXTURE_SIDES } from './fronts-panel.js';

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 12;
const FONT = 'Roboto';

async function loadFont(doc, url, name, style) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${url}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let b64 = '';
  const chunkSize = 8190; // must be a multiple of 3 to avoid mid-string base64 padding
  for (let i = 0; i < bytes.length; i += chunkSize) {
    b64 += btoa(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  doc.addFileToVFS(`${name}-${style}.ttf`, b64);
  doc.addFont(`${name}-${style}.ttf`, name, style);
}

function drawHeader(doc, room, dateStr, roomName) {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text(`Plan wykończenia — ${roomName}`, MARGIN, MARGIN + 7);

  doc.setFont(FONT, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Wymiary: ${room.width} × ${room.depth} cm, wysokość ${room.height} cm`,
    MARGIN,
    MARGIN + 14,
  );
  doc.text(`Data: ${dateStr}`, MARGIN, MARGIN + 20);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, MARGIN + 23, PAGE_W - MARGIN, MARGIN + 23);
}

function drawFooter(doc, page, total) {
  const y = PAGE_H - 5;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('Bathroom Designer — wygenerowano automatycznie', MARGIN, y);
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN, y, { align: 'right' });
}

export async function exportToPDF() {
  const { room, tileZones, tileSets, tileFronts, fixtures } = state.get();
  const rooms = state.getRooms();
  const currentRoomId = state.getCurrentRoomId();
  const currentRoomObj = rooms.find(r => r.id === currentRoomId);
  const roomName = currentRoomObj?.name || 'Pomieszczenie';
  const aggregated = aggregateTileCounts(tileZones, tileFronts, tileSets, fixtures);
  const hasZones = aggregated.length > 0;
  const dateStr = new Date().toLocaleDateString('pl-PL');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Load Unicode fonts (required for Polish characters)
  const base = import.meta.env.BASE_URL ?? '/';
  await loadFont(doc, `${base}fonts/Roboto-Regular.ttf`, FONT, 'normal');
  await loadFont(doc, `${base}fonts/Roboto-Bold.ttf`, FONT, 'bold');
  doc.setFont(FONT, 'normal');

  // ========================
  // PAGE 1: Tile plan
  // ========================
  drawHeader(doc, room, dateStr, roomName);

  const planY = MARGIN + 26;
  const planW = PAGE_W - MARGIN * 2;
  const planH = PAGE_H - planY - MARGIN - 8;

  const offscreen = document.createElement('canvas');
  offscreen.width = 3300; // ~307 DPI on A4 landscape (273 mm content width)
  offscreen.height = Math.round(2800 * (planH / planW));
  const ctx = offscreen.getContext('2d');
  renderTilePlanToContext(ctx, offscreen.width, offscreen.height, room, tileZones, tileSets);
  const planDataUrl = offscreen.toDataURL('image/jpeg', 0.92);

  doc.addImage(planDataUrl, 'JPEG', MARGIN, planY, planW, planH);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, planY, planW, planH);

  drawFooter(doc, 1, 2);

  // ========================
  // PAGE 2: Tables
  // ========================
  doc.addPage();
  drawHeader(doc, room, dateStr, roomName);

  const tableY = MARGIN + 23;

  // Tile sets summary table
  autoTable(doc, {
    startY: tableY,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Zestaw płytek', 'Kolor', 'Pow. netto (m²)', 'Płytki z naddatkiem', 'Wymiary (mm)']],
    body: hasZones
      ? aggregated.map(r => [
          r.tileSet.name,
          '',
          r.netArea.toFixed(2),
          r.tilesWithWaste.toString(),
          `${r.tileSet.tileWidth}×${r.tileSet.tileHeight}`,
        ])
      : [['Brak zdefiniowanych stref', '', '—', '—', '—']],
    styles: { font: FONT, fontSize: 9, cellPadding: 3, overflow: 'ellipsize' },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold', font: FONT },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 10 },
      2: { cellWidth: 34, halign: 'right' },
      3: { cellWidth: 38, halign: 'right' },
      4: { cellWidth: 28, halign: 'center' },
    },
    didDrawCell(data) {
      if (data.column.index === 1 && data.section === 'body' && hasZones) {
        const item = aggregated[data.row.index];
        if (!item) return;
        const hex = item.tileSet.color || '#888888';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        doc.setFillColor(r, g, b);
        const pad = 1.5;
        doc.rect(
          data.cell.x + pad,
          data.cell.y + pad,
          data.cell.width - pad * 2,
          data.cell.height - pad * 2,
          'F',
        );
      }
    },
  });

  const afterSummary = doc.lastAutoTable.finalY;

  doc.setFont(FONT, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('* z naddatkiem na odpad zgodnie z ustawieniami zestawu', MARGIN, afterSummary + 5);

  // Materials table
  if (hasZones) {
    const totalArea = aggregated.reduce((s, r) => s + r.netArea, 0);
    const matTitleY = afterSummary + 14;

    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('Orientacyjne zużycie materiałów (łącznie):', MARGIN, matTitleY);

    autoTable(doc, {
      startY: matTitleY + 4,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: 110,
      head: [['Materiał', 'Ilość', 'Jednostka']],
      body: Object.values(MATERIAL_RATES).map(m => [
        m.label,
        (totalArea * m.rate).toFixed(1),
        m.unit.split('/')[0],
      ]),
      styles: { font: FONT, fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: 'bold', font: FONT },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'right' },
        2: { cellWidth: 24 },
      },
    });
  }

  // Fronts table
  const tileableFixtures = fixtures.filter(f => f.catalogId === 'bathtub' || f.catalogId === 'shower');
  const frontsWithData = [];
  tileableFixtures.forEach(fixture => {
    const sides = FIXTURE_SIDES[fixture.catalogId] || [];
    sides.forEach(side => {
      const front = tileFronts.find(f => f.fixtureId === fixture.id && f.side === side.id);
      if (!front) return;
      const ts = tileSets.find(t => t.id === front.tileSetId);
      if (!ts) return;
      const { w, h } = side.getDims(fixture);
      const calc = calcTilesForFront(fixture, ts, side.id);
      frontsWithData.push({ fixture, side, ts, w, h, calc });
    });
  });

  if (frontsWithData.length > 0) {
    const frontsY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : afterSummary + 14;

    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('Płytki na bokach armatury:', MARGIN, frontsY);

    autoTable(doc, {
      startY: frontsY + 4,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Element', 'Bok', 'Wymiary (cm)', 'Pow. (m²)', 'Płytki z naddatkiem', 'Zestaw płytek', 'Kolor']],
      body: frontsWithData.map(({ fixture, side, ts, w, h, calc }) => [
        fixture.label || fixture.catalogId,
        side.label,
        `${w}×${h}`,
        ((w * h) / 10000).toFixed(2),
        calc ? calc.tilesWithWaste.toString() : '—',
        ts.name,
        '',
      ]),
      styles: { font: FONT, fontSize: 9, cellPadding: 3, overflow: 'ellipsize' },
      headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold', font: FONT },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 28 },
        2: { cellWidth: 26, halign: 'center' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 38, halign: 'right' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 10 },
      },
      didDrawCell(data) {
        if (data.column.index === 6 && data.section === 'body') {
          const item = frontsWithData[data.row.index];
          if (!item) return;
          const hex = item.ts.color || '#888888';
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          doc.setFillColor(r, g, b);
          const pad = 1.5;
          doc.rect(data.cell.x + pad, data.cell.y + pad, data.cell.width - pad * 2, data.cell.height - pad * 2, 'F');
        }
      },
    });
  }

  drawFooter(doc, 2, 2);

  const safeName = roomName.toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  doc.save(`plan-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
