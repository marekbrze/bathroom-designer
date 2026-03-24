import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { state } from '../core/state.js';
import { aggregateTileCounts } from './tiles-calc.js';
import { MATERIAL_RATES } from '../core/constants.js';
import { renderTilePlanToContext } from './tiles-pdf-renderer.js';

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 12;

export async function exportToPDF() {
  const { room, tileZones, tileSets, tileFronts, fixtures } = state.get();
  const aggregated = aggregateTileCounts(tileZones, tileFronts, tileSets, fixtures);
  const hasZones = aggregated.length > 0;
  const dateStr = new Date().toLocaleDateString('pl-PL');

  // --- Render tile plan to offscreen canvas ---
  const offscreen = document.createElement('canvas');
  offscreen.width = 1400;
  offscreen.height = 840;
  const ctx = offscreen.getContext('2d');
  renderTilePlanToContext(ctx, offscreen.width, offscreen.height, room, tileZones, tileSets);
  const planDataUrl = offscreen.toDataURL('image/jpeg', 0.92);

  // --- Create PDF ---
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(40, 40, 40);
  doc.text('Plan wykończenia łazienki', MARGIN, MARGIN + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Wymiary pomieszczenia: ${room.width} × ${room.depth} cm, wysokość ${room.height} cm`,
    MARGIN,
    MARGIN + 13,
  );
  doc.text(`Data: ${dateStr}`, MARGIN, MARGIN + 19);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, MARGIN + 22, PAGE_W - MARGIN, MARGIN + 22);

  // Layout constants
  const contentY = MARGIN + 25;
  const imgW = 178;
  const tableX = MARGIN + imgW + 6;
  const tableW = PAGE_W - tableX - MARGIN;
  const footerH = 12;
  const imgH = PAGE_H - contentY - footerH - 2;

  // Tile plan image
  doc.addImage(planDataUrl, 'JPEG', MARGIN, contentY, imgW, imgH);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, contentY, imgW, imgH);

  // Summary table (right column)
  const tableHead = [['Zestaw', 'Kolor', 'Pow. m²', 'Płytki*', 'Wymiary (mm)']];
  const tableBody = hasZones
    ? aggregated.map(r => [
        r.tileSet.name,
        '',
        r.netArea.toFixed(2),
        r.tilesWithWaste.toString(),
        `${r.tileSet.tileWidth}×${r.tileSet.tileHeight}`,
      ])
    : [['Brak stref', '', '—', '—', '—']];

  doc.autoTable({
    startY: contentY,
    margin: { left: tableX, right: MARGIN },
    tableWidth: tableW,
    head: tableHead,
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'ellipsize' },
    headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 8 },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 14, halign: 'right' },
      4: { cellWidth: 22, halign: 'center' },
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

  // Footnote under table
  const tableEndY = doc.lastAutoTable.finalY + 3;
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('* z naddatkiem na odpad', tableX, tableEndY);

  // Materials section (below image, only if zones exist)
  if (hasZones) {
    const totalArea = aggregated.reduce((s, r) => s + r.netArea, 0);
    const matY = contentY + imgH + 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Orientacyjne zużycie materiałów (łącznie):', MARGIN, matY);

    const matBody = Object.values(MATERIAL_RATES).map(m => [
      m.label,
      (totalArea * m.rate).toFixed(1),
      m.unit,
    ]);

    doc.autoTable({
      startY: matY + 2,
      margin: { left: MARGIN, right: PAGE_W / 2 },
      tableWidth: 100,
      head: [['Materiał', 'Ilość', 'Jednostka']],
      body: matBody,
      styles: { fontSize: 8, cellPadding: 1.8 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 16, halign: 'right' },
        2: { cellWidth: 20 },
      },
    });
  }

  // Footer
  const footerY = PAGE_H - 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('Bathroom Designer — wygenerowano automatycznie', MARGIN, footerY);
  doc.text('1 / 1', PAGE_W - MARGIN, footerY, { align: 'right' });

  // Save
  const filename = `plan-lazienki-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
