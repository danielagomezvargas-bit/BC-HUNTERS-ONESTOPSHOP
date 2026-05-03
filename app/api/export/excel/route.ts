import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import type { OnePagerData } from "@/components/OnePager";

const MP_BLUE  = "FF009EE3";
const MP_NAVY  = "FF00304A";
const MP_GREEN = "FF00A650";
const MP_AMBER = "FFB45309";
const WHITE    = "FFFFFFFF";
const LIGHT_BG = "FFF4F6FA";

function hdr(ws: ExcelJS.Worksheet, row: number, cols: number, text: string, color: string) {
  ws.mergeCells(row, 1, row, cols);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.font  = { bold: true, color: { argb: WHITE }, size: 12 };
  cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(row).height = 24;
}

function subhdr(ws: ExcelJS.Worksheet, row: number, values: string[], colors: string[]) {
  values.forEach((v, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = v;
    cell.font  = { bold: true, size: 9, color: { argb: "FF888888" } };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
    if (colors[i]) cell.font.color = { argb: colors[i] };
  });
  ws.getRow(row).height = 18;
}

export async function POST(req: NextRequest) {
  const data: OnePagerData = await req.json();
  const { negocio, productos, comPT_OT, comPT_MSI, tpvPT, comOP_OT, comOP_MSI, tpvOP, palancasSel, palancasPct } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Business Case Simulator — Mercado Pago";
  wb.created = new Date();

  // ── Sheet 1: Resumen ───────────────────────────────────────
  const ws = wb.addWorksheet("Resumen", { properties: { tabColor: { argb: MP_BLUE } } });
  ws.columns = [
    { key:"a", width:28 },
    { key:"b", width:16 },
    { key:"c", width:16 },
    { key:"d", width:16 },
    { key:"e", width:16 },
  ];

  let r = 1;

  // Title
  ws.mergeCells(r, 1, r, 5);
  const title = ws.getCell(r, 1);
  title.value = `Propuesta de monetización — ${negocio.nombre || "Seller"}`;
  title.font  = { bold: true, size: 16, color: { argb: MP_NAVY } };
  title.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BG } };
  title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(r).height = 36;
  r++;

  // Info row
  const info = [negocio.industria, negocio.rfc, new Date().toLocaleDateString("es-MX")].filter(Boolean).join("  ·  ");
  ws.mergeCells(r, 1, r, 5);
  const infoCell = ws.getCell(r, 1);
  infoCell.value = info;
  infoCell.font  = { size: 10, color: { argb: "FF888888" } };
  infoCell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BG } };
  infoCell.alignment = { indent: 1 };
  ws.getRow(r).height = 18;
  r += 2;

  // ── Savings section (per product) ──
  const sections = [
    ...(productos.point ? [{ label: "🖥 Point (Terminales)", comOT: comPT_OT, comMSI: comPT_MSI, tpv: tpvPT }] : []),
    ...(productos.op    ? [{ label: "🌐 Online Payments",     comOT: comOP_OT, comMSI: comOP_MSI, tpv: tpvOP  }] : []),
  ];

  for (const sec of sections) {
    hdr(ws, r, 5, `Comisiones — ${sec.label}`, MP_NAVY);
    r++;
    subhdr(ws, r, ["Concepto", "Tasa actual", "Tasa MP", "Ahorro %", "Ahorro mensual MXN"], ["", MP_AMBER, MP_GREEN, MP_GREEN, MP_GREEN]);
    r++;

    for (const row of sec.comOT) {
      const delta = row.cu - row.mp;
      const saving = delta > 0 ? sec.tpv * delta / 100 : 0;
      const dataRow = ws.getRow(r);
      dataRow.values = ["", row.l, row.cu / 100, row.mp / 100, delta > 0 ? delta / 100 : null, saving > 0 ? saving : null];
      // Shift — set cols 1-5
      ws.getCell(r, 1).value = row.l;
      ws.getCell(r, 2).value = row.cu / 100;
      ws.getCell(r, 3).value = row.mp / 100;
      ws.getCell(r, 4).value = delta > 0 ? delta / 100 : null;
      ws.getCell(r, 5).value = saving > 0 ? saving : null;
      [2,3,4].forEach(c => { ws.getCell(r, c).numFmt = "0.00%"; });
      ws.getCell(r, 5).numFmt = '"$"#,##0';
      if (delta > 0) ws.getCell(r, 5).font = { color: { argb: MP_GREEN }, bold: true };
      ws.getRow(r).height = 18;
      r++;
    }

    for (const row of sec.comMSI) {
      const delta = row.sb - row.sm;
      const saving = delta > 0 ? sec.tpv * delta / 100 : 0;
      ws.getCell(r, 1).value = row.l;
      ws.getCell(r, 2).value = row.sb / 100;
      ws.getCell(r, 3).value = row.sm / 100;
      ws.getCell(r, 4).value = delta > 0 ? delta / 100 : null;
      ws.getCell(r, 5).value = saving > 0 ? saving : null;
      [2,3,4].forEach(c => { ws.getCell(r, c).numFmt = "0.00%"; });
      ws.getCell(r, 5).numFmt = '"$"#,##0';
      if (delta > 0) ws.getCell(r, 5).font = { color: { argb: MP_GREEN }, bold: true };
      ws.getRow(r).height = 18;
      r++;
    }
    r++;
  }

  // ── Palancas ──
  const allPalancas = [
    ...(palancasSel.pt || []).map(id => ({ id, prod: "Point",           tpv: tpvPT, pcts: palancasPct.pt })),
    ...(palancasSel.op || []).map(id => ({ id, prod: "Online Payments", tpv: tpvOP, pcts: palancasPct.op })),
  ].filter(p => (p.pcts[p.id] || 0) > 0);

  if (allPalancas.length > 0) {
    hdr(ws, r, 5, "🚀 Palancas de incremento de ventas", MP_BLUE);
    r++;
    subhdr(ws, r, ["Palanca", "Producto", "% estimado", "Impacto mensual", "Impacto anual"], ["","", MP_BLUE, MP_GREEN, MP_GREEN]);
    r++;

    for (const p of allPalancas) {
      const pct    = p.pcts[p.id] || 0;
      const impact = p.tpv * pct / 100;
      ws.getCell(r, 1).value = p.id;
      ws.getCell(r, 2).value = p.prod;
      ws.getCell(r, 3).value = pct / 100;
      ws.getCell(r, 3).numFmt = "0%";
      ws.getCell(r, 4).value = impact;
      ws.getCell(r, 4).numFmt = '"$"#,##0';
      ws.getCell(r, 4).font = { color: { argb: MP_GREEN }, bold: true };
      ws.getCell(r, 5).value = impact * 12;
      ws.getCell(r, 5).numFmt = '"$"#,##0';
      ws.getCell(r, 5).font = { color: { argb: MP_GREEN }, bold: true };
      ws.getRow(r).height = 18;
      r++;
    }
  }

  // ── Sheet 2: Simulador interactivo ─────────────────────────
  const ws2 = wb.addWorksheet("Simulador interactivo", { properties: { tabColor: { argb: MP_GREEN } } });
  ws2.columns = [
    { key:"a", width:30 },
    { key:"b", width:18 },
    { key:"c", width:18 },
    { key:"d", width:20 },
  ];

  ws2.mergeCells(1, 1, 1, 4);
  const t2 = ws2.getCell(1, 1);
  t2.value = "Simulador interactivo — modifica los valores en amarillo";
  t2.font  = { bold: true, size: 13, color: { argb: MP_NAVY } };
  t2.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BG } };
  t2.alignment = { indent: 1 };
  ws2.getRow(1).height = 30;

  let r2 = 3;
  const INPUT_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };

  for (const sec of sections) {
    ws2.mergeCells(r2, 1, r2, 4);
    const sh = ws2.getCell(r2, 1);
    sh.value = sec.label;
    sh.font  = { bold: true, color: { argb: WHITE } };
    sh.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: MP_NAVY } };
    sh.alignment = { indent: 1 };
    ws2.getRow(r2).height = 22;
    r2++;

    ws2.getCell(r2, 1).value = "TPV mensual (modifica aquí)";
    ws2.getCell(r2, 2).value = sec.tpv;
    ws2.getCell(r2, 2).numFmt = '"$"#,##0';
    ws2.getCell(r2, 2).fill = INPUT_FILL;
    ws2.getCell(r2, 2).font = { bold: true, color: { argb: MP_BLUE } };
    ws2.getRow(r2).height = 20;
    const tpvCell = `B${r2}`;
    r2 += 2;

    ws2.getCell(r2, 1).value = "Concepto";
    ws2.getCell(r2, 2).value = "Tasa actual";
    ws2.getCell(r2, 3).value = "Tasa MP";
    ws2.getCell(r2, 4).value = "Ahorro mensual";
    [1,2,3,4].forEach(c => {
      ws2.getCell(r2, c).font = { bold: true, size: 9, color: { argb: "FF888888" } };
      ws2.getCell(r2, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
    });
    ws2.getRow(r2).height = 18;
    r2++;

    for (const row of sec.comOT) {
      const currentRow = r2;
      ws2.getCell(r2, 1).value = row.l;
      ws2.getCell(r2, 2).value = row.cu / 100;
      ws2.getCell(r2, 2).numFmt = "0.00%";
      ws2.getCell(r2, 2).fill = INPUT_FILL;
      ws2.getCell(r2, 3).value = row.mp / 100;
      ws2.getCell(r2, 3).numFmt = "0.00%";
      ws2.getCell(r2, 3).fill = INPUT_FILL;
      // Formula: =IF(B>C, (B-C)*TPV, 0)
      ws2.getCell(r2, 4).value = { formula: `=IF(B${currentRow}>C${currentRow},(B${currentRow}-C${currentRow})*${tpvCell},0)` };
      ws2.getCell(r2, 4).numFmt = '"$"#,##0';
      ws2.getCell(r2, 4).font = { color: { argb: MP_GREEN }, bold: true };
      ws2.getRow(r2).height = 18;
      r2++;
    }
    r2++;
  }

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="propuesta-${(negocio.nombre || "seller").replace(/\s+/g, "-").toLowerCase()}.xlsx"`,
    },
  });
}
