"use client";
import { useState } from "react";
import type { Productos, ProvData, ProvCounts, PalancaCategory } from "@/types";
import type { Palanca } from "@/types";
import { PALANCAS_PT, PALANCAS_OP } from "@/data/constants";
import { useWindowWidth } from "@/hooks/useWindowWidth";

const DEFAULT_PCT = 0.5;

const SAVINGS_MOCK = {
  pt: { monthly: 42_000 },
  op: { monthly: 28_500 },
};

const CAT_META: Record<PalancaCategory, { label: string; color: string; bg: string }> = {
  producto:   { label: "Producto",   color: "#0A74DA", bg: "#E8F3FD" },
  innovacion: { label: "Innovación", color: "#7C3AED", bg: "#F3EFFE" },
  marketing:  { label: "Marketing",  color: "#047857", bg: "#E8F5F0" },
};

const RESERVADO_PRESELECT_PT: Array<{ id: string; pct: number; subIds?: string[] }> = [
  { id: "mas-medios",         pct: 0.5,  subIds: ["todos"]   },
  { id: "msi",                pct: 0.5,  subIds: ["aceptar"] },
  { id: "link-pago",          pct: 0.1                       },
  { id: "ruteo",              pct: 0.1                       },
  { id: "cuotas-interes",     pct: 0.5                       },
  { id: "campanas-mensuales", pct: 0.5                       },
];

const SCENARIO_PCTS: Record<"reservado" | "industria", Record<string, number>> = {
  reservado: {
    "mas-medios": 0.5, "msi": 0.5, "bnpl": 0.1,
    "link-pago": 0.1,  "ruteo": 0.1,
    "cuotas-interes": 0.5, "seasonals": 0.5,
    "campanas-mensuales": 0.5, "trafico": 0.5, "material-pop": 0.5,
  },
  industria: {
    "mas-medios": 1.0, "msi": 1.0, "bnpl": 0.3,
    "link-pago": 0.2,  "ruteo": 0.2,
    "cuotas-interes": 1.0, "seasonals": 1.5,
    "campanas-mensuales": 1.0, "trafico": 1.0, "material-pop": 0.8,
  },
};

const N   = "#283277";
const T   = "#007770";
const BL  = "#00BCFF";
const PU  = "#AC86DB";
const GR  = "#196B24";
const BD  = "#EFEFEF";
const MU  = "#969696";
const FG2 = "#666666";
const BG2 = "#F2F4F7";

function fmtMoney(n: number) {
  return "$" + Math.round(n).toLocaleString("es-MX");
}
function fmtSignedPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}
function parseRange(rangeStr: string): number {
  const m = rangeStr.match(/([\d.]+)\s*[–\-]\s*([\d.]+)/);
  if (m) {
    const parsed = parseFloat(m[2]);
    return parsed >= 1 ? Math.min(parsed, 3) : 3;
  }
  return 3;
}
function computeImpact(selected: Set<string>, pcts: Record<string, number>, baseline: number, levers: Palanca[]) {
  return levers
    .filter(l => selected.has(l.id))
    .reduce((acc, l) => acc + (pcts[l.id] || 0) / 100 * baseline, 0);
}
function computeTotalPct(selected: Set<string>, pcts: Record<string, number>, levers: Palanca[]) {
  return levers
    .filter(l => selected.has(l.id))
    .reduce((acc, l) => acc + (pcts[l.id] || 0), 0);
}

