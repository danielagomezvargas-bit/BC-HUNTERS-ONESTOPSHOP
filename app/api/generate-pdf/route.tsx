import { NextRequest, NextResponse } from 'next/server'
import satori from 'satori'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import React from 'react'

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function n(s: string | number): number {
  const v = typeof s === 'number' ? s : parseFloat(String(s).replace(/,/g, ''))
  return isNaN(v) ? 0 : v
}
function pct(s: string | number): number { return n(s) / 100 }
function fmt(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}
function fmtPct(v: number): string { return `${(v * 100).toFixed(2)}%` }

/* ─── Palette ─────────────────────────────────────────────────────────────── */
const NAVY     = '#1A1F71'
const YELL     = '#FFE600'
const WHITE    = '#FFFFFF'
const GRAY1    = '#F7F8FA'
const GRAY2    = '#E5E7EB'
const GRAY4    = '#9CA3AF'
const GRAY5    = '#6B7280'
const GRAY8    = '#1F2937'
const MUTED    = '#8895C5'
const GRN_BAR  = '#4ADE80'
const RED_BAR  = '#F87171'
const GRN_TEXT = '#15803D'
const RED_TEXT = '#DC2626'
const GRAY_BAR = '#B8C5D0'

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
  } = body

  /* ─── Calculations ────────────────────────────────────────────────────── */
  const tpv      = n(tpvMonthly)
  const tc       = n(ticketCurrent)
  const opTpv    = n(opTpvMonthly)
  const hasOp    = opTpv > 0
  const accCur   = pct(opAcceptanceRateCurrent)
  const accMp    = pct(opAcceptanceRateMp)
  const opEffTpv = opTpv * accMp

  function calcSave(sh: number, cu: number, mp: number, base: number, msi: boolean, tcCurR: number, tcMpR: number) {
    return msi ? ((tcCurR + cu) - (tcMpR + mp)) * base * sh : (cu - mp) * base * sh
  }
  const ptcCur  = pct(tcCurrent);   const ptcMp  = pct(tcMp)
  const optcCur = pct(opTcCurrent); const optcMp = pct(opTcMp)

  const ptRows = [
    { l:'TD',      sh:pct(tdShare),    cu:pct(tdCurrent),    mp2:pct(tdMp),    msi:false },
    { l:'TC',      sh:pct(tcShare),    cu:pct(tcCurrent),    mp2:pct(tcMp),    msi:false },
    { l:'AMEX',    sh:pct(amexShare),  cu:pct(amexCurrent),  mp2:pct(amexMp),  msi:false },
    { l:'MSI 3m',  sh:pct(msi3Share),  cu:pct(msi3Current),  mp2:pct(msi3Mp),  msi:true  },
    { l:'MSI 6m',  sh:pct(msi6Share),  cu:pct(msi6Current),  mp2:pct(msi6Mp),  msi:true  },
    { l:'MSI 9m',  sh:pct(msi9Share),  cu:pct(msi9Current),  mp2:pct(msi9Mp),  msi:true  },
    { l:'MSI 12m', sh:pct(msi12Share), cu:pct(msi12Current), mp2:pct(msi12Mp), msi:true  },
    { l:'MSI 18m', sh:pct(msi18Share), cu:pct(msi18Current), mp2:pct(msi18Mp), msi:true  },
    { l:'MSI 24m', sh:pct(msi24Share), cu:pct(msi24Current), mp2:pct(msi24Mp), msi:true  },
  ].filter(r => r.sh > 0)

  const opRows = [
    { l:'TD',      sh:pct(opTdShare),    cu:pct(opTdCurrent),    mp2:pct(opTdMp),    msi:false },
    { l:'TC',      sh:pct(opTcShare),    cu:pct(opTcCurrent),    mp2:pct(opTcMp),    msi:false },
    { l:'AMEX',    sh:pct(opAmexShare),  cu:pct(opAmexCurrent),  mp2:pct(opAmexMp),  msi:false },
    { l:'MSI 3m',  sh:pct(opMsi3Share),  cu:pct(opMsi3Current),  mp2:pct(opMsi3Mp),  msi:true  },
    { l:'MSI 6m',  sh:pct(opMsi6Share),  cu:pct(opMsi6Current),  mp2:pct(opMsi6Mp),  msi:true  },
    { l:'MSI 9m',  sh:pct(opMsi9Share),  cu:pct(opMsi9Current),  mp2:pct(opMsi9Mp),  msi:true  },
    { l:'MSI 12m', sh:pct(opMsi12Share), cu:pct(opMsi12Current), mp2:pct(opMsi12Mp), msi:true  },
    { l:'MSI 18m', sh:pct(opMsi18Share), cu:pct(opMsi18Current), mp2:pct(opMsi18Mp), msi:true  },
    { l:'MSI 24m', sh:pct(opMsi24Share), cu:pct(opMsi24Current), mp2:pct(opMsi24Mp), msi:true  },
  ].filter(r => r.sh > 0)

  const pointCommMonthly = ptRows.reduce((s,r) => s + calcSave(r.sh,r.cu,r.mp2,tpv,r.msi,ptcCur,ptcMp), 0)
  const opCommMonthly    = opRows.reduce((s,r) => s + calcSave(r.sh,r.cu,r.mp2,opEffTpv,r.msi,optcCur,optcMp), 0)
  const opAccGainMonthly = hasOp ? opTpv * (accMp - accCur) : 0
  const pointCommAnnual  = pointCommMonthly * 12
  const opCommAnnual     = opCommMonthly * 12
  const totalCommAnnual  = pointCommAnnual + opCommAnnual
  const opAccGainAnnual  = opAccGainMonthly * 12
  const ticketWithMp     = tc * (1 + pct(ticketGrowthMp))
  const ticketGrowthAnn  = tpv * pct(ticketGrowthMp) * 12
  const combinedTpv      = tpv + opEffTpv
  const buenFinInc       = combinedTpv * pct(buenFinGrowth)
  const hotSaleInc       = combinedTpv * pct(hotSaleGrowth)
  const navidadInc       = combinedTpv * pct(navidadGrowth)
  const netAnn           = buenFinInc + hotSaleInc + navidadInc + ticketGrowthAnn + totalCommAnnual + opAccGainAnnual
  const netMonthly       = netAnn / 12
  const nc               = netAnn >= 0 ? '#166534' : '#991B1B'
  const dateStr = new Date().toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })

  /* ─── Fonts — read from public/fonts/ (always included in Vercel deploy) ─ */
  const fontReg  = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'inter-400.woff'))
  const fontBold = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'inter-700.woff'))

  /* ─── Logo ────────────────────────────────────────────────────────────── */
  let logoSrc: string | null = null
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'mp-logo.png'))
    logoSrc = `data:image/png;base64,${buf.toString('base64')}`
  } catch { /**/ }

  /* ─── Canvas size: 2× PDF Letter landscape ───────────────────────────── */
  const W = 1584, H = 1224
  const PX = 64   // horizontal padding
  const PY = 40   // vertical padding (body top/bottom)
  const INNER_W = W - PX * 2   // 1456

  /* ─── Commission table component ─────────────────────────────────────── */
  function CommTable({
    rows, effTpv, tcCurR, tcMpR, subtotal, label,
  }: {
    rows: typeof ptRows, effTpv: number, tcCurR: number, tcMpR: number, subtotal: number, label: string,
  }) {
    return (
      <div style={{ display:'flex', flexDirection:'column', width:'100%' }}>
        {/* Subtitle */}
        <div style={{ display:'flex', padding:'5px 8px', backgroundColor:GRAY1, borderRadius:5, marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:700, color:GRAY5 }}>{label}</span>
        </div>
        {/* Header */}
        <div style={{ display:'flex', flexDirection:'row', padding:'3px 8px', borderBottom:`1px solid ${GRAY2}` }}>
          <span style={{ width:50, fontSize:12, fontWeight:700, color:GRAY4 }}>Medio</span>
          <span style={{ width:34, fontSize:12, fontWeight:700, color:GRAY4, textAlign:'center' }}>Mix</span>
          <span style={{ flex:1, fontSize:12, fontWeight:700, color:GRAY4 }}>Actual → MP</span>
          <span style={{ width:76, fontSize:12, fontWeight:700, color:GRAY4, textAlign:'right' }}>Ahorro/mes</span>
        </div>
        {rows.map((r, i) => {
          const save = calcSave(r.sh, r.cu, r.mp2, effTpv, r.msi, tcCurR, tcMpR)
          const sc = save >= 0 ? GRN_TEXT : RED_TEXT
          const rc = (r.cu - r.mp2) >= 0 ? GRAY8 : RED_TEXT
          return (
            <div key={i} style={{
              display:'flex', flexDirection:'row',
              padding:'5px 8px',
              backgroundColor: i % 2 === 0 ? GRAY1 : WHITE,
            }}>
              <span style={{ width:50, fontSize:13, color:GRAY8 }}>{r.l}</span>
              <span style={{ width:34, fontSize:13, color:GRAY5, textAlign:'center' }}>{(r.sh*100).toFixed(0)}%</span>
              <span style={{ flex:1, fontSize:12, color:rc }}>{fmtPct(r.cu)} → {fmtPct(r.mp2)}</span>
              <span style={{ width:76, fontSize:13, fontWeight:700, color:sc, textAlign:'right' }}>{fmt(save)}</span>
            </div>
          )
        })}
        {/* Subtotal */}
        <div style={{ display:'flex', flexDirection:'row', padding:'5px 8px', borderTop:`1px solid ${GRAY2}` }}>
          <span style={{ flex:1, fontSize:13, fontWeight:700, color:GRAY8 }}>Total / mes</span>
          <span style={{ width:76, fontSize:14, fontWeight:700, color: subtotal>=0 ? GRN_TEXT : RED_TEXT, textAlign:'right' }}>{fmt(subtotal)}</span>
        </div>
      </div>
    )
  }

  /* ─── Bar chart component ─────────────────────────────────────────────── */
  function BarChart({
    rows, subtitle, subtitle2, maxBarH,
  }: {
    rows: typeof ptRows, subtitle: string, subtitle2?: string, maxBarH: number,
  }) {
    if (rows.length === 0) return <div style={{ display:'flex' }} />
    const maxR  = Math.max(...rows.flatMap(r => [r.cu, r.mp2]), 0.001)
    const scale = maxR * 1.48
    const barW  = Math.max(Math.floor((INNER_W - PX * 2) / rows.length * 0.22), 18)

    return (
      <div style={{ display:'flex', flexDirection:'column', width:'100%' }}>
        {/* Subtitle */}
        <div style={{ display:'flex', flexDirection:'column', marginBottom:14 }}>
          <span style={{ fontSize:17, fontWeight:700, color:GRAY5 }}>{subtitle}</span>
          {subtitle2 ? <span style={{ fontSize:14, color:GRAY4, marginTop:3 }}>{subtitle2}</span> : null}
        </div>

        {/* Delta labels row */}
        <div style={{ display:'flex', flexDirection:'row', width:'100%', marginBottom:6 }}>
          {rows.map((r, i) => {
            const delta    = r.cu - r.mp2
            const isSaving = delta >= 0
            const dAbs     = Math.abs(delta * 100)
            const dTxt     = `${isSaving ? '−' : '+'}${dAbs < 1 ? dAbs.toFixed(2) : dAbs.toFixed(1)}pp`
            return (
              <div key={i} style={{ flex:1, display:'flex', justifyContent:'center' }}>
                <span style={{
                  fontSize: isSaving ? 16 : 14,
                  fontWeight:700,
                  color: isSaving ? GRN_TEXT : RED_TEXT,
                }}>{dTxt}</span>
              </div>
            )
          })}
        </div>

        {/* Bars row — bottom-aligned so all bars share a baseline */}
        <div style={{
          display:'flex', flexDirection:'row',
          alignItems:'flex-end',
          width:'100%',
          height: maxBarH,
          borderBottom:`2px solid ${GRAY2}`,
        }}>
          {rows.map((r, i) => {
            const h1       = Math.max(Math.round(maxBarH * r.cu  / scale), 4)
            const h2       = Math.max(Math.round(maxBarH * r.mp2 / scale), 4)
            const isSaving = (r.cu - r.mp2) >= 0
            return (
              <div key={i} style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'flex-end' }}>
                <div style={{ display:'flex', flexDirection:'row', alignItems:'flex-end', gap:4 }}>
                  <div style={{ width:barW, height:h1, backgroundColor:GRAY_BAR, borderRadius:'4px 4px 0 0' }} />
                  <div style={{ width:barW, height:h2, backgroundColor: isSaving ? GRN_BAR : RED_BAR, borderRadius:'4px 4px 0 0' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* X-axis labels */}
        <div style={{ display:'flex', flexDirection:'row', width:'100%', marginTop:8 }}>
          {rows.map((r, i) => {
            const lbl = r.l.startsWith('MSI ') ? r.l.replace('MSI ', '') : r.l
            return (
              <div key={i} style={{ flex:1, display:'flex', justifyContent:'center' }}>
                <span style={{ fontSize:14, color:GRAY5 }}>{lbl}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ─── Layout JSX ──────────────────────────────────────────────────────── */
  const layout = (
    <div style={{ width:W, height:H, display:'flex', flexDirection:'column', backgroundColor:WHITE, fontFamily:'Inter' }}>

      {/* Top accent */}
      <div style={{ width:'100%', height:5, backgroundColor:YELL, flexShrink:0 }} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', flexDirection:'row', alignItems:'center',
        padding:`22px ${PX}px 0`,
        flexShrink:0,
      }}>
        {logoSrc ? (
          <img src={logoSrc} width={136} height={35} style={{ objectFit:'contain' }} />
        ) : null}
        <div style={{ display:'flex', flexDirection:'column', marginLeft:22, flex:1 }}>
          <span style={{ fontSize:28, fontWeight:700, color:NAVY }}>{clientName || 'Cliente'}</span>
          {industry ? <span style={{ fontSize:16, color:GRAY5, marginTop:2 }}>{industry}</span> : null}
        </div>
        <span style={{ fontSize:15, color:GRAY4 }}>{dateStr}</span>
      </div>

      {/* Thin divider */}
      <div style={{ height:1, backgroundColor:GRAY2, margin:`14px ${PX}px 16px` }} />

      {/* ── KPI Impact Bar (navy) ───────────────────────────────────────── */}
      <div style={{
        display:'flex', flexDirection:'row',
        backgroundColor:NAVY, borderRadius:10,
        margin:`0 ${PX}px`,
        flexShrink:0,
        overflow:'hidden',
      }}>
        {/* Net annual */}
        <div style={{ display:'flex', flexDirection:'column', padding:'16px 26px', flexShrink:0, borderRight:`1px solid #2A3490` }}>
          <span style={{ fontSize:13, fontWeight:700, color:MUTED }}>IMPACTO NETO ESTIMADO CON MP</span>
          <span style={{ fontSize:42, fontWeight:700, color:WHITE, marginTop:4 }}>{fmt(netAnn)}</span>
          <span style={{ fontSize:16, color:MUTED, marginTop:4 }}>{fmt(netMonthly)} / mes</span>
        </div>
        {/* 4 KPIs */}
        {[
          { l:'AHORRO COMISIONES',     v:fmt(totalCommAnnual),                    s:'anual'     },
          { l:'CRECIMIENTO ESTACIONAL',v:fmt(buenFinInc+hotSaleInc+navidadInc),   s:'3 eventos' },
          { l:'TICKET + APROBACIÓN',   v:fmt(ticketGrowthAnn+opAccGainAnnual),    s:'anual'     },
          { l:'TPV COMBINADO',         v:fmt(combinedTpv),                        s:'mensual'   },
        ].map((k, i) => (
          <div key={i} style={{
            display:'flex', flexDirection:'column',
            flex:1, padding:'16px 18px',
            borderLeft: i > 0 ? '1px solid #2A3490' : '0px solid transparent',
          }}>
            <span style={{ fontSize:12, fontWeight:700, color:MUTED }}>{k.l}</span>
            <span style={{ fontSize:26, fontWeight:700, color:WHITE, marginTop:5 }}>{k.v}</span>
            <span style={{ fontSize:13, color:MUTED, marginTop:3 }}>{k.s}</span>
          </div>
        ))}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', flexDirection:'row',
        flex:1,
        padding:`${PY}px ${PX}px ${PY * 0.6}px`,
        gap:36,
        overflow:'hidden',
      }}>

        {/* ── LEFT COLUMN — Commission tables + Seasonality ─────────── */}
        <div style={{
          display:'flex', flexDirection:'column',
          width:380, flexShrink:0,
          gap:16,
          overflow:'hidden',
        }}>
          {/* Section title */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
            <span style={{ fontSize:17, fontWeight:700, color:NAVY }}>AHORRO EN COMISIONES</span>
            <div style={{ width:48, height:3, backgroundColor:YELL }} />
          </div>

          <CommTable
            rows={ptRows} effTpv={tpv} tcCurR={ptcCur} tcMpR={ptcMp}
            subtotal={pointCommMonthly}
            label={`POINT / TERMINALES  ·  TPV ${fmt(tpv)}/mes`}
          />

          {hasOp && opRows.length > 0 ? (
            <CommTable
              rows={opRows} effTpv={opEffTpv} tcCurR={optcCur} tcMpR={optcMp}
              subtotal={opCommMonthly}
              label={`ONLINE PAYMENTS  ·  TPV ${fmt(opTpv)}/mes`}
            />
          ) : null}

          {/* Divider */}
          <div style={{ height:1, backgroundColor:GRAY2, flexShrink:0 }} />

          {/* Seasonality */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
            <span style={{ fontSize:17, fontWeight:700, color:NAVY }}>ESTACIONALIDAD</span>
            <div style={{ width:48, height:3, backgroundColor:YELL }} />
          </div>

          {[
            { name:'Buen Fin', g:n(buenFinGrowth),  v:buenFinInc },
            { name:'Hot Sale', g:n(hotSaleGrowth),  v:hotSaleInc },
            { name:'Navidad',  g:n(navidadGrowth),  v:navidadInc },
          ].filter(e => e.v > 0).map((ev, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'row', padding:'6px 8px', backgroundColor: i%2===0 ? GRAY1 : WHITE, borderRadius:4 }}>
              <span style={{ flex:1, fontSize:14, color:GRAY8 }}>{ev.name}</span>
              <span style={{ fontSize:14, fontWeight:700, color:GRN_TEXT, marginRight:12 }}>+{ev.g}%</span>
              <span style={{ fontSize:14, fontWeight:700, color:GRN_TEXT }}>{fmt(ev.v)}</span>
            </div>
          ))}

          {ticketGrowthAnn > 0 ? (
            <div style={{ display:'flex', flexDirection:'row', padding:'6px 8px' }}>
              <span style={{ flex:1, fontSize:14, color:GRAY8 }}>Ticket {fmt(tc)} → {fmt(ticketWithMp)}</span>
              <span style={{ fontSize:14, fontWeight:700, color:GRN_TEXT }}>{fmt(ticketGrowthAnn)}</span>
            </div>
          ) : null}

          {/* Net impact — bottom of left col */}
          <div style={{ display:'flex', flexDirection:'row', padding:'12px 14px', backgroundColor:'#EEF1FF', borderRadius:8, flexShrink:0, marginTop:'auto' }}>
            <span style={{ flex:1, fontSize:14, fontWeight:700, color:GRAY8 }}>IMPACTO NETO ANUAL</span>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
              <span style={{ fontSize:20, fontWeight:700, color:nc }}>{fmt(netAnn)}</span>
              <span style={{ fontSize:13, color:GRAY5 }}>{fmt(netMonthly)}/mes</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN — Charts ─────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', flex:1, gap:16, overflow:'hidden' }}>

          {/* Section title + legend */}
          <div style={{ display:'flex', flexDirection:'row', alignItems:'flex-end', flexShrink:0 }}>
            <div style={{ display:'flex', flexDirection:'column', flex:1, gap:6 }}>
              <span style={{ fontSize:17, fontWeight:700, color:NAVY }}>COMPARATIVO DE TASAS — ACTUAL VS MERCADO PAGO</span>
              <div style={{ width:48, height:3, backgroundColor:YELL }} />
            </div>
            {/* Legend */}
            <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:16, marginBottom:4 }}>
              <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:6 }}>
                <div style={{ width:14, height:10, backgroundColor:GRAY_BAR, borderRadius:2 }} />
                <span style={{ fontSize:14, color:GRAY5 }}>Tasa actual</span>
              </div>
              <div style={{ display:'flex', flexDirection:'row', alignItems:'center', gap:6 }}>
                <div style={{ width:14, height:10, backgroundColor:GRN_BAR, borderRadius:2 }} />
                <span style={{ fontSize:14, color:GRAY5 }}>con MP</span>
              </div>
            </div>
          </div>

          {/* Chart(s) — fill remaining vertical space */}
          {hasOp && opRows.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', flex:1, gap:28 }}>
              <div style={{ display:'flex', flex:1, alignItems:'center' }}>
                <BarChart rows={ptRows} subtitle={`POINT / TERMINALES  ·  TPV ${fmt(tpv)}/mes`} maxBarH={240} />
              </div>
              <div style={{ height:1, backgroundColor:GRAY2, flexShrink:0 }} />
              <div style={{ display:'flex', flex:1, alignItems:'center' }}>
                <BarChart
                  rows={opRows}
                  subtitle={`ONLINE PAYMENTS  ·  TPV ${fmt(opTpv)}/mes`}
                  subtitle2={`Aprobación: ${n(opAcceptanceRateCurrent)}% → ${n(opAcceptanceRateMp)}%`}
                  maxBarH={240}
                />
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flex:1, alignItems:'center' }}>
              <BarChart rows={ptRows} subtitle={`POINT / TERMINALES  ·  TPV ${fmt(tpv)}/mes`} maxBarH={400} />
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{
        display:'flex', flexDirection:'row',
        padding:`8px ${PX}px`,
        borderTop:`1px solid ${GRAY2}`,
        flexShrink:0,
      }}>
        <span style={{ flex:1, fontSize:14, color:GRAY4 }}>Mercado Pago  ·  Propuesta de valor confidencial</span>
        <span style={{ fontSize:14, color:GRAY4 }}>{dateStr}</span>
      </div>

      {/* Bottom accent */}
      <div style={{ width:'100%', height:5, backgroundColor:YELL, flexShrink:0 }} />
    </div>
  )

  /* ─── Render: JSX → SVG → PNG → PDF ──────────────────────────────────── */
  // Node.js Buffer.buffer may have offset != 0; copy to a fresh ArrayBuffer
  function toAb(buf: Buffer): ArrayBuffer {
    const ab = new ArrayBuffer(buf.length)
    new Uint8Array(ab).set(buf)
    return ab
  }

  try {
    const svg = await satori(layout, {
      width: W,
      height: H,
      fonts: [
        { name:'Inter', data: toAb(fontReg),  weight:400, style:'normal' },
        { name:'Inter', data: toAb(fontBold), weight:700, style:'normal' },
      ],
    })

    const png = await sharp(Buffer.from(svg)).png().toBuffer()

    const pdfDoc  = await PDFDocument.create()
    const page    = pdfDoc.addPage([792, 612])
    const pngImg  = await pdfDoc.embedPng(png)
    page.drawImage(pngImg, { x:0, y:0, width:792, height:612 })
    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="business-case-${(clientName || 'client').replace(/\s+/g, '-')}.pdf"`,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message + '\n' + err.stack : String(err)
    return new NextResponse(msg, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}
