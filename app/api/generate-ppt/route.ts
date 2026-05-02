import { NextRequest, NextResponse } from 'next/server'
import pptxgen from 'pptxgenjs'
import path from 'path'
import fs from 'fs'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function n(s: string | number): number {
  const v = typeof s === 'number' ? s : parseFloat(String(s).replace(/,/g, ''))
  return isNaN(v) ? 0 : v
}
function pct(s: string | number): number { return n(s) / 100 }
function fmt(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)
}
function fmtPct(v: number): string { return `${(v * 100).toFixed(2)}%` }

function scaleColor(value: number, maxAbs: number): string {
  const ratio = maxAbs > 0 ? Math.min(Math.abs(value) / maxAbs, 1) : 0
  if (value >= 0) {
    const r = Math.round(165 - (165 - 27) * ratio)
    const g = Math.round(214 - (214 - 94) * ratio)
    const b = Math.round(167 - (167 - 32) * ratio)
    return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
  } else {
    const r = Math.round(255 - (255 - 183) * ratio)
    const g = Math.round(205 - (205 - 28) * ratio)
    const b = Math.round(210 - (210 - 28) * ratio)
    return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase()
  }
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const NAVY     = '1A1F71'
const YELLOW   = 'FFE600'
const WHITE    = 'FFFFFF'
const OFFWHITE = 'F8F9FC'
const GRAY100  = 'E5E7EB'
const GRAY400  = '9CA3AF'
const GRAY700  = '374151'
const FONT     = 'Proxima Nova'

// ─── Layout constants ─────────────────────────────────────────────────────────
const W       = 13.33
const H       = 7.5
const SM      = 0.38   // side margin
const STRIPE  = 0.04   // yellow stripe height
const HDR_H   = 0.57   // header area height
const HERO_Y  = 0.62   // hero band top y
const HERO_H  = 0.66   // hero band height
const BODY_Y  = HERO_Y + HERO_H + 0.06  // ≈ 1.34"
const BODY_H  = H - BODY_Y - STRIPE - 0.06  // ≈ 6.06"

// Column widths
const LW      = 5.50   // left col (commission tables)
const GAP     = 0.08   // gap between columns
const CX      = SM + LW + GAP       // center col x ≈ 5.96"
const CW_COL  = 3.28   // center col width
const RX      = CX + CW_COL + GAP   // right col x ≈ 9.32"
const RW      = W - RX - SM         // right col width ≈ 3.63"

// Commission table col offsets (relative to SM)
const HX_OFF  = [0, 0.88, 1.62, 2.40, 3.18]
const HX_W    = [0.84, 0.70, 0.75, 0.75, LW - 3.18]

// ─── POST ─────────────────────────────────────────────────────────────────────
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

  // ─── Calculations ────────────────────────────────────────────────────────
  const tpv      = n(tpvMonthly)
  const tc       = n(ticketCurrent)
  const opTpv    = n(opTpvMonthly)
  const hasOp    = opTpv > 0
  const accCur   = pct(opAcceptanceRateCurrent)
  const accMp    = pct(opAcceptanceRateMp)
  const opEffTpv = opTpv * accMp

  function calcSave(share: number, curr: number, mp: number, base: number, isMsi: boolean, tcCurR: number, tcMpR: number) {
    const amt = base * share
    return isMsi ? ((tcCurR + curr) - (tcMpR + mp)) * amt : (curr - mp) * amt
  }

  const ptcCur  = pct(tcCurrent);    const ptcMp   = pct(tcMp)
  const optcCur = pct(opTcCurrent);  const optcMp  = pct(opTcMp)

  const ptRows = [
    { l: 'TD',      sh: pct(tdShare),    cu: pct(tdCurrent),    mp2: pct(tdMp),    msi: false },
    { l: 'TC',      sh: pct(tcShare),    cu: pct(tcCurrent),    mp2: pct(tcMp),    msi: false },
    { l: 'AMEX',    sh: pct(amexShare),  cu: pct(amexCurrent),  mp2: pct(amexMp),  msi: false },
    { l: 'MSI 3m',  sh: pct(msi3Share),  cu: pct(msi3Current),  mp2: pct(msi3Mp),  msi: true  },
    { l: 'MSI 6m',  sh: pct(msi6Share),  cu: pct(msi6Current),  mp2: pct(msi6Mp),  msi: true  },
    { l: 'MSI 9m',  sh: pct(msi9Share),  cu: pct(msi9Current),  mp2: pct(msi9Mp),  msi: true  },
    { l: 'MSI 12m', sh: pct(msi12Share), cu: pct(msi12Current), mp2: pct(msi12Mp), msi: true  },
    { l: 'MSI 18m', sh: pct(msi18Share), cu: pct(msi18Current), mp2: pct(msi18Mp), msi: true  },
    { l: 'MSI 24m', sh: pct(msi24Share), cu: pct(msi24Current), mp2: pct(msi24Mp), msi: true  },
  ].filter(r => r.sh > 0)

  const opRows = [
    { l: 'TD',      sh: pct(opTdShare),    cu: pct(opTdCurrent),    mp2: pct(opTdMp),    msi: false },
    { l: 'TC',      sh: pct(opTcShare),    cu: pct(opTcCurrent),    mp2: pct(opTcMp),    msi: false },
    { l: 'AMEX',    sh: pct(opAmexShare),  cu: pct(opAmexCurrent),  mp2: pct(opAmexMp),  msi: false },
    { l: 'MSI 3m',  sh: pct(opMsi3Share),  cu: pct(opMsi3Current),  mp2: pct(opMsi3Mp),  msi: true  },
    { l: 'MSI 6m',  sh: pct(opMsi6Share),  cu: pct(opMsi6Current),  mp2: pct(opMsi6Mp),  msi: true  },
    { l: 'MSI 9m',  sh: pct(opMsi9Share),  cu: pct(opMsi9Current),  mp2: pct(opMsi9Mp),  msi: true  },
    { l: 'MSI 12m', sh: pct(opMsi12Share), cu: pct(opMsi12Current), mp2: pct(opMsi12Mp), msi: true  },
    { l: 'MSI 18m', sh: pct(opMsi18Share), cu: pct(opMsi18Current), mp2: pct(opMsi18Mp), msi: true  },
    { l: 'MSI 24m', sh: pct(opMsi24Share), cu: pct(opMsi24Current), mp2: pct(opMsi24Mp), msi: true  },
  ].filter(r => r.sh > 0)

  const pointCommMonthly = ptRows.reduce((s, r) => s + calcSave(r.sh, r.cu, r.mp2, tpv, r.msi, ptcCur, ptcMp), 0)
  const opCommMonthly    = opRows.reduce((s, r) => s + calcSave(r.sh, r.cu, r.mp2, opEffTpv, r.msi, optcCur, optcMp), 0)
  const opAccGainMonthly = hasOp ? opTpv * (accMp - accCur) : 0
  const pointCommAnnual  = pointCommMonthly * 12
  const opCommAnnual     = opCommMonthly * 12
  const totalCommAnnual  = pointCommAnnual + opCommAnnual
  const opAccGainAnnual  = opAccGainMonthly * 12

  const ticketWithMp    = tc * (1 + pct(ticketGrowthMp))
  const ticketGrowthMon = tpv * pct(ticketGrowthMp)
  const ticketGrowthAnn = ticketGrowthMon * 12

  const combinedTpv = tpv + opEffTpv
  const buenFinInc  = combinedTpv * pct(buenFinGrowth)
  const hotSaleInc  = combinedTpv * pct(hotSaleGrowth)
  const navidadInc  = combinedTpv * pct(navidadGrowth)
  const growthAnn   = buenFinInc + hotSaleInc + navidadInc + ticketGrowthAnn
  const netAnn      = growthAnn + totalCommAnnual + opAccGainAnnual
  const netMonthly  = netAnn / 12

  const dateStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  let mpLogoB64 = ''
  try { mpLogoB64 = fs.readFileSync(path.join(process.cwd(), 'public', 'mp-logo.png')).toString('base64') } catch { /**/ }

  const chartBars: { label: string; value: number }[] = [
    { label: 'Point',       value: pointCommAnnual   },
    ...(hasOp               ? [{ label: 'Online Pay.',  value: opCommAnnual     }] : []),
    ...(opAccGainAnnual > 0 ? [{ label: 'Aprobación',   value: opAccGainAnnual  }] : []),
    ...(ticketGrowthAnn > 0 ? [{ label: 'Ticket',       value: ticketGrowthAnn  }] : []),
    ...(buenFinInc > 0      ? [{ label: 'Buen Fin',     value: buenFinInc       }] : []),
    ...(hotSaleInc > 0      ? [{ label: 'Hot Sale',     value: hotSaleInc       }] : []),
    ...(navidadInc > 0      ? [{ label: 'Navidad',      value: navidadInc       }] : []),
  ].filter(b => Math.abs(b.value) > 0)

  const maxAbsChart = Math.max(1, ...chartBars.map(b => Math.abs(b.value)))
  const chartColors = chartBars.map(b => scaleColor(b.value, maxAbsChart))
  const heroBg = netAnn >= 0 ? NAVY : '7F1D1D'

  // ─── Build single-slide PPTX ─────────────────────────────────────────────
  const prs = new pptxgen()
  prs.layout = 'LAYOUT_WIDE'
  const s = prs.addSlide()

  // White background
  s.addShape('rect' as pptxgen.ShapeType, { x: 0, y: 0, w: W, h: H, fill: { color: WHITE }, line: { color: WHITE, pt: 0 } })

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  // Yellow top stripe
  s.addShape('rect' as pptxgen.ShapeType, { x: 0, y: 0, w: W, h: STRIPE, fill: { color: YELLOW }, line: { color: YELLOW, pt: 0 } })

  // Client logo (optional)
  if (clientLogoBase64) {
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: SM, y: STRIPE + 0.04, w: 1.5, h: 0.44,
      fill: { color: OFFWHITE }, line: { color: GRAY100, pt: 1 }, rectRadius: 0.08,
    })
    s.addImage({
      data: `image/png;base64,${clientLogoBase64}`,
      x: SM + 0.1, y: STRIPE + 0.07, w: 1.3, h: 0.38,
      sizing: { type: 'contain', w: 1.3, h: 0.38 },
    })
  }

  // Client name
  const nameX = clientLogoBase64 ? SM + 1.62 : SM
  s.addText(clientName || 'Nombre del cliente', {
    x: nameX, y: STRIPE + 0.05, w: W - nameX - 2.25, h: 0.34,
    fontSize: 20, bold: true, fontFace: FONT, color: NAVY, autoFit: true,
  })

  // Industry chip
  if (industry) {
    const chipW = Math.min(industry.length * 0.095 + 0.36, 3.4)
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: nameX, y: STRIPE + 0.39, w: chipW, h: 0.17,
      fill: { color: OFFWHITE }, line: { color: GRAY100, pt: 1 }, rectRadius: 0.085,
    })
    s.addText(industry, {
      x: nameX + 0.1, y: STRIPE + 0.40, w: chipW - 0.12, h: 0.15,
      fontSize: 6.5, fontFace: FONT, color: GRAY400,
    })
  }

  // MP logo
  if (mpLogoB64) {
    s.addImage({ data: `image/png;base64,${mpLogoB64}`, x: W - 2.08, y: STRIPE + 0.06, w: 1.72, h: 0.40 })
  }

  // Date
  s.addText(dateStr, {
    x: W - 2.08, y: STRIPE + 0.44, w: 1.72, h: 0.13,
    fontSize: 6.5, fontFace: FONT, color: GRAY400, align: 'right',
  })

  // Thin divider under header
  s.addShape('rect' as pptxgen.ShapeType, {
    x: SM, y: HDR_H, w: W - SM * 2, h: 0.01,
    fill: { color: GRAY100 }, line: { color: GRAY100, pt: 0 },
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // HERO BAND
  // ═══════════════════════════════════════════════════════════════════════════

  s.addShape('roundRect' as pptxgen.ShapeType, {
    x: SM, y: HERO_Y, w: W - SM * 2, h: HERO_H,
    fill: { color: heroBg }, line: { color: heroBg, pt: 0 }, rectRadius: 0.12,
    shadow: { type: 'outer', blur: 8, offset: 3, angle: 270, color: '000000', opacity: 0.15 },
  })

  // Yellow left accent
  s.addShape('roundRect' as pptxgen.ShapeType, {
    x: SM, y: HERO_Y, w: 0.06, h: HERO_H,
    fill: { color: YELLOW }, line: { color: YELLOW, pt: 0 }, rectRadius: 0.06,
  })

  // Label + net annual
  s.addText('IMPACTO NETO ESTIMADO CON MERCADO PAGO', {
    x: SM + 0.14, y: HERO_Y + 0.06, w: 4.2, h: 0.18,
    fontSize: 7, bold: true, fontFace: FONT, color: YELLOW, charSpacing: 1.0,
  })
  s.addText(fmt(netAnn), {
    x: SM + 0.14, y: HERO_Y + 0.22, w: 3.8, h: 0.34,
    fontSize: 24, bold: true, fontFace: FONT, color: WHITE, autoFit: true,
  })
  s.addText(`${fmt(netMonthly)}/mes`, {
    x: SM + 4.05, y: HERO_Y + 0.26, w: 1.5, h: 0.22,
    fontSize: 9, fontFace: FONT, color: '8895C5',
  })

  // Right side: 4 KPI stat blocks (no card bg, just text + subtle dividers)
  const kpiItems = [
    { l: 'POINT',         v: fmt(pointCommAnnual),                    s: 'ahorro anual' },
    ...(hasOp ? [{ l: 'ONLINE PAY.',  v: fmt(opCommAnnual),           s: 'ahorro anual' }] : []),
    { l: 'ESTACIONAL',    v: fmt(buenFinInc + hotSaleInc + navidadInc), s: 'ingreso adicional' },
    { l: 'TICKET+ACEPT',  v: fmt(ticketGrowthAnn + opAccGainAnnual),  s: 'anual' },
  ]
  const kpiStartX   = SM + 5.65
  const kpiTotalW   = W - kpiStartX - SM - 0.08
  const kpiItemW    = kpiTotalW / kpiItems.length

  kpiItems.forEach((k, i) => {
    const kx = kpiStartX + i * kpiItemW
    // Subtle vertical divider
    if (i > 0) {
      s.addShape('rect' as pptxgen.ShapeType, {
        x: kx - 0.01, y: HERO_Y + 0.10, w: 0.015, h: HERO_H - 0.20,
        fill: { color: '2A3490' }, line: { color: '2A3490', pt: 0 },
      })
    }
    s.addText(k.l, {
      x: kx + 0.10, y: HERO_Y + 0.08, w: kpiItemW - 0.14, h: 0.16,
      fontSize: 6.5, bold: true, fontFace: FONT, color: '8895C5', charSpacing: 0.5,
    })
    s.addText(k.v, {
      x: kx + 0.10, y: HERO_Y + 0.22, w: kpiItemW - 0.14, h: 0.30,
      fontSize: 13, bold: true, fontFace: FONT, color: WHITE, autoFit: true,
    })
    s.addText(k.s, {
      x: kx + 0.10, y: HERO_Y + HERO_H - 0.20, w: kpiItemW - 0.14, h: 0.16,
      fontSize: 6.5, fontFace: FONT, color: '8895C5', italic: true,
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // BODY — LEFT: Commission Tables
  // ═══════════════════════════════════════════════════════════════════════════

  // Column headers
  const colHdrLabels = ['Medio', 'Share', 'Actual', 'MP', 'Ahorro']
  colHdrLabels.forEach((h, i) => {
    s.addText(h, {
      x: SM + HX_OFF[i], y: BODY_Y, w: HX_W[i], h: 0.18,
      fontSize: 6.5, bold: true, fontFace: FONT, color: GRAY400, charSpacing: 0.4,
    })
  })

  // Dynamic row height based on total rows
  const totalDataRows = ptRows.length + (hasOp ? opRows.length : 0)
  const fixedH = 0.20 + 0.30 + 0.28 + (hasOp ? 0.30 + 0.28 + 0.06 : 0)
  const rH = Math.min(Math.max((BODY_H - fixedH) / Math.max(totalDataRows, 1), 0.22), 0.34)

  let curY = BODY_Y + 0.20

  // ── Point section ──
  s.addShape('roundRect' as pptxgen.ShapeType, {
    x: SM, y: curY, w: LW, h: 0.28,
    fill: { color: NAVY }, line: { color: NAVY, pt: 0 }, rectRadius: 0.07,
  })
  s.addText(`POINT / TERMINALES  ·  TPV ${fmt(tpv)}/mes`, {
    x: SM + 0.12, y: curY + 0.05, w: LW - 0.20, h: 0.18,
    fontSize: 7.5, bold: true, fontFace: FONT, color: WHITE, charSpacing: 0.3,
  })
  curY += 0.30

  const maxPtSave = Math.max(...ptRows.map(r => Math.abs(calcSave(r.sh, r.cu, r.mp2, tpv, r.msi, ptcCur, ptcMp))), 1)
  ptRows.forEach((r, i) => {
    const save = calcSave(r.sh, r.cu, r.mp2, tpv, r.msi, ptcCur, ptcMp)
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: SM, y: curY, w: LW, h: rH - 0.02,
      fill: { color: i % 2 === 0 ? WHITE : OFFWHITE }, line: { color: GRAY100, pt: 1 }, rectRadius: 0.05,
    })
    const vals  = [r.l, `${(r.sh * 100).toFixed(0)}%`, fmtPct(r.cu), fmtPct(r.mp2), fmt(save)]
    const vCols = [GRAY700, GRAY400, GRAY400, '1D4ED8', scaleColor(save, maxPtSave)]
    vals.forEach((v, j) => {
      s.addText(v, {
        x: SM + HX_OFF[j], y: curY + (rH - 0.18) / 2, w: HX_W[j], h: 0.18,
        fontSize: 7, fontFace: FONT, color: vCols[j], bold: j === 4,
      })
    })
    curY += rH
  })
  // Point total row
  s.addShape('roundRect' as pptxgen.ShapeType, {
    x: SM, y: curY, w: LW, h: 0.26,
    fill: { color: scaleColor(pointCommMonthly, maxPtSave) }, line: { color: GRAY100, pt: 0 }, rectRadius: 0.07,
  })
  s.addText('Ahorro mensual Point', {
    x: SM + 0.12, y: curY + 0.04, w: 3.0, h: 0.18,
    fontSize: 7.5, bold: true, fontFace: FONT, color: WHITE,
  })
  s.addText(fmt(pointCommMonthly), {
    x: SM + HX_OFF[4], y: curY + 0.04, w: HX_W[4] + 0.5, h: 0.18,
    fontSize: 8, bold: true, fontFace: FONT, color: WHITE,
  })
  curY += 0.28

  // ── OP section (if hasOp) ──
  if (hasOp) {
    curY += 0.06
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: SM, y: curY, w: LW, h: 0.28,
      fill: { color: NAVY }, line: { color: NAVY, pt: 0 }, rectRadius: 0.07,
    })
    s.addText(`ONLINE PAYMENTS  ·  TPV ${fmt(opTpv)}/mes`, {
      x: SM + 0.12, y: curY + 0.05, w: LW - 0.20, h: 0.18,
      fontSize: 7.5, bold: true, fontFace: FONT, color: WHITE, charSpacing: 0.3,
    })
    curY += 0.30

    const maxOpSave = Math.max(...opRows.map(r => Math.abs(calcSave(r.sh, r.cu, r.mp2, opEffTpv, r.msi, optcCur, optcMp))), 1)
    opRows.forEach((r, i) => {
      const save = calcSave(r.sh, r.cu, r.mp2, opEffTpv, r.msi, optcCur, optcMp)
      s.addShape('roundRect' as pptxgen.ShapeType, {
        x: SM, y: curY, w: LW, h: rH - 0.02,
        fill: { color: i % 2 === 0 ? WHITE : OFFWHITE }, line: { color: GRAY100, pt: 1 }, rectRadius: 0.05,
      })
      const vals  = [r.l, `${(r.sh * 100).toFixed(0)}%`, fmtPct(r.cu), fmtPct(r.mp2), fmt(save)]
      const vCols = [GRAY700, GRAY400, GRAY400, '1D4ED8', scaleColor(save, maxOpSave)]
      vals.forEach((v, j) => {
        s.addText(v, {
          x: SM + HX_OFF[j], y: curY + (rH - 0.18) / 2, w: HX_W[j], h: 0.18,
          fontSize: 7, fontFace: FONT, color: vCols[j], bold: j === 4,
        })
      })
      curY += rH
    })
    // OP total row
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: SM, y: curY, w: LW, h: 0.26,
      fill: { color: scaleColor(opCommMonthly, maxPtSave) }, line: { color: GRAY100, pt: 0 }, rectRadius: 0.07,
    })
    s.addText('Ahorro mensual Online Pay.', {
      x: SM + 0.12, y: curY + 0.04, w: 3.0, h: 0.18,
      fontSize: 7.5, bold: true, fontFace: FONT, color: WHITE,
    })
    s.addText(fmt(opCommMonthly), {
      x: SM + HX_OFF[4], y: curY + 0.04, w: HX_W[4] + 0.5, h: 0.18,
      fontSize: 8, bold: true, fontFace: FONT, color: WHITE,
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BODY — CENTER: Seasonality + Summary
  // ═══════════════════════════════════════════════════════════════════════════

  let cenY = BODY_Y

  s.addText('ESTACIONALIDAD Y CRECIMIENTO', {
    x: CX, y: cenY, w: CW_COL, h: 0.18,
    fontSize: 7, bold: true, fontFace: FONT, color: NAVY, charSpacing: 0.4,
  })
  s.addShape('rect' as pptxgen.ShapeType, {
    x: CX, y: cenY + 0.18, w: 0.65, h: 0.025,
    fill: { color: YELLOW }, line: { color: YELLOW, pt: 0 },
  })
  cenY += 0.24

  const evItems: { l: string; v: number; sub: string }[] = [
    ...(buenFinInc > 0    ? [{ l: 'BUEN FIN',           v: buenFinInc,        sub: `+${n(buenFinGrowth)}% TPV` }] : []),
    ...(hotSaleInc > 0    ? [{ l: 'HOT SALE',           v: hotSaleInc,        sub: `+${n(hotSaleGrowth)}% TPV` }] : []),
    ...(navidadInc > 0    ? [{ l: 'NAVIDAD',            v: navidadInc,        sub: `+${n(navidadGrowth)}% TPV` }] : []),
    ...(opAccGainAnnual>0 ? [{ l: 'TASA APROBACIÓN',    v: opAccGainAnnual,   sub: `${n(opAcceptanceRateCurrent)}%→${n(opAcceptanceRateMp)}%` }] : []),
    ...(ticketGrowthAnn>0 ? [{ l: 'CRECIMIENTO TICKET', v: ticketGrowthAnn,   sub: tc > 0 ? `${fmt(tc)}→${fmt(ticketWithMp)}` : 'anual' }] : []),
  ]

  // Distribute evItems + 1 summary card evenly in remaining space
  const cenAvailH = H - cenY - STRIPE - 0.06
  const numCards  = evItems.length + 1
  const evH       = Math.min((cenAvailH - (numCards - 1) * 0.05) / numCards, 0.88)

  evItems.forEach(e => {
    const col = scaleColor(e.v, Math.max(Math.abs(netAnn), 1))
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: CX, y: cenY, w: CW_COL, h: evH,
      fill: { color: OFFWHITE }, line: { color: GRAY100, pt: 1 }, rectRadius: 0.09,
    })
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: CX, y: cenY, w: 0.05, h: evH,
      fill: { color: col }, line: { color: col, pt: 0 }, rectRadius: 0.05,
    })
    s.addText(e.l, {
      x: CX + 0.14, y: cenY + 0.07, w: CW_COL - 0.22, h: 0.16,
      fontSize: 6.5, bold: true, fontFace: FONT, color: GRAY400, charSpacing: 0.5,
    })
    s.addText(fmt(e.v), {
      x: CX + 0.14, y: cenY + 0.22, w: CW_COL - 0.22, h: evH - 0.42,
      fontSize: 13, bold: true, fontFace: FONT, color: col, autoFit: true,
    })
    s.addText(e.sub, {
      x: CX + 0.14, y: cenY + evH - 0.22, w: CW_COL - 0.22, h: 0.18,
      fontSize: 6.5, fontFace: FONT, color: GRAY400, italic: true,
    })
    cenY += evH + 0.05
  })

  // Summary net annual card (remaining height)
  const remH = H - cenY - STRIPE - 0.04
  if (remH > 0.40) {
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: CX, y: cenY, w: CW_COL, h: remH,
      fill: { color: heroBg }, line: { color: heroBg, pt: 0 }, rectRadius: 0.10,
    })
    s.addShape('roundRect' as pptxgen.ShapeType, {
      x: CX, y: cenY, w: 0.05, h: remH,
      fill: { color: YELLOW }, line: { color: YELLOW, pt: 0 }, rectRadius: 0.05,
    })
    s.addText('IMPACTO NETO ANUAL', {
      x: CX + 0.14, y: cenY + 0.07, w: CW_COL - 0.22, h: 0.18,
      fontSize: 6.5, bold: true, fontFace: FONT, color: YELLOW, charSpacing: 0.8,
    })
    s.addText(fmt(netAnn), {
      x: CX + 0.14, y: cenY + 0.22, w: CW_COL - 0.22, h: remH - 0.44,
      fontSize: 16, bold: true, fontFace: FONT, color: WHITE, autoFit: true,
    })
    s.addText(`${fmt(netMonthly)}/mes`, {
      x: CX + 0.14, y: cenY + remH - 0.24, w: CW_COL - 0.22, h: 0.18,
      fontSize: 8, fontFace: FONT, color: '8895C5',
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BODY — RIGHT: Bar Chart
  // ═══════════════════════════════════════════════════════════════════════════

  if (chartBars.length > 0) {
    s.addText('IMPACTO ANUAL POR COMPONENTE', {
      x: RX, y: BODY_Y, w: RW, h: 0.18,
      fontSize: 7, bold: true, fontFace: FONT, color: NAVY, charSpacing: 0.4,
    })
    s.addShape('rect' as pptxgen.ShapeType, {
      x: RX, y: BODY_Y + 0.18, w: 0.65, h: 0.025,
      fill: { color: YELLOW }, line: { color: YELLOW, pt: 0 },
    })
    s.addChart(prs.ChartType.bar, [
      { name: 'Impacto', labels: chartBars.map(b => b.label), values: chartBars.map(b => b.value) },
    ], {
      x: RX, y: BODY_Y + 0.24, w: RW, h: BODY_H - 0.26,
      chartColors,
      showValue: true,
      dataLabelFontSize: 7,
      dataLabelFontBold: true,
      dataLabelColor: GRAY700,
      valAxisNumFmt: '"$"#,##0',
      valGridLine: { style: 'dot', color: GRAY100 },
      valAxisLineShow: false,
      catAxisLineShow: false,
      catAxisLabelFontSize: 7,
      catAxisLabelColor: GRAY400,
      showLegend: false,
      plotAreaBorderColor: WHITE,
      chartAreaBorderColor: WHITE,
      plotAreaFill: { color: WHITE },
    } as Parameters<typeof s.addChart>[2])
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // YELLOW BOTTOM STRIPE
  // ═══════════════════════════════════════════════════════════════════════════

  s.addShape('rect' as pptxgen.ShapeType, {
    x: 0, y: H - STRIPE, w: W, h: STRIPE,
    fill: { color: YELLOW }, line: { color: YELLOW, pt: 0 },
  })

  // ─── Serialize ────────────────────────────────────────────────────────────
  const buffer = await prs.write({ outputType: 'nodebuffer' }) as Buffer
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="business-case-${(clientName || 'cliente').replace(/\s+/g, '-')}.pptx"`,
    },
  })
}
