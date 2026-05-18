import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

function cellNum(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  if (typeof v === "number") return v;
  if (v !== null && typeof v === "object" && "result" in (v as object)) {
    const r = (v as { result: unknown }).result;
    return typeof r === "number" ? r : null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No se adjuntó ningún archivo." }, { status: 400 });
    }

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

    const vc_point = cellNum(sheet.getCell("M85"));
    const vc_op    = cellNum(sheet.getCell("M58"));

    return NextResponse.json({ fileName: file.name, vc_point, vc_op });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar el archivo. Asegúrate de que sea un .xlsx válido." },
      { status: 500 }
    );
  }
}
