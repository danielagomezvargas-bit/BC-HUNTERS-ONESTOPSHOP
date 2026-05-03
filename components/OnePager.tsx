"use client";
import { COLORS as C, PALANCAS_PT, PALANCAS_OP } from "@/data/constants";
import { fmx, fmtPct } from "@/utils/format";
import type { ComOTRow, ComMSIRow, Negocio, Productos } from "@/types";

export interface OnePagerData {
  negocio:       Negocio;
  productos:     Productos;
  comPT_OT:      ComOTRow[];
  comPT_MSI:     ComMSIRow[];
  tpvPT:         number;
  comOP_OT:      ComOTRow[];
  comOP_MSI:     ComMSIRow[];
  tpvOP:         number;
  propuestaProd: "pt" | "op" | "both";
  palancasSel:   { pt: string[]; op: string[] };
  palancasPct:   { pt: Record<string, number>; op: Record<string, number> };
}

// ── Helpers ───────────────────────────────────────────────────
export function calcSavingsRows(comOT: ComOTRow[], comMSI: ComMSIRow[], tpv: number) {
  const rows: { label: string; cu: number; mp: number; comisionMXN: number; deltaMXN: number }[] = [];
  for (const r of comOT) {
    const delta = r.cu - r.mp;
    rows.push({ label: r.l, cu: r.cu, mp: r.mp, comisionMXN: tpv * r.cu / 100, deltaMXN: delta > 0 ? tpv * delta / 100 : 0 });
  }
  for (const r of comMSI) {
    const delta = r.sb - r.sm;
    rows.push({ label: r.l, cu: r.sb, mp: r.sm, comisionMXN: tpv * r.sb / 100, deltaMXN: delta > 0 ? tpv * delta / 100 : 0 });
  }
  return rows;
}

function calcPalancas(palancas: typeof PALANCAS_PT, sel: string[], pcts: Record<string, number>, tpv: number) {
  return palancas
    .filter(p => sel.includes(p.id) && (pcts[p.id] || 0) > 0)
    .map(p => ({ ...p, pct: pcts[p.id] || 0, impact: tpv * (pcts[p.id] || 0) / 100 }));
}

const TH: React.CSSProperties = {
  padding: "0 10px", fontSize: 9, fontWeight: 700, color: "#fff",
  textTransform: "uppercase", letterSpacing: ".05em", textAlign: "right",
};

