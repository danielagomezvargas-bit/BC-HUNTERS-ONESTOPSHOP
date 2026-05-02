import { NextRequest, NextResponse } from 'next/server'

// ─── POST /api/log ─────────────────────────────────────────────────────────────
// Appends a record to Airtable base appcm4BnunNpcCnJW / table BCS_Simulator_Log

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN ?? ''
const AIRTABLE_URL   = 'https://api.airtable.com/v0/appcm4BnunNpcCnJW/BCS_Simulator_Log'

interface LogPayload {
  // Client
  clientName: string; rfc?: string; industry?: string
  currentProvider?: string; hasSellerData?: string
  // TPV / ticket
  tpvMonthly?: string; opTpvMonthly?: string; ticketCurrent?: string
  // Results
  netAnnualized?: number; totalCommissionAnnual?: number
  buenFinIncrement?: number; hotSaleIncrement?: number; navidadIncrement?: number
  // Point payment mix (%)
  tdShare?: string; tcShare?: string; amexShare?: string
  msi3Share?: string; msi6Share?: string; msi9Share?: string
  msi12Share?: string; msi18Share?: string; msi24Share?: string
  tcIntShare?: string; tdIntShare?: string
  // Point current rates (%)
  tdCurrent?: string; tcCurrent?: string; amexCurrent?: string
  msi3Current?: string; msi6Current?: string; msi9Current?: string
  msi12Current?: string; msi18Current?: string; msi24Current?: string
  tcIntCurrent?: string; tdIntCurrent?: string
  // OP payment mix (%)
  opTdShare?: string; opTcShare?: string; opAmexShare?: string
  opMsi3Share?: string; opMsi6Share?: string; opMsi9Share?: string
  opMsi12Share?: string; opMsi18Share?: string; opMsi24Share?: string
  opTcIntShare?: string; opTdIntShare?: string
  // OP current rates (%)
  opTdCurrent?: string; opTcCurrent?: string; opAmexCurrent?: string
  opMsi3Current?: string; opMsi6Current?: string; opMsi9Current?: string
  opMsi12Current?: string; opMsi18Current?: string; opMsi24Current?: string
  opTcIntCurrent?: string; opTdIntCurrent?: string
  // Fixed costs
  deviceRentalMonthly?: string; deviceQuantity?: string; networkFeeMonthly?: string
}

const n = (v?: string) => parseFloat(v ?? '0') || 0

export async function POST(req: NextRequest) {
  try {
    const b: LogPayload = await req.json()

    if (!AIRTABLE_TOKEN) {
      return NextResponse.json({ ok: false, reason: 'no_token' }, { status: 200 })
    }

    await fetch(AIRTABLE_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [{
          fields: {
            Timestamp:           new Date().toISOString(),
            Cliente:             b.clientName          ?? '',
            RFC:                 b.rfc                 ?? '',
            Industria:           b.industry            ?? '',
            'Proveedor Actual':  b.currentProvider     ?? '',
            'Tiene Datos':       b.hasSellerData       ?? '',
            'TPV Point':         n(b.tpvMonthly),
            'TPV OP':            n(b.opTpvMonthly),
            Ticket:              n(b.ticketCurrent),
            'Neto Anualizado':   b.netAnnualized         ?? 0,
            'Comision Anual':    b.totalCommissionAnnual ?? 0,
            'Buen Fin':          b.buenFinIncrement      ?? 0,
            'Hot Sale':          b.hotSaleIncrement      ?? 0,
            Navidad:             b.navidadIncrement      ?? 0,
            // Point — mezcla
            'Mix TD Point':      n(b.tdShare),
            'Mix TC Point':      n(b.tcShare),
            'Mix AMEX Point':    n(b.amexShare),
            'Mix MSI3 Point':    n(b.msi3Share),
            'Mix MSI6 Point':    n(b.msi6Share),
            'Mix MSI9 Point':    n(b.msi9Share),
            'Mix MSI12 Point':   n(b.msi12Share),
            'Mix MSI18 Point':   n(b.msi18Share),
            'Mix MSI24 Point':   n(b.msi24Share),
            'Mix TC Int Point':  n(b.tcIntShare),
            'Mix TD Int Point':  n(b.tdIntShare),
            // Point — tasas proveedor actual
            'Tasa TD Point':     n(b.tdCurrent),
            'Tasa TC Point':     n(b.tcCurrent),
            'Tasa AMEX Point':   n(b.amexCurrent),
            'Tasa MSI3 Point':   n(b.msi3Current),
            'Tasa MSI6 Point':   n(b.msi6Current),
            'Tasa MSI9 Point':   n(b.msi9Current),
            'Tasa MSI12 Point':  n(b.msi12Current),
            'Tasa MSI18 Point':  n(b.msi18Current),
            'Tasa MSI24 Point':  n(b.msi24Current),
            'Tasa TC Int Point': n(b.tcIntCurrent),
            'Tasa TD Int Point': n(b.tdIntCurrent),
            // OP — mezcla
            'Mix TD OP':         n(b.opTdShare),
            'Mix TC OP':         n(b.opTcShare),
            'Mix AMEX OP':       n(b.opAmexShare),
            'Mix MSI3 OP':       n(b.opMsi3Share),
            'Mix MSI6 OP':       n(b.opMsi6Share),
            'Mix MSI9 OP':       n(b.opMsi9Share),
            'Mix MSI12 OP':      n(b.opMsi12Share),
            'Mix MSI18 OP':      n(b.opMsi18Share),
            'Mix MSI24 OP':      n(b.opMsi24Share),
            'Mix TC Int OP':     n(b.opTcIntShare),
            'Mix TD Int OP':     n(b.opTdIntShare),
            // OP — tasas proveedor actual
            'Tasa TD OP':        n(b.opTdCurrent),
            'Tasa TC OP':        n(b.opTcCurrent),
            'Tasa AMEX OP':      n(b.opAmexCurrent),
            'Tasa MSI3 OP':      n(b.opMsi3Current),
            'Tasa MSI6 OP':      n(b.opMsi6Current),
            'Tasa MSI9 OP':      n(b.opMsi9Current),
            'Tasa MSI12 OP':     n(b.opMsi12Current),
            'Tasa MSI18 OP':     n(b.opMsi18Current),
            'Tasa MSI24 OP':     n(b.opMsi24Current),
            'Tasa TC Int OP':    n(b.opTcIntCurrent),
            'Tasa TD Int OP':    n(b.opTdIntCurrent),
            // Costos fijos
            'Renta Device/mes':  n(b.deviceRentalMonthly),
            'Cantidad Devices':  n(b.deviceQuantity),
            'Pago Red/mes':      n(b.networkFeeMonthly),
          },
        }],
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[log] Airtable error:', err)
    return NextResponse.json({ ok: false, reason: String(err) }, { status: 200 })
  }
}
