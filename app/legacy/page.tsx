'use client'

import { useState, useCallback, useRef } from 'react'
import { Download, Upload, RefreshCw, ChevronDown, ChevronUp, Info, CreditCard, Presentation, FileText } from 'lucide-react'
import { INDUSTRIES, getSeasonality, getIndustryDefaults } from '@/lib/seasonality-data'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, CartesianGrid,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  clientName:    string
  rfc:           string
  currentProvider: string
  hasSellerData: 'yes' | 'no' | ''
  industry:      string
  // ── Point ──
  tpvMonthly:    string
  ticketCurrent: string
  // Point payment mix (%)
  tdShare: string; tcShare: string; amexShare: string
  msi3Share: string; msi6Share: string; msi9Share: string
  msi12Share: string; msi18Share: string; msi24Share: string
  // Point current commission rates (%)
  tdCurrent: string; tcCurrent: string; amexCurrent: string
  msi3Current: string; msi6Current: string; msi9Current: string
  msi12Current: string; msi18Current: string; msi24Current: string
  // Point MP rates (%)
  tdMp: string; tcMp: string; amexMp: string
  msi3Mp: string; msi6Mp: string; msi9Mp: string
  msi12Mp: string; msi18Mp: string; msi24Mp: string
  // Point — International cards (new)
  tcIntShare: string; tcIntCurrent: string; tcIntMp: string
  tdIntShare: string; tdIntCurrent: string; tdIntMp: string
  // Point — Fixed costs (new): Renta de Devices, Pago Fijo de Red
  deviceRentalMonthly: string
  deviceQuantity:      string
  networkFeeMonthly:   string
  // ── Online Payments (OP) ──
  opTpvMonthly:            string
  opAcceptanceRateCurrent: string
  opAcceptanceRateMp:      string
  // OP payment mix (%)
  opTdShare: string; opTcShare: string; opAmexShare: string
  opMsi3Share: string; opMsi6Share: string; opMsi9Share: string
  opMsi12Share: string; opMsi18Share: string; opMsi24Share: string
  // OP current commission rates (%)
  opTdCurrent: string; opTcCurrent: string; opAmexCurrent: string
  opMsi3Current: string; opMsi6Current: string; opMsi9Current: string
  opMsi12Current: string; opMsi18Current: string; opMsi24Current: string
  // OP MP rates (%)
  opTdMp: string; opTcMp: string; opAmexMp: string
  opMsi3Mp: string; opMsi6Mp: string; opMsi9Mp: string
  opMsi12Mp: string; opMsi18Mp: string; opMsi24Mp: string
  // OP — International cards (new)
  opTcIntShare: string; opTcIntCurrent: string; opTcIntMp: string
  opTdIntShare: string; opTdIntCurrent: string; opTdIntMp: string
  // ── Seasonality ──
  buenFinGrowth:   string
  hotSaleGrowth:   string
  navidadGrowth:   string
  ticketGrowthMp:  string
  // ── Branding ──
  clientLogoBase64: string
  clientLogoName:   string
}

const DEFAULT_FORM: FormState = {
  clientName: '', rfc: '', currentProvider: '', hasSellerData: 'yes', industry: '',
  // Point
  tpvMonthly: '7000000', ticketCurrent: '300',
  tdShare: '43', tcShare: '41', amexShare: '4',
  msi3Share: '10', msi6Share: '2', msi9Share: '0',
  msi12Share: '0', msi18Share: '0', msi24Share: '0',
  tdCurrent: '1.35', tcCurrent: '1.75', amexCurrent: '3.00',
  msi3Current: '0', msi6Current: '0', msi9Current: '0',
  msi12Current: '0', msi18Current: '0', msi24Current: '0',
  tdMp: '1.90', tcMp: '2.00', amexMp: '3.40',
  msi3Mp: '4.00', msi6Mp: '4.50', msi9Mp: '5.00',
  msi12Mp: '5.50', msi18Mp: '6.50', msi24Mp: '7.50',
  // Point — International cards
  tcIntShare: '0', tcIntCurrent: '0', tcIntMp: '3.60',
  tdIntShare: '0', tdIntCurrent: '0', tdIntMp: '2.50',
  // Point — Fixed costs
  deviceRentalMonthly: '0',
  deviceQuantity: '1',
  networkFeeMonthly: '0',
  // OP
  opTpvMonthly: '0',
  opAcceptanceRateCurrent: '80', opAcceptanceRateMp: '85',
  opTdShare: '40', opTcShare: '45', opAmexShare: '5',
  opMsi3Share: '8', opMsi6Share: '2', opMsi9Share: '0',
  opMsi12Share: '0', opMsi18Share: '0', opMsi24Share: '0',
  opTdCurrent: '1.35', opTcCurrent: '1.75', opAmexCurrent: '3.00',
  opMsi3Current: '0', opMsi6Current: '0', opMsi9Current: '0',
  opMsi12Current: '0', opMsi18Current: '0', opMsi24Current: '0',
  opTdMp: '1.90', opTcMp: '2.00', opAmexMp: '3.40',
  opMsi3Mp: '4.00', opMsi6Mp: '4.50', opMsi9Mp: '5.00',
  opMsi12Mp: '5.50', opMsi18Mp: '6.50', opMsi24Mp: '7.50',
  // OP — International cards
  opTcIntShare: '0', opTcIntCurrent: '0', opTcIntMp: '3.60',
  opTdIntShare: '0', opTdIntCurrent: '0', opTdIntMp: '2.50',
  // Seasonality
  buenFinGrowth: '40', hotSaleGrowth: '25', navidadGrowth: '55',
  ticketGrowthMp: '5',
  // Branding
  clientLogoBase64: '', clientLogoName: '',
}

// ─── Calculation engine ───────────────────────────────────────────────────────

function n(s: string): number {
  const v = parseFloat(s.replace(/,/g, ''))
  return isNaN(v) ? 0 : v
}
function pct(s: string): number { return n(s) / 100 }

interface CalcResult {
  // Point amounts & savings
  tdAmt: number; tcAmt: number; amexAmt: number
  msi3Amt: number; msi6Amt: number; msi9Amt: number
  msi12Amt: number; msi18Amt: number; msi24Amt: number
  tdSave: number; tcSave: number; amexSave: number
  msi3Save: number; msi6Save: number; msi9Save: number
  msi12Save: number; msi18Save: number; msi24Save: number
  // Point — International cards (new)
  tcIntAmt: number; tcIntSave: number
  tdIntAmt: number; tdIntSave: number
  // Point — Fixed costs (new)
  deviceRentalSave: number; networkFeeSave: number
  pointCommissionMonthly: number; pointCommissionAnnual: number
  totalShare: number
  // OP amounts & savings
  opEffectiveTpv: number
  opTdAmt: number; opTcAmt: number; opAmexAmt: number
  opMsi3Amt: number; opMsi6Amt: number; opMsi9Amt: number
  opMsi12Amt: number; opMsi18Amt: number; opMsi24Amt: number
  opTdSave: number; opTcSave: number; opAmexSave: number
  opMsi3Save: number; opMsi6Save: number; opMsi9Save: number
  opMsi12Save: number; opMsi18Save: number; opMsi24Save: number
  // OP — International cards (new)
  opTcIntAmt: number; opTcIntSave: number
  opTdIntAmt: number; opTdIntSave: number
  opCommissionMonthly: number; opCommissionAnnual: number
  opAcceptanceGainMonthly: number; opAcceptanceGainAnnual: number
  opTotalShare: number
  // Combined
  totalCommissionMonthly: number; totalCommissionAnnual: number
  // Ticket growth (Point)
  ticketWithMp: number; ticketGrowthMonthly: number
  // Seasonality (applied to combined TPV)
  combinedTpv: number
  buenFinIncrement: number; hotSaleIncrement: number; navidadIncrement: number
  growthAnnualized: number
  // Net
  netAnnualized: number; netMonthly: number
  // Seasonal commission savings (informational — not summed in total)
  seasonalCommSavings: number
}

