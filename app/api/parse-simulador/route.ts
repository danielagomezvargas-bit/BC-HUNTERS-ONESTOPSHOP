import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

// Converts a cell value to a percentage number (e.g. 0.0245 → 2.45, 2.45 → 2.45)
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

  // Excel stores % cells as decimals (0.0245 = 2.45%) with numFmt containing "%"
  const fmt = String((cell as any).numFmt ?? "");
  if (fmt.includes("%") || (num > 0 && num < 1)) {
    return Math.round(num * 10000) / 100;
  }
  return Math.round(num * 100) / 100;
}

// Scans upward from a given row to detect whether we're in a Point or OP section
function detectSection(sheet: ExcelJS.Worksheet, fromRow: number): "point" | "op" | null {
  for (let r = fromRow - 1; r >= Math.max(1, fromRow - 80); r--) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= 10; c++) {
      const txt = String(row.getCell(c).value ?? "").trim().toLowerCase();
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

    sheet.eachRow((row, rowNum) => {
      // Look for any cell in this row whose text matches the VC label
      let hasLabel = false;
      row.eachCell((cell) => {
        const txt = String(cell.value ?? "").trim().toLowerCase();
        if (txt.includes("vc total con dc")) hasLabel = true;
      });
      if (!hasLabel) return;

      const val     = cellPct(sheet.getCell(rowNum, 13)); // col M = 13
      const section = detectSection(sheet, rowNum);

      if (section === "point" && vc_point === null) {
        vc_point = val; vc_point_fila = rowNum;
      } else if (section === "op" && vc_op === null) {
        vc_op = val; vc_op_fila = rowNum;
      } else if (section === null) {
        // Can't determine section — assign by row order (OP appears first)
        if (vc_op === null)         { vc_op    = val; vc_op_fila    = rowNum; }
        else if (vc_point === null) { vc_point = val; vc_point_fila = rowNum; }
      }
    });

    return NextResponse.json({
      fileName:      file.name,
      sheetName:     sheet.name,
      vc_point,
      vc_point_fila,
      vc_op,
      vc_op_fila,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar el archivo. Asegúrate de que sea un .xlsx válido." },
      { status: 500 }
    );
  }
}
