"use client";
import { useEffect, useState } from "react";
import { PALANCAS_PT, PALANCAS_OP } from "@/data/constants";

// ── Types ──────────────────────────────────────────────────────
interface OTRow   { l: string; sh: number; cu: number; mp: number; }
interface MSIRow  { l: string; sh: number; sb: number; sm: number; }
interface SimData {
  negocio:     { nombre: string };
  productos:   { point: boolean; op: boolean };
  comPT_OT:    OTRow[];
  comPT_MSI:   MSIRow[];
  tpvPT:       number;
  comOP_OT:    OTRow[];
  comOP_MSI:   MSIRow[];
  tpvOP:       number;
  palancasSel: { pt: string[]; op: string[] };
  palancasPct: { pt: Record<string, number>; op: Record<string, number> };
}

// ── Helpers ─────────────────────────────────────────────────────
const fmt  = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("es-MX");
const fmtC = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (a >= 1_000)     return "$" + Math.round(n / 1_000) + "K";
  return "$" + Math.round(n).toLocaleString("es-MX");
};
const fmtMXN = (n: number) => "$" + Math.round(n).toLocaleString("es-MX") + " MXN";
function computeOT(tpv: number, rows: OTRow[]) {
  return rows
    .filter(r => r.mp != null && r.cu > r.mp)
    .map(r => ({
      name:   r.l,
      vol:    Math.round(tpv * r.sh),
      cu:     r.cu,
      mp:     r.mp,
      comCu:  Math.round(tpv * r.sh * r.cu / 100),
      comMp:  Math.round(tpv * r.sh * r.mp / 100),
      save:   Math.round(tpv * r.sh * (r.cu - r.mp) / 100),
      delta:  r.cu - r.mp,
    }))
    .filter(r => r.vol > 0 && r.save > 0);
}

// MSI total = tasa TC crédito + sobretasa
function computeMSI(tpv: number, rows: MSIRow[], tcCu = 0, tcMp = 0) {
  return rows
    .filter(r => (tcCu + r.sb) > (tcMp + r.sm))
    .map(r => ({
      name:   r.l,
      vol:    Math.round(tpv * r.sh),
      cu:     tcCu + r.sb,
      mp:     tcMp + r.sm,
      comCu:  Math.round(tpv * r.sh * (tcCu + r.sb) / 100),
      comMp:  Math.round(tpv * r.sh * (tcMp + r.sm) / 100),
      save:   Math.round(tpv * r.sh * ((tcCu + r.sb) - (tcMp + r.sm)) / 100),
      delta:  (tcCu + r.sb) - (tcMp + r.sm),
    }))
    .filter(r => r.vol > 0 && r.save > 0);
}

const sumSave = <T extends { save: number }>(rows: T[]) => rows.reduce((a, r) => a + r.save, 0);

