"use client";
import { useEffect, useRef, useState } from "react";
import { COLORS as C, PALANCAS_PT, PALANCAS_OP } from "@/data/constants";
import { fmx, fmtPct } from "@/utils/format";
import type { ComOTRow, ComMSIRow, Negocio, Productos } from "@/types";

export interface OnePagerData {
  negocio:      Negocio;
  productos:    Productos;
  // Comisiones PT
  comPT_OT:     ComOTRow[];
  comPT_MSI:    ComMSIRow[];
  tpvPT:        number;
  // Comisiones OP
  comOP_OT:     ComOTRow[];
  comOP_MSI:    ComMSIRow[];
  tpvOP:        number;
  // Palancas
  propuestaProd: "pt" | "op" | "both";
  palancasSel:  { pt: string[]; op: string[] };
  palancasPct:  { pt: Record<string, number>; op: Record<string, number> };
}

// ── Helpers ───────────────────────────────────────────────────
function calcSavings(comOT: ComOTRow[], comMSI: ComMSIRow[], tpv: number) {
  const otSavings = comOT.reduce((sum, r) => {
    const delta = r.cu - r.mp;
    return sum + (delta > 0 ? tpv * (delta / 100) : 0);
  }, 0);
  const msiSavings = comMSI.reduce((sum, r) => {
    const delta = r.sb - r.sm;
    return sum + (delta > 0 ? tpv * (delta / 100) : 0);
  }, 0);
  return { otSavings, msiSavings, total: otSavings + msiSavings };
}

function calcPalancas(palancas: typeof PALANCAS_PT, sel: string[], pcts: Record<string, number>, tpv: number) {
  return palancas
    .filter(p => sel.includes(p.id))
    .map(p => ({ ...p, pct: pcts[p.id] || 0, impact: tpv * (pcts[p.id] || 0) / 100 }))
    .filter(p => p.pct > 0);
}

