"use client";
import { useState, useRef } from "react";
import type { Negocio, SimuladorData } from "@/types";
import { INDUSTRIES, COLORS as C } from "@/data/constants";
import NavButtons from "@/components/ui/NavButtons";

interface Props {
  negocio:    Negocio;
  setNegocio: (fn: (prev: Negocio) => Negocio) => void;
  simData:    SimuladorData | null;
  setSimData: (d: SimuladorData | null) => void;
  onNext:     () => void;
}

function fmtMXN(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

export default function Step1_Datos({ negocio, setNegocio, simData, setSimData, onNext }: Props) {
  const [err,        setErr]        = useState<Record<string, string>>({});
  const [bduLoading, setBduLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simErr,     setSimErr]     = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]   = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!negocio.nombre.trim()) e.nombre = "El nombre del seller es obligatorio";
    if (!negocio.industria)     e.industria = "Selecciona una industria";
    setErr(e);
    return Object.keys(e).length === 0;
  }

  async function lookupRFC() {
    if (negocio.rfc.length < 12) return;
    setBduLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setNegocio(p => ({
      ...p,
      bdu: { giro: "Comercio al por menor de ropa", tasa_debito: "1.15%", tasa_credito: "1.67%" },
    }));
    setBduLoading(false);
  }

  async function parseSimulador(file: File) {
    if (!file.name.endsWith(".xlsx")) {
      setSimErr("Solo se aceptan archivos .xlsx");
      return;
    }
    setSimLoading(true);
    setSimErr(null);
    setSimData(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/parse-simulador", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setSimErr(json.error || "Error al procesar el archivo.");
      } else {
        setSimData(json as SimuladorData);
      }
    } catch {
      setSimErr("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSimLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) parseSimulador(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) parseSimulador(f);
  }

  const inp:  React.CSSProperties = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px", fontSize: 13, color: C.text, outline: "none" };
  const inpE: React.CSSProperties = { ...inp, border: `2px solid ${C.red}` };
  const sel:  React.CSSProperties = { ...inp, background: "#fff", cursor: "pointer" };
  const lbl:  React.CSSProperties = { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5, display: "block" };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Datos del negocio</h2>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Información básica del seller</p>

      {/* ── Campos básicos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>

        {/* Nombre */}
        <div>
          <label style={lbl}>Nombre del seller <span style={{ color: C.blue }}>✦</span></label>
          <input style={err.nombre ? inpE : inp} value={negocio.nombre}
            onChange={e => setNegocio(p => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej. AUNA" />
          {err.nombre && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>{err.nombre}</div>}
        </div>

        {/* RFC */}
        <div>
          <label style={lbl}>RFC <span style={{ color: C.muted, fontWeight: 400, fontSize: 9 }}>(opcional)</span></label>
          <input style={inp} value={negocio.rfc}
            onChange={e => setNegocio(p => ({ ...p, rfc: e.target.value }))}
            onBlur={lookupRFC} placeholder="Ej. EMP200101ABC" maxLength={13} />
          {bduLoading && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Consultando BDU…</div>}
          {negocio.bdu && (
            <>
              <div style={{ background: C.lb, border: `1px solid #B3DDEF`, borderRadius: 8, padding: "10px 14px", marginTop: 8, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: C.navy, marginBottom: 4 }}>Resultado BDU</div>
                <div>Giro: {negocio.bdu.giro}</div>
                <div>Tasa natural Débito: <strong>{negocio.bdu.tasa_debito}</strong></div>
                <div>Tasa natural Crédito: <strong>{negocio.bdu.tasa_credito}</strong></div>
              </div>
              <div style={{ background: "#FFFBF5", border: `1px solid #F0C070`, borderRadius: 7, padding: "8px 12px", fontSize: 11, color: C.amber, marginTop: 6 }}>
                Recuerda que estas son tasas interbancarias, no significa que el Seller pague estas comisiones
              </div>
            </>
          )}
        </div>

        {/* Industria */}
        <div>
          <label style={lbl}>Industria <span style={{ color: C.blue }}>✦</span></label>
          <select style={err.industria ? { ...sel, border: `2px solid ${C.red}` } : sel}
            value={negocio.industria}
            onChange={e => setNegocio(p => ({ ...p, industria: e.target.value }))}>
            <option value="">Selecciona…</option>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          {err.industria && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>{err.industria}</div>}
        </div>

        {/* Logo */}
        <div>
          <label style={lbl}>Logo del seller <span style={{ color: C.muted, fontWeight: 400, fontSize: 9 }}>(opcional)</span></label>
          <div
            style={{ border: `2px dashed ${C.border}`, borderRadius: 7, padding: 14, textAlign: "center", cursor: "pointer", background: "#FAFAFA" }}
            onClick={() => document.getElementById("logo-inp")?.click()}
          >
            {negocio.logo
              ? <img src={negocio.logo} alt="logo" style={{ maxHeight: 48, maxWidth: 120, objectFit: "contain" }} />
              : <div style={{ fontSize: 12, color: C.muted }}>📁 Haz clic para subir</div>
            }
          </div>
          <input id="logo-inp" type="file" accept="image/*" style={{ display: "none" }}
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

      {/* ── Divider ── */}
      <div style={{ borderTop: `1px solid ${C.border}`, margin: "28px 0 20px" }} />

      {/* ── Simulador ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 2 }}>
          Simulador de comisiones
        </div>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
          Sube el archivo Excel del simulador para pre-cargar los datos del deal.
          <span style={{ display: "block", marginTop: 2, fontStyle: "italic" }}>
            Ej. "Simulador Sellers MLM v17.5.1 - *.xlsx" → hoja SIMULADOR
          </span>
        </p>

        {/* Drop zone */}
        {!simData && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? C.blue : C.border}`,
              borderRadius: 10,
              padding: "28px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "#EBF6FD" : "#FAFAFA",
              transition: "border-color .15s, background .15s",
            }}
          >
            {simLoading ? (
              <div style={{ fontSize: 13, color: C.muted }}>
                <span style={{ display: "inline-block", marginRight: 8 }}>⏳</span>
                Analizando simulador…
              </div>
            ) : (
              <>
                <div style={{ fontSize: 26, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                  Arrastra el archivo aquí o haz clic para buscarlo
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>Solo archivos .xlsx</div>
              </>
            )}
          </div>
        )}

        <input ref={fileRef} type="file" accept=".xlsx" style={{ display: "none" }} onChange={handleFileChange} />

        {/* Error */}
        {simErr && (
          <div style={{ background: "#FFF5F5", border: `1px solid #FFB3B3`, borderRadius: 8, padding: "12px 14px", marginTop: 12, fontSize: 12, color: C.red, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⚠ {simErr}</span>
            <button onClick={() => setSimErr(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Resultado */}
        {simData && (
          <div style={{ background: "#F0FBF4", border: `1px solid #86CFAA`, borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1A7C41" }}>✓ Simulador cargado</span>
                <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{simData.fileName}</span>
              </div>
              <button
                onClick={() => { setSimData(null); setSimErr(null); }}
                style={{ background: "none", border: `1px solid #86CFAA`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#1A7C41", cursor: "pointer" }}
              >
                Cambiar
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
              {/* VC Point */}
              <div style={{ background: "#fff", border: `1px solid #C6E9D4`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                  VC Total con DC — Point
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.navy }}>
                  {fmtMXN(simData.vc_point)}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Celda M85</div>
              </div>

              {/* VC OP */}
              <div style={{ background: "#fff", border: `1px solid #C6E9D4`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                  VC Total con DC — Online Payments
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.navy }}>
                  {fmtMXN(simData.vc_op)}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Celda M58</div>
              </div>
            </div>

            <div style={{ marginTop: 12, background: "#FFFBF0", border: `1px solid #F0D080`, borderRadius: 7, padding: "8px 12px", fontSize: 11, color: "#9A7000" }}>
              Las tasas actuales del seller se capturarán en el siguiente paso con datos muestra hasta integrar la fuente BDU.
            </div>
          </div>
        )}
      </div>

      <NavButtons
        onNext={() => validate() && onNext()}
        nextLabel="Elegir producto →"
        nextAction="Siguiente paso"
      />
    </div>
  );
}
