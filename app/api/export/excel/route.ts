import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import type { OnePagerData } from "@/components/OnePager";

// ── Palette ───────────────────────────────────────────────────────
const NAVY    = "FF00304A";
const BLUE    = "FF009EE3";
const GREEN   = "FF00A650";
const WHITE   = "FFFFFFFF";
const LIGHT   = "FFF4F6FA";
const SUMMARY = "FFF0F6FF";
const YELLOW  = "FFFFF3CD";
const GRAY    = "FFFAFAFA";
const MSI_BG  = "FF2C4A7C";

// ── Helpers ───────────────────────────────────────────────────────
function sectionHdr(ws: ExcelJS.Worksheet, row: number, cols: number, text: string, color = NAVY) {
  ws.mergeCells(row, 1, row, cols);
  const c = ws.getCell(row, 1);
  c.value = text;
  c.font  = { bold: true, color: { argb: WHITE }, size: 11 };
  c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  ws.getRow(row).height = 22;
}

function colHdrs(ws: ExcelJS.Worksheet, row: number, labels: string[]) {
  labels.forEach((v, i) => {
    const c = ws.getCell(row, i + 1);
    c.value = v;
    c.font  = { bold: true, size: 9, color: { argb: "FF555555" } };
    c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", indent: i === 0 ? 1 : 0 };
    c.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
  });
  ws.getRow(row).height = 18;
}

function inputCell(c: ExcelJS.Cell, value: number, numFmt: string) {
  c.value  = value;
  c.numFmt = numFmt;
  c.fill   = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
  c.font   = { bold: true, color: { argb: NAVY } };
  c.alignment = { horizontal: "center" };
}