// ── Sub-components ────────────────────────────────────────────
function SavingsRow({ label, cu, mp, delta }: { label: string; cu: number; mp: number; delta: number }) {
  return (
    <tr style={{ height: 32, borderBottom: `1px solid #F2F2F2` }}>
      <td style={{ padding: "0 10px", fontSize: 11, color: "#444" }}>{label}</td>
      <td style={{ padding: "0 10px", textAlign: "right", fontSize: 11, color: C.amber, fontWeight: 700 }}>{fmtPct(cu)}</td>
      <td style={{ padding: "0 10px", textAlign: "right", fontSize: 11, color: C.green, fontWeight: 700 }}>{fmtPct(mp)}</td>
      <td style={{ padding: "0 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: delta > 0 ? C.green : C.muted }}>
        {delta > 0 ? `↓ ${fmtPct(delta)}` : "—"}
      </td>
    </tr>
  );
}

function SavingsSection({ title, icon, comOT, comMSI, tpv }: {
  title: string; icon: string; comOT: ComOTRow[]; comMSI: ComMSIRow[]; tpv: number;
}) {
  const { otSavings, msiSavings, total } = calcSavings(comOT, comMSI, tpv);
  const otRows = comOT.filter(r => r.cu > r.mp);
  const msiRows = comMSI.filter(r => r.sb > r.sm);
  if (otRows.length === 0 && msiRows.length === 0) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ background: C.navy, color: "#fff", padding: "7px 12px", borderRadius: "6px 6px 0 0", fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
        <span>{icon} {title}</span>
        <span style={{ color: "#4ADE80" }}>Ahorro mensual: {fmx(total)}</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.border}`, borderTop: "none" }}>
        <thead>
          <tr style={{ background: "#FAFAFA", height: 26 }}>
            {["Concepto", "Tasa actual", "Tasa MP", "Ahorro"].map((h, i) => (
              <th key={i} style={{ padding: "0 10px", fontSize: 9, fontWeight: 700, color: "#888", textTransform: "uppercase", textAlign: i === 0 ? "left" : "right", letterSpacing: ".05em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {otRows.map(r => <SavingsRow key={r.l} label={r.l} cu={r.cu} mp={r.mp} delta={r.cu - r.mp} />)}
          {msiRows.map(r => <SavingsRow key={r.l} label={r.l} cu={r.sb} mp={r.sm} delta={r.sb - r.sm} />)}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function OnePager({ data, pagerRef }: { data: OnePagerData; pagerRef?: React.RefObject<HTMLDivElement> }) {
  const { negocio, productos, comPT_OT, comPT_MSI, tpvPT, comOP_OT, comOP_MSI, tpvOP, propuestaProd, palancasSel, palancasPct } = data;
  const date = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  const ptSavings = calcSavings(comPT_OT, comPT_MSI, tpvPT);
  const opSavings = calcSavings(comOP_OT, comOP_MSI, tpvOP);
  const totalSavingsMes = ptSavings.total + opSavings.total;

  const showPT = (propuestaProd === "pt" || propuestaProd === "both") && productos.point;
  const showOP = (propuestaProd === "op" || propuestaProd === "both") && productos.op;

  const ptPalancas = showPT ? calcPalancas(PALANCAS_PT, palancasSel.pt, palancasPct.pt, tpvPT) : [];
  const opPalancas = showOP ? calcPalancas(PALANCAS_OP, palancasSel.op, palancasPct.op, tpvOP) : [];
  const totalIncrementoMes = [...ptPalancas, ...opPalancas].reduce((s, p) => s + p.impact, 0);

  return (
    <div ref={pagerRef} id="one-pager" style={{
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      background: "#fff", width: "100%", maxWidth: 860,
      margin: "0 auto", padding: "28px 32px",
      border: `1px solid ${C.border}`, borderRadius: 10,
    }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: `2px solid ${C.navy}`, marginBottom: 20 }}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logotipo_de_Mercado_Pago.svg/512px-Logotipo_de_Mercado_Pago.svg.png"
          style={{ height: 36 }} alt="Mercado Pago"
        />
        {negocio.logo && (
          <>
            <span style={{ fontSize: 18, color: C.muted }}>×</span>
            <img src={negocio.logo} style={{ height: 36, objectFit: "contain" }} alt={negocio.nombre} />
          </>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{negocio.nombre || "Seller"}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{negocio.industria} · Propuesta de monetización</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em" }}>Fecha</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{date}</div>
        </div>
      </div>

      {/* ── Resumen ejecutivo ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 22 }}>
        {[
          { label: "Ahorro en comisiones", sub: "mensual", value: fmx(totalSavingsMes), color: C.green, bg: C.lg },
          { label: "Ahorro en comisiones", sub: "anual estimado", value: fmx(totalSavingsMes * 12), color: C.green, bg: C.lg },
          { label: "Incremento en ventas", sub: "mensual estimado", value: fmx(totalIncrementoMes), color: C.blue, bg: C.lb },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderRadius: 8, padding: "14px 16px", borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>
              {k.label}<br /><span style={{ color: k.color }}>{k.sub}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Ahorro en comisiones ── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10, paddingBottom: 5, borderBottom: `1px solid ${C.border}` }}>
        💳 Ahorro en comisiones vs. solución actual
      </div>
      {productos.point && (
        <SavingsSection title="Point (Terminales)" icon="🖥" comOT={comPT_OT} comMSI={comPT_MSI} tpv={tpvPT} />
      )}
      {productos.op && (
        <SavingsSection title="Online Payments" icon="🌐" comOT={comOP_OT} comMSI={comOP_MSI} tpv={tpvOP} />
      )}

      {/* ── Palancas de incremento ── */}
      {(ptPalancas.length > 0 || opPalancas.length > 0) && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, margin: "18px 0 10px", paddingBottom: 5, borderBottom: `1px solid ${C.border}` }}>
            🚀 Palancas de incremento de ventas
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", height: 28 }}>
                {["Palanca", "Producto", "% estimado", "Impacto mensual", "Impacto anual"].map((h, i) => (
                  <th key={i} style={{ padding: "0 10px", fontSize: 9, fontWeight: 700, color: "#888", textTransform: "uppercase", textAlign: i <= 1 ? "left" : "right", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...ptPalancas.map(p => ({ ...p, prod: "Point" })), ...opPalancas.map(p => ({ ...p, prod: "Online Payments" }))].map((p, i) => (
                <tr key={i} style={{ height: 36, borderBottom: `1px solid #F2F2F2` }}>
                  <td style={{ padding: "0 10px", fontSize: 12 }}>{p.icon} {p.label}</td>
                  <td style={{ padding: "0 10px", fontSize: 11, color: C.muted }}>{p.prod}</td>
                  <td style={{ padding: "0 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.blue }}>{p.pct}%</td>
                  <td style={{ padding: "0 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.green }}>{fmx(p.impact)}</td>
                  <td style={{ padding: "0 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.green }}>{fmx(p.impact * 12)}</td>
                </tr>
              ))}
              <tr style={{ background: C.navy, height: 36 }}>
                <td colSpan={3} style={{ padding: "0 10px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Total incremento estimado</td>
                <td style={{ padding: "0 10px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>{fmx(totalIncrementoMes)}</td>
                <td style={{ padding: "0 10px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "#4ADE80" }}>{fmx(totalIncrementoMes * 12)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 20, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: C.muted }}>Propuesta generada con Business Case Simulator — Mercado Pago</span>
        <span style={{ fontSize: 9, color: C.muted }}>Las proyecciones son estimadas y sujetas a validación comercial</span>
      </div>
    </div>
  );
}
