"use client";
import { useState } from "react";

// ── Tokens (match Step7) ──────────────────────────────────────
const NAVY  = "#0E1B3D";
const YEL   = "#FFE600";
const POS   = "#00A650";
const ACC   = "#434CE4";
const G040  = "#F7F7F7";
const G070  = "#F0F0F0";
const G150  = "#E5E5E5";
const G400  = "#999999";
const G600  = "#666666";
const G900  = "#1A1A1A";

function Icon({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const paths: Record<string, React.ReactNode> = {
    close:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    pdf:         <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></>,
    excel:       <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8l5 8 5-8"/></>,
    link:        <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    mail:        <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></>,
    chevron:     <polyline points="6 9 12 15 18 9"/>,
    copy:        <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    check:       <polyline points="20 6 9 17 4 12"/>,
    external:    <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    spinner:     <><path d="M21 12a9 9 0 1 1-6.219-8.56"/></>,
    trendingup:  <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    trendingdown:<><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
    star:        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {paths[name] ?? <circle cx="12" cy="12" r="9"/>}
    </svg>
  );
}

const fmtC = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000)     return "$" + Math.round(n / 1_000) + "K";
  return "$" + Math.round(n).toLocaleString("es-MX");
};

// ── Props ─────────────────────────────────────────────────────
export interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  empresa: string;
  monthlyGain: number;
  annualGain: number;
  totalSave: number;
  incrSalesMxn: number;
}

