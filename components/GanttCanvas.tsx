"use client";
import React from "react";

// ── Tokens ────────────────────────────────────────────────────
export const DARK_BG   = "#15192F";
export const DARK_HEAD = "#1B1F38";
export const YEL       = "#FFE600";
export const MPB       = "#009EE3";   // Mercado Pago blue
export const POS       = "#00A650";

// ── Kind palette ──────────────────────────────────────────────
export const KIND: Record<string, { bg: string; fg: string; label: string }> = {
  obligatoria: { bg: YEL,       fg: "#1A1A1A", label: "Obligatoria" },
  preparacion: { bg: MPB,       fg: "#ffffff", label: "Preparación"  },
  lanzamiento: { bg: POS,       fg: "#ffffff", label: "Lanzamiento"  },
  seguimiento: { bg: "#6B7280", fg: "#ffffff", label: "Seguimiento"  },
};

// ── Phase shape ───────────────────────────────────────────────
export interface GanttPhase {
  id: string;
  name: string;
  desc: string;
  sla: string;
  offset: number;
  duration: number;
  kind: "obligatoria" | "preparacion" | "lanzamiento" | "seguimiento";
  locked?: boolean;
  custom?: boolean;
}

// ── Layout constants (download / capture target: 1920 × 1080) ─
export const GW = 1920;
export const GH = 1080;
export const LW = 300;             // left label column
export const RH = 84;              // ruler (month banner 22 + day ticks 62)
export const FH = 56;              // footer legend
export const BH = GH - RH - FH;   // 940 — phase body

// ── Phase builder ─────────────────────────────────────────────
export function buildPhases(
  productos: { point: boolean; op: boolean },
  palancasPt: Set<string>,
  palancasOp: Set<string>,
): GanttPhase[] {
  const ph: GanttPhase[] = [];

  ph.push({ id: "p0",  name: "Apertura de cuenta",       desc: "Alta del seller en la plataforma de cobros.",              sla: "15 min · alta inmediata",        offset: 0, duration: 0, kind: "obligatoria", locked: true });
  ph.push({ id: "p1",  name: "Configuración de cuenta",  desc: "Tasas, métodos de pago y reglas comerciales del seller.",  sla: "1 día hábil",                    offset: 0, duration: 1, kind: "obligatoria" });

  let base = 1;

  if (productos.point) {
    ph.push({ id: "pt1", name: "Envío de terminales Point",  desc: "Despacho y entrega de las terminales en sucursal.",           sla: "2–6 días hábiles",            offset: 0, duration: 3, kind: "obligatoria" });
    ph.push({ id: "pt2", name: "Capacitación de cajeros",    desc: "Sesión de operación de la terminal con el equipo en sitio.", sla: "30 min · al recibir equipo",  offset: 3, duration: 0, kind: "preparacion" });
    ph.push({ id: "pt3", name: "Go Live — Point",            desc: "Activación, prueba de cobro real y validación.",             sla: "Post capacitación",           offset: 3, duration: 1, kind: "lanzamiento" });
    base = Math.max(base, 4);
    if (palancasPt.has("msi")) {
      ph.push({ id: "msi1", name: "Configuración MSI",       desc: "Activación de plazos sin intereses por banco.",              sla: "1 día hábil",                 offset: 1, duration: 1, kind: "preparacion" });
    }
  }

  if (productos.op) {
    const off = productos.point ? 1 : 0;
    ph.push({ id: "op1", name: "Integración técnica OP",    desc: "API checkout, webhooks y configuración de pagos online.",       sla: "3–5 días hábiles",         offset: off,     duration: 4, kind: "preparacion" });
    ph.push({ id: "op2", name: "Pruebas QA — Sandbox",      desc: "Validación de flujos de pago, casos de error y notificaciones.", sla: "2 días hábiles",          offset: off + 4, duration: 2, kind: "preparacion" });
    ph.push({ id: "op3", name: "Go Live — Online Payments", desc: "Habilitación en producción y primera transacción real.",        sla: "Hito de lanzamiento",      offset: off + 6, duration: 0, kind: "lanzamiento" });
    base = Math.max(base, off + 7);
    if (palancasOp.has("checkout-pro")) {
      ph.push({ id: "cop1", name: "Activación Checkout Pro",       desc: "Configuración de la experiencia de checkout optimizada.", sla: "1 día hábil · post integración", offset: base - 1, duration: 1, kind: "preparacion" });
    }
    if (palancasOp.has("subs")) {
      ph.push({ id: "sub1", name: "Configuración suscripciones",   desc: "Alta de planes recurrentes y cargos automáticos.",         sla: "1 día hábil",                    offset: base,     duration: 1, kind: "preparacion" });
      base++;
    }
  }

  ph.push({ id: "f1", name: "Reportes y conciliación", desc: "Acompañamiento, revisión de reportes y optimización post go-live.", sla: "Seguimiento semanal", offset: base, duration: 7, kind: "seguimiento" });

  return ph;
}

