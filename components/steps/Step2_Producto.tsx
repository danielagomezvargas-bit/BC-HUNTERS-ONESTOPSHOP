"use client";
import { useState } from "react";
import type { Productos } from "@/types";
import { COLORS as C } from "@/data/constants";
import NavButtons from "@/components/ui/NavButtons";

interface Props {
  productos: Productos;
  setProductos: (fn: (p: Productos) => Productos) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CardDef { key: keyof Productos; icon: string; title: string; sub: string }

const CARDS: CardDef[] = [
  { key:"point", icon:"🖥", title:"Point",           sub:"Terminales físicas"    },
  { key:"op",    icon:"🌐", title:"Online Payments", sub:"Checkout / Link de Pago"},
];

export default function Step2_Producto({ productos, setProductos, onNext, onBack }: Props) {
  const [err, setErr] = useState(false);

  function toggle(key: keyof Productos) {
    setProductos(p => ({ ...p, [key]: !p[key] }));
    setErr(false);
  }

  function handleNext() {
    if (!productos.point && !productos.op) { setErr(true); return; }
    onNext();
  }

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:4 }}>¿Qué ejercicio te voy a ayudar a hacer?</h2>
      <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>
        Selecciona las soluciones que vas a presentarle al seller <span style={{ color:C.blue }}>✦</span>
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:12 }}>
        {CARDS.map(({ key, icon, title, sub }) => {
          const active = productos[key];
          return (
            <div key={key} onClick={() => toggle(key)} style={{
              border:`2px solid ${active ? C.blue : C.border}`,
              borderRadius:10, padding:"22px 20px",
              cursor:"pointer", background: active ? C.lb : "#fff",
              position:"relative", transition:"all .15s",
            }}>
              {active && (
                <div style={{ position:"absolute", top:12, right:12, width:22, height:22, borderRadius:"50%", background:C.blue, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>✓</div>
              )}
              <div style={{ fontSize:28, marginBottom:10 }}>{icon}</div>
              <div style={{ fontSize:16, fontWeight:700, color: active ? C.blue : C.text, marginBottom:5 }}>{title}</div>
              <div style={{ fontSize:12, color:C.muted }}>{sub}</div>
            </div>
          );
        })}
      </div>

      {err && (
        <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:C.lr, border:"1px solid #FFCDD2", borderRadius:8, padding:"10px 14px", fontSize:12, color:C.red }}>
          <span>⚠</span>
          <div><strong>Selecciona al menos una opción.</strong> Elige Point, Online Payments, o ambas.</div>
        </div>
      )}

      {(productos.point || productos.op) && (
        <div style={{ background:C.lb, border:`1px solid #B3DDEF`, borderRadius:8, padding:"10px 14px", fontSize:12, color:C.navy, marginTop:12 }}>
          ✓ Ejercicio: {[productos.point && "Point", productos.op && "Online Payments"].filter(Boolean).join(" + ")}
        </div>
      )}

      <NavButtons
        onBack={onBack} onNext={handleNext}
        backLabel="← Datos del negocio"
        nextLabel="Registrar proveedores →"
        backAction="Paso anterior" nextAction="Siguiente paso"
      />
    </div>
  );
}
