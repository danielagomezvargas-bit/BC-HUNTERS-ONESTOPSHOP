"use client";
import { useState } from "react";
import type { Negocio } from "@/types";
import { INDUSTRIES, COLORS as C } from "@/data/constants";
import NavButtons from "@/components/ui/NavButtons";

interface Props {
  negocio: Negocio;
  setNegocio: (fn: (prev: Negocio) => Negocio) => void;
  onNext: () => void;
}

export default function Step1_Datos({ negocio, setNegocio, onNext }: Props) {
  const [err, setErr] = useState<Record<string,string>>({});
  const [bduLoading, setBduLoading] = useState(false);

  function validate() {
    const e: Record<string,string> = {};
    if (!negocio.nombre.trim()) e.nombre = "El nombre del seller es obligatorio";
    if (!negocio.industria)     e.industria = "Selecciona una industria";
    setErr(e);
    return Object.keys(e).length === 0;
  }

  async function lookupRFC() {
    if (negocio.rfc.length < 12) return;
    setBduLoading(true);
    await new Promise(r => setTimeout(r, 700)); // Replace with real BDU endpoint
    setNegocio(p => ({
      ...p,
      bdu: { giro:"Comercio al por menor de ropa", tasa_debito:"1.15%", tasa_credito:"1.67%" },
    }));
    setBduLoading(false);
  }

  const inp: React.CSSProperties = { width:"100%", border:`1px solid ${C.border}`, borderRadius:7, padding:"8px 12px", fontSize:13, color:C.text, outline:"none" };
  const inpE: React.CSSProperties = { ...inp, border:`2px solid ${C.red}` };
  const sel: React.CSSProperties = { ...inp, background:"#fff", cursor:"pointer" };
  const lbl: React.CSSProperties = { fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:5, display:"block" };

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:4 }}>Datos del negocio</h2>
      <p style={{ fontSize:13, color:C.muted, marginBottom:24 }}>Información básica del seller</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px 24px" }}>

        {/* Nombre */}
        <div>
          <label style={lbl}>Nombre del seller <span style={{ color:C.blue }}>✦</span></label>
          <input style={err.nombre ? inpE : inp} value={negocio.nombre}
            onChange={e => setNegocio(p => ({ ...p, nombre:e.target.value }))}
            placeholder="Ej. AUNA" />
          {err.nombre && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>{err.nombre}</div>}
        </div>

        {/* RFC */}
        <div>
          <label style={lbl}>RFC <span style={{ color:C.muted, fontWeight:400, fontSize:9 }}>(opcional)</span></label>
          <input style={inp} value={negocio.rfc}
            onChange={e => setNegocio(p => ({ ...p, rfc:e.target.value }))}
            onBlur={lookupRFC} placeholder="Ej. EMP200101ABC" maxLength={13} />
          {bduLoading && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Consultando BDU…</div>}
          {negocio.bdu && (
            <>
              <div style={{ background:C.lb, border:`1px solid #B3DDEF`, borderRadius:8, padding:"10px 14px", marginTop:8, fontSize:12 }}>
                <div style={{ fontWeight:700, color:C.navy, marginBottom:4 }}>Resultado BDU</div>
                <div>Giro: {negocio.bdu.giro}</div>
                <div>Tasa natural Débito: <strong>{negocio.bdu.tasa_debito}</strong></div>
                <div>Tasa natural Crédito: <strong>{negocio.bdu.tasa_credito}</strong></div>
              </div>
              <div style={{ background:"#FFFBF5", border:`1px solid #F0C070`, borderRadius:7, padding:"8px 12px", fontSize:11, color:C.amber, marginTop:6 }}>
                Recuerda que estas son tasas interbancarias, no significa que el Seller pague estas comisiones
              </div>
            </>
          )}
        </div>

        {/* Industria */}
        <div>
          <label style={lbl}>Industria <span style={{ color:C.blue }}>✦</span></label>
          <select style={err.industria ? { ...sel, border:`2px solid ${C.red}` } : sel}
            value={negocio.industria}
            onChange={e => setNegocio(p => ({ ...p, industria:e.target.value }))}>
            <option value="">Selecciona…</option>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          {err.industria && <div style={{ fontSize:11, color:C.red, marginTop:3 }}>{err.industria}</div>}
        </div>

        {/* Logo */}
        <div>
          <label style={lbl}>Logo del seller <span style={{ color:C.muted, fontWeight:400, fontSize:9 }}>(opcional)</span></label>
          <div
            style={{ border:`2px dashed ${C.border}`, borderRadius:7, padding:14, textAlign:"center", cursor:"pointer", background:"#FAFAFA" }}
            onClick={() => document.getElementById("logo-inp")?.click()}
          >
            {negocio.logo
              ? <img src={negocio.logo} alt="logo" style={{ maxHeight:48, maxWidth:120, objectFit:"contain" }} />
              : <div style={{ fontSize:12, color:C.muted }}>📁 Haz clic para subir</div>
            }
          </div>
          <input id="logo-inp" type="file" accept="image/*" style={{ display:"none" }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = ev => setNegocio(p => ({ ...p, logo: ev.target?.result as string }));
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      </div>

      <NavButtons
        onNext={() => validate() && onNext()}
        nextLabel="Elegir producto →"
        nextAction="Siguiente paso"
      />
    </div>
  );
}
