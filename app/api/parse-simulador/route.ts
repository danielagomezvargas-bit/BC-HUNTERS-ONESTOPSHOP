import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

function cellPct(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  let num: number | null = null;
  if (typeof v === "number") {
    num = v;
  } else if (v !== null && typeof v === "object" && "result" in (v as object)) {
    const r = (v as { result: unknown }).result;
    if (typeof r === "number") num = r;
  }
  if (num === null) return null;
  const fmt = String((cell as any).numFmt ?? "");
  if (fmt.includes("%") || (num > 0 && num < 1)) return Math.round(num * 10000) / 100;
  return Math.round(num * 100) / 100;
}

function detectSection(sheet: ExcelJS.Worksheet, fromRow: number): "point" | "op" | null {
  for (let r = fromRow - 1; r >= Math.max(1, fromRow - 80); r--) {
    for (let c = 1; c <= 10; c++) {
      const txt = String(sheet.getRow(r).getCell(c).value ?? "").trim().toLowerCase();
      if (txt.includes("point")) return "point";
      if (txt.includes("online") || txt.includes("pagos en") || txt === "op") return "op";
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No se adjuntó ningún archivo." }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const wb  = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    const sheet = wb.getWorksheet("SIMULADOR");
    if (!sheet) {
      return NextResponse.json(
        { error: "No se encontró la hoja 'SIMULADOR'. Verifica que sea el archivo correcto." },
        { status: 422 }
      );
    }

    let vc_point:      number | null = null;
    let vc_point_fila: number | null = null;
    let vc_op:         number | null = null;
    let vc_op_fila:    number | null = null;

    // ── Step 1: find column-M rows that say "VC" (text) ──────────────────────
    // These are the section headers separating OP and Point tables.
    // e.g. M40 = "VC" (OP header), M65 = "VC" (Point header)
    const vcHeaderRows: number[] = [];
    sheet.eachRow((row, rowNum) => {
      const v = row.getCell(13).value;
      if (typeof v === "string" && v.trim().toLowerCase() === "vc") {
        vcHeaderRows.push(rowNum);
      }
    });

    if (vcHeaderRows.length >= 2) {
      const sections = [
        { start: vcHeaderRows[0], end: vcHeaderRows[1] - 1 },
        { start: vcHeaderRows[1], end: vcHeaderRows[1] + 60 },
      ].map((s, idx) => ({
        ...s,
        sec: (detectSection(sheet, s.start) ?? (idx === 0 ? "op" : "point")) as "op" | "point",
      }));

      for (const { start, end, sec } of sections) {
        let val:  number | null = null;
        let fila: number | null = null;

        // First: explicit "VC + DCC" label in cols A–E (e.g. C85 "VC (%) con DCC")
        search:
        for (let r = start + 1; r <= end; r++) {
          for (let c = 1; c <= 5; c++) {
            const txt = String(sheet.getRow(r).getCell(c).value ?? "").trim().toLowerCase();
            if (txt.includes("vc") && txt.includes("dcc")) {
              const v = cellPct(sheet.getCell(r, 13));
              if (v !== null) { val = v; fila = r; break search; }
            }
          }
        }

        // Fallback: last non-zero value in col M scanning backwards from end of section
        // (the total row sits after the zero-value rows at the bottom of each section)
        if (val === null) {
          for (let r = end; r > start; r--) {
            const v = cellPct(sheet.getCell(r, 13));
            if (v !== null && v > 0 && v <= 100) { val = v; fila = r; break; }
          }
        }

        if (sec === "op"    && vc_op    === null) { vc_op    = val; vc_op_fila    = fila; }
        if (sec === "point" && vc_point === null) { vc_point = val; vc_point_fila = fila; }
      }
    }

    // ── Debug info ────────────────────────────────────────────────────────────
    const dbgVcCells: { fila: number; col: string; texto: string }[] = [];
    const dbgColM:    { fila: number; valor: string; numFmt: string }[] = [];
    sheet.eachRow((row, rowNum) => {
      row.eachCell((cell, colNum) => {
        const txt = String(cell.value ?? "").trim();
        if (txt.toLowerCase().includes("vc")) {
          const letter = colNum <= 26 ? String.fromCharCode(64 + colNum) : `C${colNum}`;
          dbgVcCells.push({ fila: rowNum, col: letter, texto: txt.slice(0, 80) });
        }
      });
      if (rowNum >= 10 && rowNum <= 95) {
        const cell  = row.getCell(13);
        const raw   = cell.value;
        let valor   = "";
        if (typeof raw === "number") valor = String(raw);
        else if (raw !== null && typeof raw === "object" && "result" in (raw as object)) valor = String((raw as any).result);
        if (valor) dbgColM.push({ fila: rowNum, valor, numFmt: String((cell as any).numFmt ?? "") });
      }
    });

    return NextResponse.json({
      fileName:      file.name,
      sheetName:     sheet.name,
      vc_point,
      vc_point_fila,
      vc_op,
      vc_op_fila,
      _debug: { vcHeaderRows, dbgVcCells, dbgColM },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar el archivo. Asegúrate de que sea un .xlsx válido." },
      { status: 500 }
    );
  }
}
