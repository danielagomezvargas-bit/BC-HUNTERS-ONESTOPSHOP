"use client";
import { useState } from "react";
import type { Productos, ProvData, ProvCounts } from "@/types";
import type { SecKey } from "@/types";
import { PROVEEDORES_PT, PROVEEDORES_OP, COLORS as C } from "@/data/constants";
import NavButtons from "@/components/ui/NavButtons";

interface Props {
  productos: Productos;
  provCounts: ProvCounts;
  setProvCounts: (fn: (p: ProvCounts) => ProvCounts) => void;
  provData: ProvData;
  updateProvData: (sec: SecKey, idx: number, field: "rates"|"bank", val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function ProvRow({ sec, idx, provData, updateProvData, banks }: {
  sec: SecKey; idx: number; provData: ProvData;
  updateProvData: Props["updateProvData"]; banks: string[];
}) {
  const d = provData[`${sec}_${idx}`] || {};
  const rates = d.rates || "";
  const bank  = d.bank  || "";

  function setYN(val: "si"|"no") {
    updateProvData(sec, idx, "rates", val);
    if (val === "no") updateProvData(sec, idx, "bank", "Desconocido");
    if (val === "si") updateProvData(sec, idx, "bank", "");
  }

  const pill = (active: boolean): React.CSSProperties => ({
    display:"flex", alignItems:"center", gap:6,
    padding:"8px 22px", borderRadius:8, fontSize:13, fontWeight:700,
    cursor:"pointer", userSelect:"none", transition:"all .15s",
    border:`1.5px solid ${active ? C.blue : C.border}`,
    background: active ? C.blue : "#fff",
    color: active ? "#fff" : C.muted,
  });

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", marginBottom:8, background:"#FAFAFA" }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
        Solución {idx + 1}
      </div>

      {/* Sí / No */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5 }}>
          ¿Tienes las tasas reales del seller? <span style={{ color:C.blue }}>✦</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {(["si","no"] as const).map(val => (
            <div key={val} style={pill(rates === val)} onClick={() => setYN(val)}>
              <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: rates === val ? "rgba(255,255,255,.7)" : C.border }}/>
              {val === "si" ? "Sí" : "No"}
            </div>
          ))}
        </div>
        {rates === "no" && (
          <div style={{ fontSize:10, marginTop:7, fontWeight:600, padding:"5px 9px", borderRadius:5, color:C.amber, background:C.la }}>
            Usaremos una estimación referencial de la industria.
          </div>
        )}
      </div>

      {/* Proveedor */}
      {rates !== "" && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5 }}>
            Proveedor <span style={{ color:C.blue }}>✦</span>
          </div>
          <select value={bank} onChange={e => updateProvData(sec, idx, "bank", e.target.value)}
            style={{ width:"100%", border:`1px solid ${C.border}`, borderRadius:6, padding:"7px 10px", fontSize:13, color:C.text, background:"#fff", outline:"none" }}>
            <option value="">Selecciona…</option>
            {banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

function Section({ sec, title, sub, question, banks, count, setCount, provData, updateProvData }: {
  sec: SecKey; title: string; sub: string; question: string; banks: string[];
  count: number; setCount: (s: SecKey, n: number) => void;
  provData: ProvData; updateProvData: Props["updateProvData"];
}) {
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
      <div style={{ background: sec === "pt" ? C.navy : "#1A4A5E", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ color:"#fff", fontSize:13, fontWeight:700 }}>{title}</div>
          <div style={{ color:"rgba(255,255,255,.5)", fontSize:10, marginTop:1 }}>{sub}</div>
        </div>
        <span style={{ background:"rgba(255,255,255,.15)", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:4 }}>
          {count === 1 ? "1 solución" : `${count} soluciones`}
        </span>
      </div>
      <div style={{ padding:14 }}>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:8 }}>{question} <span style={{ color:C.blue }}>✦</span></div>
          <div style={{ display:"flex", gap:6 }}>
            {[1,2,3,4].map(n => (
              <button key={n} onClick={() => setCount(sec, n)} style={{
                width:42, height:42, borderRadius:8, fontWeight:700, fontSize:14, cursor:"pointer",
                border:`2px solid ${count === n ? C.blue : C.border}`,
                background: count === n ? C.blue : "#fff",
                color: count === n ? "#fff" : C.text,
              }}>{n < 4 ? n : "4+"}</button>
            ))}
          </div>
        </div>
        {Array.from({ length: count }, (_, i) => (
          <ProvRow key={i} sec={sec} idx={i} provData={provData} updateProvData={updateProvData} banks={banks} />
        ))}
        <div style={{ background:"#F4F6FA", border:`1px solid ${C.border}`, borderRadius:7, padding:"9px 11px", fontSize:11, color:C.muted, display:"flex", gap:7 }}>
          <span style={{ fontSize:14, flexShrink:0 }}>📊</span>
          Sé honesto al indicar si tienes las tasas reales del contrato. Esta información alimenta el benchmark de Mercado Pago.
        </div>
      </div>
    </div>
  );
}

