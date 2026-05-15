"use client";
import { useState, useEffect } from "react";
import { PALANCAS_PT, PALANCAS_OP } from "@/data/constants";

// ── Color tokens ───────────────────────────────────────────────────
const YEL  = "#FFE600";
const NAVY = "#0E1B3D";
const ACC  = "#434CE4";
const POS  = "#00A650";
const G040 = "#F7F7F7";
const G070 = "#F0F0F0";
const G150 = "#E5E5E5";
const G200 = "#CCCCCC";
const G400 = "#999999";
const G600 = "#666666";
const G900 = "#1A1A1A";

// ── Helpers ────────────────────────────────────────────────────────
const fmt  = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");
const fmtC = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000)     return "$" + Math.round(n / 1_000) + "K";
  return "$" + Math.round(n).toLocaleString("es-MX");
};

// ── Icon ───────────────────────────────────────────────────────────
function Icon({ name, size = 18, color = "currentColor", sw = 2 }: {
  name: string; size?: number; color?: string; sw?: number;
}) {
  const p: Record<string, React.ReactNode> = {
    check:    <polyline points="20 6 9 17 4 12" />,
    chevron:  <polyline points="6 9 12 15 18 9" />,
    trend:    <><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {p[name] ?? <circle cx="12" cy="12" r="9"/>}
    </svg>
  );
}

// ── InfoBtn — descripción siempre visible en el link del seller ────
function InfoBtn({ content, accent }: { content: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      fontSize: 11, lineHeight: 1.5,
      color: accent ? "rgba(255,255,255,0.6)" : G400,
      maxWidth: 200,
    }}>
      {content}
    </div>
  );
}

// ── EquationCard ───────────────────────────────────────────────────
function EquationCard({ chip, label, big, sub, accent = false, style: xs }: {
  chip: React.ReactNode; label?: string; big: React.ReactNode; sub: React.ReactNode;
  accent?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: accent ? NAVY : "white", color: accent ? "white" : "inherit",
      borderRadius: 14, padding: "22px 24px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      border: accent ? "none" : `1px solid ${G150}`,
      display: "flex", flexDirection: "column", gap: 10, minHeight: 200, ...xs,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: accent ? "rgba(255,230,0,0.15)" : G070,
          color: accent ? YEL : G600,
          padding: "4px 10px", borderRadius: 999,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const,
        }}>{chip}</div>
      </div>
      {label && <div style={{ fontSize: 13, fontWeight: 600, color: accent ? "rgba(255,255,255,0.7)" : G600 }}>{label}</div>}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: accent ? "center" : "flex-start" }}>
        {big}
      </div>
      <InfoBtn content={sub} accent={accent} />
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%", background: "white",
      border: `1px solid ${G150}`, boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 800, color: G600, alignSelf: "center", flexShrink: 0,
    }}>{symbol}</div>
  );
}

