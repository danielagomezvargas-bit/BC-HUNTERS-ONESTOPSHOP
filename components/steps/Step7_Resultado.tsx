"use client";
import { useState } from "react";
import type { Negocio, Productos, ShareState, ComOTRow, ComMSIRow } from "@/types";
import { PALANCAS_PT, PALANCAS_OP } from "@/data/constants";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import DownloadModal from "@/components/DownloadModal";
import SlideComisionesModal from "@/components/SlideComisionesModal";
import GanttModal from "@/components/GanttModal";

// ── Andes X color tokens ─────────────────────────────────────
const YEL  = "#FFE600";
const NAVY = "#0E1B3D";
const ACC  = "#434CE4";          // blue-accent
const ACCT = "#ECEDFC";          // blue-accent-tint
const POS  = "#00A650";          // positive
const POST = "#E5F6EC";          // positive-tint
const G040 = "#F7F7F7";
const G070 = "#F0F0F0";
const G150 = "#E5E5E5";          // border-default
const G200 = "#CCCCCC";
const G400 = "#999999";          // fg-tertiary
const G600 = "#666666";          // fg-secondary
const G900 = "#1A1A1A";          // fg-primary

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");
const fmtC = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000)     return "$" + Math.round(n / 1_000) + "K";
  return "$" + Math.round(n).toLocaleString("es-MX");
};

// ── Icon (Andes stroke icons) ─────────────────────────────────
function Icon({ name, size = 18, color = "currentColor", sw = 2 }: {
  name: string; size?: number; color?: string; sw?: number;
}) {
  const p: Record<string, React.ReactNode> = {
    check:        <polyline points="20 6 9 17 4 12" />,
    close:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    plus:         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    minus:        <line x1="5" y1="12" x2="19" y2="12" />,
    download:     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    presentation: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    calendar:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    chart:        <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
    chevron:      <polyline points="6 9 12 15 18 9" />,
    external:     <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    trend:        <><polyline points="3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></>,
    sparkle:      <><path d="M12 3l1.8 5.5L19 10l-5.2 1.5L12 17l-1.8-5.5L5 10l5.2-1.5z"/></>,
    info:         <><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {p[name] ?? <circle cx="12" cy="12" r="9"/>}
    </svg>
  );
}

// ── Yellow header ─────────────────────────────────────────────
function YellowHeader({ empresa, logo, palancas, monthlyGain, w }: {
  empresa: string; logo?: string | null; palancas: number; monthlyGain: number; w: number;
}) {
  return (
    <div style={{ background: YEL, padding: w >= 768 ? "44px 48px 76px" : "32px 24px 68px", position: "relative", margin: "-32px -36px 0" }}>

      {/* Headline: icono de tendencia + texto */}
      <div style={{ display: "flex", alignItems: "center", gap: w >= 768 ? 28 : 18, maxWidth: 1080 }}>
        {/* Icono de crecimiento o pérdida */}
        <div style={{
          flexShrink: 0,
          width: w >= 768 ? 72 : 52, height: w >= 768 ? 72 : 52,
          borderRadius: 16,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
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

        {/* Texto — dos líneas explícitas */}
        <div>
          <div style={{ fontSize: w >= 768 ? 50 : 30, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.04 }}>
            Estarás generando {monthlyGain >= 0 ? "+" : "−"}{fmtC(Math.abs(monthlyGain))} al mes
          </div>
          <div style={{ fontSize: w >= 768 ? 26 : 18, fontWeight: 600, color: "rgba(0,0,0,0.6)", marginTop: 8 }}>
            a tu seller: {empresa}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 4, background: "linear-gradient(90deg, transparent 0%, #B8A500 20%, #B8A500 80%, transparent 100%)" }} />
    </div>
  );
}

