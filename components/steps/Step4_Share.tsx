"use client";
import { useState, useRef, useCallback } from "react";
import type { Productos, ProvData, ProvCounts, ShareState } from "@/types";
import type { SecKey, MsiPlazo } from "@/types";
import { MEDIOS_PT_OT, MEDIOS_OP_OT, MSI_PLAZOS, COLORS as C } from "@/data/constants";
import { fmx, parseNum } from "@/utils/format";
import NavButtons from "@/components/ui/NavButtons";

interface Props {
  productos: Productos;
  provData: ProvData;
  provCounts: ProvCounts;
  sharePT: ShareState;
  setSharePT: (fn: (p: ShareState) => ShareState) => void;
  shareOP: ShareState;
  setShareOP: (fn: (p: ShareState) => ShareState) => void;
  simLoaded: boolean;
  setSimLoaded: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

const MSI_ALL = MSI_PLAZOS as unknown as MsiPlazo[];

// ── Small helpers ─────────────────────────────────────────────
function getProvName(sec: SecKey, provData: ProvData, provCounts: ProvCounts): string {
  const n = provCounts[sec];
  if (n === 1) return provData[`${sec}_0`]?.bank || "—";
  const names = Array.from({ length: n }, (_, i) => provData[`${sec}_${i}`]?.bank).filter(Boolean);
  return names.join(" · ") || "—";
}

function sumOT(ot: Record<string, number>): number {
  return Object.values(ot).reduce((a, b) => a + (b || 0), 0);
}
function sumMSI(msi: Record<string, number>, active: Set<MsiPlazo>): number {
  return Array.from(active).reduce((a, p) => a + (msi[p] || 0), 0);
}

// ── Upload banner ─────────────────────────────────────────────
function SimUpload({ loaded, onToggle }: { loaded: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      display:"flex", alignItems:"center", gap:16,
      border:`2px ${loaded ? "solid" : "dashed"} ${loaded ? C.green : "#B3DDEF"}`,
      borderRadius:12, background: loaded ? C.lg : C.lb,
      padding:"16px 20px", cursor:"pointer", marginBottom:22, transition:"all .2s",
    }}>
      <div style={{ width:48, height:48, borderRadius:9, background:"#fff", border:`1px solid ${loaded ? "#A3D9B8" : "#B3DDEF"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
        {loaded ? "✅" : "📂"}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color: loaded ? "#00703A" : C.blue }}>
          {loaded ? "Simulador leído — datos pre-llenados" : "Subir Simulador_Sellers_MLM (.xlsx)"}
        </div>
        <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
          {loaded ? "Puedes editar cualquier valor abajo" : "Pre-llena todos los campos automáticamente · Compatible con cualquier versión"}
        </div>
      </div>
      <div style={{ fontSize:12, fontWeight:700, color: loaded ? "#00703A" : C.blue, background:"#fff", border:`1.5px solid ${loaded ? "#00A650" : C.blue}`, borderRadius:7, padding:"6px 14px", flexShrink:0 }}>
        {loaded ? "Cambiar" : "Cargar archivo"}
      </div>
    </div>
  );
}

// ── Solution header ───────────────────────────────────────────
function SolHeader({ sec, name, tpv }: { sec: SecKey; name: string; tpv: number }) {
  const isPT = sec === "pt";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderRadius:"10px 10px 0 0", background: isPT ? C.navy : "#1A4A5E" }}>
      <span style={{ fontSize:20 }}>{isPT ? "🖥" : "🌐"}</span>
      <div style={{ flex:1 }}>
        <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{isPT ? "Point" : "Online Payments"}</div>
        <div style={{ color:"rgba(255,255,255,.85)", fontSize:12, fontWeight:600, marginTop:2, display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:C.blue }}/>
          {name}
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ color:"rgba(255,255,255,.4)", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>{isPT ? "TPV mensual" : "Vol. mensual"}</div>
        <div style={{ color:"#fff", fontSize:15, fontWeight:700, marginTop:2 }}>{fmx(tpv)}</div>
      </div>
    </div>
  );
}

// ── Number input ──────────────────────────────────────────────
function NumInp({ value, onChange, sim }: { value: number; onChange: (v: number) => void; sim: boolean }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", border:`1px solid ${sim ? "#B3DDEF" : C.border}`, borderRadius:6, background: sim ? C.lb : "#fff", height:28 }}>
      <input
        type="number" step="0.1" min={0} max={100}
        value={value || ""}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width:52, border:"none", background:"transparent", padding:"0 4px", fontSize:12, outline:"none", textAlign:"center", color:C.text }}
      />
      <span style={{ fontSize:11, color:C.muted, paddingRight:6 }}>%</span>
    </div>
  );
}

// ── Share section (one product) ───────────────────────────────
function ShareSection({ sec, share, setShare, provData, provCounts, simLoaded, errShare }: {
  sec: SecKey;
  share: ShareState;
  setShare: (fn: (p: ShareState) => ShareState) => void;
  provData: ProvData;
  provCounts: ProvCounts;
  simLoaded: boolean;
  errShare: boolean;
}) {
  const medios = sec === "pt" ? MEDIOS_PT_OT : MEDIOS_OP_OT;
  const provName = getProvName(sec, provData, provCounts);
  const otSum = sumOT(share.ot as unknown as Record<string, number>);
  const msiSum = sumMSI(share.msi, share.msiActive);
  const total = otSum + msiSum;
  const ok = Math.abs(total - 100) < 1.5;

  function setOT(key: string, val: number) {
    setShare(p => ({ ...p, ot: { ...p.ot as any, [key]: val } }));
  }
  function setMSI(plazo: MsiPlazo, val: number) {
    setShare(p => ({ ...p, msi: { ...p.msi, [plazo]: val } }));
  }
  function toggleMSI(plazo: MsiPlazo) {
    setShare(p => {
      const next = new Set(p.msiActive);
      if (next.has(plazo)) { next.delete(plazo); }
      else { next.add(plazo); }
      return { ...p, msiActive: next };
    });
  }
  function setTPV(val: number) {
    setShare(p => ({ ...p, tpv: val }));
  }

  const activeMSI = Array.from(share.msiActive).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:24 }}>
      <SolHeader sec={sec} name={provName} tpv={share.tpv} />

      {/* TPV bar */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 18px", background:"#F7F8FA", borderBottom:`2px solid ${C.border}` }}>
        <span style={{ fontSize:11, fontWeight:600, color:C.muted, whiteSpace:"nowrap" }}>
          {sec === "pt" ? "TPV mensual" : "Procesamiento mensual"} <span style={{ color:C.blue }}>✦</span>
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>$</span>
          <input
            type="text"
            defaultValue={share.tpv.toLocaleString("es-MX")}
            onBlur={e => setTPV(parseNum(e.target.value))}
            style={{ border:`1px solid ${simLoaded ? "#B3DDEF" : C.border}`, borderRadius:6, padding:"5px 8px", fontSize:12, color:C.text, background: simLoaded ? C.lb : "#fff", outline:"none", width:148, textAlign:"right" }}
          />
          <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>MXN</span>
        </div>
        <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap", background: ok ? C.lg : C.la, color: ok ? "#00703A" : C.amber }}>
          Share de pagos: {total.toFixed(1)}% {ok ? "✓" : "⚠ debe ser 100%"}
        </span>
      </div>

      {/* Split */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 20px 1fr" }}>

        {/* LEFT — Pagos de contado */}
        <div>
          <div style={{ padding:"11px 16px", background:"#FFF8F0", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>💳 Pagos de contado</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>¿Cómo es el comportamiento de pago?</div>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
            <colgroup><col/><col style={{ width:88 }}/><col style={{ width:106 }}/></colgroup>
            <thead>
              <tr style={{ height:30, background:"#FAFAFA", borderBottom:`1px solid #EBEBEB` }}>
                <th style={{ padding:"0 14px", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", textAlign:"left" }}>Tipo de pago</th>
                <th style={{ padding:"0 14px", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", textAlign:"right" }}>Share %</th>
                <th style={{ padding:"0 14px", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", textAlign:"right" }}>TPV</th>
              </tr>
            </thead>
            <tbody>
              {medios.map(m => {
                const pct = (share.ot as any)[m.key] || 0;
                const vol = share.tpv * pct / 100;
                return (
                  <tr key={m.key} style={{ height:40, borderBottom:`1px solid #F2F2F2` }}>
                    <td style={{ padding:"0 14px", fontSize:13, fontWeight:500, color:C.text }}>{m.label}</td>
                    <td style={{ padding:"0 14px", textAlign:"right" }}>
                      <NumInp value={pct} onChange={v => setOT(m.key, v)} sim={simLoaded} />
                    </td>
                    <td style={{ padding:"0 14px", fontSize:11, color:C.muted, textAlign:"right", fontVariantNumeric:"tabular-nums" }}>
                      {pct > 0 ? fmx(vol) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ height:40, background:"#F7F8FA", borderTop:`2px solid ${C.border}` }}>
                <td style={{ padding:"0 14px", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".05em" }}>Subtotal</td>
                <td style={{ padding:"0 14px", fontSize:12, fontWeight:700, textAlign:"right", color: ok ? C.green : C.amber }}>{otSum.toFixed(1)}%</td>
                <td style={{ padding:"0 14px", fontSize:11, color:C.muted, textAlign:"right" }}>{fmx(share.tpv * otSum / 100)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* GAP */}
        <div style={{ background:C.bg, borderLeft:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}` }}/>

        {/* RIGHT — MSI */}
        <div>
          <div style={{ padding:"11px 16px", background:"#FFF8F0", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>📅 Financiamiento</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap", marginTop:4 }}>
              <span style={{ fontSize:10, fontWeight:600, color:C.amber, whiteSpace:"nowrap" }}>¿Qué meses ofrece el Seller? <span style={{ color:C.blue }}>✦</span></span>
              <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                {MSI_ALL.map(p => (
                  <div key={p} onClick={() => toggleMSI(p)} style={{
                    padding:"2px 8px", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer",
                    border:`1.5px solid ${share.msiActive.has(p) ? C.amber : C.border}`,
                    background: share.msiActive.has(p) ? C.la : "#fff",
                    color: share.msiActive.has(p) ? C.amber : C.muted,
                  }}>{p}</div>
                ))}
              </div>
            </div>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
            <colgroup><col/><col style={{ width:88 }}/><col style={{ width:106 }}/></colgroup>
            <thead>
              <tr style={{ height:30, background:"#FAFAFA", borderBottom:`1px solid #EBEBEB` }}>
                <th style={{ padding:"0 14px", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", textAlign:"left" }}>Meses sin intereses</th>
                <th style={{ padding:"0 14px", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", textAlign:"right" }}>Share %</th>
                <th style={{ padding:"0 14px", fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", textAlign:"right" }}>TPV</th>
              </tr>
            </thead>
            <tbody>
              {activeMSI.length === 0
                ? <tr><td colSpan={3} style={{ padding:"16px 14px", textAlign:"center", fontSize:11, color:C.muted }}>Sin plazos seleccionados</td></tr>
                : activeMSI.map(p => {
                    const pct = (share.msi as Record<string, number>)[p] || 0;
                    const vol = share.tpv * pct / 100;
                    return (
                      <tr key={p} style={{ height:40, borderBottom:`1px solid #F2F2F2` }}>
                        <td style={{ padding:"0 14px", fontSize:13, fontWeight:600, color:C.amber }}>{p}</td>
                        <td style={{ padding:"0 14px", textAlign:"right" }}>
                          <NumInp value={pct} onChange={v => setMSI(p, v)} sim={simLoaded} />
                        </td>
                        <td style={{ padding:"0 14px", fontSize:11, color:C.muted, textAlign:"right" }}>
                          {pct > 0 ? fmx(vol) : "—"}
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
            <tfoot>
              <tr style={{ height:40, background:"#F7F8FA", borderTop:`2px solid ${C.border}` }}>
                <td style={{ padding:"0 14px", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".05em" }}>Subtotal MSI</td>
                <td style={{ padding:"0 14px", fontSize:12, fontWeight:700, textAlign:"right", color: ok ? C.green : C.amber }}>{msiSum.toFixed(1)}%</td>
                <td style={{ padding:"0 14px", fontSize:11, color:C.muted, textAlign:"right" }}>{fmx(share.tpv * msiSum / 100)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {errShare && (
        <div style={{ display:"flex", gap:8, padding:"10px 14px", background:"#FEE8EA", borderTop:`1px solid #FFCDD2`, fontSize:12, color:C.red }}>
          <span>⚠</span> El share debe sumar 100% antes de continuar (actual: {total.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Step4_Share({
  productos, provData, provCounts,
  sharePT, setSharePT, shareOP, setShareOP,
  simLoaded, setSimLoaded,
  onNext, onBack,
}: Props) {
  const [errs, setErrs] = useState<Record<string, boolean>>({});
  const [simClicks, setSimClicks] = useState(0);

  function validate() {
    const e: Record<string, boolean> = {};
    if (productos.point) {
      const t = sumOT(sharePT.ot as any) + sumMSI(sharePT.msi, sharePT.msiActive);
      if (!sharePT.tpv) e.ptTpv = true;
      if (Math.abs(t - 100) >= 1.5) e.ptShare = true;
    }
    if (productos.op) {
      const t = sumOT(shareOP.ot as any) + sumMSI(shareOP.msi, shareOP.msiActive);
      if (!shareOP.tpv) e.opTpv = true;
      if (Math.abs(t - 100) >= 1.5) e.opShare = true;
    }
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function toggleSim() {
    const n = simClicks + 1;
    setSimClicks(n);
    setSimLoaded(n % 2 === 1);
  }

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:4 }}>Share de pagos</h2>
      <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>
        Sube el simulador para auto-completar, o ingresa los valores manualmente
      </p>

      <SimUpload loaded={simLoaded} onToggle={toggleSim} />

      {productos.point && (
        <ShareSection sec="pt" share={sharePT} setShare={setSharePT}
          provData={provData} provCounts={provCounts}
          simLoaded={simLoaded} errShare={!!errs.ptShare} />
      )}
      {productos.op && (
        <ShareSection sec="op" share={shareOP} setShare={setShareOP}
          provData={provData} provCounts={provCounts}
          simLoaded={simLoaded} errShare={!!errs.opShare} />
      )}

      <NavButtons
        onBack={onBack} onNext={() => validate() && onNext()}
        backLabel="← Revisar proveedores"
        nextLabel="Ingresar comisiones →"
        backAction="Paso anterior" nextAction="Siguiente paso"
      />
    </div>
  );
}
