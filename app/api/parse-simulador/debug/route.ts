import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const wb  = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    // List all sheet names
    const sheetNames = wb.worksheets.map(ws => ws.name);

    const sheet = wb.getWorksheet("SIMULADOR");
    if (!sheet) return NextResponse.json({ sheetNames, error: "Hoja SIMULADOR no encontrada" });

    // Dump every non-empty cell: row, col letter, value
    const cells: { fila: number; col: string; valor: string }[] = [];
    sheet.eachRow((row, rowNum) => {
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        const v = cell.value;
        let txt = "";
        if (typeof v === "string")  txt = v;
        else if (typeof v === "number") txt = String(v);
        else if (v !== null && typeof v === "object") {
          if ("result" in (v as object)) txt = String((v as any).result);
          else if ("text" in (v as object)) txt = String((v as any).text);
          else txt = JSON.stringify(v).slice(0, 80);
        }
        if (txt.trim()) {
          const colLetter = colNum <= 26
            ? String.fromCharCode(64 + colNum)
            : String.fromCharCode(64 + Math.floor((colNum - 1) / 26)) + String.fromCharCode(65 + ((colNum - 1) % 26));
          cells.push({ fila: rowNum, col: colLetter, valor: txt.trim().slice(0, 120) });
        }
      });
    });

    // Rows that look like they could contain the VC label (filter for "vc" or "valor")
    const vcRows = cells.filter(c => {
      const t = c.valor.toLowerCase();
      return (t.includes("vc") && t.includes("dc")) || t.includes("valor cliente");
    });

    // Also return cols A–N for rows 40–95 to see the exact structure
    const rangeRows: { fila: number; cols: Record<string, string> }[] = [];
    for (let r = 40; r <= 95; r++) {
      const row = sheet.getRow(r);
      const cols: Record<string, string> = {};
      for (let c = 1; c <= 14; c++) {
        const cell = row.getCell(c);
        const v = cell.value;
        let txt = "";
        if (typeof v === "string")  txt = v;
        else if (typeof v === "number") txt = String(v);
        else if (v !== null && typeof v === "object" && "result" in (v as object)) txt = String((v as any).result);
        if (txt.trim()) {
          const letter = c <= 26 ? String.fromCharCode(64 + c) : "?";
          cols[letter] = txt.trim().slice(0, 80);
        }
      }
      if (Object.keys(cols).length > 0) rangeRows.push({ fila: r, cols });
    }

    return NextResponse.json({ sheetNames, vcRows, rangeRows });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