// ── Info tooltip button ───────────────────────────────────────
function InfoBtn({ content, accent }: { content: React.ReactNode; accent?: boolean }) {
  const [vis, setVis] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onMouseEnter={() => setVis(true)}
        onMouseLeave={() => setVis(false)}
        onFocus={() => setVis(true)}
        onBlur={() => setVis(false)}
        style={{
          width: 18, height: 18, borderRadius: "50%",
          background: accent ? "rgba(255,255,255,0.15)" : G070,
          border: accent ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${G150}`,
          color: accent ? "rgba(255,255,255,0.55)" : G400,
          fontSize: 10, fontWeight: 700, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontFamily: "inherit", padding: 0,
        }}
        aria-label="Ver desglose"
      >?</button>
      {vis && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: G900, color: "white",
          borderRadius: 8, padding: "10px 13px",
          fontSize: 12, lineHeight: 1.5,
          width: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          zIndex: 50, pointerEvents: "none",
          whiteSpace: "normal" as const,
        }}>
          {content}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `5px solid ${G900}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ── Equation card ─────────────────────────────────────────────
function EquationCard({ chip, label, big, sub, accent = false, style: extraStyle }: {
  chip: React.ReactNode; label?: string; big: React.ReactNode; sub: React.ReactNode; accent?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: accent ? NAVY : "white",
      color: accent ? "white" : "inherit",
      borderRadius: 14, padding: "22px 24px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      border: accent ? "none" : `1px solid ${G150}`,
      display: "flex", flexDirection: "column", gap: 10,
      minHeight: 200,
      ...extraStyle,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: accent ? "rgba(255,230,0,0.15)" : G070,
          color: accent ? YEL : G600,
          padding: "4px 10px", borderRadius: 999,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const,
        }}>{chip}</div>
        <InfoBtn content={sub} accent={accent} />
      </div>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 600, color: accent ? "rgba(255,255,255,0.7)" : G600 }}>{label}</div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: accent ? "center" : "flex-start" }}>
        {big}
      </div>
    </div>
  );
}

function Operator({ symbol }: { symbol: string }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: "50%", background: "white",
      border: `1px solid ${G150}`, boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 800, color: G600,
      alignSelf: "center", flexShrink: 0,
    }}>{symbol}</div>
  );
}