// ── Month labels ─────────────────────────────────────────────────
const MONTHS_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const MONTHS_FULL  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ── CSS ──────────────────────────────────────────────────────────
const PDF_CSS = `
@font-face{font-family:"Proxima Nova";src:url("/pdf-assets/fonts/proxima-nova-light.otf") format("opentype");font-weight:300;font-style:normal;font-display:swap}
@font-face{font-family:"Proxima Nova";src:url("/pdf-assets/fonts/proxima-nova.otf") format("opentype");font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:"Proxima Nova";src:url("/pdf-assets/fonts/proxima-nova-bold.otf") format("opentype");font-weight:700;font-style:normal;font-display:swap}
@font-face{font-family:"Proxima Nova";src:url("/pdf-assets/fonts/proxima-nova-extrabold.otf") format("opentype");font-weight:800;font-style:normal;font-display:swap}
@font-face{font-family:"Proxima Nova";src:url("/pdf-assets/fonts/proxima-nova-black.otf") format("opentype");font-weight:900;font-style:normal;font-display:swap}

.pdf-root{
  --page-w:816px;--page-h:1056px;--page-pad-x:56px;--page-pad-y:48px;
  --hero-yellow:#FFE600;--ink:#1A1A1A;--ink-soft:#4A4A4A;
  --rule:#E5E5E5;--rule-soft:#EEEEEE;
  --positive:#00A650;--accent:#434CE4;--navy:#0F1A36;
  font-family:"Proxima Nova",-apple-system,"Helvetica Neue",sans-serif;
  font-size:14px;color:var(--ink);
  background:#ECEDF0;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
  box-sizing:border-box;
}
.pdf-root *{box-sizing:border-box}
.pdf-doc{display:flex;flex-direction:column;align-items:center;gap:32px;padding:80px 0 64px}
.pdf-page{width:var(--page-w);min-height:var(--page-h);background:#fff;
  box-shadow:0 12px 36px rgba(15,26,54,.14),0 2px 6px rgba(15,26,54,.06);
  position:relative;page-break-after:always;break-after:page;
  display:flex;flex-direction:column}
.pdf-page:last-child{page-break-after:auto;break-after:auto}

/* Header */
.doc-header{display:flex;align-items:center;justify-content:space-between;
  padding:22px var(--page-pad-x) 18px;border-bottom:1px solid var(--rule-soft);flex:0 0 auto}
.doc-brand{display:flex;align-items:center;gap:10px}
.doc-brand .mp-logo{height:26px;display:block;flex-shrink:0}
.doc-brand .brand-sep{font-size:13px;color:#ccc;font-weight:300;line-height:1}
.doc-brand .seller-logo{height:26px;display:block;border-radius:3px;flex-shrink:0}
.doc-brand .brand-sub{font-size:10.5px;color:var(--ink-soft);text-transform:uppercase;
  letter-spacing:.02em}
.doc-meta{text-align:right;font-size:10.5px;color:var(--ink-soft);line-height:1.4;white-space:nowrap}
.doc-meta strong{color:var(--ink);font-weight:600;display:block;font-size:12px}

/* Footer */
.doc-footer{display:flex;align-items:center;justify-content:space-between;
  padding:14px var(--page-pad-x) 22px;border-top:1px solid var(--rule-soft);
  font-size:10px;color:var(--ink-soft);letter-spacing:.02em;margin-top:auto;flex:0 0 auto}
.doc-footer .pgnum{font-weight:600;color:var(--ink);letter-spacing:0}

/* Cover hero */
.cover-hero{background:var(--hero-yellow);padding:28px var(--page-pad-x) 64px;
  position:relative;flex:0 0 auto}
.cover-overline{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
  color:rgba(26,26,26,.7);margin-bottom:12px}
.cover-headline{display:grid;grid-template-columns:48px 1fr;gap:14px;align-items:center}
.arrow-chip{width:48px;height:48px;border-radius:50%;background:var(--ink);
  color:var(--hero-yellow);display:grid;place-items:center}
.arrow-chip svg{width:22px;height:22px}
.cover-headline h1{font-size:42px;line-height:1.05;font-weight:800;letter-spacing:-.022em;
  color:var(--ink);margin:0}
.cover-headline h1 .soft{color:rgba(26,26,26,.72);font-weight:700}

/* KPI strip */
.kpi-strip{padding:0 var(--page-pad-x);margin-top:-32px;
  display:grid;grid-template-columns:1fr 24px 1fr 24px 1.5fr;
  align-items:stretch;gap:0;position:relative;z-index:2;flex:0 0 auto}
.kpi-card{background:#fff;border:1px solid var(--rule);border-radius:12px;
  padding:16px 16px 18px;box-shadow:0 8px 20px rgba(15,26,54,.06);
  display:flex;flex-direction:column;min-height:200px}
.kpi-card.dark{background:var(--navy);border-color:var(--navy);color:#fff;
  box-shadow:0 8px 24px rgba(15,26,54,.18)}
.kpi-top{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.pill{display:inline-flex;align-items:center;height:22px;padding:0 9px;
  border-radius:999px;background:#f5f5f5;color:var(--ink);
  font-size:11px;font-weight:600;letter-spacing:-.005em}
.pill.green{color:#006D33;background:#E5F6EC}
.pill.blue{color:#2A33C2;background:#ECEDFC}
.pill.dark{color:#FFE600;background:rgba(255,230,0,.10);
  border:1px solid rgba(255,230,0,.30);text-transform:uppercase;
  letter-spacing:.08em;font-size:10px;height:24px;padding:0 10px}
.kpi-label{font-size:13px;font-weight:600;color:var(--ink);
  margin-bottom:4px;letter-spacing:-.005em;line-height:1.25;
  min-height:2.5em;display:flex;align-items:flex-start}
.kpi-card.dark .kpi-label{color:rgba(255,255,255,.7)}
.kpi-value{font-size:44px;line-height:1;font-weight:800;letter-spacing:-.035em;
  margin-top:4px;font-variant-numeric:tabular-nums}
.kpi-value.green{color:var(--positive)}
.kpi-value.blue{color:var(--accent)}
.kpi-sub{margin-top:auto;padding-top:10px;font-size:11px;line-height:1.4;
  color:var(--ink-soft);letter-spacing:-.002em}
.kpi-sub b{color:var(--ink);font-weight:600}
.kpi-card.dark .kpi-sub{color:rgba(255,255,255,.65)}
.kpi-card.dark .kpi-sub b{color:#fff}
.dark-split{display:grid;grid-template-columns:1fr 1px 1fr;gap:0;column-gap:14px;margin-top:4px}
.dark-split>.sep{background:rgba(255,255,255,.18)}
.col-label{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(255,255,255,.6);margin-bottom:6px}
.col-value{font-size:38px;line-height:1;font-weight:800;letter-spacing:-.035em;
  font-variant-numeric:tabular-nums}
.col-value.yellow{color:#FFE600}
.col-value.white{color:#fff}
.kpi-op{display:flex;align-items:center;justify-content:center;padding:8px 0}
.kpi-op .op{width:28px;height:28px;border-radius:50%;background:#fff;
  border:1px solid var(--rule);display:flex;align-items:center;justify-content:center;
  font-size:18px;font-weight:800;color:var(--ink-soft)}

/* Cover body */
.cover-body{padding:22px var(--page-pad-x) 0;display:flex;flex-direction:column;gap:18px;flex:1 1 auto}
.context{background:#FAFAFB;border:1px solid #E5E5E5;border-radius:10px;padding:16px 18px}
.context-title{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-soft);margin-bottom:12px}
.context-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}
.ctx-item .k{font-size:10px;color:var(--ink-soft);margin-bottom:2px;letter-spacing:.02em}
.ctx-item .v{font-size:12px;font-weight:600;color:var(--ink)}
.toc{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.toc-item{display:flex;gap:10px;align-items:flex-start}
.toc-num{width:28px;height:28px;border-radius:50%;background:#E5E5E5;
  color:#555;font-size:13px;font-weight:700;
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.toc-text .t{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:2px}
.toc-text .d{font-size:11.5px;color:var(--ink-soft);line-height:1.4}
.note{font-size:10px;color:var(--ink-soft);line-height:1.4;padding:0 2px}

/* Detail pages */
.detail-body{padding:18px var(--page-pad-x) 0;display:flex;flex-direction:column;gap:14px;flex:1 1 auto}
.page-title-row{display:flex;align-items:center;justify-content:space-between;
  padding-bottom:14px;border-bottom:1px solid var(--rule)}
.page-title{display:flex;align-items:center;gap:14px}
.icon-tile{width:44px;height:44px;border-radius:10px;background:#1A1A1A;
  color:var(--hero-yellow);display:grid;place-items:center;flex-shrink:0}
.icon-tile.alt{background:var(--hero-yellow);color:#1A1A1A}
.page-title h2{font-size:26px;font-weight:800;letter-spacing:-.018em;margin:0 0 2px}
.product-sub{font-size:12px;color:var(--ink-soft)}
.page-title-row .right .k{font-size:10px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--ink-soft);text-align:right}
.page-title-row .right .v{font-size:22px;font-weight:800;color:var(--positive);
  text-align:right;font-variant-numeric:tabular-nums;letter-spacing:-.02em}

/* Section cards */
.section{border:1px solid var(--rule);border-radius:10px;overflow:hidden}
.section-head{display:flex;align-items:center;justify-content:space-between;
  background:#FAFAFB;padding:12px 16px;border-bottom:1px solid var(--rule);
  min-height:56px;gap:12px}
.section-head .left{display:flex;align-items:center;gap:10px}
.section-head .title{font-size:13px;font-weight:700;color:var(--ink)}
.section-head .right{display:flex;align-items:center;gap:20px}
.section-head .stat .k{font-size:9.5px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--ink-soft);text-align:right}
.section-head .stat .v{font-size:14px;font-weight:700;text-align:right;
  font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.section-head .stat .v.green{color:var(--positive)}
.section-head .stat .v.red{color:#C9293B}
.tag{display:inline-flex;align-items:center;height:20px;padding:0 8px;
  border-radius:999px;background:#EEF0F5;color:var(--ink-soft);
  font-size:10px;font-weight:700;letter-spacing:.04em}
.tag.gray{background:#F0F0F0;color:#888}

/* Products table */
table.products{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
table.products thead th{font-size:9.5px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--ink-soft);padding:9px 8px;
  text-align:right;border-bottom:1px solid var(--rule-soft);white-space:nowrap}
table.products thead th:first-child{text-align:left;padding-left:16px}
table.products tbody td{font-size:11.5px;padding:9px 8px;
  border-bottom:1px solid var(--rule-soft);text-align:right;white-space:nowrap}
table.products tbody tr:last-child td{border-bottom:none}
table.products tbody td:first-child{text-align:left;padding-left:16px;font-weight:600;white-space:normal;line-height:1.25}
table.products tbody td:last-child{padding-right:16px}
td.strike{text-decoration:line-through;color:var(--ink-soft)}
td.delta-neg{color:#C9293B;font-weight:600}
td.save{color:var(--positive);font-weight:700}

/* Empty row */
.empty-row{padding:14px 16px;font-size:12px;color:var(--ink-soft);
  font-style:italic;background:#FAFAFB}

/* Total banner */
.total-banner{border:1px solid #F4E89A;background:#FFFBE5;border-radius:10px;
  padding:14px 18px;display:flex;justify-content:space-between;align-items:center;
  font-variant-numeric:tabular-nums}
.total-banner .label{font-size:13px;font-weight:700;color:var(--ink)}
.total-banner .right{display:flex;align-items:center;gap:28px}
.total-banner .stat .k{font-size:9.5px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--ink-soft)}
.total-banner .stat .v{font-size:16px;font-weight:700;color:var(--ink)}
.total-banner .stat .v.green{color:var(--positive)}

/* Compare cards (page 4) */
.compare{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.compare-card{border:1px solid var(--rule);border-radius:10px;overflow:hidden;
  display:flex;flex-direction:column}
.compare-head{display:flex;align-items:center;gap:12px;padding:14px 18px;
  background:#FAFAFB;border-bottom:1px solid var(--rule)}
.compare-icon{width:38px;height:38px;border-radius:8px;background:var(--ink);
  color:var(--hero-yellow);display:grid;place-items:center;flex-shrink:0}
.compare-icon.alt{background:var(--hero-yellow);color:var(--ink)}
.compare-name{font-size:16px;font-weight:800;letter-spacing:-.012em;color:var(--ink)}
.compare-sub{font-size:11px;color:var(--ink-soft);margin-top:2px}
.compare-body{padding:12px 18px 14px;flex:1 1 auto}
.lever-row{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:12px;padding:7px 0;font-size:11.5px}
.lever-row.head{font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;
  color:var(--ink-soft);border-bottom:1px solid var(--rule-soft);
  padding-bottom:8px;margin-bottom:4px}
.lever-row span:nth-child(2),.lever-row span:nth-child(3){text-align:right;font-variant-numeric:tabular-nums}
.lever-empty{padding:18px 0 6px;font-size:12px;color:var(--ink-soft);font-style:italic;text-align:center}
.compare-foot{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;
  padding:12px 18px 14px;background:#FAFAFB;border-top:1px solid var(--rule);
  font-variant-numeric:tabular-nums}
.compare-foot .stat .k{font-size:9.5px;letter-spacing:.07em;text-transform:uppercase;
  color:var(--ink-soft);margin-bottom:2px}
.compare-foot .stat .v{font-size:14px;font-weight:700;color:var(--ink);letter-spacing:-.005em}
.compare-foot .stat .v.blue{color:var(--accent)}

/* Print */
@page{size:letter;margin:0}
@media print{
  .pdf-root{background:#fff}
  .pdf-doc{padding:0;gap:0}
  .pdf-page{box-shadow:none;width:8.5in;min-height:11in;margin:0}
  .no-print{display:none!important}
}

/* Print bar */
.print-bar{position:fixed;right:24px;top:24px;z-index:50;display:flex;gap:8px}
.btn-print{background:var(--navy);color:#fff;border:0;height:40px;padding:0 18px;
  border-radius:8px;font:700 13px/1 "Proxima Nova",-apple-system,sans-serif;
  cursor:pointer;display:inline-flex;align-items:center;gap:8px;
  box-shadow:0 8px 24px rgba(15,26,54,.18)}
.btn-print:hover{background:#000}
.btn-print.yellow{background:var(--hero-yellow);color:var(--ink)}
`;