function totalRow(ws: ExcelJS.Worksheet, row: number, cols: number, label: string,
  sums: { col: number; refs: number[] }[], color = LIGHT) {
  for (let c = 1; c <= cols; c++) {
    ws.getCell(row, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  }
  ws.getCell(row, 1).value = label;
  ws.getCell(row, 1).font  = { bold: true, size: 10 };
  sums.forEach(({ col, refs }) => {
    ws.getCell(row, col).value  = { formula: `=${refs.map(r => `${colLetter(col)}${r}`).join("+")}` };
    ws.getCell(row, col).numFmt = '"$"#,##0';
    ws.getCell(row, col).font   = { bold: true, color: { argb: col === 8 ? GREEN : NAVY } };
  });
  ws.getRow(row).height = 20;
}

function colLetter(n: number) { return String.fromCharCode(64 + n); }

// ── Route ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const data: OnePagerData = await req.json();
  const { negocio, productos, comPT_OT, comPT_MSI, tpvPT, comOP_OT, comOP_MSI, tpvOP, palancasSel, palancasPct } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Business Case Simulator — Mercado Pago";
  wb.created = new Date();

  // ═══════════════════════════════════════════════════════════════
  // SHEET 1: Análisis de Comisiones
  // Cols: A Concepto | B Share% | C Volumen | D Tasa Actual |
  //       E Com.Actual | F Tasa MP | G Com.MP | H Δ Ahorro
  // ═══════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet("Análisis", { properties: { tabColor: { argb: NAVY } } });
  const COLS = 8;
  ws.columns = [
    { key: "a", width: 28 }, // Concepto
    { key: "b", width: 10 }, // Share %
    { key: "c", width: 16 }, // Volumen MXN
    { key: "d", width: 13 }, // Tasa Actual
    { key: "e", width: 16 }, // Com. Actual
    { key: "f", width: 13 }, // Tasa MP
    { key: "g", width: 16 }, // Com. MP
    { key: "h", width: 16 }, // Δ Ahorro
  ];

  let r = 1;

  // Title
  ws.mergeCells(r, 1, r, COLS);
  const titleC = ws.getCell(r, 1);
  titleC.value = `Business Case — ${negocio.nombre || "Seller"} × Mercado Pago`;
  titleC.font  = { bold: true, size: 15, color: { argb: NAVY } };
  titleC.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
  titleC.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(r).height = 36;
  r++;

  ws.mergeCells(r, 1, r, COLS);
  const infoC = ws.getCell(r, 1);
  infoC.value = [negocio.rfc, new Date().toLocaleDateString("es-MX")].filter(Boolean).join("  ·  ");
  infoC.font  = { size: 9, color: { argb: "FF888888" } };
  infoC.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
  infoC.alignment = { indent: 1 };
  ws.getRow(r).height = 16;
  r++;

  // ── Reserve rows for summary (filled after detail is built) ──
  const SUMMARY_ROW_START = r;
  const SUMMARY_ROWS = 7;
  r += SUMMARY_ROWS;

  // ── Build detail sections ──
  const sections = [
    ...(productos.point ? [{ label: "Point (Terminales)", comOT: comPT_OT, comMSI: comPT_MSI, tpv: tpvPT }] : []),
    ...(productos.op    ? [{ label: "Online Payments",    comOT: comOP_OT,  comMSI: comOP_MSI,  tpv: tpvOP  }] : []),
  ];

  // Tracks H-column total rows (commission savings) for summary formulas
  const commTotalHCells: string[] = [];

  for (const sec of sections) {
    r++; // spacer

    sectionHdr(ws, r, COLS, `▸  ${sec.label}`);
    r++;

    // ── Input block ──
    ws.getCell(r, 1).value = "TPV mensual (modifica aquí)";
    ws.getCell(r, 1).font  = { size: 10, italic: true, color: { argb: "FF555555" } };
    inputCell(ws.getCell(r, 3), sec.tpv, '"$"#,##0');
    ws.mergeCells(r, 3, r, 4);
    ws.getRow(r).height = 20;
    const tpvRef = `C${r}`;
    r++;

    ws.getCell(r, 1).value = "Ticket promedio";
    ws.getCell(r, 1).font  = { size: 10, italic: true, color: { argb: "FF555555" } };
    inputCell(ws.getCell(r, 3), 0, '"$"#,##0');
    ws.mergeCells(r, 3, r, 4);
    ws.getRow(r).height = 20;
    r++;

    r++; // spacer before table

    // ── Column headers ──
    colHdrs(ws, r, ["Concepto", "Share %", "Volumen MXN", "Tasa Actual", "Com. Actual", "Tasa MP", "Com. MP", "Δ Ahorro"]);
    r++;

    const dataRows: number[] = [];

    // OT rows
    for (const row of sec.comOT) {
      ws.getCell(r, 1).value = row.l;
      ws.getCell(r, 1).font  = { size: 10 };

      inputCell(ws.getCell(r, 2), row.sh, "0%");          // B: Share % (yellow)
      ws.getCell(r, 3).value  = { formula: `=${tpvRef}*B${r}` };  // C: Volumen = TPV × share
      ws.getCell(r, 3).numFmt = '"$"#,##0';
      ws.getCell(r, 3).font   = { color: { argb: "FF444444" } };

      inputCell(ws.getCell(r, 4), row.cu / 100, "0.00%"); // D: Tasa Actual (yellow)
      ws.getCell(r, 5).value  = { formula: `=C${r}*D${r}` };      // E: Com.Actual
      ws.getCell(r, 5).numFmt = '"$"#,##0';

      inputCell(ws.getCell(r, 6), row.mp / 100, "0.00%"); // F: Tasa MP (yellow)
      ws.getCell(r, 7).value  = { formula: `=C${r}*F${r}` };      // G: Com.MP
      ws.getCell(r, 7).numFmt = '"$"#,##0';

      ws.getCell(r, 8).value  = { formula: `=E${r}-G${r}` };      // H: Δ Ahorro
      ws.getCell(r, 8).numFmt = '"$"#,##0';
      ws.getCell(r, 8).font   = { bold: true, color: { argb: GREEN } };

      dataRows.push(r);
      ws.getRow(r).height = 18;
      r++;
    }

    // MSI rows
    if (sec.comMSI.length > 0) {
      ws.mergeCells(r, 1, r, COLS);
      const msiH = ws.getCell(r, 1);
      msiH.value = "  Meses Sin Intereses";
      msiH.font  = { bold: true, size: 9, color: { argb: WHITE } };
      msiH.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: MSI_BG } };
      msiH.alignment = { indent: 2 };
      ws.getRow(r).height = 16;
      r++;

      for (const row of sec.comMSI) {
        ws.getCell(r, 1).value = row.l;
        ws.getCell(r, 1).font  = { size: 10, italic: true };

        inputCell(ws.getCell(r, 2), row.sh, "0%");
        ws.getCell(r, 3).value  = { formula: `=${tpvRef}*B${r}` };
        ws.getCell(r, 3).numFmt = '"$"#,##0';
        ws.getCell(r, 3).font   = { color: { argb: "FF444444" } };

        inputCell(ws.getCell(r, 4), row.sb / 100, "0.00%");
        ws.getCell(r, 5).value  = { formula: `=C${r}*D${r}` };
        ws.getCell(r, 5).numFmt = '"$"#,##0';

        inputCell(ws.getCell(r, 6), row.sm / 100, "0.00%");
        ws.getCell(r, 7).value  = { formula: `=C${r}*F${r}` };
        ws.getCell(r, 7).numFmt = '"$"#,##0';

        ws.getCell(r, 8).value  = { formula: `=E${r}-G${r}` };
        ws.getCell(r, 8).numFmt = '"$"#,##0';
        ws.getCell(r, 8).font   = { bold: true, color: { argb: GREEN } };

        dataRows.push(r);
        ws.getRow(r).height = 18;
        r++;
      }
    }

    // Section total row
    totalRow(ws, r, COLS, "TOTAL", [
      { col: 5, refs: dataRows },
      { col: 7, refs: dataRows },
      { col: 8, refs: dataRows },
    ]);
    commTotalHCells.push(`H${r}`);
    r++;
  }

  // ── Palancas section ──
  const allPalancas = [
    ...(palancasSel.pt || []).map(id => ({ id, prod: "Point",           tpv: tpvPT, pcts: palancasPct.pt })),
    ...(palancasSel.op || []).map(id => ({ id, prod: "Online Payments", tpv: tpvOP,  pcts: palancasPct.op })),
  ].filter(p => (p.pcts[p.id] || 0) > 0);

  let palancaTotalRef = "";

  if (allPalancas.length > 0) {
    r++;
    sectionHdr(ws, r, COLS, "▸  Palancas de Incremento de Ventas", BLUE);
    r++;
    colHdrs(ws, r, ["Palanca", "Producto", "% estimado", "", "Impacto mensual", "", "Impacto anual", ""]);
    r++;

    const palancaRows: number[] = [];
    for (const p of allPalancas) {
      const pct = p.pcts[p.id] || 0;
      ws.getCell(r, 1).value = p.id;
      ws.getCell(r, 2).value = p.prod;

      inputCell(ws.getCell(r, 3), pct / 100, "0%");

      ws.getCell(r, 5).value  = { formula: `=C${r}*${p.tpv}` };
      ws.getCell(r, 5).numFmt = '"$"#,##0';
      ws.getCell(r, 5).font   = { bold: true, color: { argb: GREEN } };

      ws.getCell(r, 7).value  = { formula: `=E${r}*12` };
      ws.getCell(r, 7).numFmt = '"$"#,##0';
      ws.getCell(r, 7).font   = { bold: true, color: { argb: GREEN } };

      palancaRows.push(r);
      ws.getRow(r).height = 18;
      r++;
    }

    totalRow(ws, r, COLS, "TOTAL Palancas", [
      { col: 5, refs: palancaRows },
      { col: 7, refs: palancaRows },
    ], LIGHT);
    palancaTotalRef = `E${r}`;
    r++;
  }

  // ── Fill summary block (reserved rows at top) ──
  const sr = SUMMARY_ROW_START;

  sectionHdr(ws, sr, COLS, "▸  Resumen Ejecutivo", BLUE);

  const sumItems = [
    {
      label: "Ahorro en comisiones / mes",
      formula: commTotalHCells.length ? commTotalHCells.join("+") : "0",
      color: GREEN,
    },
    {
      label: "Ahorro en comisiones / año",
      formula: commTotalHCells.length ? `(${commTotalHCells.join("+") })*12` : "0",
      color: GREEN,
    },
    ...(palancaTotalRef
      ? [{
          label: "Incremento de ventas estimado / mes",
          formula: palancaTotalRef,
          color: BLUE,
        }]
      : []),
  ];

  sumItems.forEach((item, i) => {
    const ri = sr + 1 + i;
    ws.getCell(ri, 1).value = item.label;
    ws.getCell(ri, 1).font  = { size: 10, color: { argb: "FF333333" } };
    ws.getCell(ri, 1).fill  = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY } };
    ws.getCell(ri, 1).alignment = { indent: 2 };

    ws.getCell(ri, 3).value  = { formula: `=${item.formula}` };
    ws.getCell(ri, 3).numFmt = '"$"#,##0';
    ws.getCell(ri, 3).font   = { bold: true, size: 12, color: { argb: item.color } };
    ws.getCell(ri, 3).fill   = { type: "pattern", pattern: "solid", fgColor: { argb: SUMMARY } };
    ws.mergeCells(ri, 1, ri, 2);
    ws.mergeCells(ri, 3, ri, 5);
    ws.getRow(ri).height = 22;
  });

  // Note row
  const noteR = sr + 1 + sumItems.length;
  ws.mergeCells(noteR, 1, noteR, COLS);
  const noteC = ws.getCell(noteR, 1);
  noteC.value = "  ⚠  Celdas en amarillo son editables. Ajusta TPV, share o tasas para iterar el escenario.";
  noteC.font  = { size: 9, italic: true, color: { argb: "FF996600" } };
  noteC.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
  noteC.alignment = { indent: 1 };
  ws.getRow(noteR).height = 18;

  // ── Output ────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="BC_${(negocio.nombre || "seller").replace(/\s+/g, "-")}.xlsx"`,
    },
  });
}