// ── Collapsible accordion ────────────────────────────────────
function Collapsible({ title, badge, totalLabel, totalValue, deltaValue, defaultOpen = false, children }: {
  title: string; badge?: string; totalLabel: string; totalValue: string;
  deltaValue: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${G150}`, borderRadius: 12, marginBottom: 12, background: "white", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 18, alignItems: "center",
        padding: "16px 20px", border: "none", background: "transparent", width: "100%", cursor: "pointer",
        fontFamily: "inherit", textAlign: "left" as const,
      }}>
        <span style={{
          width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center",
          transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: G600,
        }}>
          <Icon name="chevron" size={18} />
        </span>
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
            {badge && (
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const, background: G070, color: G600, padding: "3px 8px", borderRadius: 999 }}>{badge}</span>
            )}
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

// ── Product table ─────────────────────────────────────────────
type TableRow = { name: string; vol: number; now: number; mp: number; save: number };
function ProductTable({ rows }: { rows: TableRow[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ color: G400, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
          {["Producto","Volumen / mes","Tasa actual","Tasa MP","Comisión actual","Comisión MP","Δ %","Ahorro / mes"].map(h => (
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

// ── Value-added table ─────────────────────────────────────────
type VARow = { name: string; incrPct: number; gain: number };
function ValueAddedTable({ rows }: { rows: VARow[] }) {
  if (rows.length === 0) {
    return <div style={{ fontSize: 13, color: G600, padding: "16px 0", fontStyle: "italic" }}>Sin palancas seleccionadas para este producto.</div>;
  }
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

// ── Channel toggle ────────────────────────────────────────────
function ChannelToggle({ value, onChange }: { value: "pt" | "op"; onChange: (v: "pt" | "op") => void }) {
  const opts: { k: "pt" | "op"; l: string; desc: string; bg: string; fg: string; icon: React.ReactNode }[] = [
    {
      k: "pt", l: "Point", desc: "Terminales físicas en sucursal",
      bg: YEL, fg: NAVY,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="13" rx="2"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="20" x2="16" y2="20"/>
          <line x1="12" y1="17" x2="12" y2="20"/>
        </svg>
      ),
    },
    {
      k: "op", l: "Online Payments", desc: "Checkout web / digital",
      bg: NAVY, fg: "white",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="14" rx="2"/>
          <line x1="2" y1="9" x2="22" y2="9"/>
          <circle cx="6" cy="13.5" r="1" fill="currentColor"/>
          <line x1="10" y1="13.5" x2="18" y2="13.5"/>
        </svg>
      ),
    },
  ];
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8, gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: G400 }}>
          Selección de producto
        </span>
        <span style={{ fontSize: 11, color: G400 }}>El desglose se actualiza al cambiar</span>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
        background: "white", border: `1px solid ${G150}`,
        borderRadius: 14, padding: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        {opts.map(o => {
          const active = value === o.k;
          return (
            <button key={o.k} onClick={() => onChange(o.k)} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px",
              border: "none", borderRadius: 10,
              background: active ? o.bg : "transparent",
              color: active ? o.fg : "inherit",
              cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const,
              transition: "background 160ms",
              boxShadow: active ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            }}>
              <span style={{
                width: 38, height: 38, borderRadius: 8,
                background: active ? (o.k === "pt" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)") : G070,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: active ? o.fg : G600, flexShrink: 0,
              }}>{o.icon}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", color: active ? o.fg : G900 }}>{o.l}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? (o.k === "pt" ? "rgba(14,27,61,0.7)" : "rgba(255,255,255,0.75)") : G400 }}>{o.desc}</span>
              </div>
              {active && (
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 800, color: o.fg, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: o.k === "pt" ? POS : YEL }} />
                  Activo
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Next steps ────────────────────────────────────────────────
function NextSteps({ onDownload, onGantt, onSlide }: { onDownload: () => void; onGantt: () => void; onSlide: () => void }) {
  const items = [
    { t: "Descarga el ejercicio de monetización para enviar al seller", d: "PDF / EXCEL\nLink para compartir\nE-mail", icon: "download", action: onDownload },
    { t: "Slide de comisiones",                      d: "Prepara en automático el Slide a incluir en tu presentación con el Seller", icon: "presentation", action: onSlide },
    { t: "Gantt — Cronograma de despliegue",         d: "Plan de implementación personalizado para tu seller.", icon: "calendar", action: onGantt },
  ];
  return (
    <div style={{ marginTop: 24, background: "white", border: `1px solid ${G150}`, borderRadius: 14, padding: "24px 28px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: G600, marginBottom: 6 }}>Próximos pasos</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 16px" }}>¿Cómo más te puedo ayudar?</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {items.map((it, i) => (
          <button key={i}
            onClick={it.action}
            style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              background: G040, border: `1px solid ${G150}`,
              borderRadius: 12, padding: "16px 18px", cursor: "pointer", fontFamily: "inherit",
              textAlign: "left" as const, transition: "all 200ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#FFFCE5"; e.currentTarget.style.borderColor = YEL; }}
            onMouseLeave={e => { e.currentTarget.style.background = G040; e.currentTarget.style.borderColor = G150; }}
          >
            <span style={{ width: 38, height: 38, borderRadius: 10, background: "white", border: `1px solid ${G150}`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: G900, flexShrink: 0 }}>
              <Icon name={it.icon} size={18} />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{it.t}</span>
              <span style={{ display: "block", fontSize: 12, color: G600, lineHeight: 1.6, whiteSpace: "pre-line" as const }}>{it.d}</span>
            </span>
            <span style={{ color: G400, fontWeight: 700, fontSize: 16, alignSelf: "center" }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Internal footer ───────────────────────────────────────────
function InternalFooter() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 24, background: G040, border: `1px solid ${G150}`, borderRadius: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        background: "transparent", border: "none", padding: "14px 20px", cursor: "pointer",
        fontFamily: "inherit", textAlign: "left" as const,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "#E8EEF8", color: "#8A98C0", padding: "3px 8px", borderRadius: 4 }}>Uso interno</span>
        <span style={{ fontSize: 13, color: G600 }}>Información de soporte y comparativos para el ejecutivo</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: G600 }}>
          <Icon name="chevron" size={16} />
        </span>
      </button>
      {open && (
        <div style={{ padding: "14px 20px 18px", borderTop: `1px solid ${G150}`, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: G600, lineHeight: 1.5 }}>
            Compara esta propuesta contra peers del mismo segmento e industria. No visible para el seller.
          </div>
          <a href="/benchmark" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: ACC,
            background: "transparent", border: `1px solid ${ACC}`,
            padding: "7px 12px", borderRadius: 6, textDecoration: "none",
          }}>
            Ir al Benchmark <Icon name="external" size={14} color={ACC} />
          </a>
        </div>
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface Props {
  negocio: Negocio;
  productos: Productos;
  sharePT: ShareState;
  shareOP: ShareState;
  comPT_OT: ComOTRow[];
  comPT_MSI: ComMSIRow[];
  comOP_OT: ComOTRow[];
  comOP_MSI: ComMSIRow[];
  palancasSel: { pt: Set<string>; op: Set<string> };
  palancasPct: { pt: Record<string, number>; op: Record<string, number> };
  onBack: () => void;
}

// ── Helper computations ───────────────────────────────────────
function computeOTRows(tpv: number, comOT: ComOTRow[]): TableRow[] {
  return comOT
    .filter(r => r.mp !== null && r.cu > (r.mp ?? r.cu))
    .map(r => ({
      name: r.l,
      vol:  Math.round(tpv * r.sh),
      now:  r.cu,
      mp:   r.mp ?? r.cu,
      save: Math.round(tpv * r.sh * (r.cu - (r.mp ?? r.cu)) / 100),
    }))
    .filter(r => r.vol > 0 && r.save > 0);
}

// MSI total = tasa TC (crédito) + sobretasa.
// La sobretasa es adicional a la comisión de pagar con crédito.
function computeMSIRows(tpv: number, comMSI: ComMSIRow[], tcCu = 0, tcMp = 0): TableRow[] {
  return comMSI
    .filter(r => (tcCu + r.sb) > (tcMp + r.sm))
    .map(r => ({
      name: r.l,
      vol:  Math.round(tpv * r.sh),
      now:  tcCu + r.sb,                                                          // TC actual + sobretasa actual
      mp:   tcMp + r.sm,                                                          // TC MP + sobretasa MP
      save: Math.round(tpv * r.sh * ((tcCu + r.sb) - (tcMp + r.sm)) / 100),
    }))
    .filter(r => r.vol > 0 && r.save > 0);
}

const sumSave = (rows: TableRow[]) => rows.reduce((a, r) => a + r.save, 0);

// ── Main ──────────────────────────────────────────────────────
export default function Step7_Resultado({
  negocio, productos,
  sharePT, shareOP,
  comPT_OT, comPT_MSI, comOP_OT, comOP_MSI,
  palancasSel, palancasPct,
  onBack,
}: Props) {
  const w = useWindowWidth();
  const [channel, setChannel] = useState<"pt" | "op">("pt");
  const [showDetail, setShowDetail] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showGantt,         setShowGantt]         = useState(false);
  const [showSlide,         setShowSlide]         = useState(false);

  const empresa = negocio.nombre || "Hospital Auna";
  const palancasCount = palancasSel.pt.size + palancasSel.op.size;

  // Commission savings — MSI: tasa total = TC crédito + sobretasa
  const ptTC_cu = comPT_OT.find(r => r.l === "T. Crédito")?.cu ?? 0;
  const ptTC_mp = comPT_OT.find(r => r.l === "T. Crédito")?.mp ?? 0;
  const opTC_cu = comOP_OT.find(r => r.l === "T. Crédito")?.cu ?? 0;
  const opTC_mp = comOP_OT.find(r => r.l === "T. Crédito")?.mp ?? 0;

  const ptOT  = productos.point ? computeOTRows(sharePT.tpv, comPT_OT) : [];
  const ptMSI = productos.point ? computeMSIRows(sharePT.tpv, comPT_MSI, ptTC_cu, ptTC_mp) : [];
  const opOT  = productos.op   ? computeOTRows(shareOP.tpv, comOP_OT) : [];
  const opMSI = productos.op   ? computeMSIRows(shareOP.tpv, comOP_MSI, opTC_cu, opTC_mp) : [];

  const ptOTTotal  = sumSave(ptOT);
  const ptMSITotal = sumSave(ptMSI);
  const opOTTotal  = sumSave(opOT);
  const opMSITotal = sumSave(opMSI);

  const saveOneShot = ptOTTotal + opOTTotal;
  const saveMSI_val = ptMSITotal + opMSITotal;
  const totalSave   = saveOneShot + saveMSI_val;

  // Incremental from palancas
  const ptImpact = PALANCAS_PT.filter(l => palancasSel.pt.has(l.id))
    .reduce((acc, l) => acc + (palancasPct.pt[l.id] || 0) / 100 * sharePT.tpv, 0);
  const opImpact = PALANCAS_OP.filter(l => palancasSel.op.has(l.id))
    .reduce((acc, l) => acc + (palancasPct.op[l.id] || 0) / 100 * shareOP.tpv, 0);
  const incrSalesMxn = ptImpact + opImpact;
  const baseTpv = sharePT.tpv + shareOP.tpv;
  const incrSalesPct = baseTpv > 0 ? (incrSalesMxn / baseTpv) * 100 : 0;

  const monthlyGain = totalSave + incrSalesMxn;
  const annualGain  = monthlyGain * 12;

  // Weighted rate delta
  const rateDiffPp = baseTpv > 0
    ? [...comPT_OT, ...comOP_OT].reduce((acc, r) => {
        const tpv = r.l.includes("Online") || comOP_OT.includes(r) ? shareOP.tpv : sharePT.tpv;
        return acc + (r.mp !== null ? r.sh * (r.cu - (r.mp ?? r.cu)) : 0);
      }, 0)
    : 0;

  // Value-added rows by channel
  const ptVA: VARow[] = PALANCAS_PT.filter(l => palancasSel.pt.has(l.id)).map(l => ({
    name:    l.label,
    incrPct: palancasPct.pt[l.id] || 0,
    gain:    Math.round((palancasPct.pt[l.id] || 0) / 100 * sharePT.tpv),
  }));
  const opVA: VARow[] = PALANCAS_OP.filter(l => palancasSel.op.has(l.id)).map(l => ({
    name:    l.label,
    incrPct: palancasPct.op[l.id] || 0,
    gain:    Math.round((palancasPct.op[l.id] || 0) / 100 * shareOP.tpv),
  }));

  const curOT  = channel === "pt" ? ptOT  : opOT;
  const curMSI = channel === "pt" ? ptMSI : opMSI;
  const curVA  = channel === "pt" ? ptVA  : opVA;
  const curOTTotal  = channel === "pt" ? ptOTTotal  : opOTTotal;
  const curMSITotal = channel === "pt" ? ptMSITotal : opMSITotal;
  const curVATotal  = (channel === "pt" ? ptVA : opVA).reduce((a, r) => a + r.gain, 0);
  const curVAPct    = (channel === "pt" ? ptVA : opVA).reduce((a, r) => a + r.incrPct, 0);

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Yellow header — negative margins to escape card padding */}
      <YellowHeader empresa={empresa} logo={negocio.logo} palancas={palancasCount} monthlyGain={monthlyGain} w={w} />

      {/* Content — pulled up with negative margin like the HTML */}
      <div style={{ margin: "-44px 0 0", position: "relative" }}>

        {/* Top equation */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: w >= 900
              ? "minmax(0,0.9fr) auto minmax(0,0.9fr) auto minmax(0,1.5fr)"
              : w >= 640 ? "1fr 1fr" : "1fr",
            gap: 12, alignItems: "stretch",
          }}>
            <EquationCard
              chip={`−${rateDiffPp.toFixed(2)}%`}
              label="Ahorro mensual en tasas"
              big={
                <div style={{ fontSize: 46, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: POS, lineHeight: 1 }}>
                  {fmtC(totalSave)}
                </div>
              }
              sub={<>Suma de <strong>{fmt(saveOneShot)}</strong> en pagos de contado + <strong>{fmt(saveMSI_val)}</strong> en meses sin intereses.</>}
            />
            {w >= 900 && <Operator symbol="+" />}
            <EquationCard
              chip={`+${incrSalesPct.toFixed(1)}%`}
              label="Incremental en ventas"
              big={
                <div style={{ fontSize: 46, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: ACC, lineHeight: 1 }}>
                  {fmtC(incrSalesMxn)}
                </div>
              }
              sub={<>Volumen adicional desbloqueado por las palancas de valor agregado.</>}
            />
            {w >= 900 && <Operator symbol="=" />}
            <EquationCard
              accent
              style={{ gridColumn: w < 900 ? "1 / -1" : undefined }}
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
          <span style={{
            width: 44, height: 44, borderRadius: 10,
            background: showDetail ? "rgba(255,230,0,0.15)" : G070,
            color: showDetail ? YEL : G600,
            display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
              ¿Quieres ver el detalle del análisis?
            </span>
            <span style={{ fontSize: 13, color: showDetail ? "rgba(255,255,255,0.7)" : G600 }}>
              {showDetail
                ? "Mostrando desglose completo por medio de pago, producto y palancas."
                : "Activa para revisar comisiones, MSI y valores agregados con tu seller."}
            </span>
          </div>
          {/* Toggle switch */}
          <span style={{
            width: 56, height: 32, borderRadius: 999, padding: 3,
            background: showDetail ? YEL : G200,
            display: "inline-flex", alignItems: "center", flexShrink: 0,
            transition: "background 200ms",
          }}>
            <span style={{
              width: 26, height: 26, background: "white", borderRadius: "50%",
              transform: showDetail ? "translateX(24px)" : "translateX(0)",
              transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: NAVY,
            }}>
              {showDetail && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </span>
          </span>
        </button>

        {/* Detail breakdown */}
        {showDetail && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 14px", letterSpacing: "-0.01em" }}>Desglose por medio de pago</h2>
            <ChannelToggle value={channel} onChange={setChannel} />

            <Collapsible
              key={channel + "-oneshot"}
              title="Comisiones · Pagos de contado"
              badge="One-shot"
              totalLabel="Ahorro / mes"
              totalValue={fmt(curOTTotal)}
              deltaValue={<span style={{ color: POS }}>−{curOT.reduce((a, r) => a + (r.now - r.mp) * r.vol / 100 / curOTTotal * 100, 0).toFixed(2)}%</span>}
            >
              {curOT.length > 0
                ? <ProductTable rows={curOT} />
                : <div style={{ fontSize: 13, color: G600, fontStyle: "italic" }}>Sin diferencias de tasa en este canal.</div>
              }
            </Collapsible>

            <Collapsible
              key={channel + "-msi"}
              title="Comisiones · Meses sin intereses"
              badge="MSI"
              totalLabel="Ahorro / mes"
              totalValue={fmt(curMSITotal)}
              deltaValue={<span style={{ color: POS }}>−{curMSI.reduce((a, r) => a + (r.now - r.mp) * r.vol / 100 / (curMSITotal || 1) * 100, 0).toFixed(2)}%</span>}
            >
              {curMSI.length > 0 ? (
                <>
                  <div style={{ fontSize: 11, color: G400, fontStyle: "italic", marginBottom: 10, padding: "5px 8px", background: G040, borderRadius: 4 }}>
                    * Tasa MSI = comisión de T. Crédito + sobretasa. Las columnas muestran el costo total en ambos escenarios.
                  </div>
                  <ProductTable rows={curMSI} />
                </>
              ) : (
                <div style={{ fontSize: 13, color: G600, fontStyle: "italic" }}>Sin MSI configurados para este canal.</div>
              )}
            </Collapsible>

            {/* Total comisiones summary */}
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
              title="Valores agregados · Ganancia incremental"
              badge="Volumen extra"
              totalLabel="Ganancia / mes"
              totalValue={fmt(curVATotal)}
              deltaValue={<span style={{ color: ACC }}>+{curVAPct.toFixed(2)}%</span>}
            >
              <ValueAddedTable rows={curVA} />
            </Collapsible>
          </div>
        )}

        <NextSteps onDownload={() => setShowDownloadModal(true)} onGantt={() => setShowGantt(true)} onSlide={() => setShowSlide(true)} />
        <InternalFooter />
        <DownloadModal
          open={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          empresa={empresa}
          monthlyGain={monthlyGain}
          annualGain={annualGain}
          totalSave={totalSave}
          incrSalesMxn={incrSalesMxn}
        />

        {/* Gantt modal */}
        <GanttModal
          open={showGantt}
          onClose={() => setShowGantt(false)}
          negocio={negocio}
          productos={productos}
          palancasSel={palancasSel}
        />

        <SlideComisionesModal
          open={showSlide}
          onClose={() => setShowSlide(false)}
          empresa={empresa}
          rubro={negocio.industria}
          sellerLogo={negocio.logo}
          productos={productos}
          comPT_OT={comPT_OT}  comPT_MSI={comPT_MSI}  tpvPT={sharePT.tpv}
          comOP_OT={comOP_OT}  comOP_MSI={comOP_MSI}  tpvOP={shareOP.tpv}
        />

        {/* Nav footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          paddingTop: 32, marginTop: 28, borderTop: `1px solid ${G150}`,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: G400, letterSpacing: "0.08em", marginBottom: 8 }}>PASO ANTERIOR</div>
            <button
              onClick={onBack}
              style={{
                background: "white", border: `1px solid #D9D9D9`, padding: "12px 22px",
                borderRadius: 6, fontWeight: 600, color: NAVY, cursor: "pointer",
                fontFamily: "inherit", fontSize: 14,
              }}
            >← Propuesta de valor</button>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: G400, letterSpacing: "0.08em", marginBottom: 8 }}>NUEVA PROPUESTA</div>
            <a href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: YEL, border: "none", padding: "13px 28px",
              borderRadius: 6, fontWeight: 700, color: NAVY, cursor: "pointer",
              fontFamily: "inherit", fontSize: 14, textDecoration: "none",
            }}>+ Nueva propuesta</a>
          </div>
        </div>
      </div>
    </div>
  );
}