function Icon({ name, size = 18, color = "currentColor", sw = 1.6 }: {
  name: string; size?: number; color?: string; sw?: number;
}) {
  const c: React.SVGProps<SVGSVGElement> = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: color, strokeWidth: sw,
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "card":      return <svg {...c}><rect x="2.5" y="5.5" width="19" height="13" rx="2"/><path d="M2.5 10h19"/></svg>;
    case "globe":     return <svg {...c}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case "stack":     return <svg {...c}><rect x="2.5" y="7.5" width="14" height="10" rx="2"/><rect x="7.5" y="3.5" width="14" height="10" rx="2"/></svg>;
    case "refresh":   return <svg {...c}><path d="M3 12a9 9 0 0 1 15-6.7M21 4v5h-5M21 12a9 9 0 0 1-15 6.7M3 20v-5h5"/></svg>;
    case "options":   return <svg {...c}><circle cx="6" cy="8" r="2"/><circle cx="18" cy="16" r="2"/><path d="M9 8h12M3 16h12"/></svg>;
    case "wallet":    return <svg {...c}><path d="M3 7a2 2 0 0 1 2-2h12v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="17" cy="13.5" r="1.2" fill={color}/></svg>;
    case "fire":      return <svg {...c}><path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-1.5.7-2.5.7-2.5S10 11 10 13a2 2 0 0 0 4 0c0-3-2-5-2-10z"/></svg>;
    case "bag":       return <svg {...c}><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
    case "megaphone": return <svg {...c}><path d="M3 10v4l8 4V6L3 10z"/><path d="M11 8l8-4v16l-8-4"/></svg>;
    case "tag":       return <svg {...c}><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="8" cy="8" r="1.4" fill={color}/></svg>;
    case "chart":     return <svg {...c}><path d="M3 20h18M6 16V9M11 16V5M16 16v-7M21 16v-3"/></svg>;
    case "edit":      return <svg {...c}><path d="M4 20h4l11-11-4-4L4 16v4z"/></svg>;
    case "key":       return <svg {...c}><circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M16 6l3 3"/></svg>;
    case "shield":    return <svg {...c}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></svg>;
    case "bolt":      return <svg {...c}><path d="M13 3 4 14h7l-1 7 9-11h-7l1-7z"/></svg>;
    case "link":      return <svg {...c}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></svg>;
    case "qr":        return <svg {...c}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v3M14 21h7"/></svg>;
    case "check":     return <svg {...c}><path d="M5 12l5 5L20 7"/></svg>;
    case "plus":      return <svg {...c}><path d="M12 5v14M5 12h14"/></svg>;
    case "minus":     return <svg {...c}><path d="M5 12h14"/></svg>;
    case "sparkle":   return <svg {...c}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>;
    case "lock":      return <svg {...c}><rect x="4.5" y="11" width="15" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    default:          return <svg {...c}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

function SwitchToggle({ on, onClick, readOnly }: {
  on: boolean; onClick?: () => void; readOnly?: boolean;
}) {
  return (
    <div
      onClick={readOnly ? undefined : onClick}
      style={{
        position: "relative", display: "inline-block",
        width: 38, height: 22, borderRadius: 999,
        background: on ? N : "#C0C0C0",
        cursor: readOnly ? "default" : "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 2,
        left: on ? 18 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 2px rgba(0,0,0,.15)",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

function ContribRow({ label, value, color, total, dim }: {
  label: string; value: number; color: string; total: number; dim?: boolean;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ opacity: dim ? 0.35 : 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 10, alignItems: "center" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "block", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.85)" }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
          {fmtMoney(value)}<span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginLeft: 3 }}>/mes</span>
        </span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,.1)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: color, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function ProductCard({ id, label, icon, iconColor, active, isCurrent, baseline, totalPct, impact, activeCount, barColor, onCardClick, onToggle }: {
  id: string; label: string;
  icon: string; iconColor: string;
  active: boolean; isCurrent: boolean;
  baseline: number; totalPct: number; impact: number; activeCount: number;
  barColor: string;
  onCardClick: () => void;
  onToggle: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onCardClick}
      style={{
        position: "relative",
        display: "flex", alignItems: "center", gap: 14,
        background: !active ? "#F5F5F5" : isCurrent ? (id === "pt" ? "#F0FBFF" : "#F8F4FE") : "#fff",
        border: `2px solid ${!active ? "#E0E0E0" : isCurrent ? barColor : BD}`,
        borderRadius: 12, padding: "14px 18px",
        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        transition: "all 0.15s", overflow: "hidden",
        boxShadow: isCurrent && active ? `0 2px 8px ${barColor}30` : "none",
        width: "100%",
        opacity: active ? 1 : 0.6,
      }}
    >
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center" }}>
        <SwitchToggle on={active} readOnly />
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: iconColor,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon name={icon} size={20} color="#fff" sw={1.6} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: N, fontSize: 15 }}>{label}</div>
        <div style={{ fontSize: 12, color: FG2, marginTop: 2 }}>
          {active
            ? <span>Baseline {fmtMoney(baseline)}/mes · <strong>{activeCount}</strong> palancas activas</span>
            : <span>Inactivo · click en el switch para activar</span>
          }
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, color: GR, fontSize: 17, lineHeight: 1 }}>{fmtSignedPct(totalPct)}</div>
        <div style={{ fontSize: 11, color: FG2, marginTop: 4 }}>{fmtMoney(impact)}/mes</div>
      </div>
      {isCurrent && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: barColor }} />
      )}
    </button>
  );
}