// ── GanttChartBody ────────────────────────────────────────────
// Renders everything INSIDE the 1920×1080 chart div.
// Parent supplies dayW, rowH (computed from totalDays, phases.length).
export interface GanttChartBodyProps {
  phases: GanttPhase[];
  dayW: number;
  rowH: number;
  totalDays: number;
  showMes2: boolean;
  sellerName: string;
  dragId: string | null;
  selectedId: string | null;
  onDragStart: (e: React.MouseEvent, p: GanttPhase) => void;
  onSelect: (id: string) => void;
}

export function GanttChartBody({
  phases, dayW, rowH, totalDays, showMes2, sellerName,
  dragId, selectedId, onDragStart, onSelect,
}: GanttChartBodyProps) {
  return (
    <>
      {/* ── RULER ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: RH,
        background: DARK_HEAD,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
      }}>
        {/* Corner label */}
        <div style={{
          width: LW, flexShrink: 0, height: RH,
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "flex-end",
          padding: "0 24px 14px",
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.07em", color: "rgba(255,255,255,0.4)" }}>
            {sellerName.toUpperCase().slice(0, 22)}
          </span>
        </div>

        {/* Day columns */}
        <div style={{ position: "relative", flex: 1, height: RH }}>
          {/* Month banners */}
          <div style={{ position: "absolute", top: 0, left: 0, height: 22, display: "flex" }}>
            <div style={{
              width: 30 * dayW, height: 22, flexShrink: 0,
              display: "flex", alignItems: "center", paddingLeft: 14,
              borderRight: showMes2 ? "1px solid rgba(255,255,255,0.1)" : undefined,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: YEL, letterSpacing: "0.1em" }}>MES 1</span>
            </div>
            {showMes2 && (
              <div style={{ width: 30 * dayW, flexShrink: 0, display: "flex", alignItems: "center", paddingLeft: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", letterSpacing: "0.1em" }}>MES 2</span>
              </div>
            )}
          </div>

          {/* Day tick + number */}
          {Array.from({ length: totalDays }, (_, i) => {
            const day   = i + 1;
            const is10  = day % 10 === 0;
            const is5   = day % 5  === 0;
            const isM2  = day === 31;
            const showN = is5 || day === 1 || (dayW >= 40 && day % 2 === 0);
            return (
              <div key={day} style={{
                position: "absolute", top: 22, left: i * dayW, width: dayW, height: RH - 22,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
                paddingBottom: 8,
                borderLeft: isM2
                  ? "2px solid rgba(255,255,255,0.2)"
                  : `1px solid rgba(255,255,255,${is5 ? "0.08" : "0.03"})`,
              }}>
                {showN && (
                  <span style={{
                    fontSize: is10 ? 15 : is5 ? 13 : 11,
                    fontWeight: is10 ? 800 : is5 ? 600 : 400,
                    color: `rgba(255,255,255,${is10 ? "0.9" : is5 ? "0.6" : "0.3"})`,
                    marginBottom: 4, lineHeight: 1,
                  }}>{day}</span>
                )}
                <div style={{
                  width: 1,
                  height: is10 ? 13 : is5 ? 8 : 5,
                  background: `rgba(255,255,255,${is10 ? "0.5" : is5 ? "0.28" : "0.12"})`,
                }}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ position: "absolute", top: RH, left: 0, right: 0, height: BH }}>

        {/* Row zebra */}
        {phases.map((p, i) => (
          <div key={`z-${p.id}`} style={{
            position: "absolute", top: i * rowH, left: 0, right: 0, height: rowH,
            background: selectedId === p.id
              ? "rgba(255,255,255,0.055)"
              : i % 2 === 0 ? "rgba(255,255,255,0.022)" : "transparent",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
          }}/>
        ))}

        {/* Vertical grid */}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const is5  = day % 5  === 0;
          const isM2 = day === 31;
          return (
            <div key={`vl-${day}`} style={{
              position: "absolute",
              left: LW + i * dayW, top: 0, width: 1, height: BH,
              background: isM2
                ? "rgba(255,255,255,0.14)"
                : `rgba(255,255,255,${is5 ? "0.05" : "0.018"})`,
              pointerEvents: "none",
            }}/>
          );
        })}

        {/* ── Dashed end-of-bar lines ──
            One per bar-phase, ONLY spanning that row's height, at the bar's right edge.
            Reactive: posX = offset + duration, updates automatically with drag state. */}
        {phases.map((p, i) => {
          if (p.duration === 0) return null;  // milestones are diamonds — no end line
          const ks   = KIND[p.kind];
          const endX = LW + (p.offset + p.duration) * dayW;
          return (
            <div key={`el-${p.id}`} style={{
              position: "absolute",
              left: endX - 1,
              top: i * rowH,
              width: 0,
              height: rowH,
              borderLeft: `2px dashed ${ks.bg}99`,
              pointerEvents: "none",
              zIndex: 2,
            }}/>
          );
        })}

        {/* ── Phase rows ── */}
        {phases.map((p, i) => {
          const ks       = KIND[p.kind];
          const isMile   = p.duration === 0;
          const barL     = LW + p.offset * dayW;
          const barW     = Math.max(dayW * 0.65, p.duration * dayW);
          const mileX    = LW + p.offset * dayW;
          const isDragging = dragId === p.id;
          const isSelected = selectedId === p.id;
          const cy       = i * rowH + rowH / 2;
          const barH     = rowH * 0.58;
          const barTop   = i * rowH + (rowH - barH) / 2;
          const dSize    = Math.min(barH * 0.75, 36);

          return (
            <div key={p.id}>
              {/* Label column */}
              <div
                onClick={() => onSelect(p.id)}
                style={{
                  position: "absolute",
                  left: 0, top: i * rowH, width: LW, height: rowH,
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                  padding: "0 16px 0 24px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: ks.bg,
                    boxShadow: isSelected ? `0 0 0 3px ${ks.bg}55` : undefined,
                  }}/>
                  <span style={{
                    fontSize: 15, fontWeight: 700,
                    color: isSelected ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.82)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: LW - 68,
                  }}>
                    {p.name}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, color: "rgba(255,255,255,0.35)",
                  marginTop: 4, paddingLeft: 18,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: LW - 28,
                }}>
                  {p.sla}
                </div>
              </div>

              {/* Milestone diamond */}
              {isMile && (
                <div
                  onMouseDown={e => !p.locked && onDragStart(e, p)}
                  onClick={() => onSelect(p.id)}
                  style={{
                    position: "absolute",
                    left: mileX - dSize / 2,
                    top:  cy - dSize / 2,
                    width: dSize, height: dSize,
                    background: ks.bg,
                    transform: "rotate(45deg)",
                    borderRadius: 4,
                    cursor: p.locked ? "pointer" : "ew-resize",
                    zIndex: 3,
                    boxShadow: isDragging
                      ? `0 0 0 4px ${ks.bg}50, 0 6px 20px ${ks.bg}60`
                      : isSelected ? `0 0 0 3px ${ks.bg}70` : `0 2px 8px rgba(0,0,0,0.5)`,
                  }}
                />
              )}

              {/* Phase bar */}
              {!isMile && (
                <div
                  onMouseDown={e => onDragStart(e, p)}
                  onClick={() => onSelect(p.id)}
                  style={{
                    position: "absolute",
                    left: barL, top: barTop,
                    width: barW, height: barH,
                    background: ks.bg,
                    borderRadius: 8,
                    cursor: p.locked ? "pointer" : "ew-resize",
                    zIndex: 3,
                    boxShadow: isDragging
                      ? `0 0 0 3px ${ks.bg}55, 0 8px 24px ${ks.bg}55`
                      : isSelected ? `0 0 0 2px ${ks.bg}88` : `0 2px 10px rgba(0,0,0,0.45)`,
                    display: "flex", alignItems: "center",
                    padding: "0 16px", overflow: "hidden", gap: 10,
                  }}
                >
                  {!p.locked && (
                    <div style={{ display: "flex", flexDirection: "column", gap: barH * 0.1, flexShrink: 0 }}>
                      {[0, 1, 2].map(k => (
                        <div key={k} style={{
                          width: 3, height: 3, borderRadius: "50%",
                          background: ks.fg === "#1A1A1A" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.35)",
                        }}/>
                      ))}
                    </div>
                  )}
                  <span style={{
                    fontSize: Math.max(12, rowH * 0.2),
                    fontWeight: 700, color: ks.fg,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {p.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FOOTER / LEGEND ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: FH,
        background: DARK_HEAD,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center",
        padding: "0 28px", gap: 24,
      }}>
        {Object.entries(KIND).map(([key, s]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.bg }}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          Cronograma estimado · Mercado Pago
        </span>
      </div>
    </>
  );
}
