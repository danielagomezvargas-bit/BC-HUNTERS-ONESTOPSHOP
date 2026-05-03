"use client";
import { useEffect, useRef, useState } from "react";
import OnePager, { type OnePagerData } from "@/components/OnePager";
import { COLORS as C } from "@/data/constants";

export default function SummaryPage() {
  const [data, setData] = useState<OnePagerData | null>(null);
  const pagerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("simulator_summary");
    if (raw) setData(JSON.parse(raw));
  }, []);

  function handlePrint() {
    window.print();
  }

  async function handleExcel() {
    if (!data) return;
    const res = await fetch("/api/export/excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { alert("Error generando Excel"); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `propuesta-${data.negocio.nombre || "seller"}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data) {
    return (
      <div style={{ fontFamily:"'IBM Plex Sans', sans-serif", textAlign:"center", padding:80, color:C.muted }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📄</div>
        <div style={{ fontSize:16, fontWeight:700, color:C.navy }}>No hay propuesta generada</div>
        <div style={{ marginTop:12 }}>
          <a href="/simulator" style={{ color:C.blue, fontWeight:700, textDecoration:"none" }}>← Volver al simulador</a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          #one-pager { border: none !important; box-shadow: none !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        background:"#fff", borderBottom:`1px solid ${C.border}`,
        padding:"10px 24px", display:"flex", alignItems:"center", gap:12,
        position:"sticky", top:0, zIndex:50,
      }}>
        <a href="/simulator" style={{ fontSize:12, color:C.muted, textDecoration:"none", marginRight:8 }}>← Simulador</a>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logotipo_de_Mercado_Pago.svg/512px-Logotipo_de_Mercado_Pago.svg.png"
          style={{ height:30 }} alt="Mercado Pago"
        />
        <span style={{ fontSize:14, fontWeight:700, color:C.navy, marginRight:"auto" }}>
          Resumen de monetización — {data.negocio.nombre}
        </span>

        <button onClick={handlePrint} style={btnStyle(C.navy)}>
          🖨 Descargar PDF
        </button>
        <button onClick={handleExcel} style={btnStyle(C.green)}>
          📊 Descargar Excel
        </button>
        <a href="/benchmark" style={{ ...btnStyle(C.blue), textDecoration:"none" }}>
          📈 Ver benchmark
        </a>
      </div>

      {/* One Pager */}
      <div style={{ background:C.bg, minHeight:"100vh", padding:"28px 20px" }}>
        <OnePager data={data} pagerRef={pagerRef} />
      </div>
    </>
  );
}

const btnStyle = (color: string): React.CSSProperties => ({
  padding: "8px 16px", background: color, color: "#fff",
  border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700,
  cursor: "pointer",
});
