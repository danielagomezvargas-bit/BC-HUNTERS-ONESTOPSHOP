"use client";
import type { Negocio, Productos } from "@/types";
import { COLORS } from "@/data/constants";

interface Props { negocio: Negocio; productos: Productos }

export default function Topbar({ negocio, productos }: Props) {
  const prods = [
    productos.point && "Point",
    productos.op    && "Online Payments",
  ].filter(Boolean);

  return (
    <div style={{
      background:"#fff", borderBottom:`1px solid ${COLORS.border}`,
      padding:"10px 24px", display:"flex", alignItems:"center", gap:14,
      position:"sticky", top:0, zIndex:50,
    }}>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logotipo_de_Mercado_Pago.svg/512px-Logotipo_de_Mercado_Pago.svg.png"
        style={{ height:36 }} alt="Mercado Pago"
      />
      {negocio.logo && (
        <>
          <span style={{ fontSize:14, color:COLORS.muted }}>×</span>
          <img src={negocio.logo} style={{ height:36, objectFit:"contain" }} alt="seller" />
        </>
      )}
      <div style={{ width:1, height:36, background:COLORS.border, margin:"0 14px" }}/>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:COLORS.navy }}>Business Case Simulator</div>
        <div style={{ fontSize:12, color:COLORS.muted }}>Monetización de oferta de valor</div>
      </div>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
        {prods.length > 0 && (
          <span style={{ fontSize:11, color:COLORS.muted }}>Ejercicio: {prods.join(" + ")}</span>
        )}
        {negocio.nombre && (
          <span style={{ fontSize:12, fontWeight:700, color:COLORS.navy, marginLeft:8 }}>
            {negocio.nombre}
          </span>
        )}
      </div>
    </div>
  );
}
