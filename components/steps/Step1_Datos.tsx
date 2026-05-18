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

function fmtPct(n: number | null) {
  if (n === null) return "—";
  return n.toFixed(2) + "%";
}

const TH: React.CSSProperties = {
  padding: "8px 14px", fontSize: 10, fontWeight: 700,
  color: C.muted, textTransform: "uppercase", letterSpacing: ".06em",
  textAlign: "left", borderBottom: `1px solid ${C.border}`,
};
const TD: React.CSSProperties = {
  padding: "10px 14px", fontSize: 13, color: C.text,
  borderBottom: `1px solid ${C.border}`,
};
const TDnum: React.CSSProperties = { ...TD, fontWeight: 700, color: C.navy };

export default function Step1_Datos({ negocio, setNegocio, simData, setSimData, onNext }: Props) {
  const [err,        setErr]        = useState<Record<string, string>>({});
  const [bduLoading, setBduLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simErr,     setSimErr]     = useState<string | null>(null);
  const [simDebug,   setSimDebug]   = useState<any>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]    = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!negocio.nombre.trim()) e.nombre   = "El nombre del seller es obligatorio";
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
    if (!file.name.endsWith(".xlsx")) { setSimErr("Solo se aceptan archivos .xlsx"); return; }
    setSimLoading(true);
    setSimErr(null);
    setSimData(null);
    setSimDebug(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res  = await fetch("/api/parse-simulador", { method: "POST", body: form });
      const json = await res.json();
      if (json._debug) setSimDebug(json._debug);
      if (!res.ok) setSimErr(json.error || "Error al procesar el archivo.");
      else         setSimData(json as SimuladorData);
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

  const rows = [
    { producto: "Point",           valor: simData?.vc_point,  fila: simData?.vc_point_fila },
    { producto: "Online Payments", valor: simData?.vc_op,     fila: simData?.vc_op_fila   },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginBottom: 4 }}>Datos del negocio</h2>
      <p  style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Información básica del seller</p>

      {/* ── Campos básicos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>

        <div>
          <label style={lbl}>Nombre del seller <span style={{ color: C.blue }}>✦</span></label>
          <input style={err.nombre ? inpE : inp} value={negocio.nombre}
            onChange={e => setNegocio(p => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej. AUNA" />
          {err.nombre && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>{err.nombre}</div>}
        </div>

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
          Sube el archivo Excel del simulador (hoja <strong>SIMULADOR</strong>) para pre-cargar los datos del deal.
        </p>

        {/* Drop zone — only shown when no data loaded */}
        {!simData && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? C.blue : C.border}`,
              borderRadius: 10,
              padding: "32px 20px",
              textAlign: "center",
              cursor: simLoading ? "default" : "pointer",
              background: dragging ? "#EBF6FD" : "#FAFAFA",
              transition: "border-color .15s, background .15s",
            }}
          >
            {simLoading ? (
              <div style={{ fontSize: 13, color: C.muted }}>
                <span style={{ marginRight: 8 }}>⏳</span>Analizando simulador…
              </div>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
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
            <button onClick={() => setSimErr(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Debug panel — visible when values not found */}
        {simDebug && (!simData?.vc_point || !simData?.vc_op) && (
          <div style={{ marginTop: 12, border: `1px solid #E0C060`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: "#FFFBF0", padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#7A5C00" }}>
              🔍 Debug — comparte esta info para corregir la extracción
            </div>
            <div style={{ padding: "10px 14px", fontSize: 11, fontFamily: "monospace", background: "#FEFCF0", maxHeight: 260, overflowY: "auto" }}>
              <div style={{ marginBottom: 6, color: "#555" }}>
                <strong>Columna detectada para VC:</strong> {simDebug.vcCol ?? "—"}
              </div>
              <div style={{ marginBottom: 4, color: "#555" }}><strong>Celdas con "vc" en su texto:</strong></div>
              {simDebug.dbgVcCells?.length === 0
                ? <div style={{ color: "#999" }}>ninguna</div>
                : simDebug.dbgVcCells?.map((c: any, i: number) => (
                  <div key={i} style={{ color: "#333" }}>{c.col}{c.fila}: "{c.texto}"</div>
                ))
              }
              <div style={{ marginTop: 8, marginBottom: 4, color: "#555" }}><strong>Valores en col M (filas 10–95):</strong></div>
              {simDebug.dbgColM?.length === 0
                ? <div style={{ color: "#999" }}>ninguno</div>
                : simDebug.dbgColM?.map((r: any, i: number) => (
                  <div key={i} style={{ color: "#333" }}>M{r.fila}: {r.valor} {r.numFmt ? `[${r.numFmt}]` : ""}</div>
                ))
              }
            </div>
          </div>
        )}

        {/* Preview table */}
        {simData && (
          <div style={{ border: `1px solid #86CFAA`, borderRadius: 10, overflow: "hidden" }}>

            {/* Header */}
            <div style={{ background: "#F0FBF4", borderBottom: `1px solid #86CFAA`, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1A7C41" }}>✓ Simulador cargado</span>
                <span style={{ fontSize: 11, color: C.muted, marginLeft: 10 }}>
                  {simData.fileName}
                </span>
                <span style={{ fontSize: 10, color: C.muted, marginLeft: 8, background: "#E0F4E8", padding: "2px 7px", borderRadius: 4 }}>
                  hoja: {simData.sheetName}
                </span>
              </div>
              <button
                onClick={() => { setSimData(null); setSimErr(null); fileRef.current?.click(); }}
                style={{ background: "none", border: `1px solid #86CFAA`, borderRadius: 6, padding: "3px 12px", fontSize: 11, color: "#1A7C41", cursor: "pointer" }}
              >
                Cambiar archivo
              </button>
            </div>

            {/* Subtitle */}
            <div style={{ padding: "10px 18px 4px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Vista previa — confirma que los datos son correctos
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={TH}>Producto</th>
                    <th style={TH}>Concepto</th>
                    <th style={{ ...TH, textAlign: "right" }}>Valor</th>
                    <th style={{ ...TH, textAlign: "right" }}>Referencia en archivo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.producto} style={{ background: "#fff" }}>
                      <td style={TD}>
                        <span style={{ fontWeight: 600, color: C.navy }}>{r.producto}</span>
                      </td>
                      <td style={TD}>VC Total con DC</td>
                      <td style={{ ...TDnum, textAlign: "right" }}>
                        {r.valor !== null && r.valor !== undefined
                          ? fmtPct(r.valor)
                          : <span style={{ color: C.muted, fontWeight: 400 }}>No encontrado</span>
                        }
                      </td>
                      <td style={{ ...TD, textAlign: "right", color: C.muted, fontSize: 11 }}>
                        {r.fila ? `Fila ${r.fila}, col M` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div style={{ padding: "10px 18px", background: "#FFFBF0", borderTop: `1px solid #F0D080`, fontSize: 11, color: "#9A7000" }}>
              Las tasas actuales del seller y el processing / financing fee se capturarán en los pasos siguientes.
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