// ── Option row ─────────────────────────────────────────────────
function OptionRow({
  icon, iconColor, title, desc, action, actionLabel = "Abrir", loading = false,
  children, expanded, onToggle,
}: {
  icon: string; iconColor: string; title: string; desc: string;
  action?: () => void; actionLabel?: string; loading?: boolean;
  children?: React.ReactNode; expanded?: boolean; onToggle?: () => void;
}) {
  const isExpandable = !!children;
  const handleClick = isExpandable ? onToggle : action;
  const borderRadius = isExpandable && expanded ? "12px 12px 0 0" : 12;

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          background: G040, border: `1px solid ${G150}`,
          borderRadius, padding: "14px 16px",
          cursor: loading ? "default" : "pointer", fontFamily: "inherit",
          textAlign: "left" as const, width: "100%",
          opacity: loading ? 0.65 : 1,
          borderBottom: isExpandable && expanded ? `1px solid ${G150}` : undefined,
          transition: "background 150ms",
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#FFFCE5"; }}
        onMouseLeave={e => { e.currentTarget.style.background = G040; }}
      >
        <span style={{
          width: 40, height: 40, borderRadius: 10,
          background: "white", border: `1px solid ${G150}`,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, color: iconColor,
        }}>
          {loading
            ? <span style={{ animation: "spin 1s linear infinite", display: "inline-flex" }}><Icon name="spinner" size={18} color={G400}/></span>
            : <Icon name={icon} size={18} color={iconColor}/>
          }
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: G900, marginBottom: 2 }}>{title}</span>
          <span style={{ display: "block", fontSize: 12, color: G600, lineHeight: 1.4 }}>{desc}</span>
        </span>
        <span style={{
          color: G400, fontWeight: 700, fontSize: 14,
          display: "inline-flex", alignItems: "center", gap: 4,
          transition: "transform 200ms",
          transform: isExpandable && expanded ? "rotate(180deg)" : "none",
        }}>
          {isExpandable ? <Icon name="chevron" size={16} color={G400}/> : actionLabel}
        </span>
      </button>
      {isExpandable && expanded && (
        <div style={{
          border: `1px solid ${G150}`, borderTop: "none",
          borderRadius: "0 0 12px 12px",
          background: "white", padding: "16px 18px",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────
export default function DownloadModal({
  open, onClose, empresa, monthlyGain, annualGain, totalSave, incrSalesMxn,
}: DownloadModalProps) {
  const [emailOpen,       setEmailOpen]       = useState(false);
  const [copied,          setCopied]          = useState(false);
  const [copiedSubject,   setCopiedSubject]   = useState(false);
  const [copiedBody,      setCopiedBody]      = useState(false);
  const [copiedBodyPlain, setCopiedBodyPlain] = useState(false);
  const [xlsxBusy,        setXlsxBusy]       = useState(false);

  if (!open) return null;

  // ── Email template ──────────────────────────────────────────
  const summaryRaw = typeof window !== "undefined" ? localStorage.getItem("simulator_summary") : null;
  const summaryData = summaryRaw ? JSON.parse(summaryRaw) : null;
  const tpvTotal      = (summaryData?.tpvPT || 0) + (summaryData?.tpvOP || 0);
  const propuestaProd = summaryData?.propuestaProd || "both";
  const comOT: Array<{ l: string; sh: number }> =
    propuestaProd === "op" ? (summaryData?.comOP_OT || []) : (summaryData?.comPT_OT || []);
  const tdShare   = Math.round((comOT.find(r => r.l === "T. Débito")?.sh    || 0) * 100);
  const tcShare   = Math.round((comOT.find(r => r.l === "T. Crédito")?.sh   || 0) * 100);
  const amexShare = Math.round((comOT.find(r => r.l === "AMEX")?.sh         || 0) * 100);
  const intlShare = Math.round((comOT.find(r => r.l === "Internacional")?.sh || 0) * 100);

  const emailSubject = `${empresa} — Mercado Pago · Business Case`;
  const emailBody =
`Hola equipo ${empresa},

Como acordamos en la llamada, adjuntamos:

- Propuesta de comisiones personalizada
- Cronograma de implementación
- Excel con el análisis de costos para que puedan evaluarlo internamente
- Sitio interactivo para explorar las tasas y proyecciones

En resumen, con la solución de Mercado Pago estarían:

- Ahorrando en comisiones: ${fmtC(totalSave)}/mes
- Generando volumen adicional con palancas activas: ${fmtC(incrSalesMxn)}/mes
- Beneficio total estimado: ${fmtC(monthlyGain)}/mes — ${fmtC(annualGain)}/año

Esta propuesta se basó en:

- Volumen mínimo de cobros en terminal: ${fmtC(tpvTotal)}/mes
- Share de pagos:
  - Débito: ${tdShare}%
  - Crédito: ${tcShare}%
  - AMEX: ${amexShare}%
  - Internacional: ${intlShare}%
- Ticket promedio: —

Quedamos atentos a cualquier duda o comentario.`;

  // HTML version — Gmail-compatible: inline styles + tables + emojis (no SVG, no <style> tags)
  const emailBodyHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:560px;color:#1A1A1A;line-height:1.65;font-size:14px">

<p style="margin:0 0 16px 0">Hola equipo <strong>${empresa}</strong>,</p>
<p style="margin:0 0 12px 0;color:#555555">Como acordamos en la llamada, adjuntamos:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border-collapse:separate;border-spacing:0 4px">
  <tr><td style="border-left:3px solid #E53935;background:#FAFAFA;padding:9px 14px;font-size:13px;color:#444444;border-radius:0 6px 6px 0">📄&nbsp;&nbsp;Propuesta de comisiones personalizada</td></tr>
  <tr><td style="border-left:3px solid #0E1B3D;background:#FAFAFA;padding:9px 14px;font-size:13px;color:#444444;border-radius:0 6px 6px 0">✅&nbsp;&nbsp;Cronograma de implementación</td></tr>
  <tr><td style="border-left:3px solid #00A650;background:#FAFAFA;padding:9px 14px;font-size:13px;color:#444444;border-radius:0 6px 6px 0">📊&nbsp;&nbsp;Excel con el análisis de costos para que puedan evaluarlo internamente</td></tr>
  <tr><td style="border-left:3px solid #434CE4;background:#FAFAFA;padding:9px 14px;font-size:13px;color:#444444;border-radius:0 6px 6px 0">🔗&nbsp;&nbsp;Sitio interactivo para explorar las tasas y proyecciones</td></tr>
</table>

<p style="margin:0 0 12px 0;font-weight:700;color:#1A1A1A">En resumen, con la solución de Mercado Pago estarían:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border-collapse:separate;border-spacing:0 4px">
  <tr>
    <td style="background:#FFFFFF;border:1px solid #E5E5E5;padding:10px 14px;font-size:13px;color:#555555;border-radius:6px 0 0 6px">📉&nbsp;&nbsp;Ahorrando en comisiones</td>
    <td align="right" style="background:#FFFFFF;border:1px solid #E5E5E5;border-left:none;padding:10px 14px;font-size:13px;font-weight:700;white-space:nowrap;color:#00A650;border-radius:0 6px 6px 0">${fmtC(totalSave)}/mes</td>
  </tr>
  <tr>
    <td style="background:#FFFFFF;border:1px solid #E5E5E5;padding:10px 14px;font-size:13px;color:#555555;border-radius:6px 0 0 6px">📈&nbsp;&nbsp;Generando volumen adicional con palancas</td>
    <td align="right" style="background:#FFFFFF;border:1px solid #E5E5E5;border-left:none;padding:10px 14px;font-size:13px;font-weight:700;white-space:nowrap;color:#434CE4;border-radius:0 6px 6px 0">${fmtC(incrSalesMxn)}/mes</td>
  </tr>
  <tr>
    <td style="background:#FFFCE5;border:1px solid #D4B800;padding:10px 14px;font-size:13px;font-weight:600;color:#1A1A1A;border-radius:6px 0 0 6px">⭐&nbsp;&nbsp;Beneficio total estimado</td>
    <td align="right" style="background:#FFFCE5;border:1px solid #D4B800;border-left:none;padding:10px 14px;font-size:13px;font-weight:700;white-space:nowrap;color:#1A1A1A;border-radius:0 6px 6px 0">${fmtC(monthlyGain)}/mes &mdash; ${fmtC(annualGain)}/año</td>
  </tr>
</table>

<p style="margin:0 0 12px 0;font-weight:700;color:#1A1A1A">Esta propuesta se basó en:</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border-collapse:separate;border-spacing:0 4px">
  <tr>
    <td style="border-left:3px solid #0E1B3D;background:#FAFAFA;padding:9px 14px;font-size:13px;color:#444444;border-radius:0 6px 6px 0">Volumen de cobros mensual</td>
    <td align="right" style="border-left:3px solid transparent;background:#FAFAFA;padding:9px 14px;font-size:13px;font-weight:700;white-space:nowrap;color:#1A1A1A;border-radius:0 6px 6px 0">${fmtC(tpvTotal)}/mes</td>
  </tr>
  <tr>
    <td colspan="2" style="border-left:3px solid #0E1B3D;background:#FAFAFA;padding:9px 14px;font-size:13px;color:#444444;border-radius:0 6px 6px 0">Share de pagos:&nbsp;&nbsp;<span style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:99px;padding:2px 9px;font-size:11px;white-space:nowrap">Débito: ${tdShare}%</span>&nbsp;<span style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:99px;padding:2px 9px;font-size:11px;white-space:nowrap">Crédito: ${tcShare}%</span>&nbsp;<span style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:99px;padding:2px 9px;font-size:11px;white-space:nowrap">AMEX: ${amexShare}%</span>&nbsp;<span style="background:#FFFFFF;border:1px solid #E5E5E5;border-radius:99px;padding:2px 9px;font-size:11px;white-space:nowrap">Internacional: ${intlShare}%</span></td>
  </tr>
  <tr>
    <td style="border-left:3px solid #0E1B3D;background:#FAFAFA;padding:9px 14px;font-size:13px;color:#444444;border-radius:0 6px 6px 0">Ticket promedio</td>
    <td align="right" style="border-left:3px solid transparent;background:#FAFAFA;padding:9px 14px;font-size:13px;font-weight:700;color:#1A1A1A;border-radius:0 6px 6px 0">—</td>
  </tr>
</table>

<p style="margin:0;color:#555555">Quedamos atentos a cualquier duda o comentario.</p>
</div>`;

  // ── Structured preview sections ────────────────────────────────
  const emailSections = [
    { t: "para",    text: `Hola equipo ${empresa},` },
    { t: "para",    text: "Como acordamos en la llamada, adjuntamos:" },
    { t: "adjuntos", items: [
      { label: "Propuesta de comisiones personalizada",                    icon: "pdf",   color: "#E53935" },
      { label: "Cronograma de implementación",                             icon: "check", color: NAVY      },
      { label: "Excel con el análisis de costos para evaluarlo internamente", icon: "excel", color: POS    },
      { label: "Sitio interactivo para explorar tasas y proyecciones",     icon: "link",  color: ACC       },
    ]},
    { t: "header", text: "En resumen, con la solución de Mercado Pago estarían:" },
    { t: "metrics", items: [
      { label: "Ahorrando en comisiones",                value: `${fmtC(totalSave)}/mes`,                             icon: "trendingdown", color: POS       },
      { label: "Generando volumen adicional con palancas", value: `${fmtC(incrSalesMxn)}/mes`,                        icon: "trendingup",   color: ACC       },
      { label: "Beneficio total estimado",               value: `${fmtC(monthlyGain)}/mes — ${fmtC(annualGain)}/año`, icon: "star",         color: "#F59E0B" },
    ]},
    { t: "header", text: "Esta propuesta se basó en:" },
    { t: "datos", items: [
      { label: "Volumen de cobros mensual", value: `${fmtC(tpvTotal)}/mes`, subs: [] as string[] },
      { label: "Share de pagos", value: "", subs: [`Débito: ${tdShare}%`, `Crédito: ${tcShare}%`, `AMEX: ${amexShare}%`, `Internacional: ${intlShare}%`] },
      { label: "Ticket promedio",           value: "—",                     subs: [] as string[] },
    ]},
    { t: "para", text: "Quedamos atentos a cualquier duda o comentario." },
  ];

  // Copy with both HTML + plain text so email clients preserve formatting
  async function copyRich(html: string, plain: string, onSuccess: () => void) {
    try {
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([plain], { type: "text/plain" });
      await navigator.clipboard.write([new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob })]);
    } catch {
      await navigator.clipboard.writeText(plain);
    }
    onSuccess();
  }

  // ── XLSX download ───────────────────────────────────────────
  async function handleXlsx() {
    setXlsxBusy(true);
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("simulator_summary") : null;
      if (!raw) throw new Error("No data");
      const res = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `MP_Propuesta_${empresa.replace(/\s+/g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al generar el Excel. Intenta de nuevo.");
    } finally {
      setXlsxBusy(false);
    }
  }

  // ── Share link ──────────────────────────────────────────────
  function handleShare() {
    const raw = typeof window !== "undefined" ? localStorage.getItem("simulator_summary") : null;
    if (!raw) { alert("No hay datos para compartir."); return; }
    try {
      const encoded = btoa(unescape(encodeURIComponent(raw)));
      window.open(`/share#${encoded}`, "_blank", "noopener,noreferrer");
    } catch {
      window.open("/simulator/summary", "_blank", "noopener,noreferrer");
    }
  }

  // ── PDF ─────────────────────────────────────────────────────
  function handlePdf() {
    window.open("/pdf", "_blank", "noopener,noreferrer");
  }

  // ── Copy email ──────────────────────────────────────────────
  function handleCopy() {
    // Copy body only as HTML so Gmail preserves formatting; subject in plain text prefix
    copyRich(emailBodyHtml, `Asunto: ${emailSubject}\n\n${emailBody}`, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }
  function handleCopySubject() {
    navigator.clipboard.writeText(emailSubject).then(() => {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2200);
    });
  }
  function handleCopyBody() {
    copyRich(emailBodyHtml, emailBody, () => {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2200);
    });
  }
  function handleCopyBodyPlain() {
    navigator.clipboard.writeText(emailBody).then(() => {
      setCopiedBodyPlain(true);
      setTimeout(() => setCopiedBodyPlain(false), 2200);
    });
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(14,27,61,0.55)",
          zIndex: 900, backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal card */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "white", borderRadius: 18,
        padding: "28px 28px 24px",
        width: "min(500px, 95vw)",
        maxHeight: "90vh", overflowY: "auto",
        zIndex: 901,
        boxShadow: "0 24px 72px rgba(0,0,0,0.22)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: YEL, display: "inline-flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="pdf" size={20} color={NAVY}/>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", color: G900 }}>
              Exportar propuesta
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: G600 }}>
              {empresa} · elige el formato
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: G070, border: "none", borderRadius: "50%",
              width: 30, height: 30, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: G600, flexShrink: 0,
            }}
          >
            <Icon name="close" size={14} color={G600}/>
          </button>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <OptionRow
            icon="pdf"
            iconColor="#E53935"
            title="PDF"
            desc="Descargar PDF"
            action={handlePdf}
            actionLabel="↓"
          />

          <OptionRow
            icon="excel"
            iconColor={POS}
            title="Excel (.xlsx)"
            desc="Con fórmulas editables: TPV, tasas, ahorro y proyección de palancas"
            action={handleXlsx}
            actionLabel="↓"
            loading={xlsxBusy}
          />

          <OptionRow
            icon="link"
            iconColor={ACC}
            title="Link para el Seller"
            desc="Vista interactiva de solo lectura; no requiere login ni edición"
            action={handleShare}
            actionLabel="→"
          />

          <OptionRow
            icon="mail"
            iconColor={NAVY}
            title="E-mail listo para enviar"
            desc="Asunto y cuerpo redactado; copia con un clic"
            expanded={emailOpen}
            onToggle={() => setEmailOpen(o => !o)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Review callout */}
              <div style={{
                background: "#FFFCE5", border: `1px solid #D4B800`,
                borderRadius: 8, padding: "8px 12px",
                fontSize: 12, color: NAVY, fontWeight: 600,
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <span>Lee el mensaje antes de enviarlo y asegúrate de que el contexto tenga sentido para este seller.</span>
              </div>
              {/* Asunto */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: G400, textTransform: "uppercase" as const }}>Asunto</span>
                  <button onClick={handleCopySubject} title="Copiar asunto" style={{
                    background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
                    display: "inline-flex", alignItems: "center", gap: 4,
                    color: copiedSubject ? POS : G400, fontSize: 10, fontWeight: 600,
                  }}>
                    <Icon name={copiedSubject ? "check" : "copy"} size={12} color={copiedSubject ? POS : G400}/>
                    {copiedSubject ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <div style={{
                  background: G040, border: `1px solid ${G150}`,
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 13, color: G900, fontStyle: "italic",
                }}>
                  {emailSubject}
                </div>
              </div>
              {/* Cuerpo */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: G400, textTransform: "uppercase" as const }}>Cuerpo</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={handleCopyBodyPlain} title="Copiar solo texto plano" style={{
                      background: copiedBodyPlain ? POS + "15" : G070, border: `1px solid ${copiedBodyPlain ? POS : G150}`,
                      borderRadius: 6, cursor: "pointer", padding: "3px 8px",
                      display: "inline-flex", alignItems: "center", gap: 4,
                      color: copiedBodyPlain ? POS : G600, fontSize: 10, fontWeight: 600,
                    }}>
                      <Icon name={copiedBodyPlain ? "check" : "copy"} size={11} color={copiedBodyPlain ? POS : G600}/>
                      {copiedBodyPlain ? "Copiado" : "Solo texto"}
                    </button>
                    <button onClick={handleCopyBody} title="Copiar con formato HTML (Gmail)" style={{
                      background: copiedBody ? POS + "15" : NAVY + "12", border: `1px solid ${copiedBody ? POS : NAVY + "30"}`,
                      borderRadius: 6, cursor: "pointer", padding: "3px 8px",
                      display: "inline-flex", alignItems: "center", gap: 4,
                      color: copiedBody ? POS : NAVY, fontSize: 10, fontWeight: 600,
                    }}>
                      <Icon name={copiedBody ? "check" : "copy"} size={11} color={copiedBody ? POS : NAVY}/>
                      {copiedBody ? "Copiado" : "Con formato"}
                    </button>
                  </div>
                </div>
                <div style={{
                  background: G040, border: `1px solid ${G150}`,
                  borderRadius: 8, padding: "14px 16px",
                  fontSize: 13, color: G900, lineHeight: 1.75, maxHeight: 360, overflowY: "auto",
                }}>
                  {emailSections.map((sec, i) => {
                    if (sec.t === "para") return (
                      <p key={i} style={{ margin: i === 0 ? 0 : "10px 0 0", color: G600, fontSize: 13 }}>{sec.text}</p>
                    );
                    if (sec.t === "header") return (
                      <p key={i} style={{ margin: "14px 0 0", fontWeight: 700, color: G900, fontSize: 12 }}>{sec.text}</p>
                    );
                    if (sec.t === "adjuntos") return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, margin: "10px 0 0" }}>
                        {sec.items!.map((item: any, j: number) => (
                          <div key={j} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "7px 12px", borderRadius: 8,
                            background: "white", border: `1px solid ${G150}`,
                            borderLeft: `3px solid ${item.color}`,
                          }}>
                            <span style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: item.color + "18", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name={item.icon} size={13} color={item.color}/>
                            </span>
                            <span style={{ fontSize: 12, color: G600, lineHeight: 1.35 }}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    );
                    if (sec.t === "metrics") return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5, margin: "10px 0 0" }}>
                        {sec.items!.map((item: any, j: number) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: `1px solid ${G150}`, borderRadius: 8, padding: "7px 10px" }}>
                            <span style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: item.color + "18", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name={item.icon} size={13} color={item.color}/>
                            </span>
                            <span style={{ flex: 1, fontSize: 11, color: G600 }}>{item.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: G900, whiteSpace: "nowrap" as const }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                    if (sec.t === "datos") return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, margin: "10px 0 0" }}>
                        {sec.items!.map((item: any, j: number) => (
                          <div key={j} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "7px 12px", borderRadius: 8, background: "white", border: `1px solid ${G150}`, borderLeft: `3px solid ${NAVY}` }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <span style={{ fontSize: 12, color: G600, lineHeight: 1.35 }}>{item.label}</span>
                              {item.value && <span style={{ fontSize: 12, fontWeight: 700, color: G900, whiteSpace: "nowrap" as const }}>{item.value}</span>}
                            </div>
                            {item.subs.length > 0 && (
                              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
                                {item.subs.map((s: string, k: number) => (
                                  <span key={k} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: G040, color: G600, border: `1px solid ${G150}` }}>{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                    return null;
                  })}
                </div>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                  background: copied ? POS : NAVY,
                  color: copied ? "white" : YEL,
                  border: "none", borderRadius: 8,
                  padding: "9px 18px", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 200ms",
                  alignSelf: "flex-start",
                }}
              >
                <Icon name={copied ? "check" : "copy"} size={15} color="currentColor"/>
                {copied ? "¡Copiado!" : "Copiar asunto + cuerpo"}
              </button>
            </div>
          </OptionRow>
        </div>

        {/* Footer note */}
        <p style={{ margin: "16px 0 0", fontSize: 11, color: G400, textAlign: "center" as const }}>
          Los datos no salen de tu dispositivo · Uso interno Hunter
        </p>
      </div>
    </>
  );
}
