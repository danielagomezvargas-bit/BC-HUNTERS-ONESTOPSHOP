"use client";
import { useState, useRef } from "react";
import type { ComOTRow, ComMSIRow, Productos } from "@/types";

// ─── Design Tokens (matching ZIP reference exactly) ───────────────
const YEL      = "#FFE600";
const YEL_SOFT = "#FFF7B2";
const MP_BLUE  = "#00A8E1";
const DEEP     = "#2D3277";
const INK      = "#1A1A1A";
const INK_SOFT = "#4A4A4A";
const STRONG   = "#BDBDBD";
const LINE     = "#DADADA";
const G100     = "#EDEDED";
const G50      = "#F4F4F4";
const NA_C     = "#9A9A9A";
const WHITE    = "#FFFFFF";
const ESC_OP   = "#DCF1FB";   // OP escalón cell bg
const ESC_MSI  = "#E6E9F4";  // MSI escalón cell bg
const MSI_ROW  = "#F4F6FB";   // MSI data cell bg
const FONT     = "'Inter', system-ui, -apple-system, sans-serif";

// ─── Slide dimensions ────────────────────────────────────────────
const W = 1920;
const H = 1080;
// PREVIEW_W y SCALE se computan dinámicamente dentro del componente

// ─── Table shared styles ─────────────────────────────────────────
const T_STYLE: React.CSSProperties = {
  width: "100%", borderCollapse: "separate", borderSpacing: 0,
  tableLayout: "fixed", fontSize: 24, background: WHITE,
  lineHeight: 1.05,
  borderTop: `1px solid ${STRONG}`, borderLeft: `1px solid ${STRONG}`,
};
const CELL: React.CSSProperties = {
  borderRight: `1px solid ${STRONG}`, borderBottom: `1px solid ${STRONG}`,
  padding: "4px 12px", textAlign: "center", verticalAlign: "middle",
  height: 46, boxSizing: "border-box",
};
const TH_STYLE: React.CSSProperties = {
  ...CELL, background: WHITE, fontWeight: 600, color: INK,
  height: 76, lineHeight: 1.1, position: "relative",
};

// ─── Helpers ─────────────────────────────────────────────────────
const fmtRate = (n: number) => n.toFixed(2) + "%";
const fmtTPV  = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return Math.round(n / 1_000) + "K";
  return n.toLocaleString("es-MX");
};

