"use client";
import { useEffect, useRef, useState } from "react";
import OnePager, { type OnePagerData } from "@/components/OnePager";
import { COLORS as C } from "@/data/constants";
import type { ComOTRow, ComMSIRow } from "@/types";

// ── Edit panel ────────────────────────────────────────────────
function EditPanel({ data, onApply, onCancel }: {
  data: OnePagerData;
  onApply: (d: OnePagerData) => void;
  onCancel: () => void;
}) {
  const [tpvPT, setTpvPT] = useState(String(data.tpvPT));
  const [tpvOP, setTpvOP] = useState(String(data.tpvOP));
  const [comPT_OT, setComPT_OT] = useState<ComOTRow[]>(data.comPT_OT.map(r => ({ ...r })));
  const [comPT_MSI, setComPT_MSI] = useState<ComMSIRow[]>(data.comPT_MSI.map(r => ({ ...r })));
  const [comOP_OT, setComOP_OT] = useState<ComOTRow[]>(data.comOP_OT.map(r => ({ ...r })));
  const [comOP_MSI, setComOP_MSI] = useState<ComMSIRow[]>(data.comOP_MSI.map(r => ({ ...r })));

  function apply() {
    const next: OnePagerData = {
      ...data,
      tpvPT: parseFloat(tpvPT) || data.tpvPT,
      tpvOP: parseFloat(tpvOP) || data.tpvOP,
      comPT_OT, comPT_MSI, comOP_OT, comOP_MSI,
    };
    localStorage.setItem("simulator_summary", JSON.stringify(next));
    onApply(next);
  }

  const inp: React.CSSProperties = {
    border: `1px solid ${C.border}`, borderRadius: 5, padding: "4px 8px",
    fontSize: 12, width: 72, textAlign: "right", outline: "none",
  };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" };

  function RateSection({ title, comOT, comMSI, tpv, setTpv, setOT, setMSI }: {
    title: string;
    comOT: ComOTRow[]; comMSI: ComMSIRow[];
    tpv: string; setTpv: (v: string) => void;
    setOT: (rows: ComOTRow[]) => void;
    setMSI: (rows: ComMSIRow[]) => void;
  }) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 10, paddingBottom: 4, borderBottom: `1px solid ${C.border}` }}>
          {title}
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>TPV mensual</label>
          <input style={{ ...inp, width: 120, marginLeft: 8 }} type="number" value={tpv} onChange={e => setTpv(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: "4px 12px", alignItems: "center", marginBottom: 8 }}>
          <div style={lbl}>Concepto</div>
          <div style={{ ...lbl, textAlign: "right", color: C.amber }}>Actual %</div>
          <div style={{ ...lbl, textAlign: "right", color: C.green }}>MP %</div>
          {comOT.map((r, i) => (
            <>
              <div key={`l${i}`} style={{ fontSize: 11, color: "#444" }}>{r.l}</div>
              <input key={`cu${i}`} style={{ ...inp, borderColor: `${C.amber}66` }} type="number" step="0.01"
                value={r.cu} onChange={e => setOT(comOT.map((x, j) => j === i ? { ...x, cu: parseFloat(e.target.value) || x.cu } : x))} />
              <input key={`mp${i}`} style={{ ...inp, borderColor: `${C.green}66` }} type="number" step="0.01"
                value={r.mp} onChange={e => setOT(comOT.map((x, j) => j === i ? { ...x, mp: parseFloat(e.target.value) || x.mp } : x))} />
            </>
          ))}
          {comMSI.map((r, i) => (
            <>
              <div key={`ml${i}`} style={{ fontSize: 11, color: "#444" }}>{r.l}</div>
              <input key={`sb${i}`} style={{ ...inp, borderColor: `${C.amber}66` }} type="number" step="0.01"
                value={r.sb} onChange={e => setMSI(comMSI.map((x, j) => j === i ? { ...x, sb: parseFloat(e.target.value) || x.sb } : x))} />
              <input key={`sm${i}`} style={{ ...inp, borderColor: `${C.green}66` }} type="number" step="0.01"
                value={r.sm} onChange={e => setMSI(comMSI.map((x, j) => j === i ? { ...x, sm: parseFloat(e.target.value) || x.sm } : x))} />
            </>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "20px 24px", marginBottom: 20, maxWidth: 900, margin: "0 auto 20px",
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 16 }}>✏️ Editar propuesta</div>
      <div style={{ display: "grid", gridTemplateColumns: data.productos.point && data.productos.op ? "1fr 1fr" : "1fr", gap: 24 }}>
        {data.productos.point && (
          <RateSection title="🖥 Point (Terminales)"
            comOT={comPT_OT} comMSI={comPT_MSI}
            tpv={tpvPT} setTpv={setTpvPT}
            setOT={setComPT_OT} setMSI={setComPT_MSI}
          />
        )}
        {data.productos.op && (
          <RateSection title="🌐 Online Payments"
            comOT={comOP_OT} comMSI={comOP_MSI}
            tpv={tpvOP} setTpv={setTpvOP}
            setOT={setComOP_OT} setMSI={setComOP_MSI}
          />
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <button onClick={apply} style={{ padding: "9px 24px", background: C.green, color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          ✅ Aplicar cambios
        </button>
        <button onClick={onCancel} style={{ padding: "9px 18px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.navy }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function SummaryPage() {
  const [data, setData]       = useState<OnePagerData | null>(null);
  const [editing, setEditing] = useState(false);
  const pagerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem("simulator_summary");
    if (raw) setData(JSON.parse(raw));
  }, []);

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
    a.href = url;
    a.download = `propuesta-${data.negocio.nombre || "seller"}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data) {
    return (
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", textAlign: "center", padding: 80, color: C.muted }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>No hay propuesta generada</div>
        <div style={{ marginTop: 12 }}>
          <a href="/simulator" style={{ color: C.blue, fontWeight: 700, textDecoration: "none" }}>← Volver al simulador</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          #one-pager { border: none !important; max-width: 100% !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        background: "#fff", borderBottom: `1px solid ${C.border}`,
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 10,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <a href="/simulator" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>← Simulador</a>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logotipo_de_Mercado_Pago.svg/512px-Logotipo_de_Mercado_Pago.svg.png"
          style={{ height: 28 }} alt="MP" />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.navy, flex: 1 }}>
          {data.negocio.nombre || "Resumen"} — Propuesta de monetización
        </span>
        <button onClick={() => setEditing(e => !e)}
          style={{ padding: "7px 16px", background: editing ? C.amber : "#fff", color: editing ? "#fff" : C.navy, border: `1px solid ${editing ? C.amber : C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          ✏️ {editing ? "Ocultar edición" : "Editar"}
        </button>
        <button onClick={() => window.print()} style={btn(C.navy)}>🖨 PDF</button>
        <button onClick={handleExcel} style={btn(C.green)}>📊 Excel</button>
        <a href="/benchmark" style={{ ...btn(C.blue), textDecoration: "none" }}>📈 Benchmark</a>
      </div>

      {/* Content */}
      <div style={{ background: C.bg, minHeight: "100vh", padding: "24px 20px" }}>
        {editing && (
          <EditPanel
            data={data}
            onApply={d => { setData(d); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        )}
        <OnePager data={data} pagerRef={pagerRef} />
      </div>
    </>
  );
}

const btn = (color: string): React.CSSProperties => ({
  padding: "7px 14px", background: color, color: "#fff",
  border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
});
