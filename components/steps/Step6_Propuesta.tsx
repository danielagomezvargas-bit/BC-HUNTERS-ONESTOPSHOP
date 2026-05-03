"use client";
import { useState } from "react";
import type { Productos, ProvData, ProvCounts } from "@/types";
import type { SecKey } from "@/types";
import { PALANCAS_PT, PALANCAS_OP, COLORS as C } from "@/data/constants";
import { fmx } from "@/utils/format";
import NavButtons from "@/components/ui/NavButtons";

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

function getProvName(sec: SecKey, provData: ProvData, provCounts: ProvCounts) {
  const n = provCounts[sec];
  const names = Array.from({ length: n }, (_, i) => provData[`${sec}_${i}`]?.bank).filter(Boolean);
  return names.join(" · ") || "—";
}

// ── Chips row ─────────────────────────────────────────────────
function ChipsRow({ sec, palancas, selected, onToggle }: {
  sec: "pt" | "op";
  palancas: typeof PALANCAS_PT;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, background:"#F9FAFB" }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>
        Selecciona las palancas que aplican <span style={{ color:C.blue }}>✦</span>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {palancas.map(p => {
          const active = selected.has(p.id);
          return (
            <div
              key={p.id}
              onClick={() => onToggle(p.id)}
              style={{
                display:"flex", alignItems:"center", gap:5,
                padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:600,
                cursor:"pointer", userSelect:"none", transition:"all .15s",
                border:`1.5px solid ${active ? C.blue : C.border}`,
                background: active ? C.blue : "#fff",
                color: active ? "#fff" : C.muted,
              }}
            >
              <span style={{ width:6, height:6, borderRadius:"50%", background:"currentColor", opacity: active ? 1 : .4, flexShrink:0 }}/>
              {p.icon} {p.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Palancas table ────────────────────────────────────────────
function PalancasTable({ sec, palancas, selected, pcts, setPct, tpv, otherLabels, setOtherLabel }: {
  sec: "pt" | "op";
  palancas: typeof PALANCAS_PT;
  selected: Set<string>;
  pcts: Record<string, number>;
  setPct: (id: string, val: number) => void;
  tpv: number;
  otherLabels: Record<string, string>;
  setOtherLabel: (id: string, val: string) => void;
}) {
  const active = palancas.filter(p => selected.has(p.id));
  const totalPct = active.reduce((s, p) => s + (pcts[p.id] || 0), 0);
  const totalImpact = tpv * totalPct / 100;

  if (active.length === 0) {
    return (
      <div style={{ padding:"24px 18px", textAlign:"center", fontSize:12, color:C.muted, background:"#FAFAFA" }}>
        Selecciona al menos una palanca de valor arriba
      </div>
    );
  }

  return (
    <>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
          <thead>
            <tr style={{ height:32, background:"#FAFAFA", borderBottom:`1px solid #EBEBEB` }}>
              {[
                { label:"Palanca de valor", align:"left",   width:220 },
                { label:"% a incrementar",  align:"center", width:110 },
                { label:"Referencia de mercado", align:"left", width:180, blue:true },
                { label:"Impacto mensual",  align:"right",  width:130 },
                { label:"Impacto anual",    align:"right",  width:130 },
              ].map((h, i) => (
                <th key={i} style={{
                  padding:"0 14px", fontSize:9, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:".06em",
                  textAlign: h.align as any,
                  color: h.blue ? C.blue : C.muted,
                  background: h.blue ? C.lb : "#FAFAFA",
                  borderBottom:`1px solid ${C.border}`,
                  width: h.width,
                }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map(p => {
              const pct = pcts[p.id] || 0;
              const impact = tpv * pct / 100;
              const isOther = p.id.startsWith("otro");

              return (
                <tr key={p.id} style={{ height:52, borderBottom:`1px solid #F2F2F2` }}>
                  {/* Label */}
                  <td style={{ padding:"0 14px", verticalAlign:"middle" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{p.label}</div>
                        {isOther && (
                          <input
                            placeholder="Especifica la palanca…"
                            value={otherLabels[p.id] || ""}
                            onChange={e => setOtherLabel(p.id, e.target.value)}
                            style={{
                              marginTop:4, border:`1px solid ${C.border}`, borderRadius:5,
                              padding:"3px 8px", fontSize:11, color:C.text, outline:"none",
                              width:160, background:"#fff",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* % input */}
                  <td style={{ padding:"0 14px", textAlign:"center", verticalAlign:"middle" }}>
                    <div style={{
                      display:"inline-flex", alignItems:"center",
                      border:`1.5px solid #B3DDEF`, borderRadius:7,
                      background:C.lb, height:32, width:84,
                    }}>
                      <input
                        type="number" min={0} max={200} step={0.5}
                        value={pct || ""}
                        placeholder="0"
                        onChange={e => setPct(p.id, parseFloat(e.target.value) || 0)}
                        style={{
                          width:52, border:"none", background:"transparent",
                          padding:"0 6px", fontSize:13, fontWeight:700,
                          outline:"none", textAlign:"center", color:C.navy,
                        }}
                      />
                      <span style={{ fontSize:11, color:C.muted, paddingRight:6, fontWeight:600 }}>%</span>
                    </div>
                  </td>

                  {/* Benchmark */}
                  <td style={{ padding:"0 14px", verticalAlign:"middle", background:C.lb }}>
                    <span style={{
                      display:"inline-flex", alignItems:"center", gap:4,
                      fontSize:11, fontWeight:700, padding:"3px 9px",
                      borderRadius:5, background:"#EEF6FD", color:C.blue,
                      border:`1px solid #B3DDEF`, whiteSpace:"nowrap",
                    }}>
                      <span style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".05em", marginRight:2 }}>Ref</span>
                      {p.bench}
                    </span>
                  </td>

                  {/* Impact */}
                  <td style={{ padding:"0 14px", textAlign:"right", verticalAlign:"middle" }}>
                    <span style={{ fontSize:13, fontWeight:700, color: pct > 0 ? C.green : C.muted }}>
                      {pct > 0 ? fmx(impact) : "—"}
                    </span>
                  </td>
                  <td style={{ padding:"0 14px", textAlign:"right", verticalAlign:"middle" }}>
                    <span style={{ fontSize:13, fontWeight:700, color: pct > 0 ? C.green : C.muted }}>
                      {pct > 0 ? fmx(impact * 12) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total bar */}
      {totalPct > 0 && (
        <div style={{
          display:"flex", alignItems:"center", gap:20,
          padding:"14px 18px", background:C.navy,
          borderTop:`2px solid ${C.border}`,
        }}>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".07em" }}>TPV mensual</span>
            <span style={{ fontSize:18, fontWeight:700, color:"#fff" }}>{fmx(tpv)}</span>
          </div>
          <div style={{ width:1, background:"rgba(255,255,255,.15)", alignSelf:"stretch", margin:"0 4px" }}/>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".07em" }}>Incremento mensual estimado</span>
            <span style={{ fontSize:20, fontWeight:700, color:"#4ADE80" }}>{fmx(totalImpact)}</span>
          </div>
          <div style={{ width:1, background:"rgba(255,255,255,.15)", alignSelf:"stretch", margin:"0 4px" }}/>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".07em" }}>Incremento anual estimado</span>
            <span style={{ fontSize:20, fontWeight:700, color:"#4ADE80" }}>{fmx(totalImpact * 12)}</span>
          </div>
        </div>
      )}
    </>
  );
}

// ── Section (one product) ─────────────────────────────────────
function ProdSection({ sec, title, icon, provName, tpv, palancas, selected, pcts, setPct, onToggle }: {
  sec: "pt" | "op"; title: string; icon: string; provName: string; tpv: number;
  palancas: typeof PALANCAS_PT;
  selected: Set<string>;
  pcts: Record<string, number>;
  setPct: (id: string, val: number) => void;
  onToggle: (id: string) => void;
}) {
  const [otherLabels, setOtherLabels] = useState<Record<string, string>>({});

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 18px", background: sec === "pt" ? C.navy : "#1A4A5E" }}>
        <span style={{ fontSize:20 }}>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{title} — Palancas de incremento</div>
          <div style={{ color:"rgba(255,255,255,.6)", fontSize:11, marginTop:2 }}>
            {fmx(tpv)} mensual · {provName}
          </div>
        </div>
      </div>

      <ChipsRow sec={sec} palancas={palancas} selected={selected} onToggle={onToggle} />

      <PalancasTable
        sec={sec} palancas={palancas} selected={selected}
        pcts={pcts} setPct={setPct} tpv={tpv}
        otherLabels={otherLabels}
        setOtherLabel={(id, val) => setOtherLabels(prev => ({ ...prev, [id]: val }))}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Step6_Propuesta({
  productos, provData, provCounts,
  sharePT, shareOP,
  propuestaProd, setPropuestaProd,
  palancasSel, togglePalanca,
  palancasPct, setPalancaPct,
  onNext, onBack,
}: Props) {
  const showPT = propuestaProd === "pt" || propuestaProd === "both";
  const showOP = propuestaProd === "op" || propuestaProd === "both";

  const btnStyle = (active: boolean): React.CSSProperties => ({
    display:"flex", alignItems:"center", gap:8,
    padding:"10px 22px", borderRadius:9, fontSize:13, fontWeight:700,
    cursor:"pointer", transition:"all .15s",
    border:`2px solid ${active ? C.blue : C.border}`,
    background: active ? C.blue : "#fff",
    color: active ? "#fff" : C.muted,
  });

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:4 }}>Propuesta de valor</h2>
      <p style={{ fontSize:13, color:C.muted, marginBottom:22 }}>
        Selecciona las palancas de incremento de ventas que aplican para este seller
      </p>

      {/* Product selector */}
      <div style={{ fontSize:14, fontWeight:700, color:C.navy, marginBottom:12 }}>
        ¿Dónde va a incrementar la venta?
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:28 }}>
        {([
          { key:"pt",   label:"🖥 Point",                    show: productos.point },
          { key:"op",   label:"🌐 Online Payments",          show: productos.op   },
          { key:"both", label:"🖥 + 🌐 Ambos",               show: productos.point && productos.op },
        ] as const).filter(o => o.show).map(o => (
          <div key={o.key} style={btnStyle(propuestaProd === o.key)}
            onClick={() => setPropuestaProd(o.key)}>
            {o.label}
          </div>
        ))}
      </div>

      {/* Sections */}
      {showPT && productos.point && (
        <ProdSection
          sec="pt" title="Point" icon="🖥"
          provName={getProvName("pt", provData, provCounts)}
          tpv={sharePT.tpv}
          palancas={PALANCAS_PT}
          selected={palancasSel.pt}
          pcts={palancasPct.pt}
          setPct={(id, val) => setPalancaPct("pt", id, val)}
          onToggle={id => togglePalanca("pt", id)}
        />
      )}

      {showOP && productos.op && (
        <ProdSection
          sec="op" title="Online Payments" icon="🌐"
          provName={getProvName("op", provData, provCounts)}
          tpv={shareOP.tpv}
          palancas={PALANCAS_OP}
          selected={palancasSel.op}
          pcts={palancasPct.op}
          setPct={(id, val) => setPalancaPct("op", id, val)}
          onToggle={id => togglePalanca("op", id)}
        />
      )}

      <NavButtons
        onBack={onBack} onNext={onNext}
        backLabel="← Revisar comisiones"
        nextLabel="Generar propuesta →"
        backAction="Paso anterior" nextAction="Finalizar"
      />
    </div>
  );
}
