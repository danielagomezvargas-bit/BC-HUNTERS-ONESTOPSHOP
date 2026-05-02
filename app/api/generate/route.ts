import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function n(s: string | number): number {
  const v = typeof s === 'number' ? s : parseFloat(String(s).replace(/,/g, ''))
  return isNaN(v) ? 0 : v
}
function pct(s: string | number): number { return n(s) / 100 }

// MP brand colors
const NAVY    = '1A1F71'
const YELLOW  = 'FFE600'
const BLUE    = '009EE3'
const WHITE   = 'FFFFFF'
const GRAY_BG = 'F8F9FA'
const INPUT_BG = 'FFFDE7'
const CALC_BG  = 'E3F2FD'
const GREEN_BG = 'E8F5E9'
const RED_BG   = 'FFEBEE'
const BLUE_BG  = 'E8F0FE'

function applyBorder(cell: ExcelJS.Cell, style: ExcelJS.BorderStyle = 'thin', color = 'D0D0D0') {
  cell.border = {
    top:    { style, color: { argb: color } },
    bottom: { style, color: { argb: color } },
    left:   { style, color: { argb: color } },
    right:  { style, color: { argb: color } },
  }
}

function headerCell(cell: ExcelJS.Cell, text: string, bgColor = NAVY) {
  cell.value = text
  cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
  cell.font  = { bold: true, color: { argb: bgColor === YELLOW ? NAVY : WHITE }, size: 10, name: 'Calibri' }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  applyBorder(cell, 'thin', '999999')
}

function labelCell(cell: ExcelJS.Cell, text: string, indent = 0) {
  cell.value = text
  cell.font  = { size: 10, name: 'Calibri', color: { argb: '444444' } }
  cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent }
  cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BG } }
  applyBorder(cell, 'thin', 'E0E0E0')
}


