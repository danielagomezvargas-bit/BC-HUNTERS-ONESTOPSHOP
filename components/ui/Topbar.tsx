"use client";
import type { Negocio, Productos } from "@/types";
import { COLORS } from "@/data/constants";

interface Props { negocio: Negocio; productos: Productos; onReset?: () => void }

export default function Topbar({ negocio, productos, onReset }: Props) {
  const prods = [
    productos.point && "Point",
    productos.op    && "Online Payments",
  ].filter(Boolean);

  return (
    <div style={{
      background:"#fff", borderBottom:`1px solid ${COLORS.border}`,
      padding:"16px 32px", display:"flex", alignItems:"center", gap:18,
      position:"sticky", top:0, zIndex:50,
    }}>
      <img
        src="/mp-logo.png"
        style={{ height:36, display:"block" }} alt="Mercado Pago"
      />
      {negocio.logo && (
        <>
          <span style={{ fontSize:16, color:COLORS.muted }}>×</span>
          <img src={negocio.logo} style={{ height:44, objectFit:"contain" }} alt="seller" />
        </>
      )}
      <div style={{ width:1, height:44, background:COLORS.border, margin:"0 18px" }}/>
      <div>
        <div style={{ fontSize:17, fontWeight:700, color:COLORS.navy }}>Business Case Simulator</div>
        <div style={{ fontSize:13, color:COLORS.muted }}>Monetización de oferta de valor</div>
      </div>
      {/* Botón Inicio */}
      {onReset && (
        <button
          onClick={() => {
            if (window.confirm("Vas a regresar a la página inicial y perderás todos los datos. ¿Continuar?")) {
              onReset();
            }
          }}
          style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "7px 16px", borderRadius: 8,
            background: "transparent", border: "1px solid #E5E7EB",
            fontSize: 13, fontWeight: 600, color: "#6B7280",
            cursor: "pointer", transition: "all .15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; (e.currentTarget as HTMLElement).style.borderColor = "#FCA5A5"; (e.currentTarget as HTMLElement).style.color = "#DC2626"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 12l5-5M3 12l5 5"/>
          </svg>
          Inicio
        </button>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {prods.length > 0 && (
          <span style={{ fontSize:13, color:COLORS.muted }}>Ejercicio: {prods.join(" + ")}</span>
        )}
        {negocio.nombre && (
          <span style={{ fontSize:14, fontWeight:700, color:COLORS.navy, marginLeft:10 }}>
            {negocio.nombre}
          </span>
        )}
      </div>
    </div>
  );
}