// ─── Brand SVGs ──────────────────────────────────────────────────
const SvgVisaMC = () => (
  <svg viewBox="0 0 130 40" height={34} style={{ display: "block" }} aria-hidden>
    <text x="0" y="27" fontFamily="sans-serif" fontWeight={800} fontSize={25} fontStyle="italic" fill="#1A1F71">VISA</text>
    <circle cx="88" cy="20" r="12" fill="#EB001B"/>
    <circle cx="107" cy="20" r="12" fill="#F79E1B"/>
    <path d="M97.5 10a12 12 0 0 0 0 20 12 12 0 0 0 0-20z" fill="#FF5F00"/>
  </svg>
);
const SvgAmex = () => (
  <svg viewBox="0 0 110 44" height={34} style={{ display: "block" }} aria-hidden>
    <rect x="4" y="3" width="102" height="38" rx="4" fill="#2E77BB"/>
    <text x="55" y="30" textAnchor="middle" fontFamily="sans-serif" fontWeight={800} fontSize={22} fill="#fff" letterSpacing={2}>AMEX</text>
  </svg>
);
const SvgDebit = () => (
  <svg viewBox="0 0 64 40" height={34} style={{ display: "block" }} aria-hidden>
    <rect x="4" y="6" width="56" height="28" rx="3" fill="#fff" stroke="#1A1A1A" strokeWidth={1.8}/>
    <rect x="4" y="13" width="56" height="5" fill="#1A1A1A"/>
    <rect x="10" y="24" width="16" height="5" rx={1} fill="#1A1A1A"/>
  </svg>
);
const SvgVales = () => (
  <svg viewBox="0 0 130 44" height={34} style={{ display: "block" }} aria-hidden>
    <rect x="4" y="3" width="122" height="38" rx="4" fill={MP_BLUE}/>
    <text x="65" y="29" textAnchor="middle" fontFamily="sans-serif" fontWeight={800} fontSize={22} fill="#fff" letterSpacing={1}>VALES</text>
  </svg>
);
const SvgIntl = () => (
  <svg viewBox="0 0 64 40" height={34} style={{ display: "block" }} aria-hidden>
    <circle cx="32" cy="20" r="14" fill="none" stroke={INK} strokeWidth={1.8}/>
    <path d="M32 6v28M18 20h28M25 9c-4 7-4 16 0 22M39 9c4 7 4 16 0 22" stroke={INK} strokeWidth={1.5} fill="none"/>
  </svg>
);
const SvgAmexIntl = () => (
  <svg viewBox="0 0 136 44" height={34} style={{ display: "block" }} aria-hidden>
    <rect x="4" y="3" width="82" height="38" rx="4" fill="#2E77BB"/>
    <text x="45" y="29" textAnchor="middle" fontFamily="sans-serif" fontWeight={800} fontSize={19} fill="#fff" letterSpacing={1}>AMEX</text>
    <circle cx="118" cy="22" r="13" fill="none" stroke={INK} strokeWidth={1.5}/>
    <path d="M118 9v26M105 22h26M111 11c-3 6-3 16 0 22M125 11c3 6 3 16 0 22" stroke={INK} strokeWidth={1.3} fill="none"/>
  </svg>
);
const SvgPayCash = () => (
  <svg viewBox="0 0 130 44" height={34} style={{ display: "block" }} aria-hidden>
    <text x="4" y="30" fontFamily="sans-serif" fontWeight={800} fontSize={22} fontStyle="italic" fill="#E10915">Pay</text>
    <text x="54" y="30" fontFamily="sans-serif" fontWeight={800} fontSize={22} fontStyle="italic" fill="#003366">Cash</text>
  </svg>
);
const SvgTransfer = () => (
  <svg viewBox="0 0 64 44" height={34} style={{ display: "block" }} aria-hidden>
    <rect x="6" y="10" width="52" height="26" rx="3" fill="#fff" stroke={INK} strokeWidth={1.8}/>
    <path d="M6 16l26 14 26-14" stroke={INK} strokeWidth={1.5} fill="none" strokeLinejoin="round"/>
    <path d="M44 4l8 6-8 6M52 10H36" stroke={MP_BLUE} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SvgCuenta = () => (
  <svg viewBox="0 0 44 34" height={34} style={{ display: "block" }} aria-hidden>
    {/* Wallet body */}
    <rect x="2" y="6" width="40" height="24" rx="4" fill="#26B6E2"/>
    {/* Wallet flap */}
    <rect x="2" y="4" width="24" height="8" rx="3" fill="#1A9EC9"/>
    {/* Coin slot */}
    <rect x="28" y="14" width="12" height="10" rx="3" fill="#fff" opacity="0.18"/>
    {/* Coin */}
    <circle cx="34" cy="19" r="3.5" fill="#FFE600"/>
    {/* Money lines */}
    <rect x="7" y="20" width="14" height="2.5" rx="1.2" fill="#fff" opacity="0.55"/>
    <rect x="7" y="24" width="10" height="2" rx="1" fill="#fff" opacity="0.35"/>
  </svg>
);

// ─── Column definitions ──────────────────────────────────────────
interface ColDef { id: string; label: React.ReactNode; logo: React.ReactNode; comboLabel: React.ReactNode }

const PT_COLS: ColDef[] = [
  { id: "tc",            label: "TC",            logo: <SvgVisaMC/>,   comboLabel: "TC"       },
  { id: "amex",          label: "Amex",          logo: <SvgAmex/>,     comboLabel: "Amex"     },
  { id: "debito",        label: "TD",            logo: <SvgDebit/>,    comboLabel: "TD"       },
  { id: "vales",         label: "Valeras",       logo: <SvgVales/>,    comboLabel: "Valeras"  },
  { id: "internacional", label: "Internacional", logo: <SvgIntl/>,     comboLabel: "Int."     },
];
const OP_COLS: ColDef[] = [
  { id: "tc",         label: "TC",                              logo: <SvgVisaMC/>,    comboLabel: "TC"        },
  { id: "amex_intl",  label: "AMEX y TC Int",                  logo: <SvgAmexIntl/>,  comboLabel: "Amex+Intl" },
  { id: "debito",     label: "TD",                             logo: <SvgDebit/>,     comboLabel: "TD"        },
  { id: "paycash",    label: "Efectivo",                       logo: <SvgPayCash/>,   comboLabel: "Efectivo"  },
  { id: "transfer",   label: "Depósitos y transferencia",      logo: <SvgTransfer/>,  comboLabel: "Dep/Trans" },
  { id: "cuenta_mp",  label: "Dinero en cuenta / Mercado Crédito", logo: <SvgCuenta/>, comboLabel: "Cta.MP"  },
];
const MSI_COLS = [
  { id: "msi3", label: "3x" }, { id: "msi6", label: "6x" }, { id: "msi9", label: "9x" },
  { id: "msi12", label: "12x" }, { id: "msi18", label: "18x" }, { id: "msi24", label: "24x" },
];

// Wizard label → slide column id
const PT_MAP: Record<string, string> = {
  "tc": "T. Crédito", "amex": "AMEX", "debito": "T. Débito",
  "vales": "", "internacional": "Internacional",
};
const OP_MAP: Record<string, string> = {
  "tc": "T. Crédito", "amex_intl": "AMEX", "debito": "T. Débito",
  "paycash": "Red PayCash", "transfer": "Dep. y Transf.", "cuenta_mp": "AM & MP Crédito",
};
const MSI_PLAZO_MAP: Record<string, string> = {
  "msi3": "3x", "msi6": "6x", "msi9": "9x",
  "msi12": "12x", "msi18": "18x", "msi24": "24x",
};

// ─── Props ───────────────────────────────────────────────────────
export interface SlideModalProps {
  open: boolean;
  onClose: () => void;
  empresa: string;
  rubro?: string;
  sellerLogo?: string | null;
  productos: Productos;
  comPT_OT:  ComOTRow[];
  comPT_MSI: ComMSIRow[];
  tpvPT: number;
  comOP_OT:  ComOTRow[];
  comOP_MSI: ComMSIRow[];
  tpvOP: number;
}

// ─── Derived rate data ───────────────────────────────────────────
interface RateData {
  ptRates: Record<string, string>;
  opRates: Record<string, string>;
  ptMsiRates: Record<string, string>;
  opMsiRates: Record<string, string>;
}
function deriveRates(
  comPT_OT: ComOTRow[], comPT_MSI: ComMSIRow[],
  comOP_OT: ComOTRow[], comOP_MSI: ComMSIRow[],
): RateData {
  const ptRates: Record<string, string> = {};
  for (const c of PT_COLS) {
    const wl = PT_MAP[c.id];
    const row = wl ? comPT_OT.find(r => r.l === wl) : null;
    ptRates[c.id] = row ? fmtRate(row.mp) : "NA";
  }
  const opRates: Record<string, string> = {};
  for (const c of OP_COLS) {
    const wl = OP_MAP[c.id];
    const row = wl ? comOP_OT.find(r => r.l === wl) : null;
    opRates[c.id] = row ? fmtRate(row.mp) : "NA";
  }
  const buildMsiRates = (src: ComMSIRow[]) => {
    const m: Record<string, string> = {};
    for (const c of MSI_COLS) {
      const row = src.find(r => r.l === MSI_PLAZO_MAP[c.id]);
      m[c.id] = row ? fmtRate(row.sm) : "—";
    }
    return m;
  };
  return {
    ptRates, opRates,
    ptMsiRates: buildMsiRates(comPT_MSI),
    opMsiRates: buildMsiRates(comOP_MSI),
  };
}

// ─── Delete state ────────────────────────────────────────────────
interface DelState {
  ptRow: boolean; opRow: boolean; msiRow: boolean;
  ptCols: Set<string>; opCols: Set<string>; msiCols: Set<string>;
  ptBullets: Set<string>; opBullets: Set<string>; comboBullets: Set<string>;
  ptIncluye: Set<string>; opIncluye: Set<string>; comboIncluye: Set<string>;
}
const emptyDel = (): DelState => ({
  ptRow: false, opRow: false, msiRow: false,
  ptCols: new Set(), opCols: new Set(), msiCols: new Set(),
  ptBullets: new Set(), opBullets: new Set(), comboBullets: new Set(),
  ptIncluye: new Set(), opIncluye: new Set(), comboIncluye: new Set(),
});

// ─── Editable span ───────────────────────────────────────────────
function E({ children, edit, style }: { children: React.ReactNode; edit: boolean; style?: React.CSSProperties }) {
  return (
    <span
      contentEditable={edit}
      suppressContentEditableWarning
      className={edit ? "mp-e" : undefined}
      style={{
        borderRadius: 3, outline: "none", display: "inline",
        transition: "background .12s, box-shadow .12s",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ─── Delete (×) button ────────────────────────────────────────────
function XBtn({ top, left, right, bottom, transform, onClick }: {
  top?: number | string; left?: number | string; right?: number | string; bottom?: number | string;
  transform?: string;
  onClick: () => void;
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", top, left, right, bottom,
        transform,
        width: 28, height: 28, borderRadius: "50%",
        background: WHITE, border: `1px solid ${STRONG}`,
        color: "#666", fontSize: 17, lineHeight: "24px",
        cursor: "pointer", zIndex: 20, padding: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 1px 2px rgba(0,0,0,.1)",
      }}
    >×</button>
  );
}

// ─── Rate cell ────────────────────────────────────────────────────
function RateCell({ val, edit, extra }: { val: string; edit: boolean; extra?: React.CSSProperties }) {
  const isNA   = val === "NA";
  const isDash = val === "—" || val === "-";
  return (
    <td style={{ ...CELL, color: isNA || isDash ? NA_C : INK, fontWeight: isNA || isDash ? 600 : 400, ...extra }}>
      <E edit={edit}>{val}</E>
    </td>
  );
}

// ─── Base Table (Point or OP) ──────────────────────────────────────
function BaseTable({ kind, cols, rates, escalon, edit, delCols, onDelCol, delRow, onDelRow, isCombo }: {
  kind: "point" | "op";
  cols: ColDef[];
  rates: Record<string, string>;
  escalon: string;
  edit: boolean;
  delCols: Set<string>;
  onDelCol: (id: string) => void;
  delRow: boolean;
  onDelRow: () => void;
  isCombo?: boolean;
}) {
  const visibleCols = cols.filter(c => !delCols.has(c.id));
  const escBg = kind === "point" ? YEL : MP_BLUE;
  const escFg = kind === "point" ? INK : WHITE;
  const escCellBg = kind === "point" ? YEL : ESC_OP;
  const escCellFg = kind === "point" ? INK : DEEP;
  const colW = isCombo ? 130 : 240;
  const headEscLabel = isCombo ? "Mín." : "Procesamiento Mín";

  return (
    <table style={{ ...T_STYLE, fontSize: isCombo ? 20 : 24 }}>
      <colgroup>
        <col style={{ width: colW }}/>
        {visibleCols.map(c => <col key={c.id}/>)}
      </colgroup>
      <thead>
        <tr>
          <th style={{ ...CELL, background: escBg, color: escFg, fontWeight: 800, height: isCombo ? 66 : 76, maxHeight: isCombo ? 66 : 76, overflow: "hidden" }}>
            <E edit={edit}>{headEscLabel}</E>
          </th>
          {visibleCols.map(c => (
            <th key={c.id} style={{ ...TH_STYLE, height: isCombo ? 66 : 76, maxHeight: isCombo ? 66 : 76, overflow: "hidden" }}>
              {edit && (
                <XBtn top={-14} right={6} onClick={() => onDelCol(c.id)}/>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minHeight: isCombo ? 50 : 60, justifyContent: "center" }}>
                {c.logo}
                <div style={{ fontSize: isCombo ? 18 : 22, color: INK_SOFT, fontWeight: 600, letterSpacing: ".04em" }}>
                  <E edit={edit}>{isCombo ? c.comboLabel : c.label}</E>
                </div>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!delRow && (
          <tr>
            <td style={{ ...CELL, background: escCellBg, color: escCellFg, fontWeight: 700, fontSize: isCombo ? 20 : 24, textTransform: "uppercase", letterSpacing: ".04em", position: "relative" }}>
              {edit && <XBtn left={-36} top="50%" onClick={onDelRow} transform="translateY(-50%)"/>}
              <E edit={edit}>{escalon}</E>
            </td>
            {visibleCols.map(c => (
              <RateCell key={c.id} val={rates[c.id] ?? "NA"} edit={edit}/>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ─── MSI Table ───────────────────────────────────────────────────
function MSITable({ msiRates, edit, delCols, onDelCol, delRow, onDelRow, isCombo }: {
  msiRates: Record<string, string>;
  edit: boolean;
  delCols: Set<string>;
  onDelCol: (id: string) => void;
  delRow: boolean;
  onDelRow: () => void;
  isCombo?: boolean;
}) {
  const visCols = MSI_COLS.filter(c => !delCols.has(c.id));
  return (
    <table style={{ ...T_STYLE, fontSize: isCombo ? 20 : 24 }}>
      <colgroup>
        <col style={{ width: isCombo ? 130 : 240 }}/>
        {visCols.map(c => <col key={c.id}/>)}
      </colgroup>
      <thead>
        <tr>
          <th style={{ ...CELL, background: DEEP, color: WHITE, fontWeight: 800, height: isCombo ? 52 : 64 }}>
            <E edit={edit}>Tramo</E>
          </th>
          {visCols.map(c => (
            <th key={c.id} style={{ ...TH_STYLE, height: isCombo ? 52 : 64, background: WHITE }}>
              {edit && <XBtn top={-14} right={6} onClick={() => onDelCol(c.id)}/>}
              <E edit={edit} style={{ fontWeight: 700, fontSize: isCombo ? 20 : 26, letterSpacing: ".02em" }}>
                {c.label}
              </E>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!delRow && (
          <tr>
            <td style={{ ...CELL, background: ESC_MSI, color: DEEP, fontWeight: 700, position: "relative" }}>
              {edit && <XBtn left={-36} top="50%" onClick={onDelRow} transform="translateY(-50%)"/>}
              <E edit={edit}>Sobretasa</E>
            </td>
            {visCols.map(c => (
              <RateCell key={c.id} val={msiRates[c.id] ?? "—"} edit={edit}
                extra={{ background: MSI_ROW }} />
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ─── Slide Header ────────────────────────────────────────────────
function SlideHead({ slideType, cliente, sellerLogo, edit, isCombo }: {
  slideType: "point" | "op" | "combo";
  cliente: string;
  sellerLogo?: string | null;
  edit: boolean;
  isCombo?: boolean;
}) {
  const subLabels: Record<string, string> = {
    point: "Terminales Punto de Venta",
    op:    "Pagos Online · Checkout Mercado Pago",
    combo: "Solución integral · Terminales Point + Pagos Online",
  };
  const headPad = isCombo ? "40px 88px 0 122px" : "56px 88px 0 122px";
  const h1Size  = isCombo ? 42 : 48;
  const subSize = isCombo ? 24 : 30;
  return (
    <div style={{ padding: headPad, position: "relative" }}>
      <h1 style={{ margin: 0, fontWeight: 800, fontSize: h1Size, letterSpacing: "-0.01em", color: INK, lineHeight: 1.05, fontFamily: FONT }}>
        Propuesta Comercial — <E edit={edit} style={{ display: "inline" }}>{cliente}</E>
      </h1>
      <div style={{ marginTop: 10, fontSize: subSize, color: INK_SOFT, fontWeight: 400, fontFamily: FONT }}>
        <E edit={edit}>{subLabels[slideType]}</E>
      </div>
    </div>
  );
}

// ─── Footer bullet list ──────────────────────────────────────────
function FootBullets({ items, edit, deleted, onDelete }: {
  items: { id: string; content: React.ReactNode }[];
  edit: boolean;
  deleted: Set<string>;
  onDelete: (id: string) => void;
}) {
  return (
    <ul style={{ margin: 0, padding: "0 0 0 22px", fontSize: 24, lineHeight: 1.3, color: INK, fontFamily: FONT }}>
      {items.filter(it => !deleted.has(it.id)).map(it => (
        <li key={it.id} style={{ marginBottom: 4, position: "relative" }}>
          {edit && <XBtn left={-32} top={4} onClick={() => onDelete(it.id)}/>}
          {it.content}
        </li>
      ))}
    </ul>
  );
}

// ─── Slide Footer ────────────────────────────────────────────────
function SlideFooter({ slideType, cliente, rubro, tpvLabel, edit, deletedBullets, onDeleteBullet, deletedIncluye, onDeleteIncluye, isCombo }: {
  slideType: "point" | "op" | "combo";
  cliente: string;
  rubro: string;
  tpvLabel: string;
  edit: boolean;
  deletedBullets: Set<string>;
  onDeleteBullet: (id: string) => void;
  deletedIncluye: Set<string>;
  onDeleteIncluye: (id: string) => void;
  isCombo?: boolean;
}) {
  const footPad = isCombo ? "24px 88px 28px 122px" : "36px 88px 44px 122px";
  const h3s = isCombo ? 20 : 24;
  const uls = isCombo ? 20 : 24;

  const datosBullets = [
    { id: "tpv",   content: <>TPV Esperado promedio $<E edit={edit}>{tpvLabel}</E> MXN mensuales</> },
    { id: "ticket",content: <>Ticket promedio $<E edit={edit}>—</E></> },
    {
      id: "mix",
      content: (
        <>Mix nacional:
          <ul style={{ paddingLeft: 28, marginTop: 6, fontSize: uls, lineHeight: 1.3 }}>
            {[
              { id: "mix-td",   label: "Débito" },
              { id: "mix-tc",   label: "Crédito 1 pago" },
              { id: "mix-amex", label: "Amex" },
              { id: "mix-msi",  label: "MSI" },
            ].filter(b => !deletedBullets.has(b.id)).map(b => (
              <li key={b.id} style={{ marginBottom: 4, position: "relative", listStyle: "none" }}
                  className="dash">
                <span style={{ marginRight: 4 }}>–</span>
                {edit && <XBtn left={-32} top={4} onClick={() => onDeleteBullet(b.id)}/>}
                {b.label}: <E edit={edit}>0</E>%
              </li>
            ))}
          </ul>
        </>
      ),
    },
    { id: "intl",  content: <>Tarjetas internacionales: <E edit={edit}>0</E>%</> },
    { id: "rubro", content: <>Rubro: <E edit={edit}>{rubro}</E></> },
    { id: "sujeto",content: <strong>Sujeto a transacción real</strong> },
  ];

  const includePT = [
    { id: "terminals", content: <>Terminales <strong>Point Smart</strong> sin costo</> },
    { id: "promotions",content: <>En Buen Fin y Hot Sale promociones bancarias acordadas.</> },
    { id: "approval",  content: <>Propuesta sujeta a aprobación comercial.</> },
  ];
  const includeOP = [
    { id: "checkout",  content: <>Integración <strong>Checkout Pro</strong> sin costo de setup</> },
    { id: "fraud",     content: <>Antifraude y 3DS incluidos en la tasa</> },
    { id: "promotions",content: <>En Buen Fin y Hot Sale promociones bancarias acordadas.</> },
    { id: "approval",  content: <>Propuesta sujeta a aprobación comercial.</> },
  ];
  const includeCombo = [
    { id: "terminals", content: <>Terminales <strong>Point Smart</strong> sin costo</> },
    { id: "checkout",  content: <>Integración <strong>Checkout Pro</strong> sin costo de setup</> },
    { id: "promotions",content: <>En Buen Fin y Hot Sale promociones bancarias acordadas.</> },
    { id: "approval",  content: <>Propuesta sujeta a aprobación comercial.</> },
  ];
  const includeItems = slideType === "point" ? includePT : slideType === "op" ? includeOP : includeCombo;

  return (
    <div style={{
      background: G100,
      padding: footPad,
      display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 80,
      alignItems: "start",
      borderTop: `1px solid ${LINE}`,
      minHeight: isCombo ? 200 : 300,
      fontFamily: FONT,
    }}>
      <div>
        <h3 style={{ margin: "0 0 14px", fontSize: h3s, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: INK }}>
          Datos considerados para la propuesta
        </h3>
        <FootBullets items={datosBullets} edit={edit} deleted={deletedBullets} onDelete={onDeleteBullet}/>
      </div>
      <div>
        <h3 style={{ margin: "0 0 14px", fontSize: h3s, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", color: INK }}>
          Incluye
        </h3>
        <FootBullets items={includeItems} edit={edit} deleted={deletedIncluye} onDelete={onDeleteIncluye}/>
        <div style={{ marginTop: isCombo ? 12 : 22, fontWeight: 700, fontSize: uls, color: INK }}>
          <E edit={edit}>Las tasas no incluyen IVA</E>
        </div>
      </div>
    </div>
  );
}

// ─── Single Slide ────────────────────────────────────────────────
interface SlideProps {
  slideType: "point" | "op" | "combo";
  cliente: string;
  rubro: string;
  sellerLogo?: string | null;
  tpvPT: number;
  tpvOP: number;
  rates: RateData;
  edit: boolean;
  del: DelState;
  onDel: (patch: Partial<DelState>) => void;
}

function Slide({ slideType, cliente, rubro, sellerLogo, tpvPT, tpvOP, rates, edit, del, onDel }: SlideProps) {
  const escPT  = "$" + fmtTPV(tpvPT);
  const escOP  = "$" + fmtTPV(tpvOP);
  const tpvLabel = fmtTPV((tpvPT || 0) + (tpvOP || 0));
  const isCombo = slideType === "combo";
  const stripeBg = slideType === "op" ? MP_BLUE : YEL;

  const bodyPadPoint = "36px 88px 0 122px";
  const bodyPadCombo = "22px 88px 0 122px";

  return (
    <div style={{
      position: "relative", width: W, height: H, background: WHITE,
      display: "grid", gridTemplateRows: "auto 1fr auto",
      overflow: "hidden", fontFamily: FONT,
    }}>
      {/* Left stripe */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 34, background: stripeBg, zIndex: 1 }}/>

      {/* Header */}
      <SlideHead slideType={slideType} cliente={cliente} sellerLogo={sellerLogo} edit={edit} isCombo={isCombo}/>

      {/* Body */}
      {slideType === "point" && (
        <div style={{ padding: bodyPadPoint, display: "flex", flexDirection: "column", gap: 22, alignSelf: "start" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: INK, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: YEL }}/>
              <span>Point · Terminales</span>
            </div>
            <BaseTable
              kind="point" cols={PT_COLS} rates={rates.ptRates}
              escalon={escPT} edit={edit}
              delCols={del.ptCols} onDelCol={id => onDel({ ptCols: new Set([...del.ptCols, id]) })}
              delRow={del.ptRow} onDelRow={() => onDel({ ptRow: true })}
            />
          </div>
          <MSITable
            msiRates={rates.ptMsiRates} edit={edit}
            delCols={del.msiCols} onDelCol={id => onDel({ msiCols: new Set([...del.msiCols, id]) })}
            delRow={del.msiRow} onDelRow={() => onDel({ msiRow: true })}
          />
        </div>
      )}

      {slideType === "op" && (
        <div style={{ padding: bodyPadPoint, display: "flex", flexDirection: "column", gap: 22, alignSelf: "start" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: INK, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, background: MP_BLUE }}/>
              <span>Online Payments · Checkout MP</span>
            </div>
            <BaseTable
              kind="op" cols={OP_COLS} rates={rates.opRates}
              escalon={escOP} edit={edit}
              delCols={del.opCols} onDelCol={id => onDel({ opCols: new Set([...del.opCols, id]) })}
              delRow={del.opRow} onDelRow={() => onDel({ opRow: true })}
            />
          </div>
          <MSITable
            msiRates={rates.opMsiRates} edit={edit}
            delCols={del.msiCols} onDelCol={id => onDel({ msiCols: new Set([...del.msiCols, id]) })}
            delRow={del.msiRow} onDelRow={() => onDel({ msiRow: true })}
          />
        </div>
      )}

      {slideType === "combo" && (
        <div style={{ padding: bodyPadCombo, display: "grid", gridTemplateColumns: "6fr 7fr", gap: 36, alignSelf: "start" }}>
          {/* Point column */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: YEL }}/>
              Point · Terminales
            </div>
            <BaseTable
              kind="point" cols={PT_COLS} rates={rates.ptRates}
              escalon={escPT} edit={edit} isCombo
              delCols={del.ptCols} onDelCol={id => onDel({ ptCols: new Set([...del.ptCols, id]) })}
              delRow={del.ptRow} onDelRow={() => onDel({ ptRow: true })}
            />
          </div>
          {/* OP column */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: MP_BLUE }}/>
              OP · Pagos Online
            </div>
            <BaseTable
              kind="op" cols={OP_COLS} rates={rates.opRates}
              escalon={escOP} edit={edit} isCombo
              delCols={del.opCols} onDelCol={id => onDel({ opCols: new Set([...del.opCols, id]) })}
              delRow={del.opRow} onDelRow={() => onDel({ opRow: true })}
            />
          </div>
          {/* Shared MSI */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, background: DEEP }}/>
              Sobretasas MSI
            </div>
            <MSITable
              msiRates={rates.ptMsiRates} edit={edit} isCombo
              delCols={del.msiCols} onDelCol={id => onDel({ msiCols: new Set([...del.msiCols, id]) })}
              delRow={del.msiRow} onDelRow={() => onDel({ msiRow: true })}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <SlideFooter
        slideType={slideType}
        cliente={cliente}
        rubro={rubro}
        tpvLabel={tpvLabel}
        edit={edit}
        deletedBullets={
          slideType === "point" ? del.ptBullets :
          slideType === "op" ? del.opBullets : del.comboBullets
        }
        onDeleteBullet={id => {
          if (slideType === "point") onDel({ ptBullets: new Set([...del.ptBullets, id]) });
          else if (slideType === "op") onDel({ opBullets: new Set([...del.opBullets, id]) });
          else onDel({ comboBullets: new Set([...del.comboBullets, id]) });
        }}
        deletedIncluye={
          slideType === "point" ? del.ptIncluye :
          slideType === "op" ? del.opIncluye : del.comboIncluye
        }
        onDeleteIncluye={id => {
          if (slideType === "point") onDel({ ptIncluye: new Set([...del.ptIncluye, id]) });
          else if (slideType === "op") onDel({ opIncluye: new Set([...del.opIncluye, id]) });
          else onDel({ comboIncluye: new Set([...del.comboIncluye, id]) });
        }}
        isCombo={isCombo}
      />
    </div>
  );
}

// ─── Slide tab labels ────────────────────────────────────────────
const TAB_LABELS: Record<string, string> = {
  point: "01 Point",
  op:    "02 OP",
  combo: "03 Point + OP",
};

// ─── Modal ───────────────────────────────────────────────────────
export default function SlideComisionesModal({
  open, onClose,
  empresa, rubro = "", sellerLogo,
  productos,
  comPT_OT, comPT_MSI, tpvPT,
  comOP_OT, comOP_MSI, tpvOP,
}: SlideModalProps) {
  const [editMode,    setEditMode]    = useState(false);
  const [resetKey,    setResetKey]    = useState(0);
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [del,         setDel]         = useState<DelState>(emptyDel);
  const [capturing,   setCapturing]   = useState(false);
  const [modalW,      setModalW]      = useState(980);
  const [modalH,      setModalH]      = useState<number | null>(null); // null = auto

  const slideRef   = useRef<HTMLDivElement>(null);
  const resizeRef  = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = (e.currentTarget as HTMLElement).closest("[data-modal-root]") as HTMLElement | null;
    resizeRef.current = {
      sx: e.clientX, sy: e.clientY,
      sw: el?.offsetWidth  ?? modalW,
      sh: el?.offsetHeight ?? (modalH ?? 600),
    };
    const onMove = (ev: PointerEvent) => {
      if (!resizeRef.current) return;
      const { sx, sy, sw, sh } = resizeRef.current;
      const newW = Math.max(600, Math.min(sw + (ev.clientX - sx), window.innerWidth  - 40));
      const newH = Math.max(400, Math.min(sh + (ev.clientY - sy), window.innerHeight - 40));
      setModalW(newW);
      setModalH(newH);
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
  };

  if (!open) return null;

  const activeSlides: Array<"point" | "op" | "combo"> = [
    ...(productos.point ? ["point" as const] : []),
    ...(productos.op    ? ["op"    as const] : []),
    ...((productos.point && productos.op) ? ["combo" as const] : []),
  ];

  const currentSlide = activeSlides[Math.min(currentIdx, activeSlides.length - 1)] ?? "point";

  const rates = deriveRates(comPT_OT, comPT_MSI, comOP_OT, comOP_MSI);

  function patchDel(patch: Partial<DelState>) {
    setDel(prev => ({ ...prev, ...patch }));
  }

  function handleReset() {
    setDel(emptyDel());
    setResetKey(k => k + 1);
    setEditMode(false);
  }

  async function handleDownload() {
    if (!slideRef.current) return;
    setCapturing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(slideRef.current, {
        width: W, height: H, pixelRatio: 2,
        backgroundColor: WHITE, cacheBust: true,
        style: { transform: "none" } as Partial<CSSStyleDeclaration>,
      });
      const safe = (empresa || "slide").replace(/[^\w\-]+/g, "_");
      const a = document.createElement("a");
      a.download = `propuesta-${currentSlide}-${safe}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error("PNG export error:", e);
      alert("Error al exportar la imagen. Intenta de nuevo.");
    } finally {
      setCapturing(false);
    }
  }

  const MODAL_BG  = "#F4F4F4";
  const BORDER    = "#E0E0E0";
  const PREVIEW_W = Math.max(560, modalW - 48);
  const SCALE     = PREVIEW_W / W;
  const PREVIEW_H = Math.round(H * SCALE);

  return (
    <>
      <style>{`
        @keyframes mp-spin { to { transform: rotate(360deg); } }
        .mp-slide-edit .mp-e:hover  { background: ${YEL_SOFT}; box-shadow: 0 0 0 2px ${YEL_SOFT}; cursor: text; }
        .mp-slide-edit .mp-e:focus  { background: #FFFCE0; box-shadow: 0 0 0 2px ${YEL}; outline: none; }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(14,27,61,0.7)", backdropFilter: "blur(4px)", zIndex: 1000 }}/>

      {/* Modal — wrapper con position:relative para que el handle de resize sea position:absolute */}
      <div data-modal-root style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: Math.min(modalW, window.innerWidth - 40),
        height: Math.min(modalH ?? Math.min(800, window.innerHeight - 40), window.innerHeight - 40),
        background: WHITE, borderRadius: 20, zIndex: 1001,
        boxShadow: "0 32px 80px rgba(0,0,0,.35)",
        display: "flex", flexDirection: "column",
        userSelect: "none", overflow: "hidden",
      }}>
        {/* Contenido scrollable */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ─ Modal header ─ */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px 18px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: DEEP, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={YEL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 800, color: INK, letterSpacing: "-0.01em" }}>Slide de Comisiones</h2>
            <p style={{ margin: 0, fontSize: 12, color: NA_C }}>Vista previa editable · incluye solo tasas Mercado Pago</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: G50, border: "none", cursor: "pointer", color: INK_SOFT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>✕</button>
        </div>

        {/* ─ Slide tabs ─ */}
        {activeSlides.length > 1 && (
          <div style={{ display: "flex", gap: 6, padding: "14px 24px 0", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {activeSlides.map((s, i) => (
              <button key={s} onClick={() => setCurrentIdx(i)} style={{
                padding: "8px 18px", borderRadius: "8px 8px 0 0",
                border: `1px solid ${i === currentIdx ? BORDER : "transparent"}`,
                borderBottom: i === currentIdx ? "1px solid " + WHITE : `1px solid ${BORDER}`,
                background: i === currentIdx ? WHITE : "transparent",
                fontSize: 13, fontWeight: i === currentIdx ? 700 : 500,
                color: i === currentIdx ? INK : NA_C,
                cursor: "pointer", marginBottom: -1,
              }}>
                {TAB_LABELS[s]}
              </button>
            ))}
          </div>
        )}

        {/* ─ Slide preview (scaled) ─ */}
        <div style={{ padding: "20px 24px", flexShrink: 0 }}>
          <div style={{
            width: PREVIEW_W, height: PREVIEW_H,
            overflow: "hidden", position: "relative",
            border: `1px solid ${BORDER}`, borderRadius: 6,
            background: MODAL_BG,
          }}>
            {/* The actual 1920×1080 slide div — this is what we capture for PNG */}
            <div
              key={resetKey}
              ref={slideRef}
              className={editMode ? "mp-slide-edit" : ""}
              style={{ width: W, height: H, transformOrigin: "top left", transform: `scale(${SCALE})` }}
            >
              <Slide
                slideType={currentSlide}
                cliente={empresa}
                rubro={rubro}
                sellerLogo={sellerLogo}
                tpvPT={tpvPT}
                tpvOP={tpvOP}
                rates={rates}
                edit={editMode}
                del={del}
                onDel={patchDel}
              />
            </div>
          </div>
          {editMode && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: NA_C, textAlign: "center" }}>
              Modo edición activo · Haz clic en cualquier texto para editarlo · usa × para eliminar filas, columnas o bullets
            </p>
          )}
        </div>

        {/* ─ Toolbar ─ */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px 20px",
          borderTop: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setEditMode(m => !m)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: editMode ? YEL : "none",
                border: `1px solid ${editMode ? "#D4BE00" : BORDER}`,
                borderRadius: 8, padding: "9px 16px",
                fontSize: 13, fontWeight: 600,
                color: editMode ? INK : INK_SOFT,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {editMode ? "Ocultar controles" : "Editar"}
            </button>

            <button
              onClick={handleReset}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "none", border: `1px solid ${BORDER}`,
                borderRadius: 8, padding: "9px 16px",
                fontSize: 13, fontWeight: 600, color: INK_SOFT,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.25"/>
              </svg>
              Restablecer datos
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{
              background: G50, border: `1px solid ${BORDER}`, borderRadius: 8,
              padding: "10px 18px", fontSize: 13, fontWeight: 600, color: INK_SOFT,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Cerrar
            </button>
            <button
              onClick={handleDownload}
              disabled={capturing}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: capturing ? NA_C : DEEP,
                color: YEL, border: "none", borderRadius: 8,
                padding: "10px 22px", fontSize: 13, fontWeight: 700,
                cursor: capturing ? "default" : "pointer",
                fontFamily: "inherit", opacity: capturing ? 0.7 : 1,
              }}
            >
              {capturing ? (
                <span style={{ display: "inline-flex", animation: "mp-spin 1s linear infinite" }}>⟳</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={YEL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {capturing ? "Exportando…" : `Descargar PNG · ${currentSlide === "point" ? "Point" : currentSlide === "op" ? "OP" : "Combo"}`}
            </button>
          </div>
        </div>

        </div>{/* fin contenido scrollable */}

        {/* Resize handle — FUERA del scroll, anclado a la esquina del wrapper */}
        <div
          onPointerDown={onResizeDown}
          style={{
            position: "absolute", bottom: 0, right: 0,
            width: 32, height: 32,
            cursor: "se-resize",
            display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
            padding: "6px",
            zIndex: 20,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 1L1 13" stroke="#BBBBBB" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M13 6L6 13"  stroke="#BBBBBB" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M13 11L11 13" stroke="#BBBBBB" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </>
  );
}