const MXN_FMT  = '"$"#,##0'
const MXN2_FMT = '"$"#,##0.00'
const PCT_FMT  = '0.00%'
const PCT1_FMT = '0.0%'

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    clientName, industry,
    tpvMonthly, ticketCurrent,
    tdShare, tcShare, amexShare,
    msi3Share, msi6Share, msi9Share, msi12Share, msi18Share, msi24Share,
    tdCurrent, tcCurrent, amexCurrent,
    msi3Current, msi6Current, msi9Current, msi12Current, msi18Current, msi24Current,
    tdMp, tcMp, amexMp,
    msi3Mp, msi6Mp, msi9Mp, msi12Mp, msi18Mp, msi24Mp,
    opTpvMonthly, opAcceptanceRateCurrent, opAcceptanceRateMp,
    opTdShare, opTcShare, opAmexShare,
    opMsi3Share, opMsi6Share, opMsi9Share, opMsi12Share, opMsi18Share, opMsi24Share,
    opTdCurrent, opTcCurrent, opAmexCurrent,
    opMsi3Current, opMsi6Current, opMsi9Current, opMsi12Current, opMsi18Current, opMsi24Current,
    opTdMp, opTcMp, opAmexMp,
    opMsi3Mp, opMsi6Mp, opMsi9Mp, opMsi12Mp, opMsi18Mp, opMsi24Mp,
    buenFinGrowth, hotSaleGrowth, navidadGrowth, ticketGrowthMp,
    clientLogoBase64,
  } = body

  // ─── Pre-calculate values ─────────────────────────────────────────────────
  const tpv = n(tpvMonthly)
  const tc  = n(ticketCurrent)
  const opTpv = n(opTpvMonthly)
  const hasOp = opTpv > 0

  const accCur = pct(opAcceptanceRateCurrent)
  const accMp  = pct(opAcceptanceRateMp)
  const opEffTpv = opTpv * accMp

  // Point
  const pointData = [
    { label: 'TD',    share: n(tdShare)/100,    curr: n(tdCurrent)/100,    mp: n(tdMp)/100,    isMsi: false },
    { label: 'TC',    share: n(tcShare)/100,    curr: n(tcCurrent)/100,    mp: n(tcMp)/100,    isMsi: false },
    { label: 'AMEX',  share: n(amexShare)/100,  curr: n(amexCurrent)/100,  mp: n(amexMp)/100,  isMsi: false },
    { label: 'MSI 3',  share: n(msi3Share)/100,  curr: n(msi3Current)/100,  mp: n(msi3Mp)/100,  isMsi: true  },
    { label: 'MSI 6',  share: n(msi6Share)/100,  curr: n(msi6Current)/100,  mp: n(msi6Mp)/100,  isMsi: true  },
    { label: 'MSI 9',  share: n(msi9Share)/100,  curr: n(msi9Current)/100,  mp: n(msi9Mp)/100,  isMsi: true  },
    { label: 'MSI 12', share: n(msi12Share)/100, curr: n(msi12Current)/100, mp: n(msi12Mp)/100, isMsi: true  },
    { label: 'MSI 18', share: n(msi18Share)/100, curr: n(msi18Current)/100, mp: n(msi18Mp)/100, isMsi: true  },
    { label: 'MSI 24', share: n(msi24Share)/100, curr: n(msi24Current)/100, mp: n(msi24Mp)/100, isMsi: true  },
  ]

  const opData = [
    { label: 'TD',    share: n(opTdShare)/100,    curr: n(opTdCurrent)/100,    mp: n(opTdMp)/100,    isMsi: false },
    { label: 'TC',    share: n(opTcShare)/100,    curr: n(opTcCurrent)/100,    mp: n(opTcMp)/100,    isMsi: false },
    { label: 'AMEX',  share: n(opAmexShare)/100,  curr: n(opAmexCurrent)/100,  mp: n(opAmexMp)/100,  isMsi: false },
    { label: 'MSI 3',  share: n(opMsi3Share)/100,  curr: n(opMsi3Current)/100,  mp: n(opMsi3Mp)/100,  isMsi: true  },
    { label: 'MSI 6',  share: n(opMsi6Share)/100,  curr: n(opMsi6Current)/100,  mp: n(opMsi6Mp)/100,  isMsi: true  },
    { label: 'MSI 9',  share: n(opMsi9Share)/100,  curr: n(opMsi9Current)/100,  mp: n(opMsi9Mp)/100,  isMsi: true  },
    { label: 'MSI 12', share: n(opMsi12Share)/100, curr: n(opMsi12Current)/100, mp: n(opMsi12Mp)/100, isMsi: true  },
    { label: 'MSI 18', share: n(opMsi18Share)/100, curr: n(opMsi18Current)/100, mp: n(opMsi18Mp)/100, isMsi: true  },
    { label: 'MSI 24', share: n(opMsi24Share)/100, curr: n(opMsi24Current)/100, mp: n(opMsi24Mp)/100, isMsi: true  },
  ]

  function calcSave(p: typeof pointData[0], baseTpv: number, tcRateCur: number, tcRateMp: number) {
    const amt = baseTpv * p.share
    if (!p.isMsi) return (p.curr - p.mp) * amt
    return ((tcRateCur + p.curr) - (tcRateMp + p.mp)) * amt
  }

  const ptcCur = n(tcCurrent)/100; const ptcMp = n(tcMp)/100
  const optcCur = n(opTcCurrent)/100; const optcMp = n(opTcMp)/100

  const pointSaves = pointData.map(p => calcSave(p, tpv, ptcCur, ptcMp))
  const opSaves    = opData.map(p => calcSave(p, opEffTpv, optcCur, optcMp))

  const pointCommMonthly = pointSaves.reduce((s, v) => s + v, 0)
  const opCommMonthly    = opSaves.reduce((s, v) => s + v, 0)
  const opAccGainMonthly = opTpv * (accMp - accCur)
  const totalCommAnnual  = (pointCommMonthly + opCommMonthly) * 12

  const ticketWithMp    = tc * (1 + pct(ticketGrowthMp))
  const ticketGrowthMon = tpv * pct(ticketGrowthMp)
  const combinedTpv     = tpv + opEffTpv
  const buenFinInc  = combinedTpv * pct(buenFinGrowth)
  const hotSaleInc  = combinedTpv * pct(hotSaleGrowth)
  const navidadInc  = combinedTpv * pct(navidadGrowth)
  const growthAnn   = buenFinInc + hotSaleInc + navidadInc + ticketGrowthMon * 12
  const netAnn      = growthAnn + totalCommAnnual + opAccGainMonthly * 12
  const netMonthly  = netAnn / 12
  const totalSeasonalTpv   = buenFinInc + hotSaleInc + navidadInc
  const seasonalCommSavings = combinedTpv > 0
    ? ((pointCommMonthly + opCommMonthly) / combinedTpv) * totalSeasonalTpv
    : 0

  // ─── Workbook ─────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'Mercado Pago — Business Case Simulator'
  wb.created  = new Date()
  wb.modified = new Date()

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1: Business Case
  // ═══════════════════════════════════════════════════════════════════════════
  const ws = wb.addWorksheet('Business Case', {
    properties: { tabColor: { argb: YELLOW } },
    pageSetup:  { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })
  ws.columns = [
    { width: 3  },  // A spacer
    { width: 46 },  // B labels
    { width: 18 },  // C value/input
    { width: 18 },  // D amounts
    { width: 16 },  // E commission current
    { width: 16 },  // F commission MP
    { width: 3  },  // G spacer
    { width: 34 },  // H right col
    { width: 18 },  // I right val
  ]

  // Title
  ws.mergeCells('A1:I2')
  const title = ws.getCell('A1')
  title.value = `Business Case — ${clientName}${industry ? ` (${industry})` : ''}`
  title.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  title.font  = { bold: true, size: 18, name: 'Calibri', color: { argb: YELLOW } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 40; ws.getRow(2).height = 40

  ws.mergeCells('A3:I3')
  const sub = ws.getCell('A3')
  sub.value = 'Mercado Pago potencia tus ventas, mejora tu rentabilidad mensual y protege tu margen en picos comerciales.'
  sub.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
  sub.font  = { italic: true, size: 10, name: 'Calibri', color: { argb: NAVY } }
  sub.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  ws.getRow(3).height = 30
  ws.getRow(4).height = 10

  // ── Summary results ────────────────────────────────────────────────────────
  ws.mergeCells('B5:C5'); headerCell(ws.getCell('B5'), 'Impacto total con Mercado Pago', NAVY)
  ws.mergeCells('E5:F5'); headerCell(ws.getCell('E5'), 'Resumen', NAVY)
  ws.getRow(5).height = 22

  const summaryRows: [string, number, string, boolean][] = [
    ['Ahorro en Point / Terminales (mensual)',      pointCommMonthly,        MXN2_FMT, false],
    ['Ahorro en Online Payments / OP (mensual)',    opCommMonthly,           MXN2_FMT, false],
    ['Ganancia acceptance OP (anual)',              opAccGainMonthly * 12,   MXN_FMT,  false],
    ['Ahorro comisiones anualizadas',               totalCommAnnual,         MXN_FMT,  false],
    ['Crecimiento por eventos (anual)',             growthAnn,               MXN_FMT,  false],
    ['Impacto neto mensual',                        netMonthly,              MXN2_FMT, true ],
    ['IMPACTO NETO ANUALIZADO',                     netAnn,                  MXN_FMT,  true ],
  ]
  summaryRows.forEach(([label, value, fmt, bold], i) => {
    const row = 6 + i
    ws.getRow(row).height = 22
    const lc = ws.getCell(`B${row}`)
    lc.value = label
    lc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bold ? NAVY : GRAY_BG } }
    lc.font  = { size: bold ? 12 : 10, name: 'Calibri', bold, color: { argb: bold ? YELLOW : '444444' } }
    lc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    applyBorder(lc, 'thin', bold ? NAVY : 'E0E0E0')
    const vc = ws.getCell(`C${row}`)
    vc.value  = value
    vc.numFmt = fmt
    const isNeg = value < 0
    vc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: bold ? YELLOW : (isNeg ? RED_BG : GREEN_BG) } }
    vc.font  = { size: bold ? 14 : 11, name: 'Calibri', bold, color: { argb: bold ? NAVY : (isNeg ? 'C62828' : '2E7D32') } }
    vc.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(vc, 'thin', bold ? YELLOW : 'E0E0E0')
  })

  const narrativeRows: [string, number][] = [
    [`TPV Point: $${(tpv/1_000_000).toFixed(1)}M/mes`, 6],
    [`TPV OP efectivo: $${(opEffTpv/1_000_000).toFixed(1)}M/mes`, 7],
    [`Ticket: $${tc.toFixed(0)} → $${ticketWithMp.toFixed(0)} con MP`, 8],
    [`Buen Fin +${n(buenFinGrowth)}% | Hot Sale +${n(hotSaleGrowth)}% | Navidad +${n(navidadGrowth)}%`, 9],
    [`Acceptance OP: ${n(opAcceptanceRateCurrent)}% → ${n(opAcceptanceRateMp)}%`, 10],
    [`Generado: ${new Date().toLocaleDateString('es-MX')}`, 12],
  ]
  narrativeRows.forEach(([text, row]) => {
    ws.mergeCells(`E${row}:F${row}`)
    const c = ws.getCell(`E${row}`)
    c.value = text
    c.font  = { size: 10, name: 'Calibri', italic: true, color: { argb: '555555' } }
    c.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BG } }
    applyBorder(c, 'thin', 'E0E0E0')
    ws.getRow(Number(row)).height = 22
  })

  ws.getRow(14).height = 14

  // ── POINT payment mix ──────────────────────────────────────────────────────
  ws.mergeCells('B15:I15')
  headerCell(ws.getCell('B15'), 'Point — Mix de medios de pago (terminales físicas)', NAVY)
  ws.getRow(15).height = 22

  const payHeaders = ['Medio de pago', 'Share', 'Monto', 'Comisión actual', 'Tasa MP', 'Ahorro vs actual']
  const payCols    = ['B', 'C', 'D', 'E', 'F', 'H']
  ws.getRow(16).height = 24
  payHeaders.forEach((h, i) => headerCell(ws.getCell(`${payCols[i]}16`), h, i === 4 ? BLUE : NAVY))

  ws.getRow(17).height = 5
  ws.getRow(18).height = 24
  ws.mergeCells('B18:C18')
  const tpvLabel = ws.getCell('B18')
  tpvLabel.value = '▶ Venta mensual TPV Point (editable)'
  tpvLabel.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
  tpvLabel.font  = { bold: true, size: 10, name: 'Calibri', color: { argb: '333333' } }
  tpvLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  applyBorder(tpvLabel, 'medium', 'FFC107')
  ws.mergeCells('D18:E18')
  const tpvInput = ws.getCell('D18')
  tpvInput.value  = tpv
  tpvInput.numFmt = MXN_FMT
  tpvInput.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
  tpvInput.font   = { bold: true, size: 13, name: 'Calibri', color: { argb: '333333' } }
  tpvInput.alignment = { horizontal: 'right', vertical: 'middle' }
  applyBorder(tpvInput, 'medium', 'FFC107')
  const tpvRef = 'D18'

  ws.getRow(19).height = 5

  const payRowStart = 20
  const tcRowRef = payRowStart + 1

  pointData.forEach(({ label, share, curr, mp, isMsi }, i) => {
    const rowNum = payRowStart + i
    ws.getRow(rowNum).height = 22

    const lc = ws.getCell(`B${rowNum}`)
    lc.value = label
    lc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_BG } }
    lc.font  = { bold: true, size: 10, name: 'Calibri', color: { argb: isMsi ? '1565C0' : '333333' } }
    lc.alignment = { horizontal: 'left', vertical: 'middle', indent: 2 }
    applyBorder(lc, 'thin', 'D0D0D0')

    const sc = ws.getCell(`C${rowNum}`)
    sc.value = share; sc.numFmt = '0%'
    sc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
    sc.font  = { bold: true, size: 11, name: 'Calibri' }
    sc.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(sc, 'thin', 'FFC107')

    const ac = ws.getCell(`D${rowNum}`)
    ac.value  = { formula: `=${tpvRef}*C${rowNum}` }
    ac.numFmt = MXN_FMT
    ac.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: CALC_BG } }
    ac.font   = { size: 10, name: 'Calibri', color: { argb: '1565C0' } }
    ac.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(ac, 'thin', '90CAF9')

    const ec = ws.getCell(`E${rowNum}`)
    ec.value = curr; ec.numFmt = PCT_FMT
    ec.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
    ec.font  = { bold: true, size: 11, name: 'Calibri' }
    ec.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(ec, 'thin', 'FFC107')

    const fc = ws.getCell(`F${rowNum}`)
    fc.value = mp; fc.numFmt = PCT_FMT
    fc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } }
    fc.font  = { bold: true, size: 11, name: 'Calibri', color: { argb: '0D47A1' } }
    fc.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(fc, 'thin', '42A5F5')

    const hc = ws.getCell(`H${rowNum}`)
    const savFormula = isMsi
      ? `=((E${tcRowRef}+E${rowNum})-(F${tcRowRef}+F${rowNum}))*D${rowNum}`
      : `=(E${rowNum}-F${rowNum})*D${rowNum}`
    hc.value  = { formula: savFormula }
    hc.numFmt = MXN2_FMT
    const isNeg2 = pointSaves[i] < 0
    hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNeg2 ? RED_BG : GREEN_BG } }
    hc.font = { bold: true, size: 11, name: 'Calibri', color: { argb: isNeg2 ? 'C62828' : '2E7D32' } }
    hc.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(hc, 'thin', isNeg2 ? 'FFCDD2' : 'C8E6C9')
  })

  const ptTotal = payRowStart + pointData.length
  ws.getRow(ptTotal).height = 24
  ws.mergeCells(`B${ptTotal}:G${ptTotal}`)
  const ptTlc = ws.getCell(`B${ptTotal}`)
  ptTlc.value = 'TOTAL COMISIONES POINT MENSUAL'
  ptTlc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  ptTlc.font  = { bold: true, size: 11, name: 'Calibri', color: { argb: WHITE } }
  ptTlc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  applyBorder(ptTlc, 'medium', NAVY)
  const ptThc = ws.getCell(`H${ptTotal}`)
  ptThc.value  = { formula: `=SUM(H${payRowStart}:H${payRowStart + pointData.length - 1})` }
  ptThc.numFmt = MXN2_FMT
  ptThc.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: pointCommMonthly >= 0 ? '4CAF50' : 'F44336' } }
  ptThc.font   = { bold: true, size: 13, name: 'Calibri', color: { argb: WHITE } }
  ptThc.alignment = { horizontal: 'right', vertical: 'middle' }
  applyBorder(ptThc, 'medium', pointCommMonthly >= 0 ? '388E3C' : 'C62828')

  let curRow = ptTotal + 2

  // ── OP section (if enabled) ────────────────────────────────────────────────
  if (hasOp) {
    ws.getRow(curRow - 1).height = 14
    ws.mergeCells(`B${curRow}:I${curRow}`)
    headerCell(ws.getCell(`B${curRow}`), `Online Payments (OP) — Acceptance: ${n(opAcceptanceRateCurrent)}% actual → ${n(opAcceptanceRateMp)}% con MP`, BLUE)
    ws.getRow(curRow).height = 22
    curRow++

    // OP headers row
    const opHRow = curRow
    ws.getRow(opHRow).height = 24
    payHeaders.forEach((h, i) => headerCell(ws.getCell(`${payCols[i]}${opHRow}`), h, i === 4 ? BLUE : NAVY))
    curRow++

    ws.getRow(curRow).height = 5; curRow++

    // OP TPV input
    const opTpvRow = curRow
    ws.getRow(opTpvRow).height = 24
    ws.mergeCells(`B${opTpvRow}:C${opTpvRow}`)
    const opTpvLabel = ws.getCell(`B${opTpvRow}`)
    opTpvLabel.value = '▶ Venta mensual OP (intentado — editable)'
    opTpvLabel.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_BG } }
    opTpvLabel.font  = { bold: true, size: 10, name: 'Calibri', color: { argb: '333333' } }
    opTpvLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    applyBorder(opTpvLabel, 'medium', '42A5F5')
    ws.mergeCells(`D${opTpvRow}:E${opTpvRow}`)
    const opTpvInput = ws.getCell(`D${opTpvRow}`)
    opTpvInput.value  = opTpv
    opTpvInput.numFmt = MXN_FMT
    opTpvInput.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_BG } }
    opTpvInput.font   = { bold: true, size: 13, name: 'Calibri', color: { argb: '0D47A1' } }
    opTpvInput.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(opTpvInput, 'medium', '42A5F5')

    const opAccCell = ws.getCell(`F${opTpvRow}`)
    opAccCell.value = `Efectivo con MP: $${((opEffTpv)/1_000_000).toFixed(1)}M   (+${((accMp-accCur)*100).toFixed(1)}pp acceptance)`
    opAccCell.font  = { size: 10, name: 'Calibri', italic: true, color: { argb: '1565C0' } }
    opAccCell.alignment = { horizontal: 'left', vertical: 'middle' }
    opAccCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: CALC_BG } }
    applyBorder(opAccCell, 'thin', '90CAF9')
    const opTpvRef = `D${opTpvRow}`
    curRow++

    ws.getRow(curRow).height = 5; curRow++

    const opPayStart = curRow
    const opTcRow    = opPayStart + 1

    opData.forEach(({ label, share, curr, mp, isMsi }, i) => {
      const rowNum = opPayStart + i
      ws.getRow(rowNum).height = 22

      const lc = ws.getCell(`B${rowNum}`)
      lc.value = label
      lc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: BLUE_BG } }
      lc.font  = { bold: true, size: 10, name: 'Calibri', color: { argb: isMsi ? '1565C0' : '0D47A1' } }
      lc.alignment = { horizontal: 'left', vertical: 'middle', indent: 2 }
      applyBorder(lc, 'thin', '90CAF9')

      const sc = ws.getCell(`C${rowNum}`)
      sc.value = share; sc.numFmt = '0%'
      sc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
      sc.font  = { bold: true, size: 11, name: 'Calibri' }
      sc.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(sc, 'thin', 'FFC107')

      // Amount = opTpvRef * acceptanceMp * share (formula via opTpvRef * accMp * C)
      const ac = ws.getCell(`D${rowNum}`)
      ac.value  = { formula: `=${opTpvRef}*${accMp}*C${rowNum}` }
      ac.numFmt = MXN_FMT
      ac.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: CALC_BG } }
      ac.font   = { size: 10, name: 'Calibri', color: { argb: '1565C0' } }
      ac.alignment = { horizontal: 'right', vertical: 'middle' }
      applyBorder(ac, 'thin', '90CAF9')

      const ec = ws.getCell(`E${rowNum}`)
      ec.value = curr; ec.numFmt = PCT_FMT
      ec.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
      ec.font  = { bold: true, size: 11, name: 'Calibri' }
      ec.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(ec, 'thin', 'FFC107')

      const fc = ws.getCell(`F${rowNum}`)
      fc.value = mp; fc.numFmt = PCT_FMT
      fc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E3F2FD' } }
      fc.font  = { bold: true, size: 11, name: 'Calibri', color: { argb: '0D47A1' } }
      fc.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(fc, 'thin', '42A5F5')

      const hc = ws.getCell(`H${rowNum}`)
      const savFormula = isMsi
        ? `=((E${opTcRow}+E${rowNum})-(F${opTcRow}+F${rowNum}))*D${rowNum}`
        : `=(E${rowNum}-F${rowNum})*D${rowNum}`
      hc.value  = { formula: savFormula }
      hc.numFmt = MXN2_FMT
      const isNeg2 = opSaves[i] < 0
      hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isNeg2 ? RED_BG : BLUE_BG } }
      hc.font = { bold: true, size: 11, name: 'Calibri', color: { argb: isNeg2 ? 'C62828' : '1565C0' } }
      hc.alignment = { horizontal: 'right', vertical: 'middle' }
      applyBorder(hc, 'thin', isNeg2 ? 'FFCDD2' : '90CAF9')
    })

    const opTotal = opPayStart + opData.length
    ws.getRow(opTotal).height = 24
    ws.mergeCells(`B${opTotal}:G${opTotal}`)
    const opTlc = ws.getCell(`B${opTotal}`)
    opTlc.value = 'TOTAL COMISIONES OP MENSUAL'
    opTlc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1565C0' } }
    opTlc.font  = { bold: true, size: 11, name: 'Calibri', color: { argb: WHITE } }
    opTlc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    applyBorder(opTlc, 'medium', '1565C0')
    const opThc = ws.getCell(`H${opTotal}`)
    opThc.value  = { formula: `=SUM(H${opPayStart}:H${opPayStart + opData.length - 1})` }
    opThc.numFmt = MXN2_FMT
    opThc.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: opCommMonthly >= 0 ? '1565C0' : 'F44336' } }
    opThc.font   = { bold: true, size: 13, name: 'Calibri', color: { argb: WHITE } }
    opThc.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(opThc, 'medium', opCommMonthly >= 0 ? '0D47A1' : 'C62828')

    // Acceptance gain row
    const accRow = opTotal + 1
    ws.getRow(accRow).height = 22
    labelCell(ws.getCell(`B${accRow}`), `Ganancia por acceptance rate (${n(opAcceptanceRateCurrent)}% → ${n(opAcceptanceRateMp)}%) — mensual`, 1)
    const accGainCell = ws.getCell(`H${accRow}`)
    accGainCell.value  = opAccGainMonthly
    accGainCell.numFmt = MXN2_FMT
    accGainCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } }
    accGainCell.font   = { bold: true, size: 11, name: 'Calibri', color: { argb: '2E7D32' } }
    accGainCell.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(accGainCell, 'thin', 'C8E6C9')

    curRow = accRow + 2
  }

  // ── Seasonality section ────────────────────────────────────────────────────
  ws.getRow(curRow - 1).height = 14
  const seasRow = curRow
  ws.mergeCells(`B${seasRow}:C${seasRow}`)
  headerCell(ws.getCell(`B${seasRow}`), 'Estacionalidad & Crecimiento', NAVY)
  ws.mergeCells(`E${seasRow}:F${seasRow}`)
  headerCell(ws.getCell(`E${seasRow}`), 'Crecimiento histórico por industria', BLUE)
  headerCell(ws.getCell(`H${seasRow}`), 'Proyección', BLUE)
  ws.getRow(seasRow).height = 22
  curRow++

  const seasEvents = [
    { label: 'Buen Fin (noviembre)',  growth: buenFinGrowth,  inc: buenFinInc,  hint: 'único evento / año' },
    { label: 'Hot Sale (mayo-jun)',   growth: hotSaleGrowth,  inc: hotSaleInc,  hint: 'único evento / año' },
    { label: 'Navidad (diciembre)',   growth: navidadGrowth,  inc: navidadInc,  hint: 'único evento / año' },
  ]

  seasEvents.forEach(({ label, growth, inc }) => {
    const r = curRow++
    ws.getRow(r).height = 22
    labelCell(ws.getCell(`B${r}`), label, 1)
    const gc = ws.getCell(`C${r}`)
    gc.value = n(growth) / 100; gc.numFmt = PCT1_FMT
    gc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
    gc.font  = { bold: true, size: 11, name: 'Calibri' }
    gc.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(gc, 'thin', 'FFC107')

    const hc = ws.getCell(`H${r}`)
    hc.value  = inc; hc.numFmt = MXN_FMT
    hc.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_BG } }
    hc.font   = { bold: true, size: 11, name: 'Calibri', color: { argb: '2E7D32' } }
    hc.alignment = { horizontal: 'right', vertical: 'middle' }
    applyBorder(hc, 'thin', 'C8E6C9')
  })

  // Ticket growth
  const tgRow = curRow++
  ws.getRow(tgRow).height = 22
  labelCell(ws.getCell(`B${tgRow}`), 'Incremento ticket promedio con MP (histórico)', 1)
  const tgc = ws.getCell(`C${tgRow}`)
  tgc.value = n(ticketGrowthMp) / 100; tgc.numFmt = PCT1_FMT
  tgc.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_BG } }
  tgc.font  = { bold: true, size: 11, name: 'Calibri' }
  tgc.alignment = { horizontal: 'center', vertical: 'middle' }
  applyBorder(tgc, 'thin', 'FFC107')
  const tgProjCell = ws.getCell(`H${tgRow}`)
  tgProjCell.value  = ticketWithMp; tgProjCell.numFmt = MXN2_FMT
  tgProjCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: CALC_BG } }
  tgProjCell.font   = { bold: true, size: 11, name: 'Calibri', color: { argb: '1565C0' } }
  tgProjCell.alignment = { horizontal: 'right', vertical: 'middle' }
  applyBorder(tgProjCell, 'thin', '90CAF9')

  // Seasonal commission savings row (informational)
  const scRow = curRow++
  ws.getRow(scRow).height = 24
  ws.mergeCells(`B${scRow}:G${scRow}`)
  const scLabel = ws.getCell(`B${scRow}`)
  scLabel.value = '★  Ahorro comisiones sobre TPV incremental estacional  (informativo — no incluido en el total)'
  scLabel.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F0FE' } }
  scLabel.font  = { bold: true, size: 10, name: 'Calibri', color: { argb: '1A237E' } }
  scLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  applyBorder(scLabel, 'medium', '3F51B5')
  const scVal = ws.getCell(`H${scRow}`)
  scVal.value  = seasonalCommSavings
  scVal.numFmt = MXN2_FMT
  scVal.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C5CAE9' } }
  scVal.font   = { bold: true, size: 12, name: 'Calibri', color: { argb: '1A237E' } }
  scVal.alignment = { horizontal: 'right', vertical: 'middle' }
  applyBorder(scVal, 'medium', '3F51B5')

  // Legend
  const legRow = curRow + 1
  ws.getRow(legRow).height = 20
  ws.mergeCells(`B${legRow}:I${legRow}`)
  const legCell = ws.getCell(`B${legRow}`)
  legCell.value = '🟡 Celdas amarillas = EDITABLES por el cliente   🔵 Celdas azules = Tasas MP (editables)   ⬜ Celdas grises = Calculadas automáticamente'
  legCell.font  = { size: 9, name: 'Calibri', italic: true, color: { argb: '777777' } }
  legCell.alignment = { horizontal: 'center', vertical: 'middle' }
  legCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } }

  // Logo
  if (clientLogoBase64) {
    try {
      const logoId = wb.addImage({ base64: clientLogoBase64, extension: 'png' })
      ws.addImage(logoId, {
        tl: { nativeCol: 7, nativeRow: 0, nativeColOff: 0, nativeRowOff: 0 },
        br: { nativeCol: 9, nativeRow: 2, nativeColOff: 0, nativeRowOff: 0 },
      } as Parameters<typeof ws.addImage>[1])
    } catch { /* silent */ }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2: Datos del cliente
  // ═══════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet('Datos del cliente', {
    properties: { tabColor: { argb: BLUE } },
  })
  ws2.columns = [{ width: 42 }, { width: 28 }]
  const inputsData: [string, string | number][] = [
    ['Cliente',               clientName],
    ['Giro / Industria',      industry || '—'],
    ['--- POINT ---',         ''],
    ['TPV Point mensual',     tpv],
    ['Ticket promedio',       tc],
    ['Share TD',              n(tdShare)/100], ['Share TC', n(tcShare)/100], ['Share AMEX', n(amexShare)/100],
    ['Share MSI 3m',  n(msi3Share)/100],  ['Share MSI 6m',  n(msi6Share)/100],  ['Share MSI 9m',  n(msi9Share)/100],
    ['Share MSI 12m', n(msi12Share)/100], ['Share MSI 18m', n(msi18Share)/100], ['Share MSI 24m', n(msi24Share)/100],
    ['Comisión TD actual',    n(tdCurrent)/100],
    ['Comisión TC actual',    n(tcCurrent)/100],
    ['Comisión AMEX actual',  n(amexCurrent)/100],
    ['Tasa MP — TD',          n(tdMp)/100],
    ['Tasa MP — TC',          n(tcMp)/100],
    ['Tasa MP — AMEX',        n(amexMp)/100],
    ['Tasa MP — MSI 3m',      n(msi3Mp)/100],  ['Tasa MP — MSI 6m',  n(msi6Mp)/100],  ['Tasa MP — MSI 9m',  n(msi9Mp)/100],
    ['Tasa MP — MSI 12m',     n(msi12Mp)/100], ['Tasa MP — MSI 18m', n(msi18Mp)/100], ['Tasa MP — MSI 24m', n(msi24Mp)/100],
    ['--- ONLINE PAYMENTS ---', ''],
    ['TPV OP mensual (intentado)',     opTpv],
    ['Acceptance rate actual',         accCur],
    ['Acceptance rate con MP',         accMp],
    ['Share OP TD',  n(opTdShare)/100],   ['Share OP TC',  n(opTcShare)/100],   ['Share OP AMEX', n(opAmexShare)/100],
    ['Share OP MSI 3m',  n(opMsi3Share)/100],  ['Share OP MSI 6m',  n(opMsi6Share)/100],  ['Share OP MSI 9m',  n(opMsi9Share)/100],
    ['Share OP MSI 12m', n(opMsi12Share)/100], ['Share OP MSI 18m', n(opMsi18Share)/100], ['Share OP MSI 24m', n(opMsi24Share)/100],
    ['Tasa OP MP — TD',  n(opTdMp)/100],  ['Tasa OP MP — TC', n(opTcMp)/100], ['Tasa OP MP — AMEX', n(opAmexMp)/100],
    ['--- ESTACIONALIDAD ---', ''],
    ['Buen Fin (% vs mes promedio)',   n(buenFinGrowth)/100],
    ['Hot Sale (% vs mes promedio)',   n(hotSaleGrowth)/100],
    ['Navidad (% vs mes promedio)',    n(navidadGrowth)/100],
    ['Ticket growth con MP',          n(ticketGrowthMp)/100],
    ['Fecha de generación',           new Date().toLocaleDateString('es-MX')],
  ]
  ws2.addRow(['Parámetro', 'Valor']).font = { bold: true }
  inputsData.forEach(([k, v]) => {
    const row = ws2.addRow([k, v])
    if (String(k).startsWith('---')) {
      row.getCell(1).font = { bold: true, color: { argb: NAVY } }
      return
    }
    const kl = String(k).toLowerCase()
    if (typeof v === 'number' && (kl.includes('share') || kl.includes('comis') || kl.includes('tasa') || kl.includes('growth') || kl.includes('fin') || kl.includes('acceptance') || kl.includes('hot') || kl.includes('navidad') || kl.includes('ticket g'))) {
      row.getCell(2).numFmt = PCT_FMT
    } else if (typeof v === 'number') {
      row.getCell(2).numFmt = MXN_FMT
    }
  })

  // ── Serialize ──────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="BusinessCase_${clientName.replace(/\s+/g, '_')}.xlsx"`,
    },
  })
}