function calculate(f: FormState): CalcResult {
  const tpv    = n(f.tpvMonthly)
  const tc     = n(f.ticketCurrent)
  const opTpv  = n(f.opTpvMonthly)

  // ── Point amounts ────────────────────────────────────────────────────────
  const tdAmt    = tpv * pct(f.tdShare)
  const tcAmt    = tpv * pct(f.tcShare)
  const amexAmt  = tpv * pct(f.amexShare)
  const msi3Amt  = tpv * pct(f.msi3Share)
  const msi6Amt  = tpv * pct(f.msi6Share)
  const msi9Amt  = tpv * pct(f.msi9Share)
  const msi12Amt = tpv * pct(f.msi12Share)
  const msi18Amt = tpv * pct(f.msi18Share)
  const msi24Amt = tpv * pct(f.msi24Share)

  const tdSave    = (pct(f.tdCurrent)   - pct(f.tdMp))   * tdAmt
  const tcSave    = (pct(f.tcCurrent)   - pct(f.tcMp))   * tcAmt
  const amexSave  = (pct(f.amexCurrent) - pct(f.amexMp)) * amexAmt
  const msi3Save  = ((pct(f.tcCurrent)+pct(f.msi3Current))  - (pct(f.tcMp)+pct(f.msi3Mp)))  * msi3Amt
  const msi6Save  = ((pct(f.tcCurrent)+pct(f.msi6Current))  - (pct(f.tcMp)+pct(f.msi6Mp)))  * msi6Amt
  const msi9Save  = ((pct(f.tcCurrent)+pct(f.msi9Current))  - (pct(f.tcMp)+pct(f.msi9Mp)))  * msi9Amt
  const msi12Save = ((pct(f.tcCurrent)+pct(f.msi12Current)) - (pct(f.tcMp)+pct(f.msi12Mp))) * msi12Amt
  const msi18Save = ((pct(f.tcCurrent)+pct(f.msi18Current)) - (pct(f.tcMp)+pct(f.msi18Mp))) * msi18Amt
  const msi24Save = ((pct(f.tcCurrent)+pct(f.msi24Current)) - (pct(f.tcMp)+pct(f.msi24Mp))) * msi24Amt

  // Point — International cards
  const tcIntAmt  = tpv * pct(f.tcIntShare)
  const tdIntAmt  = tpv * pct(f.tdIntShare)
  const tcIntSave = (pct(f.tcIntCurrent) - pct(f.tcIntMp)) * tcIntAmt
  const tdIntSave = (pct(f.tdIntCurrent) - pct(f.tdIntMp)) * tdIntAmt

  // Point — Fixed costs (saving = current monthly × quantity; MP = $0)
  const deviceRentalSave = n(f.deviceRentalMonthly) * Math.max(1, n(f.deviceQuantity))
  const networkFeeSave   = n(f.networkFeeMonthly)     // monthly saving (MP = $0)

  const pointCommissionMonthly = tdSave+tcSave+amexSave+msi3Save+msi6Save+msi9Save+msi12Save+msi18Save+msi24Save
                                + tcIntSave + tdIntSave + deviceRentalSave + networkFeeSave
  const pointCommissionAnnual  = pointCommissionMonthly * 12
  const totalShare = pct(f.tdShare)+pct(f.tcShare)+pct(f.amexShare)+
                     pct(f.msi3Share)+pct(f.msi6Share)+pct(f.msi9Share)+
                     pct(f.msi12Share)+pct(f.msi18Share)+pct(f.msi24Share)+
                     pct(f.tcIntShare)+pct(f.tdIntShare)

  // ── OP ───────────────────────────────────────────────────────────────────
  const accCur = pct(f.opAcceptanceRateCurrent)
  const accMp  = pct(f.opAcceptanceRateMp)
  // commissions apply to volume approved with MP rates
  const opEffectiveTpv = opTpv * accMp

  const opTdAmt    = opEffectiveTpv * pct(f.opTdShare)
  const opTcAmt    = opEffectiveTpv * pct(f.opTcShare)
  const opAmexAmt  = opEffectiveTpv * pct(f.opAmexShare)
  const opMsi3Amt  = opEffectiveTpv * pct(f.opMsi3Share)
  const opMsi6Amt  = opEffectiveTpv * pct(f.opMsi6Share)
  const opMsi9Amt  = opEffectiveTpv * pct(f.opMsi9Share)
  const opMsi12Amt = opEffectiveTpv * pct(f.opMsi12Share)
  const opMsi18Amt = opEffectiveTpv * pct(f.opMsi18Share)
  const opMsi24Amt = opEffectiveTpv * pct(f.opMsi24Share)

  const opTdSave    = (pct(f.opTdCurrent)   - pct(f.opTdMp))   * opTdAmt
  const opTcSave    = (pct(f.opTcCurrent)   - pct(f.opTcMp))   * opTcAmt
  const opAmexSave  = (pct(f.opAmexCurrent) - pct(f.opAmexMp)) * opAmexAmt
  const opMsi3Save  = ((pct(f.opTcCurrent)+pct(f.opMsi3Current))  - (pct(f.opTcMp)+pct(f.opMsi3Mp)))  * opMsi3Amt
  const opMsi6Save  = ((pct(f.opTcCurrent)+pct(f.opMsi6Current))  - (pct(f.opTcMp)+pct(f.opMsi6Mp)))  * opMsi6Amt
  const opMsi9Save  = ((pct(f.opTcCurrent)+pct(f.opMsi9Current))  - (pct(f.opTcMp)+pct(f.opMsi9Mp)))  * opMsi9Amt
  const opMsi12Save = ((pct(f.opTcCurrent)+pct(f.opMsi12Current)) - (pct(f.opTcMp)+pct(f.opMsi12Mp))) * opMsi12Amt
  const opMsi18Save = ((pct(f.opTcCurrent)+pct(f.opMsi18Current)) - (pct(f.opTcMp)+pct(f.opMsi18Mp))) * opMsi18Amt
  const opMsi24Save = ((pct(f.opTcCurrent)+pct(f.opMsi24Current)) - (pct(f.opTcMp)+pct(f.opMsi24Mp))) * opMsi24Amt

  // OP — International cards
  const opTcIntAmt  = opEffectiveTpv * pct(f.opTcIntShare)
  const opTdIntAmt  = opEffectiveTpv * pct(f.opTdIntShare)
  const opTcIntSave = (pct(f.opTcIntCurrent) - pct(f.opTcIntMp)) * opTcIntAmt
  const opTdIntSave = (pct(f.opTdIntCurrent) - pct(f.opTdIntMp)) * opTdIntAmt

  const opCommissionMonthly = opTdSave+opTcSave+opAmexSave+opMsi3Save+opMsi6Save+opMsi9Save+opMsi12Save+opMsi18Save+opMsi24Save
                             + opTcIntSave + opTdIntSave
  const opCommissionAnnual  = opCommissionMonthly * 12
  // Acceptance gain: extra revenue from higher approval rate
  const opAcceptanceGainMonthly = opTpv > 0 ? opTpv * (accMp - accCur) : 0
  const opAcceptanceGainAnnual  = opAcceptanceGainMonthly * 12
  const opTotalShare = pct(f.opTdShare)+pct(f.opTcShare)+pct(f.opAmexShare)+
                       pct(f.opMsi3Share)+pct(f.opMsi6Share)+pct(f.opMsi9Share)+
                       pct(f.opMsi12Share)+pct(f.opMsi18Share)+pct(f.opMsi24Share)+
                       pct(f.opTcIntShare)+pct(f.opTdIntShare)

  // ── Combined ─────────────────────────────────────────────────────────────
  const totalCommissionMonthly = pointCommissionMonthly + opCommissionMonthly
  const totalCommissionAnnual  = totalCommissionMonthly * 12

  // Ticket growth: histórico MP aumenta el ticket promedio, aplicado sobre el TPV actual
  // tc solo se usa para mostrar "$X → $Y con MP" — el incremento siempre = tpv × growth%
  const ticketWithMp        = tc * (1 + pct(f.ticketGrowthMp))
  const ticketGrowthMonthly = tpv * pct(f.ticketGrowthMp)

  // Seasonality applies to combined TPV (Point + OP effective)
  const combinedTpv = tpv + opEffectiveTpv
  const buenFinIncrement  = combinedTpv * pct(f.buenFinGrowth)
  const hotSaleIncrement  = combinedTpv * pct(f.hotSaleGrowth)
  const navidadIncrement  = combinedTpv * pct(f.navidadGrowth)

  const growthAnnualized = buenFinIncrement + hotSaleIncrement + navidadIncrement + ticketGrowthMonthly * 12
  const netAnnualized    = growthAnnualized + totalCommissionAnnual + opAcceptanceGainAnnual
  const netMonthly       = netAnnualized / 12

  // Commission savings on incremental seasonal TPV (informational)
  const totalSeasonalTpv = buenFinIncrement + hotSaleIncrement + navidadIncrement
  const seasonalCommSavings = combinedTpv > 0
    ? (totalCommissionMonthly / combinedTpv) * totalSeasonalTpv
    : 0

  return {
    tdAmt, tcAmt, amexAmt, msi3Amt, msi6Amt, msi9Amt, msi12Amt, msi18Amt, msi24Amt,
    tdSave, tcSave, amexSave, msi3Save, msi6Save, msi9Save, msi12Save, msi18Save, msi24Save,
    tcIntAmt, tcIntSave, tdIntAmt, tdIntSave, deviceRentalSave, networkFeeSave,
    pointCommissionMonthly, pointCommissionAnnual, totalShare,
    opEffectiveTpv, opTdAmt, opTcAmt, opAmexAmt,
    opMsi3Amt, opMsi6Amt, opMsi9Amt, opMsi12Amt, opMsi18Amt, opMsi24Amt,
    opTdSave, opTcSave, opAmexSave,
    opMsi3Save, opMsi6Save, opMsi9Save, opMsi12Save, opMsi18Save, opMsi24Save,
    opTcIntAmt, opTcIntSave, opTdIntAmt, opTdIntSave,
    opCommissionMonthly, opCommissionAnnual,
    opAcceptanceGainMonthly, opAcceptanceGainAnnual, opTotalShare,
    totalCommissionMonthly, totalCommissionAnnual,
    ticketWithMp, ticketGrowthMonthly,
    combinedTpv, buenFinIncrement, hotSaleIncrement, navidadIncrement,
    growthAnnualized, netAnnualized, netMonthly,
    seasonalCommSavings,
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtMXN(v: number, compact = false): string {
  if (compact) {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
    if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold text-mp-navy uppercase tracking-wider">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', prefix, suffix, hint, readOnly,
}: {
  label: string; value: string; onChange?: (v: string) => void
  type?: string; prefix?: string; suffix?: string; hint?: string; readOnly?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {hint && <span className="ml-1 text-[10px] text-gray-400">({hint})</span>}
      </label>
      <div className="flex items-center">
        {prefix && <span className="text-xs text-gray-500 mr-1.5">{prefix}</span>}
        <input
          type={type} value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mp-yellow/40 tabular-nums
            ${readOnly ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-default' : 'bg-white border-gray-200'}`}
        />
        {suffix && <span className="text-xs text-gray-500 ml-1.5">{suffix}</span>}
      </div>
    </div>
  )
}

function PaymentRow({
  label, share, onShare, current, onCurrent, mpRate, onMpRate, amount, saving,
}: {
  label: string; share: string; onShare: (v: string) => void
  current: string; onCurrent: (v: string) => void
  mpRate: string; onMpRate: (v: string) => void
  amount: number; saving: number
}) {
  const ahead = saving >= 0
  return (
    <div className="grid grid-cols-12 gap-2 items-center text-xs">
      <div className="col-span-2 font-semibold text-gray-700">{label}</div>
      <div className="col-span-2">
        <div className="flex items-center">
          <input type="number" value={share} onChange={(e) => onShare(e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-mp-yellow/40" />
          <span className="ml-1 text-gray-400">%</span>
        </div>
      </div>
      <div className="col-span-2 text-right text-gray-500 tabular-nums pr-2">{fmtMXN(amount, true)}</div>
      <div className="col-span-2">
        <div className="flex items-center">
          <input type="number" step="0.01" value={current} onChange={(e) => onCurrent(e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-mp-yellow/40" />
          <span className="ml-1 text-gray-400">%</span>
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center">
          <input type="number" step="0.01" value={mpRate} onChange={(e) => onMpRate(e.target.value)}
            className="w-full border border-blue-200 rounded px-2 py-1.5 text-center bg-blue-50 text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-300" />
          <span className="ml-1 text-blue-400">%</span>
        </div>
      </div>
      <div className={`col-span-2 text-right tabular-nums font-semibold ${ahead ? 'text-green-600' : 'text-red-500'}`}>
        {fmtMXN(saving, true)}
      </div>
    </div>
  )
}

function FixedCostRow({
  label, monthlyAmount, onMonthlyAmount, saving, quantity, onQuantity,
}: {
  label: string
  monthlyAmount: string
  onMonthlyAmount: (v: string) => void
  saving: number
  quantity?: string
  onQuantity?: (v: string) => void
}) {
  const qty = quantity !== undefined ? Math.max(1, parseFloat(quantity || '1') || 1) : 1
  return (
    <div className="grid grid-cols-12 gap-2 items-center text-xs">
      <div className="col-span-2 font-semibold text-gray-700">{label}</div>
      <div className="col-span-2 col-start-3">
        {quantity !== undefined && onQuantity ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => onQuantity(e.target.value)}
              placeholder="1"
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-mp-yellow/40"
            />
            <span className="text-gray-400 text-[10px] whitespace-nowrap">uds</span>
          </div>
        ) : (
          <span className="text-gray-300 text-[10px]">—</span>
        )}
      </div>
      <div className="col-span-2 text-right text-gray-500 tabular-nums pr-2">
        {/* amount = monthly × quantity */}
        {`$${(parseFloat(monthlyAmount || '0') * qty).toLocaleString('es-MX')}`}
      </div>
      <div className="col-span-2">
        <div className="flex items-center">
          <span className="text-xs text-gray-400 mr-1">$</span>
          <input
            type="number"
            value={monthlyAmount}
            onChange={(e) => onMonthlyAmount(e.target.value)}
            placeholder="0"
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-mp-yellow/40"
          />
          <span className="ml-1 text-gray-400 text-[10px]">/mes</span>
        </div>
      </div>
      <div className="col-span-2">
        <div className="flex items-center justify-center">
          <span className="text-xs text-blue-500 font-semibold">$0</span>
          <span className="ml-1 text-[10px] text-blue-400">(MP)</span>
        </div>
      </div>
      <div className={`col-span-2 text-right tabular-nums font-semibold ${saving >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {fmtMXN(saving, true)}
      </div>
    </div>
  )
}

function ResultCard({
  label, value, sub, highlight, color = 'default',
}: {
  label: string; value: string; sub?: string; highlight?: boolean
  color?: 'default' | 'green' | 'red' | 'yellow'
}) {
  const bg = highlight ? 'bg-mp-yellow border-mp-yellow'
    : color === 'green' ? 'bg-green-50 border-green-200'
    : color === 'red'   ? 'bg-red-50 border-red-200'
    : 'bg-white border-gray-100'
  const textColor = highlight ? 'text-mp-navy'
    : color === 'green' ? 'text-green-700'
    : color === 'red'   ? 'text-red-600'
    : 'text-gray-800'
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${bg}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${textColor}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [form, setForm]           = useState<FormState>(DEFAULT_FORM)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showOp, setShowOp]       = useState(false)
  const [generating, setGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = useCallback((key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  const applyIndustryDefaults = useCallback((_industry: string, _currentForm: FormState): Partial<FormState> => {
    const defaults = getIndustryDefaults(_industry)
    if (!defaults) return {}
    return {
      tpvMonthly:    String(defaults.tpvMonthly),
      ticketCurrent: String(defaults.ticketAvg),
      tdShare:       String(defaults.tdShare),
      tcShare:       String(defaults.tcShare),
      amexShare:     String(defaults.amexShare),
      msi3Share:     String(defaults.msi3Share),
      msi6Share:     String(defaults.msi6Share),
      msi9Share:     String(defaults.msi9Share),
      tcIntShare:    String(defaults.tcIntShare),
      tdIntShare:    String(defaults.tdIntShare),
    }
  }, [])

  const handleIndustryChange = (industry: string) => {
    const seas = getSeasonality(industry)
    setForm((f) => {
      const seasonPatch = {
        industry,
        buenFinGrowth:  String(seas.buenFin),
        hotSaleGrowth:  String(seas.hotSale),
        navidadGrowth:  String(seas.navidad),
      }
      if (f.hasSellerData === 'no') {
        const defaultsPatch = applyIndustryDefaults(industry, f)
        return { ...f, ...seasonPatch, ...defaultsPatch }
      }
      return { ...f, ...seasonPatch }
    })
  }

  const handleSellerDataToggle = (value: 'yes' | 'no') => {
    setForm((f) => {
      if (value === 'no' && f.industry) {
        const defaultsPatch = applyIndustryDefaults(f.industry, f)
        return { ...f, hasSellerData: value, ...defaultsPatch }
      }
      return { ...f, hasSellerData: value }
    })
  }

  const calc = calculate(form)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1] ?? ''
      setForm((f) => ({ ...f, clientLogoBase64: base64, clientLogoName: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const fireLog = useCallback(() => {
    const calc = calculate(form)
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Client
        clientName: form.clientName, rfc: form.rfc, industry: form.industry,
        currentProvider: form.currentProvider, hasSellerData: form.hasSellerData,
        // TPV / ticket
        tpvMonthly: form.tpvMonthly, opTpvMonthly: form.opTpvMonthly, ticketCurrent: form.ticketCurrent,
        // Results
        netAnnualized: calc.netAnnualized, totalCommissionAnnual: calc.totalCommissionAnnual,
        buenFinIncrement: calc.buenFinIncrement, hotSaleIncrement: calc.hotSaleIncrement, navidadIncrement: calc.navidadIncrement,
        // Point — mezcla
        tdShare: form.tdShare, tcShare: form.tcShare, amexShare: form.amexShare,
        msi3Share: form.msi3Share, msi6Share: form.msi6Share, msi9Share: form.msi9Share,
        msi12Share: form.msi12Share, msi18Share: form.msi18Share, msi24Share: form.msi24Share,
        tcIntShare: form.tcIntShare, tdIntShare: form.tdIntShare,
        // Point — tasas proveedor actual
        tdCurrent: form.tdCurrent, tcCurrent: form.tcCurrent, amexCurrent: form.amexCurrent,
        msi3Current: form.msi3Current, msi6Current: form.msi6Current, msi9Current: form.msi9Current,
        msi12Current: form.msi12Current, msi18Current: form.msi18Current, msi24Current: form.msi24Current,
        tcIntCurrent: form.tcIntCurrent, tdIntCurrent: form.tdIntCurrent,
        // OP — mezcla
        opTdShare: form.opTdShare, opTcShare: form.opTcShare, opAmexShare: form.opAmexShare,
        opMsi3Share: form.opMsi3Share, opMsi6Share: form.opMsi6Share, opMsi9Share: form.opMsi9Share,
        opMsi12Share: form.opMsi12Share, opMsi18Share: form.opMsi18Share, opMsi24Share: form.opMsi24Share,
        opTcIntShare: form.opTcIntShare, opTdIntShare: form.opTdIntShare,
        // OP — tasas proveedor actual
        opTdCurrent: form.opTdCurrent, opTcCurrent: form.opTcCurrent, opAmexCurrent: form.opAmexCurrent,
        opMsi3Current: form.opMsi3Current, opMsi6Current: form.opMsi6Current, opMsi9Current: form.opMsi9Current,
        opMsi12Current: form.opMsi12Current, opMsi18Current: form.opMsi18Current, opMsi24Current: form.opMsi24Current,
        opTcIntCurrent: form.opTcIntCurrent, opTdIntCurrent: form.opTdIntCurrent,
        // Costos fijos
        deviceRentalMonthly: form.deviceRentalMonthly, deviceQuantity: form.deviceQuantity,
        networkFeeMonthly: form.networkFeeMonthly,
      }),
    }).catch(() => { /* fire and forget */ })
  }, [form])

  const handleDownload = async () => {
    if (!form.clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente antes de generar.')
      return
    }
    fireLog()
    setGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al generar el archivo')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `BusinessCase_${form.clientName.replace(/\s+/g, '_')}_MercadoPago.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error al generar: ' + String(err))
    } finally {
      setGenerating(false)
    }
  }

  const [generatingPpt, setGeneratingPpt] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const handleDownloadPdf = async () => {
    if (!form.clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente antes de generar.')
      return
    }
    fireLog()
    setGeneratingPdf(true)
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al generar el PDF')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `BusinessCase_${form.clientName.replace(/\s+/g, '_')}_MercadoPago.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error al generar: ' + String(err))
    } finally {
      setGeneratingPdf(false)
    }
  }

  const handleDownloadPpt = async () => {
    if (!form.clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente antes de generar.')
      return
    }
    fireLog()
    setGeneratingPpt(true)
    try {
      const res = await fetch('/api/generate-ppt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al generar la presentación')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `BusinessCase_${form.clientName.replace(/\s+/g, '_')}_MercadoPago.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Error al generar: ' + String(err))
    } finally {
      setGeneratingPpt(false)
    }
  }

  const shareWarning   = Math.abs(calc.totalShare   - 1) > 0.001
  const opShareWarning = Math.abs(calc.opTotalShare - 1) > 0.001 && n(form.opTpvMonthly) > 0
  const hasOp = n(form.opTpvMonthly) > 0

  function n(s: string) { const v = parseFloat(s.replace(/,/g, '')); return isNaN(v) ? 0 : v }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1500px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mp-logo.png" alt="Mercado Pago" className="h-10 w-auto" />
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <p className="text-mp-navy font-semibold text-sm">Business Case Simulator</p>
              <p className="text-gray-400 text-xs">Genera propuestas de valor para clientes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf || !form.clientName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow"
            >
              {generatingPdf
                ? <><RefreshCw size={14} className="animate-spin" /> Generando…</>
                : <><FileText size={14} /> PDF</>
              }
            </button>
            <button
              onClick={handleDownloadPpt}
              disabled={generatingPpt || !form.clientName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-mp-navy text-white font-bold text-sm rounded-xl hover:bg-[#2A3191] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow"
            >
              {generatingPpt
                ? <><RefreshCw size={14} className="animate-spin" /> Generando…</>
                : <><Presentation size={14} /> PPT</>
              }
            </button>
            <button
              onClick={handleDownload}
              disabled={generating || !form.clientName.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-mp-yellow text-mp-navy font-bold text-sm rounded-xl hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow"
            >
              {generating
                ? <><RefreshCw size={14} className="animate-spin" /> Generando…</>
                : <><Download size={14} /> Excel</>
              }
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1500px] mx-auto px-6 py-6 grid grid-cols-5 gap-6">

        {/* ── LEFT: Form ───────────────────────────────────────────────────── */}
        <div className="col-span-3 space-y-5">

          {/* ── Seller data toggle ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-700">¿Cuentas con datos del seller?</span>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {(['yes', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleSellerDataToggle(v)}
                    className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                      form.hasSellerData === v
                        ? 'bg-mp-navy text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {v === 'yes' ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            {form.hasSellerData === 'no' && (
              <div className="mt-3 flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>Campos pre-llenados con benchmarks de industria Mercado Pago. Puedes editarlos.</span>
              </div>
            )}
          </div>

          {/* Client info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader title="Datos del cliente" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre del cliente *" value={form.clientName} onChange={set('clientName')} />
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Giro / Industria
                  <span className="ml-1 text-[10px] text-gray-400">(pre-llena estacionalidad)</span>
                </label>
                <select
                  value={form.industry}
                  onChange={(e) => handleIndustryChange(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mp-yellow/40 bg-white"
                >
                  <option value="">Selecciona una industria…</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* RFC + BDU giro badge */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  RFC <span className="text-gray-400">(Opcional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.rfc}
                    onChange={(e) => set('rfc')(e.target.value.toUpperCase())}
                    maxLength={13}
                    placeholder="XAXX010101000"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mp-yellow/40 font-mono uppercase"
                  />
                  {/* TODO: BDU integration — lookup giro by RFC and display here */}
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full whitespace-nowrap border border-gray-200">
                    Giro BDU: {form.rfc ? '…' : '—'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor Actual</label>
                <select
                  value={form.currentProvider}
                  onChange={(e) => set('currentProvider')(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mp-yellow/40 bg-white"
                >
                  <option value="">Selecciona proveedor…</option>
                  {[
                    'Banamex / Citibanamex', 'BBVA Bancomer', 'Santander', 'HSBC', 'Banorte',
                    'Scotiabank', 'Inbursa', 'Banco Azteca', 'BanBajío', 'Afirme',
                    'Clip', 'Conekta', 'OpenPay', 'Sr. Pago', 'iZettle / Zettle',
                    'PayPhone', 'Kushki', 'MIT (Multimedios de Transacción)', 'Prosa',
                    'E-Global', 'Fiserv', 'Getnet', 'Adyen', 'Stripe', 'PayPal', 'Otro',
                  ].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Logo del cliente</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-mp-yellow hover:text-mp-navy transition-colors"
              >
                <Upload size={15} />
                {form.clientLogoName ? form.clientLogoName : 'Subir logo (PNG, JPG)'}
              </button>
            </div>
          </div>

          {/* ── POINT section ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-mp-navy" />
              <h2 className="text-sm font-bold text-mp-navy uppercase tracking-wider">Point — Pagos presenciales</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <Field label="Venta mensual Point (TPV)" value={form.tpvMonthly} onChange={set('tpvMonthly')} prefix="$" hint="MXN" />
              <Field label="Ticket promedio actual" value={form.ticketCurrent} onChange={set('ticketCurrent')} prefix="$" hint="solo para mostrar $X→$Y con MP" />
            </div>

            <div className="grid grid-cols-12 gap-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              <div className="col-span-2">Medio</div>
              <div className="col-span-2 text-center">Share %</div>
              <div className="col-span-2 text-right pr-2">Monto</div>
              <div className="col-span-2 text-center">Comisión actual</div>
              <div className="col-span-2 text-center text-blue-500">Tasa MP</div>
              <div className="col-span-2 text-right">Ahorro/costo</div>
            </div>

            <div className="space-y-3">
              <PaymentRow label="TD"   share={form.tdShare}   onShare={set('tdShare')}
                current={form.tdCurrent}   onCurrent={set('tdCurrent')}
                mpRate={form.tdMp}         onMpRate={set('tdMp')}
                amount={calc.tdAmt}   saving={calc.tdSave} />
              <PaymentRow label="TC"   share={form.tcShare}   onShare={set('tcShare')}
                current={form.tcCurrent}   onCurrent={set('tcCurrent')}
                mpRate={form.tcMp}         onMpRate={set('tcMp')}
                amount={calc.tcAmt}   saving={calc.tcSave} />
              <PaymentRow label="AMEX" share={form.amexShare} onShare={set('amexShare')}
                current={form.amexCurrent} onCurrent={set('amexCurrent')}
                mpRate={form.amexMp}       onMpRate={set('amexMp')}
                amount={calc.amexAmt} saving={calc.amexSave} />

              <div className="border-t border-dashed border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">MSI — Meses sin intereses</p>
                <div className="space-y-2">
                  {[
                    { label: 'MSI 3',  share: form.msi3Share,  onShare: set('msi3Share'),  curr: form.msi3Current,  onCurr: set('msi3Current'),  mp: form.msi3Mp,  onMp: set('msi3Mp'),  amt: calc.msi3Amt,  sav: calc.msi3Save  },
                    { label: 'MSI 6',  share: form.msi6Share,  onShare: set('msi6Share'),  curr: form.msi6Current,  onCurr: set('msi6Current'),  mp: form.msi6Mp,  onMp: set('msi6Mp'),  amt: calc.msi6Amt,  sav: calc.msi6Save  },
                    { label: 'MSI 9',  share: form.msi9Share,  onShare: set('msi9Share'),  curr: form.msi9Current,  onCurr: set('msi9Current'),  mp: form.msi9Mp,  onMp: set('msi9Mp'),  amt: calc.msi9Amt,  sav: calc.msi9Save  },
                    { label: 'MSI 12', share: form.msi12Share, onShare: set('msi12Share'), curr: form.msi12Current, onCurr: set('msi12Current'), mp: form.msi12Mp, onMp: set('msi12Mp'), amt: calc.msi12Amt, sav: calc.msi12Save },
                    { label: 'MSI 18', share: form.msi18Share, onShare: set('msi18Share'), curr: form.msi18Current, onCurr: set('msi18Current'), mp: form.msi18Mp, onMp: set('msi18Mp'), amt: calc.msi18Amt, sav: calc.msi18Save },
                    { label: 'MSI 24', share: form.msi24Share, onShare: set('msi24Share'), curr: form.msi24Current, onCurr: set('msi24Current'), mp: form.msi24Mp, onMp: set('msi24Mp'), amt: calc.msi24Amt, sav: calc.msi24Save },
                  ].map((r) => (
                    <PaymentRow key={r.label} label={r.label}
                      share={r.share} onShare={r.onShare}
                      current={r.curr} onCurrent={r.onCurr}
                      mpRate={r.mp}   onMpRate={r.onMp}
                      amount={r.amt}  saving={r.sav} />
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Tarjetas Internacionales</p>
                <div className="space-y-2">
                  <PaymentRow label="TC Int." share={form.tcIntShare} onShare={set('tcIntShare')}
                    current={form.tcIntCurrent} onCurrent={set('tcIntCurrent')}
                    mpRate={form.tcIntMp}       onMpRate={set('tcIntMp')}
                    amount={calc.tcIntAmt}      saving={calc.tcIntSave} />
                  <PaymentRow label="TD Int." share={form.tdIntShare} onShare={set('tdIntShare')}
                    current={form.tdIntCurrent} onCurrent={set('tdIntCurrent')}
                    mpRate={form.tdIntMp}       onMpRate={set('tdIntMp')}
                    amount={calc.tdIntAmt}      saving={calc.tdIntSave} />
                </div>
              </div>

              <div className="border-t border-dashed border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Costos fijos (MP = $0)</p>
                <div className="space-y-2">
                  <FixedCostRow label="Renta Devices"
                    monthlyAmount={form.deviceRentalMonthly}
                    onMonthlyAmount={set('deviceRentalMonthly')}
                    quantity={form.deviceQuantity}
                    onQuantity={set('deviceQuantity')}
                    saving={calc.deviceRentalSave} />
                  <FixedCostRow label="Pago Fijo Red"
                    monthlyAmount={form.networkFeeMonthly}
                    onMonthlyAmount={set('networkFeeMonthly')}
                    saving={calc.networkFeeSave} />
                </div>
              </div>
            </div>

            {shareWarning && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                <Info size={13} />
                El share Point suma {(calc.totalShare * 100).toFixed(1)}% — debe ser 100%.
              </div>
            )}
          </div>

          {/* ── OP section (collapsible) ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowOp((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="text-sm font-bold text-mp-navy uppercase tracking-wider">Online Payments (OP)</h2>
                {hasOp && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                    {fmtMXN(n(form.opTpvMonthly), true)}/mes
                  </span>
                )}
              </div>
              {showOp ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showOp && (
              <div className="mt-5 space-y-5">
                {/* OP operation data */}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Venta mensual OP (TPV intentado)" value={form.opTpvMonthly}
                    onChange={set('opTpvMonthly')} prefix="$" hint="volumen total de intentos" />
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Acceptance rate actual
                      <span className="ml-1 text-[10px] text-gray-400">(% de pagos aprobados)</span>
                    </label>
                    <div className="flex items-center">
                      <input type="number" step="0.1" value={form.opAcceptanceRateCurrent}
                        onChange={(e) => set('opAcceptanceRateCurrent')(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-mp-yellow/40 tabular-nums" />
                      <span className="ml-1.5 text-xs text-gray-500">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Efectivo actual: {fmtMXN(n(form.opTpvMonthly) * n(form.opAcceptanceRateCurrent) / 100, true)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-600 mb-1">
                      Acceptance rate con MP
                      <span className="ml-1 text-[10px] text-blue-400">(tasa MP)</span>
                    </label>
                    <div className="flex items-center">
                      <input type="number" step="0.1" value={form.opAcceptanceRateMp}
                        onChange={(e) => set('opAcceptanceRateMp')(e.target.value)}
                        className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-blue-50 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 tabular-nums" />
                      <span className="ml-1.5 text-xs text-blue-400">%</span>
                    </div>
                    <p className="text-[10px] text-green-600 mt-1 font-semibold">
                      Ganancia aceptación: {fmtMXN(calc.opAcceptanceGainMonthly, true)}/mes
                    </p>
                  </div>
                </div>

                {/* OP mix headers */}
                <div>
                  <div className="grid grid-cols-12 gap-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    <div className="col-span-2">Medio</div>
                    <div className="col-span-2 text-center">Share %</div>
                    <div className="col-span-2 text-right pr-2">Monto</div>
                    <div className="col-span-2 text-center">Comisión actual</div>
                    <div className="col-span-2 text-center text-blue-500">Tasa MP</div>
                    <div className="col-span-2 text-right">Ahorro/costo</div>
                  </div>
                  <div className="space-y-3">
                    <PaymentRow label="TD"   share={form.opTdShare}   onShare={set('opTdShare')}
                      current={form.opTdCurrent}   onCurrent={set('opTdCurrent')}
                      mpRate={form.opTdMp}         onMpRate={set('opTdMp')}
                      amount={calc.opTdAmt}   saving={calc.opTdSave} />
                    <PaymentRow label="TC"   share={form.opTcShare}   onShare={set('opTcShare')}
                      current={form.opTcCurrent}   onCurrent={set('opTcCurrent')}
                      mpRate={form.opTcMp}         onMpRate={set('opTcMp')}
                      amount={calc.opTcAmt}   saving={calc.opTcSave} />
                    <PaymentRow label="AMEX" share={form.opAmexShare} onShare={set('opAmexShare')}
                      current={form.opAmexCurrent} onCurrent={set('opAmexCurrent')}
                      mpRate={form.opAmexMp}       onMpRate={set('opAmexMp')}
                      amount={calc.opAmexAmt} saving={calc.opAmexSave} />

                    <div className="border-t border-dashed border-gray-100 pt-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">MSI — Meses sin intereses</p>
                      <div className="space-y-2">
                        {[
                          { label: 'MSI 3',  share: form.opMsi3Share,  onShare: set('opMsi3Share'),  curr: form.opMsi3Current,  onCurr: set('opMsi3Current'),  mp: form.opMsi3Mp,  onMp: set('opMsi3Mp'),  amt: calc.opMsi3Amt,  sav: calc.opMsi3Save  },
                          { label: 'MSI 6',  share: form.opMsi6Share,  onShare: set('opMsi6Share'),  curr: form.opMsi6Current,  onCurr: set('opMsi6Current'),  mp: form.opMsi6Mp,  onMp: set('opMsi6Mp'),  amt: calc.opMsi6Amt,  sav: calc.opMsi6Save  },
                          { label: 'MSI 9',  share: form.opMsi9Share,  onShare: set('opMsi9Share'),  curr: form.opMsi9Current,  onCurr: set('opMsi9Current'),  mp: form.opMsi9Mp,  onMp: set('opMsi9Mp'),  amt: calc.opMsi9Amt,  sav: calc.opMsi9Save  },
                          { label: 'MSI 12', share: form.opMsi12Share, onShare: set('opMsi12Share'), curr: form.opMsi12Current, onCurr: set('opMsi12Current'), mp: form.opMsi12Mp, onMp: set('opMsi12Mp'), amt: calc.opMsi12Amt, sav: calc.opMsi12Save },
                          { label: 'MSI 18', share: form.opMsi18Share, onShare: set('opMsi18Share'), curr: form.opMsi18Current, onCurr: set('opMsi18Current'), mp: form.opMsi18Mp, onMp: set('opMsi18Mp'), amt: calc.opMsi18Amt, sav: calc.opMsi18Save },
                          { label: 'MSI 24', share: form.opMsi24Share, onShare: set('opMsi24Share'), curr: form.opMsi24Current, onCurr: set('opMsi24Current'), mp: form.opMsi24Mp, onMp: set('opMsi24Mp'), amt: calc.opMsi24Amt, sav: calc.opMsi24Save },
                        ].map((r) => (
                          <PaymentRow key={r.label} label={r.label}
                            share={r.share} onShare={r.onShare}
                            current={r.curr} onCurrent={r.onCurr}
                            mpRate={r.mp}    onMpRate={r.onMp}
                            amount={r.amt}   saving={r.sav} />
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-100 pt-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Tarjetas Internacionales</p>
                      <div className="space-y-2">
                        <PaymentRow label="TC Int." share={form.opTcIntShare} onShare={set('opTcIntShare')}
                          current={form.opTcIntCurrent} onCurrent={set('opTcIntCurrent')}
                          mpRate={form.opTcIntMp}       onMpRate={set('opTcIntMp')}
                          amount={calc.opTcIntAmt}      saving={calc.opTcIntSave} />
                        <PaymentRow label="TD Int." share={form.opTdIntShare} onShare={set('opTdIntShare')}
                          current={form.opTdIntCurrent} onCurrent={set('opTdIntCurrent')}
                          mpRate={form.opTdIntMp}       onMpRate={set('opTdIntMp')}
                          amount={calc.opTdIntAmt}      saving={calc.opTdIntSave} />
                      </div>
                    </div>
                  </div>

                  {opShareWarning && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                      <Info size={13} />
                      El share OP suma {(calc.opTotalShare * 100).toFixed(1)}% — debe ser 100%.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Seasonality (auto-populated from industry) ─────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              <div>
                <h2 className="text-sm font-bold text-mp-navy uppercase tracking-wider text-left">
                  Estacionalidad &amp; Crecimiento
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 text-left">
                  {form.industry ? `Pre-llenado con benchmarks de "${form.industry}"` : 'Selecciona industria para pre-llenar automáticamente'}
                </p>
              </div>
              {showAdvanced ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {showAdvanced && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Crecimiento Buen Fin vs mes promedio"
                  value={form.buenFinGrowth} onChange={set('buenFinGrowth')}
                  suffix="%" hint="nov, 1 vez al año" />
                <Field label="Crecimiento Hot Sale vs mes promedio"
                  value={form.hotSaleGrowth} onChange={set('hotSaleGrowth')}
                  suffix="%" hint="mayo-jun, 1 vez al año" />
                <Field label="Crecimiento Navidad vs mes promedio"
                  value={form.navidadGrowth} onChange={set('navidadGrowth')}
                  suffix="%" hint="dic, 1 vez al año" />
                <Field label="Incremento ticket promedio con MP"
                  value={form.ticketGrowthMp} onChange={set('ticketGrowthMp')}
                  suffix="%" hint="histórico ~5%" />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Results panel ─────────────────────────────────────────── */}
        <div className="col-span-2 space-y-5">

          {/* Headline */}
          <div className={`rounded-2xl p-6 shadow-md ${calc.netAnnualized >= 0 ? 'bg-mp-yellow' : 'bg-gray-800'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${calc.netAnnualized >= 0 ? 'text-mp-navy' : 'text-gray-400'}`}>
              Impacto neto anualizado con Mercado Pago
            </p>
            <p className={`text-4xl font-black tabular-nums ${calc.netAnnualized >= 0 ? 'text-mp-navy' : 'text-white'}`}>
              {fmtMXN(calc.netAnnualized, true)}
            </p>
            <p className={`text-sm mt-1 ${calc.netAnnualized >= 0 ? 'text-mp-navy/70' : 'text-gray-400'}`}>
              {fmtMXN(calc.netMonthly, true)} / mes
            </p>
            {form.clientName && (
              <p className={`text-xs mt-3 font-semibold ${calc.netAnnualized >= 0 ? 'text-mp-navy' : 'text-white'}`}>
                Para: {form.clientName}
              </p>
            )}
          </div>

          {/* Impact chart */}
          {(() => {
            const bars = [
              { name: 'Point',      value: calc.pointCommissionAnnual     },
              ...(hasOp ? [{ name: 'OP',          value: calc.opCommissionAnnual       }] : []),
              ...(hasOp && calc.opAcceptanceGainAnnual !== 0 ? [{ name: 'Acceptance',  value: calc.opAcceptanceGainAnnual   }] : []),
              ...(calc.ticketGrowthMonthly * 12 !== 0 ? [{ name: 'Ticket',      value: calc.ticketGrowthMonthly * 12 }] : []),
              ...(calc.buenFinIncrement !== 0 ? [{ name: 'Buen Fin',   value: calc.buenFinIncrement         }] : []),
              ...(calc.hotSaleIncrement !== 0 ? [{ name: 'Hot Sale',   value: calc.hotSaleIncrement         }] : []),
              ...(calc.navidadIncrement !== 0 ? [{ name: 'Navidad',    value: calc.navidadIncrement         }] : []),
            ].filter(b => Math.abs(b.value) > 0)
            if (bars.length === 0) return null

            const maxPos = Math.max(0, ...bars.filter(b => b.value >= 0).map(b => b.value))
            const maxNeg = Math.max(0, ...bars.filter(b => b.value < 0).map(b => Math.abs(b.value)))
            const maxAbs = Math.max(maxPos, maxNeg)

            // Green scale: small = #A5D6A7 (light, low opacity feel), large = #1B5E20 (dark intense)
            // Red scale:   small = #FFCDD2 (light), large = #B71C1C (dark intense)
            function barColor(value: number): string {
              const ratio = maxAbs > 0 ? Math.abs(value) / maxAbs : 0
              if (value >= 0) {
                // r: 165→27, g: 214→94, b: 167→32
                const r = Math.round(165 - (165 - 27)  * ratio)
                const g = Math.round(214 - (214 - 94)  * ratio)
                const b2 = Math.round(167 - (167 - 32) * ratio)
                return `rgb(${r},${g},${b2})`
              } else {
                // r: 255→183, g: 205→28, b: 210→28
                const r = Math.round(255 - (255 - 183) * ratio)
                const g2 = Math.round(205 - (205 - 28) * ratio)
                const b2 = Math.round(210 - (210 - 28) * ratio)
                return `rgb(${r},${g2},${b2})`
              }
            }

            const fmtTick = (v: number) => {
              const abs = Math.abs(v)
              if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
              if (abs >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
              return `$${v.toFixed(0)}`
            }

            const yMin = maxNeg > 0 ? -(maxNeg * 1.2) : 0
            const yMax = maxPos > 0 ? maxPos * 1.15 : maxNeg * 0.1

            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-bold text-mp-navy uppercase tracking-wider mb-4">Desglose del impacto anual</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bars} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtTick} tick={{ fontSize: 9, fill: '#999' }} axisLine={false} tickLine={false} domain={[yMin, yMax]} width={62} />
                    <Tooltip
                      formatter={(v) => [fmtMXN(Number(v ?? 0), true), 'Impacto anual']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '11px' }}
                      cursor={{ fill: '#F9FAFB' }}
                    />
                    <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1.5} />
                    <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                      {bars.map((b, i) => <Cell key={i} fill={barColor(b.value)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bars.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: barColor(b.value) }} />
                      <span className="text-[10px] text-gray-500">{b.name}: <span className="font-semibold" style={{ color: barColor(b.value) }}>{fmtMXN(b.value, true)}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Point + OP commission cards */}
          <div className="grid grid-cols-2 gap-3">
            <ResultCard
              label="Ahorro en Point / Terminales"
              value={fmtMXN(calc.pointCommissionMonthly, true)}
              sub={calc.pointCommissionMonthly >= 0 ? 'Ahorro vs proveedor actual' : 'Costo adicional vs proveedor actual'}
              color={calc.pointCommissionMonthly >= 0 ? 'green' : 'red'}
            />
            {hasOp ? (
              <ResultCard
                label="Ahorro en Online Payments (OP)"
                value={fmtMXN(calc.opCommissionMonthly, true)}
                sub={calc.opCommissionMonthly >= 0 ? 'Ahorro vs proveedor actual' : 'Costo adicional vs proveedor actual'}
                color={calc.opCommissionMonthly >= 0 ? 'green' : 'red'}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => setShowOp(true)}>
                <div className="text-center">
                  <CreditCard size={20} className="text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Agregar OP</p>
                </div>
              </div>
            )}
            <ResultCard
              label="Ahorro comisiones anualizadas"
              value={fmtMXN(calc.totalCommissionAnnual, true)}
              sub="Point + OP × 12 meses"
              color={calc.totalCommissionAnnual >= 0 ? 'green' : 'red'}
            />
            {hasOp ? (
              <ResultCard
                label="Ganancia acceptance OP"
                value={fmtMXN(calc.opAcceptanceGainAnnual, true)}
                sub={`${form.opAcceptanceRateCurrent}% → ${form.opAcceptanceRateMp}% aprobación`}
                color="green"
              />
            ) : (
              <ResultCard
                label="Crecimiento ticket (mes)"
                value={fmtMXN(calc.ticketGrowthMonthly, true)}
                sub={`$${n(form.ticketCurrent).toFixed(0)} → $${calc.ticketWithMp.toFixed(0)}`}
                color="green"
              />
            )}
          </div>

          {/* Seasonal commission savings — informational, not in total */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mb-1">
              Ahorro comisiones por crecimiento estacional
            </p>
            <p className="text-xl font-bold tabular-nums text-blue-700">{fmtMXN(calc.seasonalCommSavings, true)}</p>
            <p className="text-[10px] text-blue-400 mt-1">Ahorro adicional sobre TPV incremental de eventos · No incluido en el total</p>
          </div>

          {/* Seasonality breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-mp-navy uppercase tracking-wider mb-3">Estacionalidad</p>
            <div className="space-y-2">
              {[
                { label: 'Buen Fin',  value: calc.buenFinIncrement,  pct: form.buenFinGrowth,  hint: 'noviembre' },
                { label: 'Hot Sale',  value: calc.hotSaleIncrement,  pct: form.hotSaleGrowth,  hint: 'mayo-jun'  },
                { label: 'Navidad',   value: calc.navidadIncrement,  pct: form.navidadGrowth,  hint: 'diciembre' },
              ].map((ev) => (
                <div key={ev.label} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-700">{ev.label}</span>
                    <span className="ml-1.5 text-gray-400">+{ev.pct}% — {ev.hint}</span>
                  </div>
                  <span className="font-semibold text-green-600 tabular-nums">{fmtMXN(ev.value, true)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between text-xs font-bold">
                <span className="text-gray-500">Ticket growth ×12</span>
                <span className="text-green-600 tabular-nums">{fmtMXN(calc.ticketGrowthMonthly * 12, true)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-mp-navy">
                <span>Total crecimiento anual</span>
                <span className="tabular-nums">{fmtMXN(calc.growthAnnualized, true)}</span>
              </div>
            </div>
          </div>

          {/* Commission breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-mp-navy uppercase tracking-wider mb-3">Detalle comisiones — Point</p>
            <div className="space-y-2">
              {[
                { label: 'TD',     saving: calc.tdSave,    share: form.tdShare    },
                { label: 'TC',     saving: calc.tcSave,    share: form.tcShare    },
                { label: 'AMEX',   saving: calc.amexSave,  share: form.amexShare  },
                { label: 'MSI 3',  saving: calc.msi3Save,  share: form.msi3Share  },
                { label: 'MSI 6',  saving: calc.msi6Save,  share: form.msi6Share  },
                { label: 'MSI 9',  saving: calc.msi9Save,  share: form.msi9Share  },
                { label: 'MSI 12', saving: calc.msi12Save, share: form.msi12Share },
                { label: 'MSI 18', saving: calc.msi18Save, share: form.msi18Share },
                { label: 'MSI 24', saving: calc.msi24Save, share: form.msi24Share },
              ].filter((r) => parseFloat(r.share) > 0).map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium w-12">{row.label}</span>
                  <div className="flex-1 mx-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.saving >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(Math.abs(row.saving) / Math.max(Math.abs(calc.pointCommissionMonthly), 1) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`tabular-nums font-semibold w-20 text-right ${row.saving >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {fmtMXN(row.saving, true)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between text-xs font-bold">
                <span className="text-gray-700">Total mensual Point</span>
                <span className={calc.pointCommissionMonthly >= 0 ? 'text-green-700' : 'text-red-600'}>
                  {fmtMXN(calc.pointCommissionMonthly, true)}
                </span>
              </div>
            </div>

            {hasOp && (
              <>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mt-4 mb-3">Detalle comisiones — OP</p>
                <div className="space-y-2">
                  {[
                    { label: 'TD',     saving: calc.opTdSave,    share: form.opTdShare    },
                    { label: 'TC',     saving: calc.opTcSave,    share: form.opTcShare    },
                    { label: 'AMEX',   saving: calc.opAmexSave,  share: form.opAmexShare  },
                    { label: 'MSI 3',  saving: calc.opMsi3Save,  share: form.opMsi3Share  },
                    { label: 'MSI 6',  saving: calc.opMsi6Save,  share: form.opMsi6Share  },
                    { label: 'MSI 9',  saving: calc.opMsi9Save,  share: form.opMsi9Share  },
                    { label: 'MSI 12', saving: calc.opMsi12Save, share: form.opMsi12Share },
                    { label: 'MSI 18', saving: calc.opMsi18Save, share: form.opMsi18Share },
                    { label: 'MSI 24', saving: calc.opMsi24Save, share: form.opMsi24Share },
                  ].filter((r) => parseFloat(r.share) > 0).map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium w-12">{row.label}</span>
                      <div className="flex-1 mx-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.saving >= 0 ? 'bg-blue-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(Math.abs(row.saving) / Math.max(Math.abs(calc.opCommissionMonthly), 1) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`tabular-nums font-semibold w-20 text-right ${row.saving >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        {fmtMXN(row.saving, true)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 flex justify-between text-xs font-bold">
                    <span className="text-gray-700">Total mensual OP</span>
                    <span className={calc.opCommissionMonthly >= 0 ? 'text-blue-600' : 'text-red-600'}>
                      {fmtMXN(calc.opCommissionMonthly, true)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="bg-mp-navy rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Resumen del business case</p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-white/60">TPV Point mensual:</span>{' '}
                <span className="font-semibold tabular-nums">{fmtMXN(n(form.tpvMonthly), true)}/mes</span>
              </p>
              {hasOp && (
                <p>
                  <span className="text-white/60">TPV OP efectivo con MP:</span>{' '}
                  <span className="font-semibold tabular-nums text-blue-300">{fmtMXN(calc.opEffectiveTpv, true)}/mes</span>
                </p>
              )}
              <p>
                <span className="text-white/60">Crecimiento por eventos al año:</span>{' '}
                <span className="font-semibold tabular-nums text-mp-yellow">{fmtMXN(calc.growthAnnualized, true)}</span>
              </p>
              <p>
                <span className="text-white/60">Delta comisiones al año:</span>{' '}
                <span className={`font-semibold tabular-nums ${calc.totalCommissionAnnual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmtMXN(calc.totalCommissionAnnual, true)}
                </span>
              </p>
              {hasOp && (
                <p>
                  <span className="text-white/60">Ganancia acceptance OP al año:</span>{' '}
                  <span className="font-semibold tabular-nums text-blue-300">{fmtMXN(calc.opAcceptanceGainAnnual, true)}</span>
                </p>
              )}
              <div className="border-t border-white/20 pt-2">
                <p>
                  <span className="text-white/60">Impacto neto al año:</span>{' '}
                  <span className={`font-black tabular-nums text-base ${calc.netAnnualized >= 0 ? 'text-mp-yellow' : 'text-red-400'}`}>
                    {fmtMXN(calc.netAnnualized, true)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Download CTA */}
          <button
            onClick={handleDownload}
            disabled={generating || !form.clientName.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 bg-mp-yellow text-mp-navy font-bold text-base rounded-2xl hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {generating
              ? <><RefreshCw size={18} className="animate-spin" /> Generando Excel…</>
              : <><Download size={18} /> Descargar Business Case</>
            }
          </button>
          {!form.clientName.trim() && (
            <p className="text-center text-xs text-gray-400">Ingresa el nombre del cliente para habilitar la descarga</p>
          )}
        </div>
      </div>
    </div>
  )
}