// ── Collapsible ────────────────────────────────────────────────────
function Collapsible({ title, badge, totalLabel, totalValue, deltaValue, children }: {
  title: string; badge?: string; totalLabel: string; totalValue: string;
  deltaValue: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${G150}`, borderRadius: 12, marginBottom: 12, background: "white", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 18, alignItems: "center",
        padding: "16px 20px", border: "none", background: "transparent", width: "100%",
        cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const,
      }}>
        <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: G600 }}>
          <Icon name="chevron" size={18} />
        </span>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
            {badge && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: G070, color: G600, padding: "3px 8px", borderRadius: 999 }}>{badge}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontSize: 10, color: G400, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>{totalLabel}</div>
          <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: POS }}>{totalValue}</div>
        </div>
        <div style={{ textAlign: "right" as const, minWidth: 110 }}>
          <div style={{ fontSize: 10, color: G400, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Diferencia</div>
          <div style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{deltaValue}</div>
        </div>
      </button>
      {open && (
        <div style={{ background: G040, borderTop: `1px solid ${G150}`, padding: "12px 20px 18px 56px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── ProductTable ───────────────────────────────────────────────────
type TableRow = { name: string; vol: number; now: number; mp: number; save: number };
function ProductTable({ rows }: { rows: TableRow[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ color: G400, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
          {["Producto","Volumen / mes","Tasa actual","Tasa MP","Com. actual","Com. MP","Δ %","Ahorro / mes"].map(h => (
            <th key={h} style={{ textAlign: h === "Producto" ? "left" : "right" as any, fontWeight: 700, padding: "8px 0" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const comNow = r.vol * r.now / 100;
          const comMP  = r.vol * r.mp  / 100;
          return (
            <tr key={i} style={{ borderTop: `1px solid ${G150}`, fontVariantNumeric: "tabular-nums" }}>
              <td style={{ padding: "10px 0", fontWeight: 600 }}>{r.name}</td>
              <td style={{ textAlign: "right", padding: "10px 0", color: G600 }}>{fmt(r.vol)}</td>
              <td style={{ textAlign: "right", padding: "10px 0", color: G400, textDecoration: "line-through" }}>{r.now}%</td>
              <td style={{ textAlign: "right", padding: "10px 0", color: G900, fontWeight: 700 }}>{r.mp}%</td>
              <td style={{ textAlign: "right", padding: "10px 0", color: G400, textDecoration: "line-through" }}>{fmt(comNow)}</td>
              <td style={{ textAlign: "right", padding: "10px 0", color: G900, fontWeight: 700 }}>{fmt(comMP)}</td>
              <td style={{ textAlign: "right", padding: "10px 0", color: POS, fontWeight: 700 }}>−{(r.now - r.mp).toFixed(2)}%</td>
              <td style={{ textAlign: "right", padding: "10px 0", color: POS, fontWeight: 800 }}>{fmt(r.save)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── ValueAddedTable ────────────────────────────────────────────────
type VARow = { name: string; incrPct: number; gain: number };
function ValueAddedTable({ rows }: { rows: VARow[] }) {
  if (rows.length === 0) return <div style={{ fontSize: 13, color: G600, padding: "16px 0", fontStyle: "italic" }}>Sin palancas seleccionadas para este producto.</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ color: G400, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
          <th style={{ textAlign: "left", fontWeight: 700, padding: "8px 0" }}>Palanca</th>
          <th style={{ textAlign: "right", fontWeight: 700, padding: "8px 0" }}>% incremento ventas</th>
          <th style={{ textAlign: "right", fontWeight: 700, padding: "8px 0" }}>Ganancia / mes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderTop: `1px solid ${G150}`, fontVariantNumeric: "tabular-nums" }}>
            <td style={{ padding: "10px 0", fontWeight: 600 }}>{r.name}</td>
            <td style={{ textAlign: "right", padding: "10px 0", color: ACC, fontWeight: 700 }}>+{r.incrPct.toFixed(2)}%</td>
            <td style={{ textAlign: "right", padding: "10px 0", color: POS, fontWeight: 800 }}>{fmt(r.gain)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── ChannelToggle ──────────────────────────────────────────────────
function ChannelToggle({ value, onChange, showPT, showOP }: {
  value: "pt" | "op"; onChange: (v: "pt" | "op") => void;
  showPT: boolean; showOP: boolean;
}) {
  const allOpts = [
    {
      k: "pt" as const, l: "Point", desc: "Terminales físicas en sucursal", bg: YEL, fg: NAVY,
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="17" x2="12" y2="20"/></svg>,
    },
    {
      k: "op" as const, l: "Online Payments", desc: "Checkout web / digital", bg: NAVY, fg: "white",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><circle cx="6" cy="13.5" r="1" fill="currentColor"/><line x1="10" y1="13.5" x2="18" y2="13.5"/></svg>,
    },
  ];
  const opts = allOpts.filter(o => (o.k === "pt" ? showPT : showOP));
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: G400 }}>Selección de producto</span>
        <span style={{ fontSize: 11, color: G400 }}>El desglose se actualiza al cambiar</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: opts.length === 1 ? "1fr" : "1fr 1fr", background: "white", border: `1px solid ${G150}`, borderRadius: 14, padding: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {opts.map(o => {
          const active = value === o.k;
          return (
            <button key={o.k} onClick={() => onChange(o.k)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              border: "none", borderRadius: 10,
              background: active ? o.bg : "transparent", color: active ? o.fg : "inherit",
              cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const,
              transition: "background 160ms", boxShadow: active ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            }}>
              <span style={{ width: 38, height: 38, borderRadius: 8, background: active ? (o.k === "pt" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)") : G070, display: "inline-flex", alignItems: "center", justifyContent: "center", color: active ? o.fg : G600, flexShrink: 0 }}>{o.icon}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: active ? o.fg : G900 }}>{o.l}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? (o.k === "pt" ? "rgba(14,27,61,0.7)" : "rgba(255,255,255,0.75)") : G400 }}>{o.desc}</span>
              </div>
              {active && (
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 800, color: o.fg, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: o.k === "pt" ? POS : YEL }} />Activo
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Computation helpers ────────────────────────────────────────────
type ComOTRow  = { l: string; sh: number; cu: number; mp: number | null };
type ComMSIRow = { l: string; sh: number; sb: number; sm: number };

function computeOTRows(tpv: number, comOT: ComOTRow[]): TableRow[] {
  return comOT
    .filter(r => r.mp !== null && r.cu > (r.mp ?? r.cu))
    .map(r => ({ name: r.l, vol: Math.round(tpv * r.sh), now: r.cu, mp: r.mp ?? r.cu, save: Math.round(tpv * r.sh * (r.cu - (r.mp ?? r.cu)) / 100) }))
    .filter(r => r.vol > 0 && r.save > 0);
}
function computeMSIRows(tpv: number, comMSI: ComMSIRow[], tcCu = 0, tcMp = 0): TableRow[] {
  return comMSI
    .filter(r => (tcCu + r.sb) > (tcMp + r.sm))
    .map(r => ({ name: r.l, vol: Math.round(tpv * r.sh), now: tcCu + r.sb, mp: tcMp + r.sm, save: Math.round(tpv * r.sh * ((tcCu + r.sb) - (tcMp + r.sm)) / 100) }))
    .filter(r => r.vol > 0 && r.save > 0);
}
const sumSave = (rows: TableRow[]) => rows.reduce((a, r) => a + r.save, 0);

// ── SellerView ─────────────────────────────────────────────────────
function SellerView({ data }: { data: any }) {
  const [channel, setChannel] = useState<"pt" | "op">("pt");
  const [showDetail, setShowDetail] = useState(false);
  const [revealStep, setRevealStep] = useState<0 | 1 | 2>(0);
  const [w, setW] = useState(1200);

  useEffect(() => {
    const update = () => setW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const empresa = data.negocio?.nombre || "Seller";
  const propuestaProd: "pt" | "op" | "both" = data.propuestaProd ?? "both";
  const showPT = propuestaProd === "pt" || propuestaProd === "both";
  const showOP = propuestaProd === "op" || propuestaProd === "both";

  const palancasSel = {
    pt: new Set<string>(data.palancasSel?.pt ?? []),
    op: new Set<string>(data.palancasSel?.op ?? []),
  };
  const palancasPct: { pt: Record<string, number>; op: Record<string, number> } =
    data.palancasPct ?? { pt: {}, op: {} };

  const sharePT = { tpv: data.tpvPT ?? 0 };
  const shareOP = { tpv: data.tpvOP ?? 0 };
  const comPT_OT:  ComOTRow[]  = data.comPT_OT  ?? [];
  const comPT_MSI: ComMSIRow[] = data.comPT_MSI ?? [];
  const comOP_OT:  ComOTRow[]  = data.comOP_OT  ?? [];
  const comOP_MSI: ComMSIRow[] = data.comOP_MSI ?? [];

  const ptTC_cu = comPT_OT.find((r: ComOTRow) => r.l === "T. Crédito")?.cu ?? 0;
  const ptTC_mp = comPT_OT.find((r: ComOTRow) => r.l === "T. Crédito")?.mp ?? 0;
  const opTC_cu = comOP_OT.find((r: ComOTRow) => r.l === "T. Crédito")?.cu ?? 0;
  const opTC_mp = comOP_OT.find((r: ComOTRow) => r.l === "T. Crédito")?.mp ?? 0;

  const ptOT  = showPT ? computeOTRows(sharePT.tpv, comPT_OT)                         : [];
  const ptMSI = showPT ? computeMSIRows(sharePT.tpv, comPT_MSI, ptTC_cu, ptTC_mp)     : [];
  const opOT  = showOP ? computeOTRows(shareOP.tpv, comOP_OT)                          : [];
  const opMSI = showOP ? computeMSIRows(shareOP.tpv, comOP_MSI, opTC_cu, opTC_mp)      : [];

  const ptOTTotal  = sumSave(ptOT);
  const ptMSITotal = sumSave(ptMSI);
  const opOTTotal  = sumSave(opOT);
  const opMSITotal = sumSave(opMSI);
  const saveOneShot = ptOTTotal + opOTTotal;
  const saveMSI_val = ptMSITotal + opMSITotal;
  const totalSave   = saveOneShot + saveMSI_val;

  // Label lookup for palancas
  const ptLabelMap = Object.fromEntries(PALANCAS_PT.map(l => [l.id, l.label]));
  const opLabelMap = Object.fromEntries(PALANCAS_OP.map(l => [l.id, l.label]));

  const ptImpact = Array.from(palancasSel.pt).reduce((acc, id) => acc + (palancasPct.pt[id] || 0) / 100 * sharePT.tpv, 0);
  const opImpact = Array.from(palancasSel.op).reduce((acc, id) => acc + (palancasPct.op[id] || 0) / 100 * shareOP.tpv, 0);
  const incrSalesMxn = ptImpact + opImpact;
  const baseTpv = sharePT.tpv + shareOP.tpv;
  const incrSalesPct = baseTpv > 0 ? (incrSalesMxn / baseTpv) * 100 : 0;
  const monthlyGain = totalSave + incrSalesMxn;
  const annualGain  = monthlyGain * 12;

  const rateDiffPp = [...comPT_OT, ...comOP_OT].reduce((acc, r) =>
    acc + (r.mp !== null ? r.sh * (r.cu - (r.mp ?? r.cu)) : 0), 0);

  const ptVA: VARow[] = Array.from(palancasSel.pt).map(id => ({ name: ptLabelMap[id] || id, incrPct: palancasPct.pt[id] || 0, gain: Math.round((palancasPct.pt[id] || 0) / 100 * sharePT.tpv) }));
  const opVA: VARow[] = Array.from(palancasSel.op).map(id => ({ name: opLabelMap[id] || id, incrPct: palancasPct.op[id] || 0, gain: Math.round((palancasPct.op[id] || 0) / 100 * shareOP.tpv) }));

  const curOT       = channel === "pt" ? ptOT  : opOT;
  const curMSI      = channel === "pt" ? ptMSI : opMSI;
  const curVA       = channel === "pt" ? ptVA  : opVA;
  const curOTTotal  = channel === "pt" ? ptOTTotal  : opOTTotal;
  const curMSITotal = channel === "pt" ? ptMSITotal : opMSITotal;
  const curVATotal  = curVA.reduce((a, r) => a + r.gain, 0);
  const curVAPct    = curVA.reduce((a, r) => a + r.incrPct, 0);

  useEffect(() => {
    if (channel === "pt" && !showPT && showOP) setChannel("op");
    if (channel === "op" && !showOP && showPT) setChannel("pt");
  }, [showPT, showOP, channel]);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1120, margin: "0 auto", padding: "0 0 60px" }}>

      {/* ── Cintilla idéntica a la del PDF ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid #E5E5E5", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/mp-logo.png" style={{ height: 26, display: "block", flexShrink: 0 }} alt="Mercado Pago" />
          {data.negocio?.logo && (
            <>
              <span style={{ fontSize: 13, color: "#ccc", fontWeight: 300, lineHeight: 1 }}>×</span>
              <img src={data.negocio.logo} style={{ height: 26, display: "block", borderRadius: 3, flexShrink: 0 }} alt="Seller" />
            </>
          )}
          <span style={{ fontSize: 10.5, color: "#737373", textTransform: "uppercase" as const, letterSpacing: "0.02em", marginLeft: 4 }}>
            Business Case · Mercado Pago
          </span>
        </div>
        <div style={{ textAlign: "right" as const, fontSize: 10.5, color: "#737373", lineHeight: 1.4, whiteSpace: "nowrap" as const }}>
          <strong style={{ color: "#1A1A1A", fontWeight: 600, display: "block", fontSize: 12 }}>{empresa}</strong>
          Propuesta comercial
        </div>
      </div>

      {/* ── Header amarillo (igual al del Business Case) ── */}
      <div style={{ background: YEL, padding: w >= 768 ? "44px 48px 76px" : "32px 24px 68px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: w >= 768 ? 28 : 18, maxWidth: 1080 }}>
          {/* Icono tendencia */}
          <div style={{ flexShrink: 0, width: w >= 768 ? 72 : 52, height: w >= 768 ? 72 : 52, borderRadius: 16, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {monthlyGain >= 0 ? (
              <svg width={w >= 768 ? 38 : 28} height={w >= 768 ? 38 : 28} viewBox="0 0 24 24" fill="none" stroke={YEL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            ) : (
              <svg width={w >= 768 ? 38 : 28} height={w >= 768 ? 38 : 28} viewBox="0 0 24 24" fill="none" stroke={YEL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            )}
          </div>
          {/* Texto */}
          <div>
            <div style={{ fontSize: w >= 768 ? 50 : 30, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.04 }}>
              Con Mercado Pago estarás generando {monthlyGain >= 0 ? "+" : "−"}{fmtC(Math.abs(monthlyGain))} al mes
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "linear-gradient(90deg, transparent 0%, #B8A500 20%, #B8A500 80%, transparent 100%)" }} />
      </div>

      {/* ── Contenido (sube sobre el header) ── */}
      <div style={{ margin: "-44px 24px 0", position: "relative" }}>

        {/* Equation cards — reveal progresivo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: 12, flexWrap: w < 640 ? "wrap" : "nowrap" as const }}>

            {/* Card 1: Ahorro — siempre visible */}
            <div style={{ flex: "0.9 1 0", minWidth: 220 }}>
              <EquationCard
                chip={`−${rateDiffPp.toFixed(2)}%`}
                label="Ahorro mensual en tasas"
                big={<div style={{ fontSize: 46, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: POS, lineHeight: 1 }}>{fmtC(totalSave)}</div>}
                sub={<>Suma de <strong>{fmt(saveOneShot)}</strong> en pagos de contado + <strong>{fmt(saveMSI_val)}</strong> en meses sin intereses.</>}
              />
            </div>

            {/* Card 2: Incremental — revealStep >= 1 */}
            {revealStep >= 1 && w >= 640 && <Operator symbol="+" />}
            {revealStep >= 1 && (
              <div style={{ flex: "0.9 1 0", minWidth: 220 }}>
                <EquationCard
                  chip={`+${incrSalesPct.toFixed(1)}%`}
                  label="Incremental en ventas"
                  big={<div style={{ fontSize: 46, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: ACC, lineHeight: 1 }}>{fmtC(incrSalesMxn)}</div>}
                  sub={<>Volumen adicional desbloqueado por las palancas de valor agregado.</>}
                />
              </div>
            )}

            {/* Card 3: Ganancia total — revealStep >= 2 */}
            {revealStep >= 2 && w >= 640 && <Operator symbol="=" />}
            {revealStep >= 2 && (
              <div style={{ flex: "1.5 1 0", minWidth: 220 }}>
                <EquationCard
                  accent
                  chip={`Ganancia total · ${empresa}`}
                  big={
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 14, alignItems: "center", textAlign: "center" as const }}>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.04em", fontWeight: 700, marginBottom: 6 }}>Mensual</div>
                        <div style={{ fontSize: w >= 640 ? 54 : 38, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: YEL, lineHeight: 1 }}>{fmtC(monthlyGain)}</div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.15)", height: 80, alignSelf: "center" }} />
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.04em", fontWeight: 700, marginBottom: 6 }}>Anual</div>
                        <div style={{ fontSize: w >= 640 ? 54 : 38, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1 }}>{fmtC(annualGain)}</div>
                      </div>
                    </div>
                  }
                  sub={<>Suma de ahorro por tasas e incremental en ventas, proyectado a 12 meses.</>}
                />
              </div>
            )}

            {/* Botón reveal siguiente — lateral derecho */}
            {revealStep < 2 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {revealStep === 1 && w >= 640 && <Operator symbol="=" />}
                <button
                  onClick={() => setRevealStep(s => (s + 1) as 1 | 2)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 10, minWidth: 150, minHeight: 200,
                    background: "white", border: `2px dashed ${G200}`,
                    borderRadius: 14, padding: "20px 18px",
                    cursor: "pointer", fontFamily: "inherit",
                    color: G600, transition: "all 160ms",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.background = "#F0F4FF"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = G200; e.currentTarget.style.background = "white"; }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1, color: NAVY }}>→</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: G600, textAlign: "center" as const, lineHeight: 1.4 }}>
                    {revealStep === 0 ? "Mostrar incremento en ventas" : "Mostrar ganancia total"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Botón ocultar sección anterior */}
          {revealStep > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                onClick={() => setRevealStep(s => (s - 1) as 0 | 1)}
                style={{
                  background: "white", border: `1px solid ${G150}`, borderRadius: 8,
                  padding: "7px 16px", fontSize: 12, fontWeight: 600, color: G600,
                  cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                ← {revealStep === 2 ? "Ocultar ganancia total" : "Ocultar incremento"}
              </button>
            </div>
          )}
        </div>

        {/* Toggle detail */}
        <button
          onClick={() => setShowDetail(!showDetail)}
          style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 18, alignItems: "center",
            width: "100%", background: showDetail ? NAVY : "white",
            color: showDetail ? "white" : "inherit",
            border: showDetail ? `1px solid ${NAVY}` : `1px solid ${G150}`,
            borderRadius: 14, padding: "18px 22px", marginTop: 4, marginBottom: showDetail ? 24 : 4,
            cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const,
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)", transition: "all 200ms",
          }}
        >
          <span style={{ width: 44, height: 44, borderRadius: 10, background: showDetail ? "rgba(255,230,0,0.15)" : G070, color: showDetail ? YEL : G600, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>¿Quieres ver el detalle del análisis?</span>
            <span style={{ fontSize: 13, color: showDetail ? "rgba(255,255,255,0.7)" : G600 }}>
              {showDetail ? "Mostrando desglose completo por medio de pago, producto y palancas." : "Activa para revisar comisiones, MSI y valores agregados."}
            </span>
          </div>
          <span style={{ width: 56, height: 32, borderRadius: 999, padding: 3, background: showDetail ? YEL : G200, display: "inline-flex", alignItems: "center", flexShrink: 0, transition: "background 200ms" }}>
            <span style={{ width: 26, height: 26, background: "white", borderRadius: "50%", transform: showDetail ? "translateX(24px)" : "translateX(0)", transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)", boxShadow: "0 2px 4px rgba(0,0,0,0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: NAVY }}>
              {showDetail && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </span>
          </span>
        </button>

        {/* Detail breakdown */}
        {showDetail && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 14px", letterSpacing: "-0.01em" }}>Desglose por medio de pago</h2>
            {showPT && showOP && (
              <ChannelToggle value={channel} onChange={setChannel} showPT={showPT} showOP={showOP} />
            )}

            <Collapsible
              key={channel + "-oneshot"}
              title="Comisiones · Pagos de contado" badge="One-shot"
              totalLabel="Ahorro / mes" totalValue={fmt(curOTTotal)}
              deltaValue={<span style={{ color: POS }}>−{curOT.reduce((a, r) => a + (r.now - r.mp) * r.vol / 100 / (curOTTotal || 1) * 100, 0).toFixed(2)}%</span>}
            >
              {curOT.length > 0 ? <ProductTable rows={curOT} /> : <div style={{ fontSize: 13, color: G600, fontStyle: "italic" }}>Sin diferencias de tasa en este canal.</div>}
            </Collapsible>

            <Collapsible
              key={channel + "-msi"}
              title="Comisiones · Meses sin intereses" badge="MSI"
              totalLabel="Ahorro / mes" totalValue={fmt(curMSITotal)}
              deltaValue={<span style={{ color: POS }}>−{curMSI.reduce((a, r) => a + (r.now - r.mp) * r.vol / 100 / (curMSITotal || 1) * 100, 0).toFixed(2)}%</span>}
            >
              {curMSI.length > 0 ? <ProductTable rows={curMSI} /> : <div style={{ fontSize: 13, color: G600, fontStyle: "italic" }}>Sin MSI configurados para este canal.</div>}
            </Collapsible>

            <div style={{ background: "#FFFCE5", border: `1px solid ${YEL}`, borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 18, alignItems: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Total comisiones (contado + MSI)</div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: 10, color: G400, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Δ ponderada</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>−{rateDiffPp.toFixed(2)}%</div>
              </div>
              <div style={{ textAlign: "right" as const, minWidth: 140 }}>
                <div style={{ fontSize: 10, color: G400, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Ahorro total / mes</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: POS }}>{fmt(curOTTotal + curMSITotal)}</div>
              </div>
            </div>

            <Collapsible
              key={channel + "-va"}
              title="Valores agregados · Ganancia incremental" badge="Volumen extra"
              totalLabel="Ganancia / mes" totalValue={fmt(curVATotal)}
              deltaValue={<span style={{ color: ACC }}>+{curVAPct.toFixed(2)}%</span>}
            >
              <ValueAddedTable rows={curVA} />
            </Collapsible>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${G150}` }}>
          <span style={{ fontSize: 11, color: G400 }}>Propuesta generada con Business Case · Mercado Pago</span>
        </div>
      </div>
    </div>
  );
}

// ── Default export ─────────────────────────────────────────────────
export default function SharePage() {
  const [data, setData]   = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) { setError("No se encontró la propuesta en el enlace."); return; }
      const decoded = decodeURIComponent(escape(atob(hash)));
      setData(JSON.parse(decoded));
    } catch {
      setError("El enlace no es válido o está dañado.");
    }
  }, []);

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Enlace inválido</h1>
        <p style={{ color: G600 }}>{error}</p>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${G150}`, borderTopColor: NAVY, margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: G600 }}>Cargando propuesta…</p>
      </div>
    </div>
  );

  return <SellerView data={data} />;
}