// ── Main ──────────────────────────────────────────────────────
export default function OnePager({ data, pagerRef }: { data: OnePagerData; pagerRef?: React.RefObject<HTMLDivElement> }) {
  const { negocio, productos, comPT_OT, comPT_MSI, tpvPT, comOP_OT, comOP_MSI, tpvOP, propuestaProd, palancasSel, palancasPct } = data;
  const date = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

  // Savings
  const ptRows = calcSavingsRows(comPT_OT, comPT_MSI, tpvPT);
  const opRows = calcSavingsRows(comOP_OT, comOP_MSI, tpvOP);
  const allSavingsRows = [
    ...(productos.point ? ptRows : []),
    ...(productos.op    ? opRows : []),
  ];
  const totalSavingsMes = allSavingsRows.reduce((s, r) => s + r.deltaMXN, 0);

  // Palancas
  const showPT = (propuestaProd === "pt" || propuestaProd === "both") && productos.point;
  const showOP = (propuestaProd === "op" || propuestaProd === "both") && productos.op;
  const ptPalancas = showPT ? calcPalancas(PALANCAS_PT, palancasSel.pt, palancasPct.pt, tpvPT) : [];
  const opPalancas = showOP ? calcPalancas(PALANCAS_OP, palancasSel.op, palancasPct.op, tpvOP) : [];
  const allPalancas = [...ptPalancas.map(p => ({ ...p, prod: "Point" })), ...opPalancas.map(p => ({ ...p, prod: "Online Payments" }))];
  const totalIncrementoMes = allPalancas.reduce((s, p) => s + p.impact, 0);

  const gananciaTotal    = totalSavingsMes + totalIncrementoMes;
  const gananciaAnual    = gananciaTotal * 12;

  return (
    <div ref={pagerRef} id="one-pager" style={{
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      background: "#fff", width: "100%", maxWidth: 900,
      margin: "0 auto", padding: "28px 32px",
      border: `1px solid ${C.border}`, borderRadius: 10,
    }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.navy }}>Business Case</div>
          <div style={{ fontSize: 13, color: C.blue, fontStyle: "italic" }}>¿Cómo te vamos a ayudar?</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logotipo_de_Mercado_Pago.svg/512px-Logotipo_de_Mercado_Pago.svg.png"
            style={{ height: 38 }} alt="Mercado Pago"
          />
          {negocio.logo && (
            <>
              <span style={{ fontSize: 16, color: C.muted }}>×</span>
              <img src={negocio.logo} style={{ height: 38, objectFit: "contain" }} alt={negocio.nombre} />
            </>
          )}
        </div>
      </div>

      {negocio.nombre && (
        <div style={{ textAlign: "center", fontSize: 12, color: C.muted, marginBottom: 18 }}>
          {negocio.nombre} · {negocio.industria} · {date}
        </div>
      )}

      {/* ── Side by side: Costos | Incremental ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, alignItems: "start" }}>

        {/* LEFT — Resumen Tasas */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: C.navy, color: "#fff", padding: "9px 14px", fontSize: 12, fontWeight: 700 }}>
            Resumen Tasas {productos.point && productos.op ? "Terminal + Online" : productos.point ? "Terminal" : "Online"}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#2A4A6A", height: 26 }}>
                <th style={{ ...TH, textAlign: "left", paddingLeft: 12 }}>Concepto</th>
                <th style={TH}>Actual</th>
                <th style={{ ...TH, color: "#4ADE80" }}>MP</th>
                <th style={{ ...TH, color: "#FCA5A5" }}>Com. $</th>
                <th style={{ ...TH, color: "#4ADE80" }}>Δ Ahorro</th>
              </tr>
            </thead>
            <tbody>
              {allSavingsRows.map((r, i) => (
                <tr key={i} style={{ height: 32, borderBottom: "1px solid #F2F2F2", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td style={{ padding: "0 8px 0 12px", fontSize: 11, color: "#444" }}>{r.label}</td>
                  <td style={{ padding: "0 8px", textAlign: "right", fontSize: 11, color: C.amber, fontWeight: 700 }}>{fmtPct(r.cu)}</td>
                  <td style={{ padding: "0 8px", textAlign: "right", fontSize: 11, color: C.green, fontWeight: 700 }}>{fmtPct(r.mp)}</td>
                  <td style={{ padding: "0 8px", textAlign: "right", fontSize: 11, color: "#666" }}>{fmx(r.comisionMXN)}</td>
                  <td style={{ padding: "0 8px", textAlign: "right", fontSize: 12, fontWeight: 700, color: r.deltaMXN > 0 ? C.green : C.muted }}>
                    {r.deltaMXN > 0 ? `-${fmx(r.deltaMXN)}` : "—"}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#1A3A5A", height: 34 }}>
                <td colSpan={4} style={{ padding: "0 8px 0 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Total Inversión Tasas</td>
                <td style={{ padding: "0 8px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>-{fmx(totalSavingsMes)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RIGHT — Incremental Ventas */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ background: C.blue, color: "#fff", padding: "9px 14px", fontSize: 12, fontWeight: 700 }}>
            Incremental Ventas
          </div>
          {allPalancas.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#007DC0", height: 26 }}>
                  <th style={{ ...TH, textAlign: "left", paddingLeft: 12 }}>Palanca</th>
                  <th style={TH}>%</th>
                  <th style={{ ...TH, color: "#4ADE80" }}>Impacto $</th>
                </tr>
              </thead>
              <tbody>
                {allPalancas.map((p, i) => (
                  <tr key={i} style={{ height: 32, borderBottom: "1px solid #F2F2F2", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                    <td style={{ padding: "0 8px 0 12px", fontSize: 11, color: "#444" }}>{p.icon} {p.label}</td>
                    <td style={{ padding: "0 8px", textAlign: "right", fontSize: 11, color: C.blue, fontWeight: 700 }}>{p.pct}%</td>
                    <td style={{ padding: "0 8px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.green }}>{fmx(p.impact)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#007DC0", height: 34 }}>
                  <td colSpan={2} style={{ padding: "0 8px 0 12px", fontSize: 12, fontWeight: 700, color: "#fff" }}>Incremento en Ventas</td>
                  <td style={{ padding: "0 8px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>{fmx(totalIncrementoMes)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 12, color: C.muted }}>
              Sin palancas de incremento seleccionadas
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom callouts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={{ background: C.green, borderRadius: 8, padding: "14px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Ahorro Anual</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>-{fmx(totalSavingsMes * 12)}</div>
        </div>
        <div style={{ background: C.blue, borderRadius: 8, padding: "14px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Ganancia Total Mensual</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{fmx(gananciaTotal)}</div>
        </div>
        <div style={{ background: C.navy, borderRadius: 8, padding: "14px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Ganancia Anualizada</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#4ADE80" }}>{fmx(gananciaAnual)}</div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: 16, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, color: C.muted }}>Business Case Simulator — Mercado Pago</span>
        <span style={{ fontSize: 9, color: C.muted }}>Las proyecciones son estimadas y sujetas a validación comercial</span>
      </div>
    </div>
  );
}