// ── Doc header ───────────────────────────────────────────────────
function DocHeader({ sub, metaTitle, metaSub, sellerLogo }: {
  sub: string; metaTitle: string; metaSub: string; sellerLogo?: string | null;
}) {
  return (
    <header className="doc-header">
      <div className="doc-brand">
        <img src="/mp-logo.png" className="mp-logo" alt="Mercado Pago" />
        {sellerLogo && (
          <>
            <span className="brand-sep">×</span>
            <img src={sellerLogo} className="seller-logo" alt="Seller" />
          </>
        )}
        {sub && <div className="brand-sub">{sub}</div>}
      </div>
      <div className="doc-meta">
        <strong>{metaTitle}</strong>
        {metaSub}
      </div>
    </header>
  );
}

// ── Doc footer ───────────────────────────────────────────────────
function DocFooter({ page, of, mid }: { page: string; of: string; mid: string }) {
  return (
    <footer className="doc-footer">
      <div>Confidencial</div>
      <div>Mercado Pago México · {mid}</div>
      <div className="pgnum">{page} / {of}</div>
    </footer>
  );
}

// ── OT Table ────────────────────────────────────────────────────
type ComputedRow = ReturnType<typeof computeOT>[number];
function ComTable({ rows, empty }: { rows: ComputedRow[]; empty: string }) {
  if (rows.length === 0) return <div className="empty-row">{empty}</div>;
  return (
    <table className="products">
      <thead>
        <tr>
          {["Producto","Volumen / mes","Tasa actual","Tasa MP","Comisión actual","Comisión MP","Δ %","Ahorro / mes"].map(h => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.name}</td>
            <td>{fmt(r.vol)}</td>
            <td className="strike">{r.cu}%</td>
            <td><strong>{r.mp}%</strong></td>
            <td className="strike">{fmt(r.comCu)}</td>
            <td><strong>{fmt(r.comMp)}</strong></td>
            <td className="delta-neg">−{r.delta.toFixed(2)}%</td>
            <td className="save">{fmt(r.save)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Section card ─────────────────────────────────────────────────
function SectionCard({ title, tag, tagClass, savings, diffPct, children }: {
  title: string; tag: string; tagClass?: string;
  savings: string; diffPct: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section">
      <div className="section-head">
        <div className="left">
          <span className="title">{title}</span>
          <span className={`tag${tagClass ? " " + tagClass : ""}`}>{tag}</span>
        </div>
        <div className="right">
          <div className="stat">
            <div className="k">Ahorro / mes</div>
            <div className="v green">{savings}</div>
          </div>
          <div className="stat">
            <div className="k">Diferencia</div>
            <div className="v red">{diffPct}</div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function PdfPage() {
  const [data, setData] = useState<SimData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("simulator_summary");
      if (!raw) { setError(true); return; }
      setData(JSON.parse(raw));
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#555" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p>No se encontró ninguna propuesta guardada.<br/>Completa el simulador primero.</p>
          <a href="/" style={{ color: "#434CE4", fontWeight: 700 }}>← Ir al simulador</a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #E5E5E5", borderTopColor: "#434CE4", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Compute ────────────────────────────────────────────────────
  const { negocio, productos, comPT_OT, comPT_MSI, tpvPT, comOP_OT, comOP_MSI, tpvOP, palancasSel, palancasPct } = data;
  const seller = negocio.nombre || "Hospital Auna";

  const ptTC_cu = comPT_OT.find((r: OTRow) => r.l === "T. Crédito")?.cu ?? 0;
  const ptTC_mp = comPT_OT.find((r: OTRow) => r.l === "T. Crédito")?.mp ?? 0;
  const opTC_cu = comOP_OT.find((r: OTRow) => r.l === "T. Crédito")?.cu ?? 0;
  const opTC_mp = comOP_OT.find((r: OTRow) => r.l === "T. Crédito")?.mp ?? 0;

  const ptOT  = productos.point ? computeOT(tpvPT, comPT_OT)                      : [];
  const ptMSI = productos.point ? computeMSI(tpvPT, comPT_MSI, ptTC_cu, ptTC_mp)  : [];
  const opOT  = productos.op   ? computeOT(tpvOP, comOP_OT)                       : [];
  const opMSI = productos.op   ? computeMSI(tpvOP, comOP_MSI, opTC_cu, opTC_mp)   : [];

  const ptOTTotal  = sumSave(ptOT);
  const ptMSITotal = sumSave(ptMSI);
  const opOTTotal  = sumSave(opOT);
  const opMSITotal = sumSave(opMSI);
  const ptTotal    = ptOTTotal + ptMSITotal;
  const opTotal    = opOTTotal + opMSITotal;
  const totalSave  = ptTotal + opTotal;
  const cashSub    = ptOTTotal + opOTTotal;
  const msiSub     = ptMSITotal + opMSITotal;

  const ptVA = PALANCAS_PT.filter(l => palancasSel.pt.includes(l.id)).map(l => ({
    name: l.label,
    extraVol: Math.round((palancasPct.pt[l.id] || 0) / 100 * tpvPT),
    gain:     Math.round((palancasPct.pt[l.id] || 0) / 100 * tpvPT),
    pct:      palancasPct.pt[l.id] || 0,
  }));
  const opVA = PALANCAS_OP.filter(l => palancasSel.op.includes(l.id)).map(l => ({
    name: l.label,
    extraVol: Math.round((palancasPct.op[l.id] || 0) / 100 * tpvOP),
    gain:     Math.round((palancasPct.op[l.id] || 0) / 100 * tpvOP),
    pct:      palancasPct.op[l.id] || 0,
  }));

  const ptVATotal  = ptVA.reduce((a, r) => a + r.gain, 0);
  const opVATotal  = opVA.reduce((a, r) => a + r.gain, 0);
  const incrSales  = ptVATotal + opVATotal;
  const monthlyGain = totalSave + incrSales;
  const annualGain  = monthlyGain * 12;

  const baseTpv   = (productos.point ? tpvPT : 0) + (productos.op ? tpvOP : 0);
  const totalDelta = baseTpv > 0 ? totalSave / baseTpv * 100 : 0;
  const ptDelta    = tpvPT  > 0 ? ptTotal  / tpvPT  * 100 : 0;
  const opDelta    = tpvOP  > 0 ? opTotal  / tpvOP  * 100 : 0;
  const incrPct    = baseTpv > 0 ? incrSales / baseTpv * 100 : 0;

  const ptVAExtraVol = ptVA.reduce((a, r) => a + r.extraVol, 0);
  const opVAExtraVol = opVA.reduce((a, r) => a + r.extraVol, 0);
  const ptVAPct      = ptVA.reduce((a, r) => a + r.pct, 0);
  const opVAPct      = opVA.reduce((a, r) => a + r.pct, 0);

  // Date labels
  const now = new Date();
  const generatedAt    = `${now.getDate()} ${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`;
  const proposalValidity = `${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}`;
  const exerciseLabel  = [productos.point && "Point", productos.op && "Online Payments"].filter(Boolean).join(" + ");

  const ptMediaCount = comPT_OT.filter(r => r.sh > 0).length;
  const ptMSICount   = comPT_MSI.filter(r => r.sh > 0).length;
  const opMediaCount = comOP_OT.filter(r => r.sh > 0).length;

  const ptPageSub = `Terminales físicas en sucursal · ${ptMediaCount} medio${ptMediaCount !== 1 ? "s" : ""} de pago${ptMSICount > 0 ? ` · ${ptMSICount} tramo${ptMSICount !== 1 ? "s" : ""} de MSI` : " · sin MSI"}`;
  const opPageSub = `Checkout web / digital · ${opMediaCount} medio${opMediaCount !== 1 ? "s" : ""} de pago${opMSI.length > 0 ? ` · ${opMSI.length} tramo${opMSI.length !== 1 ? "s" : ""} de MSI` : " · sin MSI configurados"}`;

  // Pages: 01 Portada, 02 Point (if active), 03 OP (if active), 04 Palancas
  const pages = ["Portada", productos.point && "Point", productos.op && "Online Payments", "Palancas"].filter(Boolean);

  return (
    <div className="pdf-root">
      <style dangerouslySetInnerHTML={{ __html: PDF_CSS }} />

      <div className="print-bar no-print">
        <button className="btn-print yellow" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Guardar como PDF
        </button>
        <a href="/" className="btn-print">← Volver al simulador</a>
      </div>

      <div className="pdf-doc">

        {/* ── PAGE 1 — PORTADA ─────────────────────────────── */}
        <section className="pdf-page" data-screen-label="01 Portada">
          <DocHeader
            sub="Business Case Simulator"
            metaTitle={seller}
            metaSub={`Ejercicio: ${exerciseLabel} · ${generatedAt}`}
            sellerLogo={negocio.logo}
          />

          <div className="cover-hero">
            <div className="cover-headline">
              <div className="arrow-chip">
                {monthlyGain >= 0 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5 12 12 5 19 12"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <polyline points="19 12 12 19 5 12"/>
                  </svg>
                )}
              </div>
              <h1>Con Mercado Pago<br/>
                {monthlyGain >= 0 ? (
                  <span className="soft">estarás generando +{fmtC(monthlyGain)} al mes.</span>
                ) : (
                  <span className="soft">estarás invirtiendo {fmtC(Math.abs(monthlyGain))} al mes.</span>
                )}
              </h1>
            </div>
          </div>

          <div className="kpi-strip">
            {/* KPI 1 */}
            <div className="kpi-card">
              <div className="kpi-top"><span className="pill green">−{totalDelta.toFixed(2)}%</span></div>
              <div className="kpi-label">Ahorro mensual en tasas</div>
              <div className="kpi-value green">{fmtC(totalSave)}</div>
              <div className="kpi-sub">
                Suma de <b>{fmt(cashSub)}</b> en pagos de contado{msiSub > 0 ? <> + <b>{fmt(msiSub)}</b> en meses sin intereses.</> : "."}
              </div>
            </div>
            <div className="kpi-op"><div className="op">+</div></div>
            {/* KPI 2 */}
            <div className="kpi-card">
              <div className="kpi-top"><span className="pill blue">+{incrPct.toFixed(1)}%</span></div>
              <div className="kpi-label">Incremental en ventas</div>
              <div className="kpi-value blue">{fmtC(incrSales)}</div>
              <div className="kpi-sub">Volumen adicional desbloqueado por las palancas de valor agregado.</div>
            </div>
            <div className="kpi-op"><div className="op">=</div></div>
            {/* KPI 3 dark */}
            <div className="kpi-card dark">
              <div className="kpi-top"><span className="pill dark">Ganancia total · {seller}</span></div>
              <div className="dark-split">
                <div>
                  <div className="col-label">Mensual</div>
                  <div className="col-value yellow">{fmtC(monthlyGain)}</div>
                </div>
                <div className="sep" />
                <div>
                  <div className="col-label">Anual</div>
                  <div className="col-value white">{fmtC(annualGain)}</div>
                </div>
              </div>
              <div className="kpi-sub">Suma de ahorro por tasas e incremental en ventas, <b>proyectado a 12 meses</b>.</div>
            </div>
          </div>

          <div className="cover-body">
            <div className="context">
              <div className="context-title">Contexto del análisis</div>
              <div className="context-grid">
                <div className="ctx-item"><div className="k">Seller</div><div className="v">{seller}</div></div>
                <div className="ctx-item"><div className="k">Productos</div><div className="v">{exerciseLabel}</div></div>
                <div className="ctx-item"><div className="k">Volumen / mes analizado</div><div className="v">{fmtMXN(baseTpv)}</div></div>
                <div className="ctx-item"><div className="k">Δ ponderada de tasa</div><div className="v" style={{ color: "var(--positive)" }}>−{totalDelta.toFixed(2)}%</div></div>
                <div className="ctx-item"><div className="k">Mercado</div><div className="v">México · MXN</div></div>
                <div className="ctx-item"><div className="k">Vigencia de propuesta</div><div className="v">{proposalValidity}</div></div>
                <div className="ctx-item"><div className="k">Proyección</div><div className="v">12 meses</div></div>
                <div className="ctx-item"><div className="k">Documento</div><div className="v">Propuesta · v1</div></div>
              </div>
            </div>

            <div>
              <div className="context-title" style={{ marginBottom: 10 }}>Qué encontrás en este documento</div>
              <div className="toc">
                {productos.point && (
                  <div className="toc-item">
                    <div className="toc-num">2</div>
                    <div className="toc-text">
                      <div className="t">Detalle — Point</div>
                      <div className="d">Desglose de comisiones por medio de pago para terminales físicas.</div>
                    </div>
                  </div>
                )}
                {productos.op && (
                  <div className="toc-item">
                    <div className="toc-num">{productos.point ? "3" : "2"}</div>
                    <div className="toc-text">
                      <div className="t">Detalle — Online Payments</div>
                      <div className="d">Desglose de comisiones por medio de pago en Online Payments.</div>
                    </div>
                  </div>
                )}
                <div className="toc-item">
                  <div className="toc-num">{pages.length}</div>
                  <div className="toc-text">
                    <div className="t">Palancas de crecimiento</div>
                    <div className="d">Ganancia incremental por estrategias elegidas para ti.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="note">
              Las tasas y volúmenes mostrados corresponden a los compartidos por el Seller. Son indicativos y están sujetos a aprobación comercial.
            </div>
          </div>

          <DocFooter page="01" of={String(pages.length).padStart(2,"0")} mid="Business Case Simulator" />
        </section>

        {/* ── PAGE 2 — POINT (if active) ───────────────────── */}
        {productos.point && (() => {
          const pg = "02";
          const total = String(pages.length).padStart(2,"0");
          return (
            <section className="pdf-page" data-screen-label="02 Detalle Point">
              <DocHeader
                sub={`Propuesta · ${seller}`}
                metaTitle="Detalle del análisis"
                metaSub="Point — terminales físicas en sucursal"
                sellerLogo={negocio.logo}
              />
              <div className="detail-body">
                <div className="page-title-row">
                  <div className="page-title">
                    <div className="icon-tile">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                        <rect x="2" y="5" width="20" height="14" rx="2"/>
                        <line x1="2" y1="10" x2="22" y2="10"/>
                      </svg>
                    </div>
                    <div>
                      <h2>Point</h2>
                      <div className="product-sub">{ptPageSub}</div>
                    </div>
                  </div>
                  <div className="right">
                    <div className="k">Ahorro total / mes</div>
                    <div className="v">{fmt(ptTotal)}</div>
                  </div>
                </div>

                <SectionCard title="Comisiones · Pagos de contado" tag="One-shot" tagClass="gray"
                  savings={fmt(ptOTTotal)} diffPct={ptOTTotal > 0 ? `−${(ptOTTotal / (ptOT.reduce((a,r)=>a+r.comCu,0)||1)*100).toFixed(2)}%` : "−0.00%"}>
                  <ComTable rows={ptOT} empty="Sin diferencias de tasa en Point." />
                </SectionCard>

                <SectionCard title="Comisiones · Meses sin intereses" tag="MSI"
                  savings={fmt(ptMSITotal)} diffPct={ptMSITotal > 0 ? `−${(ptMSITotal / (ptMSI.reduce((a,r)=>a+r.comCu,0)||1)*100).toFixed(2)}%` : "−0.00%"}>
                  <ComTable rows={ptMSI} empty="Sin MSI configurados para este canal." />
                </SectionCard>

                <div className="total-banner">
                  <div className="label">Total comisiones (contado + MSI)</div>
                  <div className="right">
                    <div className="stat"><div className="k">Δ ponderada</div><div className="v green">−{ptDelta.toFixed(2)}%</div></div>
                    <div className="stat"><div className="k">Ahorro total / mes</div><div className="v green">{fmt(ptTotal)}</div></div>
                  </div>
                </div>

                <div className="note">
                  Las comisiones <b>actual</b> reflejan la tasa vigente con el proveedor declarado; las comisiones <b>MP</b> aplican la oferta cargada. La diferencia ponderada se calcula sobre el volumen mensual de cada medio de pago. <b>Valores agregados</b> se desarrollan en la última página.
                </div>
              </div>
              <DocFooter page={pg} of={total} mid="Detalle Point" />
            </section>
          );
        })()}

        {/* ── PAGE 3 — ONLINE PAYMENTS (if active) ─────────── */}
        {productos.op && (() => {
          const pg = String(productos.point ? 3 : 2).padStart(2,"0");
          const total = String(pages.length).padStart(2,"0");
          return (
            <section className="pdf-page" data-screen-label="03 Detalle Online Payments">
              <DocHeader
                sub={`Propuesta · ${seller}`}
                metaTitle="Detalle del análisis"
                metaSub="Online Payments — checkout web / digital"
                sellerLogo={negocio.logo}
              />
              <div className="detail-body">
                <div className="page-title-row">
                  <div className="page-title">
                    <div className="icon-tile alt">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                        <rect x="2" y="4" width="20" height="14" rx="2"/>
                        <line x1="2" y1="20" x2="22" y2="20"/>
                        <line x1="8" y1="20" x2="16" y2="20" strokeWidth="2.4"/>
                      </svg>
                    </div>
                    <div>
                      <h2>Online Payments</h2>
                      <div className="product-sub">{opPageSub}</div>
                    </div>
                  </div>
                  <div className="right">
                    <div className="k">Ahorro total / mes</div>
                    <div className="v">{fmt(opTotal)}</div>
                  </div>
                </div>

                <SectionCard title="Comisiones · Pagos de contado" tag="One-shot" tagClass="gray"
                  savings={fmt(opOTTotal)} diffPct={opOTTotal > 0 ? `−${(opOTTotal / (opOT.reduce((a,r)=>a+r.comCu,0)||1)*100).toFixed(2)}%` : "−0.00%"}>
                  <ComTable rows={opOT} empty="Sin diferencias de tasa en Online Payments." />
                </SectionCard>

                <SectionCard title="Comisiones · Meses sin intereses" tag="MSI"
                  savings={fmt(opMSITotal)} diffPct={opMSITotal > 0 ? `−${(opMSITotal / (opMSI.reduce((a,r)=>a+r.comCu,0)||1)*100).toFixed(2)}%` : "−0.00%"}>
                  <ComTable rows={opMSI} empty="Sin MSI configurados para este canal." />
                </SectionCard>

                <div className="total-banner">
                  <div className="label">Total comisiones (contado + MSI)</div>
                  <div className="right">
                    <div className="stat"><div className="k">Δ ponderada</div><div className="v green">−{opDelta.toFixed(2)}%</div></div>
                    <div className="stat"><div className="k">Ahorro total / mes</div><div className="v green">{fmt(opTotal)}</div></div>
                  </div>
                </div>

                <div className="note">
                  Online Payments cubre cobros del checkout digital. Si se activa MSI en el canal digital, esta sección se actualiza automáticamente. <b>Valores agregados</b> se desarrollan en la última página.
                </div>
              </div>
              <DocFooter page={pg} of={total} mid="Detalle Online Payments" />
            </section>
          );
        })()}

        {/* ── PAGE 4 — PALANCAS ────────────────────────────── */}
        {(() => {
          const pg = String(pages.length).padStart(2,"0");
          const total = pg;
          return (
            <section className="pdf-page" data-screen-label="04 Valores agregados">
              <DocHeader
                sub={`Propuesta · ${seller}`}
                metaTitle="Valores agregados"
                metaSub="Ganancia incremental por palancas"
                sellerLogo={negocio.logo}
              />
              <div className="detail-body">
                <div className="page-title-row">
                  <div className="page-title">
                    <div className="icon-tile">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                        <polyline points="16 7 22 7 22 13"/>
                      </svg>
                    </div>
                    <div>
                      <h2>Valores agregados</h2>
                      <div className="product-sub">Volumen extra desbloqueado por palancas activadas · {[productos.point && "Point", productos.op && "Online Payments"].filter(Boolean).join(" vs ")}</div>
                    </div>
                  </div>
                  <div className="right">
                    <div className="k">Ganancia / mes</div>
                    <div className="v" style={{ color: "var(--accent)" }}>{fmtC(incrSales)}</div>
                  </div>
                </div>

                <div className="compare">
                  {/* Point card */}
                  {productos.point && (
                    <div className="compare-card">
                      <div className="compare-head">
                        <div className="compare-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <rect x="2" y="5" width="20" height="14" rx="2"/>
                            <line x1="2" y1="10" x2="22" y2="10"/>
                          </svg>
                        </div>
                        <div>
                          <div className="compare-name">Point</div>
                          <div className="compare-sub">Terminales físicas</div>
                        </div>
                      </div>
                      <div className="compare-body">
                        <div className="lever-row head">
                          <span>Palanca</span><span>Vol. extra / mes</span><span>Ganancia / mes</span>
                        </div>
                        {ptVA.length === 0
                          ? <div className="lever-empty">Sin palancas seleccionadas para Point.</div>
                          : ptVA.map((r, i) => (
                              <div key={i} className="lever-row">
                                <span>{r.name}</span>
                                <span>{fmt(r.extraVol)}</span>
                                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(r.gain)}</span>
                              </div>
                            ))
                        }
                      </div>
                      <div className="compare-foot">
                        <div className="stat"><div className="k">Volumen extra</div><div className="v">{fmt(ptVAExtraVol)}</div></div>
                        <div className="stat"><div className="k">Diferencia</div><div className="v blue">+{ptVAPct.toFixed(2)}%</div></div>
                        <div className="stat"><div className="k">Ganancia / mes</div><div className="v blue">{fmt(ptVATotal)}</div></div>
                      </div>
                    </div>
                  )}

                  {/* OP card */}
                  {productos.op && (
                    <div className="compare-card">
                      <div className="compare-head">
                        <div className="compare-icon alt">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <rect x="2" y="4" width="20" height="14" rx="2"/>
                            <line x1="2" y1="20" x2="22" y2="20"/>
                            <line x1="8" y1="20" x2="16" y2="20" strokeWidth="2.4"/>
                          </svg>
                        </div>
                        <div>
                          <div className="compare-name">Online Payments</div>
                          <div className="compare-sub">Checkout web / digital</div>
                        </div>
                      </div>
                      <div className="compare-body">
                        <div className="lever-row head">
                          <span>Palanca</span><span>Vol. extra / mes</span><span>Ganancia / mes</span>
                        </div>
                        {opVA.length === 0
                          ? <div className="lever-empty">Sin palancas seleccionadas para Online Payments.</div>
                          : opVA.map((r, i) => (
                              <div key={i} className="lever-row">
                                <span>{r.name}</span>
                                <span>{fmt(r.extraVol)}</span>
                                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(r.gain)}</span>
                              </div>
                            ))
                        }
                      </div>
                      <div className="compare-foot">
                        <div className="stat"><div className="k">Volumen extra</div><div className="v">{fmt(opVAExtraVol)}</div></div>
                        <div className="stat"><div className="k">Diferencia</div><div className="v blue">+{opVAPct.toFixed(2)}%</div></div>
                        <div className="stat"><div className="k">Ganancia / mes</div><div className="v blue">{fmt(opVATotal)}</div></div>
                      </div>
                    </div>
                  )}

                  {/* If only one product, fill second column */}
                  {(productos.point && !productos.op) || (!productos.point && productos.op) ? (
                    <div style={{ border: "1px dashed #E5E5E5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 13, fontStyle: "italic" }}>
                      Canal no activo en este ejercicio
                    </div>
                  ) : null}
                </div>

                <div className="note">
                  Estas palancas están proyectadas según el caso específico para <b>{seller}</b> y basadas en análisis de la industria.
                </div>
              </div>
              <DocFooter page={pg} of={total} mid="Valores agregados" />
            </section>
          );
        })()}

      </div>
    </div>
  );
}
