// ─── Shared Types — Business Case Simulator ────────────────────

export type ProductoKey = "point" | "op";
export type SecKey = "pt" | "op";
export type StatusId = "por_definir" | "en_proceso" | "presentado" | "ganado" | "perdido" | "en_pausa";
export type MsiPlazo = "3x" | "6x" | "9x" | "12x" | "18x" | "24x";

// ── Paso 1 ──────────────────────────────────────────────────────
export interface Negocio {
  nombre: string;
  rfc: string;
  industria: string;
  logo: string | null;
  bdu: BDUResult | null;
}

export interface BDUResult {
  giro: string;
  tasa_debito: string;
  tasa_credito: string;
}

// ── Paso 2 ──────────────────────────────────────────────────────
export interface Productos {
  point: boolean;
  op: boolean;
}

// ── Paso 3 ──────────────────────────────────────────────────────
export interface ProvRow {
  rates: "si" | "no" | "";
  bank: string;
}

export type ProvData = Record<string, ProvRow>; // key: `${sec}_${idx}`
export type ProvCounts = { pt: number; op: number };

// ── Paso 4 — Share ──────────────────────────────────────────────
export interface ShareOT_PT {
  td: number; tc: number; amex: number; intl: number;
}
export interface ShareOT_OP {
  td: number; tc: number; amex: number; intl: number;
  oxxo: number; paycash: number; transfer: number; am: number;
}
export type ShareMSI = Record<MsiPlazo, number>;

export interface ShareState {
  tpv: number;
  ot: ShareOT_PT | ShareOT_OP;
  msi: ShareMSI;
  msiActive: Set<MsiPlazo>;
}

// ── Paso 5 — Comisiones ─────────────────────────────────────────
export interface ComOTRow {
  l: string;
  sh: number;
  cu: number; // tasa actual
  mp: number; // tasa MP
}

export interface ComMSIRow {
  l: string;
  sh: number;
  sb: number; // sobretasa actual
  sm: number; // sobretasa MP
}

// ── Paso 6 — Propuesta de valor ─────────────────────────────────
export type PalancaCategory = "producto" | "innovacion" | "marketing";

export interface PalancaSuboption {
  id: string;
  label: string;
  defaultPct: number;
}

export interface Palanca {
  id: string;
  label: string;
  desc?: string;
  icon: string;
  range: string;
  category?: PalancaCategory;
  suboptions?: PalancaSuboption[];
}

// ── Benchmark DB ─────────────────────────────────────────────────
export interface BenchmarkRecord {
  id: string;
  seller: string;
  rfc: string;
  industria: string;
  producto: "Point" | "Online Payments";
  proveedor: string;
  tpv: number;
  ticket: number;
  hunter: string;
  tasas: { td: number; tc: number; amex: number | null; intl: number | null };
  tasas_mp: { td: number | null; tc: number | null; amex: number | null; intl: number | null };
  msi: Record<MsiPlazo, { ba: number; sb: number } | null>;
  msi_mp: Record<MsiPlazo, { ba: number; sb: number } | null>;
  status: StatusId;
  fecha: string;
  updatedAt?: string;
  razon_perdida: string | null;
}