interface Props {
  productos: Productos;
  provData: ProvData;
  provCounts: ProvCounts;
  sharePT: { tpv: number };
  shareOP: { tpv: number };
  propuestaProd: "pt" | "op" | "both";
  setPropuestaProd: (v: "pt" | "op" | "both") => void;
  palancasSel: { pt: Set<string>; op: Set<string> };
  togglePalanca: (sec: "pt" | "op", id: string) => void;
  palancasPct: { pt: Record<string, number>; op: Record<string, number> };
  setPalancaPct: (sec: "pt" | "op", id: string, val: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step6_Propuesta({
  productos, sharePT, shareOP,
  propuestaProd, setPropuestaProd,
  palancasSel, togglePalanca,
  palancasPct, setPalancaPct,
  onNext, onBack,
}: Props) {
  const w = useWindowWidth();
  const showPT = propuestaProd === "pt" || propuestaProd === "both";
  const showOP = propuestaProd === "op" || propuestaProd === "both";
  const [view, setView] = useState<"pt" | "op">(showPT ? "pt" : "op");
  const [scenario, setScenario] = useState<"reservado" | "industria">("reservado");
  const [scenarioModified, setScenarioModified] = useState(false);
  const [subSel, setSubSel] = useState<{ pt: Record<string, string[]>; op: Record<string, string[]> }>({ pt: {}, op: {} });
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const ptImpact     = computeImpact(palancasSel.pt, palancasPct.pt, sharePT.tpv, PALANCAS_PT);
  const opImpact     = computeImpact(palancasSel.op, palancasPct.op, shareOP.tpv, PALANCAS_OP);
  const totalSavings = (showPT ? SAVINGS_MOCK.pt.monthly : 0) + (showOP ? SAVINGS_MOCK.op.monthly : 0);
  const totalValue   = ptImpact + opImpact + totalSavings;
  const totalAnnual  = totalValue * 12;

  const viewLevers  = view === "pt" ? PALANCAS_PT : PALANCAS_OP;
  const viewSel     = view === "pt" ? palancasSel.pt : palancasSel.op;
  const viewPct     = view === "pt" ? palancasPct.pt : palancasPct.op;
  const viewTPV     = view === "pt" ? sharePT.tpv : shareOP.tpv;
  const viewLabel   = view === "pt" ? "Point" : "Online Payments";
  const viewEnabled = view === "pt" ? showPT : showOP;

  const appliedLevers   = viewLevers.filter(l => viewSel.has(l.id));
  const availableLevers = viewLevers.filter(l => !viewSel.has(l.id));

  const handleCardClick = (id: "pt" | "op") => {
    const isActive = id === "pt" ? showPT : showOP;
    if (!isActive) {
      setPropuestaProd(id === "pt" ? (showOP ? "both" : "pt") : (showPT ? "both" : "op"));
      setView(id);
    } else {
      setView(id);
    }
  };

  const handleToggle = (e: React.MouseEvent, id: "pt" | "op") => {
    e.stopPropagation();
    const isActive = id === "pt" ? showPT : showOP;
    if (isActive) {
      if (id === "pt") setPropuestaProd(showOP ? "op" : "op");
      else setPropuestaProd(showPT ? "pt" : "pt");
      const other = id === "pt" ? "op" : "pt";
      if (view === id) setView(other as "pt" | "op");
    } else {
      setPropuestaProd(id === "pt" ? (showOP ? "both" : "pt") : (showPT ? "both" : "op"));
      setView(id);
    }
  };

  const getSubSel = (leverId: string) => subSel[view][leverId] ?? [];

  const toggleSubOpt = (leverId: string, optId: string) => {
    setSubSel(prev => {
      const cur = prev[view][leverId] ?? [];
      const next = cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId];
      return { ...prev, [view]: { ...prev[view], [leverId]: next } };
    });
  };

  const calcSubPct = (lever: Palanca): number => {
    const subs = lever.suboptions ?? [];
    const sel  = subSel[view][lever.id] ?? [];
    if (subs.length > 0 && sel.length > 0) {
      return subs.filter(s => sel.includes(s.id)).reduce((a, s) => a + s.defaultPct, 0);
    }
    return SCENARIO_PCTS[scenario][lever.id] ?? DEFAULT_PCT;
  };

  const addLever = (lever: Palanca) => {
    const pct = calcSubPct(lever);
    togglePalanca(view, lever.id);
    setPalancaPct(view, lever.id, pct);
    setExpandedSub(null);
  };

  const removeLever = (id: string) => {
    setPalancaPct(view, id, 0);
    togglePalanca(view, id);
  };

  const updatePct = (id: string, val: number) => {
    setPalancaPct(view, id, val);
    setScenarioModified(true);
  };

  const handleScenarioChange = (s: "reservado" | "industria") => {
    setScenario(s);
    setScenarioModified(false);
    setExpandedSub(null);

    if (s === "reservado") {
      Array.from(palancasSel.pt).forEach(id => togglePalanca("pt", id));
      RESERVADO_PRESELECT_PT.forEach(({ id, pct, subIds }) => {
        togglePalanca("pt", id);
        setPalancaPct("pt", id, pct);
        if (subIds) {
          setSubSel(prev => ({ ...prev, pt: { ...prev.pt, [id]: subIds } }));
        }
      });
      const pcts = SCENARIO_PCTS[s];
      Object.entries(pcts).forEach(([id, val]) => setPalancaPct("op", id, val));
    } else {
      const pcts = SCENARIO_PCTS[s];
      Object.entries(pcts).forEach(([id, val]) => {
        setPalancaPct("pt", id, val);
        setPalancaPct("op", id, val);
      });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: N, margin: "0 0 6px" }}>
          ¿Cómo vamos a monetizar la Propuesta de Valor?
        </h2>
      </div>

      {/* Hero summary */}
      <div style={{
        background: N, borderRadius: 14, padding: "28px 32px 24px",
        margin: "0 0 18px", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -60, top: -60,
          width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,230,0,0.15), transparent 70%)",
        }} />
        <div style={{ display: "grid", gridTemplateColumns: w >= 768 ? "1.1fr 1.4fr" : "1fr", gap: 36, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.65)", letterSpacing: "0.08em" }}>
              INCREMENTAL DE VENTAS ENTREGADO AL SELLER
            </div>
            <div style={{ fontSize: w >= 768 ? 52 : 36, fontWeight: 800, color: "#FFE600", letterSpacing: "-0.025em", lineHeight: 1, marginTop: 10 }}>
              {fmtMoney(totalValue)}
              <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,230,0,.7)", marginLeft: 6 }}>/mes</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 8 }}>
              {fmtMoney(totalAnnual)} anual
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
            <ContribRow label="Point · crecimiento"              value={ptImpact}     color={BL} total={totalValue} dim={!showPT} />
            <ContribRow label="Online Payments · crecimiento"    value={opImpact}     color={PU} total={totalValue} dim={!showOP} />
            <ContribRow label="Ahorros estimados (mock)"         value={totalSavings} color={T}  total={totalValue} />
          </div>
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 18, background: "rgba(255,255,255,.08)" }}>
          <div style={{ flex: ptImpact || 0.001, background: BL, transition: "flex 0.3s" }} />
          <div style={{ flex: opImpact || 0.001, background: PU, transition: "flex 0.3s" }} />
          <div style={{ flex: totalSavings || 0.001, background: T, transition: "flex 0.3s" }} />
        </div>
      </div>

      {/* Section 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 12px" }}>
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "#E0E0E0", color: "#888",
          fontWeight: 800, fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>1</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: N }}>¿En qué productos va a incrementar la venta?</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        {productos.point && (
          <ProductCard
            id="pt" label="Point" icon="card" iconColor={BL}
            active={showPT} isCurrent={view === "pt" && showPT}
            baseline={sharePT.tpv}
            totalPct={computeTotalPct(palancasSel.pt, palancasPct.pt, PALANCAS_PT)}
            impact={ptImpact}
            activeCount={palancasSel.pt.size}
            barColor={BL}
            onCardClick={() => handleCardClick("pt")}
            onToggle={e => handleToggle(e, "pt")}
          />
        )}
        {productos.op && (
          <ProductCard
            id="op" label="Online Payments" icon="globe" iconColor={PU}
            active={showOP} isCurrent={view === "op" && showOP}
            baseline={shareOP.tpv}
            totalPct={computeTotalPct(palancasSel.op, palancasPct.op, PALANCAS_OP)}
            impact={opImpact}
            activeCount={palancasSel.op.size}
            barColor={PU}
            onCardClick={() => handleCardClick("op")}
            onToggle={e => handleToggle(e, "op")}
          />
        )}
      </div>

      {/* Section 2: Scenario */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 18px", flexWrap: "wrap" as const }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "#E0E0E0", color: "#888", fontWeight: 700, fontSize: 11,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>2</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: N }}>¿Qué escenario quieres plantear?</span>
        <div style={{
          display: "inline-flex", background: BG2, border: `1px solid ${BD}`,
          borderRadius: 999, padding: 3, gap: 2,
        }}>
          {(["reservado", "industria"] as const).map(s => (
            <button
              key={s}
              onClick={() => handleScenarioChange(s)}
              style={{
                padding: "5px 14px", borderRadius: 999, border: 0, cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: scenario === s ? 700 : 400,
                background: scenario === s ? N : "transparent",
                color: scenario === s ? "#fff" : FG2,
                transition: "all 0.15s",
              }}
            >
              {s === "reservado" ? "Reservado" : "Industria"}
            </button>
          ))}
        </div>
        {scenarioModified && (
          <span style={{ fontSize: 10, color: MU, fontStyle: "italic" }}>* Datos modificados</span>
        )}
      </div>

      {/* Tab bar */}
      {(showPT || showOP) && (
        <div style={{ display: "flex", borderBottom: `1px solid ${BD}`, marginBottom: 16 }}>
          {showPT && (
            <button
              onClick={() => setView("pt")}
              style={{
                padding: "9px 20px", background: "none", border: 0, cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: view === "pt" ? 600 : 400,
                color: view === "pt" ? "#555" : "#AAAAAA",
                borderBottom: `2px solid ${view === "pt" ? "#888" : "transparent"}`,
                marginBottom: -1, transition: "all 0.15s",
              }}
            >Point</button>
          )}
          {showOP && (
            <button
              onClick={() => setView("op")}
              style={{
                padding: "9px 20px", background: "none", border: 0, cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: view === "op" ? 600 : 400,
                color: view === "op" ? "#555" : "#AAAAAA",
                borderBottom: `2px solid ${view === "op" ? "#888" : "transparent"}`,
                marginBottom: -1, transition: "all 0.15s",
              }}
            >Online Payments</button>
          )}
        </div>
      )}

      {/* Builder */}
      {viewEnabled ? (
        <div style={{ display: "grid", gridTemplateColumns: w >= 1024 ? "320px 1fr" : w >= 768 ? "280px 1fr" : "1fr", gap: 14 }}>

          {/* Catalog sidebar */}
          <aside style={{
            background: "#fff", border: `1px solid ${BD}`, borderRadius: 12,
            padding: "14px 12px", alignSelf: "start",
            position: "sticky", top: 12,
            maxHeight: w < 768 ? 340 : 720, display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "0 6px 10px", borderBottom: `1px solid ${BD}`, marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MU, letterSpacing: "0.08em" }}>CATÁLOGO</div>
              <div style={{ fontWeight: 700, color: N, fontSize: 14, marginTop: 2 }}>Agregar palancas</div>
              <div style={{ fontSize: 11, color: FG2, marginTop: 3, marginBottom: 8 }}>
                {availableLevers.length} disponibles · {viewLabel}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px 10px" }}>
                {(Object.entries(CAT_META) as [PalancaCategory, typeof CAT_META[PalancaCategory]][]).map(([key, meta]) => (
                  <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: FG2 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, display: "inline-block" }} />
                    {meta.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
              {availableLevers.length === 0 && (
                <div style={{ fontSize: 12, color: MU, padding: "16px 8px", textAlign: "center", fontStyle: "italic" }}>
                  Todas las palancas aplicadas
                </div>
              )}

              {(["producto", "innovacion", "marketing"] as PalancaCategory[]).map(cat => {
                const catLevers = availableLevers.filter(l => (l.category ?? "producto") === cat);
                if (catLevers.length === 0) return null;
                const meta = CAT_META[cat];
                return (
                  <div key={cat}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px 4px" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: meta.color, textTransform: "uppercase" as const }}>
                        {meta.label}
                      </span>
                    </div>
                    {catLevers.map(lever => {
                      const hasSubs = (lever.suboptions?.length ?? 0) > 0;
                      const isExpanded = expandedSub === lever.id;
                      const selSubs = getSubSel(lever.id);
                      return (
                        <div key={lever.id}>
                          <button
                            onClick={() => hasSubs ? setExpandedSub(isExpanded ? null : lever.id) : addLever(lever)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 8,
                              padding: "7px 8px", background: isExpanded ? meta.bg : "transparent",
                              border: 0, borderRadius: 8, cursor: "pointer",
                              textAlign: "left" as const, fontFamily: "inherit", transition: "background 0.12s",
                            }}
                            onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = meta.bg; }}
                            onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: meta.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name={lever.icon} size={14} color={meta.color} sw={1.6} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: N, fontSize: 12, lineHeight: 1.2 }}>{lever.label}</div>
                              <div style={{ fontSize: 10, color: MU, marginTop: 1, lineHeight: 1.3 }}>
                                {lever.desc ? lever.desc.slice(0, 40) + (lever.desc.length > 40 ? "…" : "") : `↑ ${lever.range}`}
                              </div>
                            </div>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: hasSubs ? (isExpanded ? meta.color : "#C0C0C0") : "#C0C0C0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon name={hasSubs ? (isExpanded ? "minus" : "plus") : "plus"} size={12} color="#fff" sw={2} />
                            </div>
                          </button>

                          {hasSubs && isExpanded && (
                            <div style={{ background: meta.bg, border: `1px solid ${BD}`, borderRadius: 8, padding: "10px 12px", margin: "2px 0 4px" }}>
                              <div style={{ fontSize: 9, fontWeight: 800, color: meta.color, letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                                Selecciona las opciones
                              </div>
                              {lever.suboptions!.map(opt => {
                                const isSel = selSubs.includes(opt.id);
                                return (
                                  <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                                    <div
                                      onClick={() => toggleSubOpt(lever.id, opt.id)}
                                      style={{
                                        width: 16, height: 16, borderRadius: 4,
                                        border: `2px solid ${isSel ? meta.color : "#C0C0C0"}`,
                                        background: isSel ? meta.color : "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, cursor: "pointer", transition: "all 0.12s",
                                      }}
                                    >
                                      {isSel && <Icon name="check" size={10} color="#fff" sw={2.8} />}
                                    </div>
                                    <span style={{ fontSize: 12, color: N, flex: 1 }}>{opt.label}</span>
                                    <span style={{ fontSize: 10, color: meta.color, fontWeight: 600 }}>+{opt.defaultPct}%</span>
                                  </label>
                                );
                              })}
                              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                                <button
                                  onClick={() => addLever(lever)}
                                  disabled={selSubs.length === 0}
                                  style={{
                                    flex: 1, padding: "6px 0",
                                    background: selSubs.length > 0 ? meta.color : "#D0D0D0",
                                    color: "#fff", border: 0, borderRadius: 6,
                                    cursor: selSubs.length > 0 ? "pointer" : "default",
                                    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                                  }}
                                >
                                  {`Agregar${selSubs.length > 0 ? ` (${lever.suboptions!.filter(s => selSubs.includes(s.id)).reduce((a, s) => a + s.defaultPct, 0).toFixed(2)}%)` : ""}`}
                                </button>
                                <button
                                  onClick={() => addLever(lever)}
                                  style={{ padding: "6px 10px", background: "transparent", color: MU, border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
                                  title="Agregar sin sub-opciones"
                                >Default</button>
                                <button
                                  onClick={() => setExpandedSub(null)}
                                  style={{ padding: "6px 8px", background: "transparent", color: MU, border: `1px solid ${BD}`, borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}
                                >✕</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Applied main panel */}
          <div style={{ background: "#fff", border: `1px solid ${BD}`, borderRadius: 12, padding: "22px 24px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              paddingBottom: 14, borderBottom: `1px solid ${BD}`, marginBottom: 16,
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: N }}>
                  Palancas aplicadas a {viewLabel}
                </h3>
                <div style={{ fontSize: 12, color: FG2, marginTop: 4 }}>
                  Baseline {fmtMoney(viewTPV)}/mes · {appliedLevers.length} configuradas
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: GR, lineHeight: 1 }}>
                  {fmtSignedPct(computeTotalPct(viewSel, viewPct, viewLevers))}
                </div>
                <div style={{ fontSize: 13, color: FG2, marginTop: 4 }}>
                  {fmtMoney(computeImpact(viewSel, viewPct, viewTPV, viewLevers))}/mes
                </div>
              </div>
            </div>

            {appliedLevers.length === 0 ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 14, justifyContent: "center",
                background: "#F9F9F9", border: "1px dashed #D9D9D9", borderRadius: 10,
                padding: 30, color: FG2, fontSize: 13,
              }}>
                <Icon name="sparkle" size={22} color="#0B5394" sw={1.6} />
                <div>Agregá palancas del catálogo de la izquierda para empezar</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
                {appliedLevers.map(lever => {
                  const pct = viewPct[lever.id] || 0;
                  const impact = pct / 100 * viewTPV;
                  const maxRange = Math.max(parseRange(lever.range), pct);
                  const sliderBg = `linear-gradient(to right, ${N} 0%, ${N} ${(pct / maxRange) * 100}%, #EFEFEF ${(pct / maxRange) * 100}%, #EFEFEF 100%)`;
                  const catKey = (lever.category ?? "producto") as PalancaCategory;
                  const catM = CAT_META[catKey];
                  const selSubIds = subSel[view][lever.id] ?? [];
                  return (
                    <div key={lever.id} style={{ background: "#FAFBFC", border: `1px solid ${BD}`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: catM.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon name={lever.icon} size={16} color={catM.color} sw={1.6} />
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                              <div style={{ fontWeight: 700, color: N, fontSize: 14 }}>{lever.label}</div>
                              <span style={{ fontSize: 9, fontWeight: 700, color: catM.color, background: catM.bg, borderRadius: 4, padding: "2px 6px", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>{catM.label}</span>
                            </div>
                            {selSubIds.length > 0 ? (
                              <div style={{ fontSize: 11, color: T, marginTop: 1 }}>
                                {selSubIds.map(id => lever.suboptions?.find(s => s.id === id)?.label ?? id).join(" · ")}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: FG2 }}>↑ {lever.range}</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeLever(lever.id)}
                          title="Quitar palanca"
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            border: "1px solid #FCE8E6", background: "#fff", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#FCE8E6")}
                          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                        >
                          <Icon name="minus" size={14} color="#C30C3E" sw={2.4} />
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: w >= 600 ? "1fr 90px 90px" : "1fr 80px", gap: 10, alignItems: "center" }}>
                        <div style={{ minWidth: 0 }}>
                          <input
                            type="range"
                            min={0} max={maxRange} step={0.1}
                            value={pct}
                            onChange={e => updatePct(lever.id, parseFloat(e.target.value))}
                            style={{
                              width: "100%", height: 6, borderRadius: 999, outline: 0, cursor: "pointer",
                              WebkitAppearance: "none", appearance: "none",
                              background: sliderBg,
                            } as React.CSSProperties}
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: MU }}>
                            <span>0%</span><span>{maxRange}%</span>
                          </div>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          background: "#fff", border: "1px solid #D9D9D9", borderRadius: 8, padding: "6px 10px",
                        }}>
                          <input
                            type="number" step={0.1}
                            value={pct}
                            onChange={e => updatePct(lever.id, parseFloat(e.target.value) || 0)}
                            style={{
                              width: 50, border: 0, outline: 0, fontFamily: "inherit",
                              fontSize: 16, fontWeight: 700, color: N,
                              textAlign: "right", background: "transparent",
                            } as React.CSSProperties}
                          />
                          <span style={{ fontSize: 12, color: MU }}>%</span>
                        </div>
                        {w >= 600 && (
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: GR, fontSize: 18, lineHeight: 1 }}>{fmtMoney(impact)}</div>
                            <div style={{ fontSize: 11, color: MU, marginTop: 2 }}>/mes</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: "#F9F9F9", border: "1px dashed #D9D9D9", borderRadius: 12,
          padding: 22, display: "flex", alignItems: "center", gap: 14, color: FG2, margin: "18px 0",
        }}>
          <Icon name="lock" size={20} color={MU} sw={1.6} />
          <div>
            <strong>{viewLabel}</strong> está desactivado.
            <button
              onClick={() => {
                if (view === "pt") setPropuestaProd(showOP ? "both" : "pt");
                else setPropuestaProd(showPT ? "both" : "op");
              }}
              style={{
                background: "transparent", border: 0, color: "#0B5394",
                cursor: "pointer", fontWeight: 600, marginLeft: 8,
                fontFamily: "inherit", fontSize: 13,
              }}
            >
              Activar producto
            </button>
          </div>
        </div>
      )}

      {/* Nav footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        paddingTop: 32, marginTop: 28, borderTop: `1px solid ${BD}`,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: MU, letterSpacing: "0.08em", marginBottom: 8 }}>
            PASO ANTERIOR
          </div>
          <button
            onClick={onBack}
            style={{
              background: "#fff", border: "1px solid #D9D9D9", padding: "12px 22px",
              borderRadius: 6, fontWeight: 600, color: N, cursor: "pointer",
              fontFamily: "inherit", fontSize: 14,
            }}
          >← Comisiones</button>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: MU, letterSpacing: "0.08em", marginBottom: 8, textAlign: "right" }}>
            FINALIZAR
          </div>
          <button
            onClick={onNext}
            style={{
              background: BL, border: 0, padding: "13px 28px",
              borderRadius: 6, fontWeight: 700, color: "#fff", cursor: "pointer",
              fontFamily: "inherit", fontSize: 14,
            }}
          >Generar propuesta</button>
        </div>
      </div>
    </div>
  );
}