export default function Step3_Proveedores({ productos, provCounts, setProvCounts, provData, updateProvData, onNext, onBack }: Props) {
  const [errList, setErrList] = useState<string[]>([]);

  function handleSetCount(sec: SecKey, n: number) {
    setProvCounts(prev => ({ ...prev, [sec]: n }));
  }

  function validate() {
    const errs: string[] = [];
    (["pt","op"] as SecKey[]).forEach(sec => {
      if (sec === "pt" && !productos.point) return;
      if (sec === "op" && !productos.op)    return;
      const label = sec === "pt" ? "Point" : "Online Payments";
      for (let i = 0; i < provCounts[sec]; i++) {
        const d = provData[`${sec}_${i}`] || {};
        if (!d.rates)            errs.push(`${label} — Solución ${i+1}: indica si tienes las tasas reales`);
        if (d.rates && !d.bank)  errs.push(`${label} — Solución ${i+1}: selecciona el proveedor`);
      }
    });
    setErrList(errs);
    return errs.length === 0;
  }

  const both = productos.point && productos.op;

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:4 }}>Proveedores actuales del seller</h2>
      <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Registra todas las soluciones de cobro que usa hoy</p>

      <div style={{ display: both ? "grid" : "block", gridTemplateColumns: both ? "1fr 1fr" : undefined, gap:16, marginBottom: errList.length ? 0 : 24 }}>
        {productos.point && (
          <Section sec="pt" title="🖥 Point" sub="Terminales físicas"
            question="¿Cuántas soluciones de cobro usa hoy el seller?"
            banks={PROVEEDORES_PT} count={provCounts.pt}
            setCount={handleSetCount} provData={provData} updateProvData={updateProvData} />
        )}
        {productos.op && (
          <Section sec="op" title="🌐 Online Payments" sub="Checkout · Link de Pago"
            question="¿Cuántos gateways o plataformas usa hoy el seller?"
            banks={PROVEEDORES_OP} count={provCounts.op}
            setCount={handleSetCount} provData={provData} updateProvData={updateProvData} />
        )}
      </div>

      {errList.length > 0 && (
        <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:C.lr, border:"1px solid #FFCDD2", borderRadius:8, padding:"10px 14px", margin:"16px 0", fontSize:12, color:C.red, lineHeight:1.5 }}>
          <span style={{ fontSize:16 }}>⚠</span>
          <div>
            <strong>Completa los campos obligatorios:</strong>
            <ul style={{ listStyle:"none", padding:0, margin:"4px 0 0" }}>
              {errList.map((e,i) => <li key={i}>· {e}</li>)}
            </ul>
          </div>
        </div>
      )}

      <NavButtons
        onBack={onBack} onNext={() => validate() && onNext()}
        backLabel="← Elegir producto"
        nextLabel="Ingresar share de pagos →"
        backAction="Paso anterior" nextAction="Siguiente paso"
      />
    </div>
  );
}
