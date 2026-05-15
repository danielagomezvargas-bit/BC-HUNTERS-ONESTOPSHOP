// Gantt — Cronograma de despliegue (Andes X)
const { useState, useMemo, useRef, useEffect, useCallback } = React;

// ─── tweakable defaults ────────────────────────────────────────────────────
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "startDate": "2026-05-12",
  "sellerName": "Seller Muestra",
  "location": "metro"
}/*EDITMODE-END*/;

// Override con datos del simulador si están disponibles
(function() {
  const init = window.GANTT_INIT || {};
  if (init.sellerName) DEFAULTS.sellerName = init.sellerName;
  if (init.startDate)  DEFAULTS.startDate  = init.startDate;
})();

// ─── date helpers ──────────────────────────────────────────────────────────
const MS_DAY = 86400000;
const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isWeekend = (d) => { const x = d.getDay(); return x === 0 || x === 6; };
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addBusinessDays = (d, n) => {
  if (n === 0) return new Date(d);
  let r = new Date(d); const sign = Math.sign(n); let left = Math.abs(n);
  while (left > 0) { r = addDays(r, sign); if (!isWeekend(r)) left--; }
  return r;
};
const businessDayDiff = (a, b) => {
  if (b <= a) return 0;
  let n = 0; let cur = new Date(a);
  while (cur < b) { cur = addDays(cur, 1); if (!isWeekend(cur)) n++; }
  return n;
};
const dayDiff = (a, b) => Math.round((b - a) / MS_DAY);

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_ES_LONG = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DOW_ES = ["D", "L", "M", "X", "J", "V", "S"]; // X = miércoles
const fmtShort = (d) => `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;

// ─── kinds ─────────────────────────────────────────────────────────────────
const KIND = {
  obligatoria: { label: "Fase obligatoria", color: "#15192F", fg: "#FFFFFF" },
  preparacion: { label: "Preparación",      color: "#26B6E2", fg: "#FFFFFF" },
  lanzamiento: { label: "Lanzamiento",      color: "#00A650", fg: "#FFFFFF" },
  seguimiento: { label: "Seguimiento",      color: "#737373", fg: "#FFFFFF" },
};
// ─── color picker swatches ─────────────────────────────────────────────────
// Each entry is a tonal variant of an existing kind — no new colors.
const SWATCHES = [
  { kind: "obligatoria", color: "#15192F" },
  { kind: "obligatoria", color: "#2A3050" },
  { kind: "preparacion", color: "#26B6E2" },
  { kind: "preparacion", color: "#5BCEEE" },
  { kind: "lanzamiento", color: "#00A650" },
  { kind: "lanzamiento", color: "#4CC079" },
  { kind: "seguimiento", color: "#737373" },
  { kind: "seguimiento", color: "#A6A6A6" },
];

const ENVIO_DAYS = { metro: 2, resto: 6 };
const ENVIO_LABEL = { metro: "2 días hábiles · CDMX / GDL / MTY", resto: "5–7 días hábiles · resto del país" };

const buildDefaults = (location) => {
  const envio = ENVIO_DAYS[location];
  // total project default ≈ 10 business days
  return [
    { id: "p1", name: "Apertura de cuenta",     desc: "Alta del seller en la plataforma de cobros.",                  sla: "15 min · alta inmediata",                offset: 0,         duration: 0,     kind: "obligatoria", locked: true },
    { id: "p2", name: "Configuración de cuenta", desc: "Tasas, métodos de pago y reglas comerciales del seller.",      sla: "1 día hábil",                            offset: 0,         duration: 1,     kind: "obligatoria", locked: false },
    { id: "p3", name: "Envío de terminales",    desc: "Despacho y entrega de las terminales Point en sucursal.",      sla: ENVIO_LABEL[location],                    offset: 0,         duration: envio, kind: "obligatoria", locked: false, locationDriven: true },
    { id: "p4", name: "Capacitación de cajeros", desc: "Sesión de operación de la terminal con el equipo en sitio.",  sla: "30 min · al recibir las terminales",     offset: envio,     duration: 1,     kind: "preparacion", locked: false },
    { id: "p5", name: "Encendido de terminales", desc: "Activación, prueba de cobro real y validación de pagos.",     sla: "Mismo día · post capacitación",          offset: envio,     duration: 1,     kind: "lanzamiento", locked: false },
    { id: "p6", name: "Reportes de conciliación", desc: "Acompañamiento y revisión de reportes post go-live.",         sla: "Seguimiento semanal",                    offset: envio + 1, duration: 7,     kind: "seguimiento", locked: false },
  ];
};

// ─── icons ─────────────────────────────────────────────────────────────────
const I = {
  external: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  drag: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  edit: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
  lock: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const css = `
.gantt-modal {
  width: 1440px; height: 820px;
  max-width: calc(100vw - 32px); max-height: calc(100vh - 32px);
  background: #FFFFFF; border-radius: 14px; box-shadow: 0 30px 80px rgba(0,0,0,0.45);
  display: grid; grid-template-rows: auto auto 1fr; overflow: hidden;
  font-family: var(--font-family-base);
  position: relative;
}

/* ─── phase stepper ──────────────────────────────────────────────────── */
.gx-stepper {
  display: flex; align-items: center; gap: 0;
  padding: 10px 20px 10px 24px;
  background: #F7F8FA; border-bottom: 1px solid #E5E5E5;
  overflow-x: auto; flex-shrink: 0; user-select: none;
}
.gx-stepper::-webkit-scrollbar { display: none; }
.gx-step-line { flex: 1; height: 2px; background: #E5E5E5; min-width: 8px; transition: background 250ms; }
.gx-step-dot {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; border: 2px solid #E5E5E5;
  background: #fff; color: #BDBDBD; transition: all 200ms;
}
.gx-step-dot.done   { background: var(--step-color, #15192F); border-color: var(--step-color, #15192F); color: #fff; cursor: pointer; }
.gx-step-dot.done:hover { opacity: .85; }
.gx-step-dot.active { background: var(--step-color, #15192F); border-color: var(--step-color, #15192F); color: #fff; box-shadow: 0 0 0 3px rgba(0,0,0,.12); }
.gx-step-dot.future { cursor: default; opacity: .45; }
.gx-step-label {
  font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: #737373; margin-top: 4px; white-space: nowrap; max-width: 80px;
  overflow: hidden; text-overflow: ellipsis; text-align: center;
}
.gx-stepper-btn {
  padding: 5px 14px; border-radius: 6px; border: 1px solid #E5E5E5;
  background: #fff; color: #15192F; font-size: 12px; font-weight: 700;
  cursor: pointer; flex-shrink: 0; margin-left: 16px; white-space: nowrap;
  transition: background 150ms;
}
.gx-stepper-btn:hover { background: #F0F0F0; }
.gx-stepper-btn:disabled { opacity: .4; cursor: default; }

/* ─── header ──────────────────────────────────────────────────────────── */
.gx-head {
  background: #15192F; color: #FFFFFF;
  padding: 18px 22px 18px 26px;
  display: flex; align-items: center; gap: 16px;
  border-bottom: 1px solid #0A0D1F;
}
.gx-title { font-size: 19px; font-weight: 700; line-height: 24px; letter-spacing: -0.005em; }
.gx-sub   { font-size: 13px; color: rgba(255,255,255,0.62); margin-top: 2px; }
.gx-spacer { flex: 1; }
.gx-duration {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 8px 14px; min-width: 230px;
  display:flex; flex-direction: column; align-items: flex-end; gap: 2px;
}
.gx-dur-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; color: rgba(255,255,255,0.55); text-transform: uppercase; white-space: nowrap; }
.gx-dur-row { display:flex; align-items: baseline; gap: 4px; }
.gx-dur-value {
  font-size: 22px; font-weight: 700; color: #FFE600; line-height: 26px;
  background: transparent; border: 0; text-align: right; font-family: inherit; padding: 0;
  width: 38px;
}
.gx-dur-value:focus { outline: 0; background: rgba(255,230,0,0.08); border-radius: 4px; }
.gx-dur-unit { font-size: 12px; color: rgba(255,255,255,0.7); font-weight: 600; }
.gx-dur-meta { font-size: 10.5px; color: rgba(255,255,255,0.55); }
.gx-dur-edit { color: rgba(255,255,255,0.35); display:inline-flex; margin-left: 2px; }
.gx-close {
  width: 36px; height: 36px; border-radius: 8px; display:grid; place-items:center;
  background: transparent; color: rgba(255,255,255,0.7); border: 0; cursor: pointer;
  transition: background 150ms;
}
.gx-close:hover { background: rgba(255,255,255,0.08); color: #FFFFFF; }
.gx-iconbtn {
  width: 36px; height: 36px; border-radius: 8px; display:grid; place-items:center;
  background: transparent; color: rgba(255,255,255,0.7); border: 0; cursor: pointer;
  transition: background 150ms, color 150ms;
}
.gx-iconbtn:hover { background: rgba(255,230,0,0.12); color: #FFE600; }
.gx-readonly-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding: 8px 12px; border-radius: 8px;
  background: rgba(255,230,0,0.1); color: #FFE600;
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
  border: 1px solid rgba(255,230,0,0.25);
}

/* share popover */
.gx-share-pop {
  position: absolute; top: 76px; right: 22px; z-index: 200;
  width: 360px; background: #FFFFFF; color: #1A1A1A;
  border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  padding: 16px;
  animation: gxFade 200ms ease-out;
}
@keyframes gxFade { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.gx-share-pop .sh-title { font-size: 13px; font-weight: 700; color: #15192F; }
.gx-share-pop .sh-sub { font-size: 11px; color: #737373; margin-top: 2px; line-height: 14px; }
.gx-share-pop .sh-link {
  display: flex; align-items: center; gap: 6px;
  margin-top: 10px; padding: 8px 10px;
  border: 1px solid #E5E5E5; border-radius: 8px;
  background: #F7F7F7;
  font-size: 11px; color: #434CE4; font-family: var(--font-family-mono);
  overflow: hidden;
}
.gx-share-pop .sh-link span {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.gx-share-pop .sh-copy {
  flex-shrink: 0; padding: 6px 10px; border-radius: 6px;
  background: #15192F; color: #FFFFFF; border: 0; cursor: pointer;
  font: inherit; font-size: 11px; font-weight: 600;
  display:inline-flex; align-items:center; gap: 4px;
}
.gx-share-pop .sh-copy:hover { background: #0A0D1F; }
.gx-share-pop .sh-copy.copied { background: #00A650; }
.gx-share-pop .sh-close {
  position: absolute; top: 8px; right: 8px;
  width: 24px; height: 24px; border: 0; background: transparent;
  color: #999999; cursor: pointer; border-radius: 4px;
  display:grid; place-items:center;
}
.gx-share-pop .sh-close:hover { background: #F0F0F0; color: #1A1A1A; }
.gx-share-pop::before {
  content: ""; position: absolute; top: -7px; right: 28px;
  width: 0; height: 0;
  border-left: 7px solid transparent; border-right: 7px solid transparent;
  border-bottom: 7px solid #FFFFFF;
}

/* ─── body ────────────────────────────────────────────────────────────── */
.gx-body { display: grid; grid-template-columns: 500px 1fr; min-height: 0; }
.gx-body.ro { grid-template-columns: 1fr; }

/* ─── LEFT: configuration ─────────────────────────────────────────────── */
.gx-left {
  background: #F7F7F7; border-right: 1px solid #E5E5E5;
  display: grid; grid-template-rows: auto 1fr auto; min-height: 0;
}
.gx-left-head { padding: 18px 20px 14px; }
.gx-overline { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #737373; }
.gx-label { font-size: 12px; font-weight: 600; color: #1A1A1A; margin: 14px 0 6px; }
.gx-input {
  width: 100%; padding: 10px 12px; border: 1px solid #E5E5E5; background: #FFFFFF;
  border-radius: 8px; font-size: 14px; font-family: inherit; color: #1A1A1A;
  transition: border-color 150ms, box-shadow 150ms;
}
.gx-input:focus { outline: 0; border-color: #434CE4; box-shadow: 0 0 0 3px #ECEDFC; }

.gx-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 4px; }
.gx-toggle button {
  background: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 8px; padding: 9px 8px;
  font: inherit; font-size: 12px; font-weight: 600; color: #1A1A1A; cursor: pointer;
  display:flex; align-items:center; justify-content:center; gap:6px;
  transition: all 150ms;
}
.gx-toggle button:hover { border-color: #B3B3B3; }
.gx-toggle button.active { border-color: #434CE4; background: #ECEDFC; color: #434CE4; box-shadow: 0 0 0 1px #434CE4 inset; }

/* phases table */
.gx-phases-head {
  display: grid;
  grid-template-columns: 14px minmax(0, 1.1fr) minmax(0, 1.6fr) 44px 18px 18px;
  gap: 8px; padding: 6px 12px 6px 10px;
  border-bottom: 1px solid #E5E5E5; background: #F0F0F0;
}
.gx-phases-head > div { font-size: 9.5px; font-weight: 700; color: #737373; letter-spacing: 0.06em; text-transform: uppercase; }
.gx-phases-head .col-dur { text-align: center; }

.gx-phases { overflow-y: auto; min-height: 0; }
.gx-phases::-webkit-scrollbar { width: 8px; }
.gx-phases::-webkit-scrollbar-thumb { background: #CCCCCC; border-radius: 4px; }

.gx-phase-row {
  display: grid;
  grid-template-columns: 14px minmax(0, 1.1fr) minmax(0, 1.6fr) 44px 18px 18px;
  gap: 8px; align-items: center; padding: 10px 12px 10px 10px;
  border-bottom: 1px solid #ECECEC;
}
.gx-phase-row:hover { background: #FFFFFF; }
.gx-phase-row.dragging { opacity: 0.35; }
.gx-phase-row.drop-above { box-shadow: 0 -2px 0 0 #434CE4 inset; }
.gx-phase-grip { color: #B3B3B3; cursor: grab; display:flex; align-items:center; }
.gx-phase-grip.locked { color: #E5E5E5; cursor: not-allowed; }
.gx-phase-grip:active { cursor: grabbing; }
.gx-phase-name {
  border: 1px solid transparent; background: transparent;
  font: inherit; font-size: 12.5px; font-weight: 600; color: #1A1A1A;
  padding: 4px 6px; border-radius: 4px; min-width: 0; width: 100%;
}
.gx-phase-name:hover { background: #FFFFFF; border-color: #E5E5E5; }
.gx-phase-name:focus { outline: 0; background: #FFFFFF; border-color: #434CE4; box-shadow: 0 0 0 3px #ECEDFC; }
.gx-phase-meta { font-size: 10.5px; color: #737373; padding: 0 6px; line-height: 14px; margin-top: 1px; }
.gx-phase-info { min-width: 0; }
.gx-phase-desc {
  border: 1px solid transparent; background: transparent;
  font: inherit; font-size: 12px; color: #4A4A4A; line-height: 16px;
  padding: 4px 6px; border-radius: 4px; min-width: 0; width: 100%;
  resize: none; min-height: 32px; max-height: 60px; font-family: inherit;
}
.gx-phase-desc:hover { background: #FFFFFF; border-color: #E5E5E5; }
.gx-phase-desc:focus { outline: 0; background: #FFFFFF; border-color: #434CE4; box-shadow: 0 0 0 3px #ECEDFC; }
.gx-num {
  width: 100%; padding: 6px 4px; text-align: center; border: 1px solid #E5E5E5; background: #FFFFFF;
  border-radius: 6px; font: inherit; font-size: 12px; color: #1A1A1A;
}
.gx-num:focus { outline: 0; border-color: #434CE4; box-shadow: 0 0 0 3px #ECEDFC; }

.gx-swatch {
  width: 18px; height: 18px; border-radius: 5px; border: 0; cursor: pointer; padding: 0;
  position: relative;
}
.gx-swatch:hover { transform: scale(1.1); }
.gx-swatch-pop {
  position: absolute; z-index: 50; bottom: calc(100% + 6px); right: 0;
  background: #FFFFFF; border: 1px solid #E5E5E5; border-radius: 8px; padding: 6px;
  display: grid; grid-template-columns: repeat(4, 22px); gap: 4px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}
.gx-swatch-pop button { width: 22px; height: 22px; border-radius: 4px; border: 0; cursor: pointer; padding: 0; }
.gx-swatch-pop button.sel { box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #434CE4; }
.gx-trash {
  width: 18px; height: 18px; border-radius: 4px; border: 0; background: transparent;
  color: #999999; cursor: pointer; display:grid; place-items:center;
}
.gx-trash:hover { background: #FCE5E8; color: #F23D4F; }
.gx-trash:disabled { opacity: 0.3; cursor: not-allowed; }

.gx-add-row {
  margin: 10px 12px 10px;
  width: calc(100% - 24px);
  padding: 12px; border-radius: 8px; border: 1.5px dashed #B9C0FA;
  background: rgba(67,76,228,0.03);
  font: inherit; font-size: 13px; font-weight: 600; color: #434CE4;
  display:flex; align-items:center; justify-content:center; gap:6px; cursor: pointer;
  transition: all 150ms;
}
.gx-add-row:hover { background: #ECEDFC; border-color: #434CE4; }

.gx-left-foot { padding: 14px 16px 16px; border-top: 1px solid #E5E5E5; background: #FFFFFF; }
.gx-download {
  width: 100%; padding: 12px 16px; background: #15192F; color: #FFFFFF;
  border: 0; border-radius: 8px; font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  display:flex; align-items:center; justify-content:center; gap:8px;
  transition: background 150ms;
}
.gx-download:hover { background: #0A0D1F; }

/* ─── RIGHT: gantt ────────────────────────────────────────────────────── */
.gx-right {
  display: grid; grid-template-rows: auto 1fr auto; min-height: 0; background: #FFFFFF;
}
.gx-right-head { padding: 18px 24px 12px; display:flex; align-items: baseline; gap: 16px; }
.gx-right-title { font-size: 16px; font-weight: 700; color: #1A1A1A; }
.gx-right-meta { font-size: 12.5px; color: #737373; }

.gx-chart {
  position: relative; overflow: auto; padding: 0; min-height: 0;
  border-top: 1px solid #F0F0F0;
}
.gx-chart::-webkit-scrollbar { height: 10px; width: 10px; }
.gx-chart::-webkit-scrollbar-thumb { background: #CCCCCC; border-radius: 5px; }
.gx-chart::-webkit-scrollbar-track { background: #F7F7F7; }

.gx-grid { position: relative; }

/* === multi-row header === */
.gx-header-stack {
  position: sticky; top: 0; z-index: 6; background: #FFFFFF;
  border-bottom: 1px solid #E5E5E5;
  display: grid;
}
.gx-h-row { display: grid; }
.gx-h-mes { height: 30px; background: #FAFAFA; border-bottom: 1px solid #E5E5E5; }
.gx-h-mes .mes-band {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: #15192F;
  background: #FFE600;
  height: 30px;
  border: 0; cursor: pointer; padding: 0 8px;
  font-family: inherit;
  transition: filter 150ms;
}
.gx-h-mes .mes-band:hover { filter: brightness(0.93); }
.gx-h-mes .mes-band.alt { background: #1F2547; color: #FFFFFF; }
.gx-h-mes .mes-band.focused {
  outline: 2px solid #434CE4; outline-offset: -2px;
  background: #434CE4; color: #FFFFFF;
}
.gx-h-mes .mes-band.alt.focused { background: #434CE4; color: #FFFFFF; }
.gx-h-mes .mes-band .focus-tick {
  display:inline-flex; width: 14px; height: 14px; align-items:center; justify-content:center;
  border-radius: 50%; background: rgba(255,255,255,0.25); font-size: 9px;
}
.gx-h-month {
  height: 26px;
  font-size: 11px; font-weight: 700; color: #1A1A1A; letter-spacing: 0.02em;
  display: flex; align-items: center;
  border-bottom: 1px solid #F0F0F0; background: #FFFFFF;
}
.gx-h-month-cell {
  display:flex; align-items:center; gap: 6px;
  padding: 0 10px; height: 100%;
  cursor: pointer; transition: background 150ms;
  border-right: 1px solid #F0F0F0;
}
.gx-h-month-cell:hover { background: #F7F7F7; }
.gx-h-month-cell.focused { background: #ECEDFC; color: #434CE4; }
.gx-h-month-cell .focus-chip {
  font-size: 9px; font-weight: 700; letter-spacing: 0.04em;
  padding: 1px 5px; border-radius: 3px;
  background: #ECEDFC; color: #434CE4;
}
.gx-h-month-cell.focused .focus-chip { background: #434CE4; color: #FFFFFF; }
.gx-h-dow {
  height: 22px;
  font-size: 9px; font-weight: 700; color: #999999; letter-spacing: 0;
  text-align: center; line-height: 22px;
  border-bottom: 1px solid #F0F0F0;
}
.gx-h-dow.we { color: #F23D4F; background: #FBFBFB; }
.gx-h-day {
  height: 26px;
  font-size: 10px; font-weight: 600; color: #1A1A1A;
  text-align: center; line-height: 26px;
  border-right: 1px solid #F4F4F4;
  font-variant-numeric: tabular-nums;
}
.gx-h-day.we { color: #B3B3B3; background: #FBFBFB; }
.gx-h-day.month-start { border-left: 1.5px solid #CCCCCC; }
.gx-h-today { background: rgba(242,61,79,0.08); color: #F23D4F; font-weight: 700; }
.gx-h-start { background: rgba(0,166,80,0.12); color: #00873F; font-weight: 700; }
.gx-header-side {
  background: #FFFFFF; border-right: 1px solid #E5E5E5;
  display: flex; align-items: flex-end; padding: 0 12px 6px; color: #999999;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
}

/* rows */
.gx-rows { position: relative; }
.gx-row {
  position: relative; min-height: 56px;
  display: grid;
  border-bottom: 1px solid #F0F0F0;
}
.gx-row-label {
  position: sticky; left: 0; z-index: 4; background: #FFFFFF;
  padding: 8px 12px;
  display: flex; flex-direction: column; justify-content: center;
  border-right: 1px solid #E5E5E5;
}
.gx-row-name { font-size: 13px; font-weight: 600; color: #1A1A1A; line-height: 16px;
  white-space: normal; word-break: break-word; }
.gx-row-sla  { font-size: 10.5px; color: #737373; line-height: 14px; margin-top: 2px;
              white-space: normal; word-break: break-word; }
.gx-row-bg { position: relative; height: 100%; min-height: 56px; }

.gx-day-line {
  position: absolute; top: 0; bottom: 0; width: 1px; background: #F4F4F4;
  pointer-events: none;
}
.gx-weekend-strip {
  position: absolute; top: 0; bottom: 0; background: rgba(0,0,0,0.022);
  pointer-events: none;
}
.gx-month-divider {
  position: absolute; top: 0; bottom: 0; width: 1.5px; background: #DCDCDC;
  pointer-events: none; z-index: 2;
}
.gx-today-line {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: #F23D4F; z-index: 3; pointer-events: none;
}
.gx-start-line {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: #00A650; z-index: 3; pointer-events: none;
}
.gx-end-line {
  position: absolute; top: 0; bottom: 0; width: 0; z-index: 5; pointer-events: none;
  border-left: 2.5px solid #F23D4F;
}
.gx-end-label {
  position: absolute; top: 2px; left: 5px;
  font-size: 9px; font-weight: 800; color: #fff;
  background: #F23D4F; padding: 1px 6px; border-radius: 3px;
  white-space: nowrap; line-height: 14px; letter-spacing: 0.03em;
}

/* phase guide lines (dashed verticals spanning all rows) */
.gx-rows-overlay {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 2;
}
.gx-focus-mask {
  position: absolute; top: 0; bottom: 0;
  background: rgba(255,255,255,0.72);
  pointer-events: none; z-index: 4;
}
.gx-guide {
  position: absolute; width: 0;
  border-left: 1px dashed rgba(67,76,228,0.20);
  pointer-events: none;
}
.gx-guide.end { border-left-color: rgba(21,25,47,0.32); }
.gx-guide.hover { border-left-color: #434CE4; border-left-width: 1.5px; z-index: 5; }
.gx-guide-label {
  position: absolute; top: 2px; transform: translateX(-50%);
  font-size: 9px; font-weight: 700; color: #FFFFFF;
  background: #434CE4; padding: 1px 5px; border-radius: 3px;
  white-space: nowrap; line-height: 12px; letter-spacing: 0.02em;
}

/* header logo slot */
.gx-logo-slot {
  width: 48px; height: 48px; border-radius: 10px;
  background: rgba(255,255,255,0.06);
  border: 1.5px dashed rgba(255,255,255,0.22);
  display: grid; place-items: center;
  color: rgba(255,255,255,0.45);
  font-size: 9px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  overflow: hidden; flex-shrink: 0;
}
.gx-logo-slot image-slot {
  width: 100%; height: 100%; display: block;
}

/* bars */
.gx-bar {
  position: absolute; top: 12px; height: 32px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.12);
  cursor: grab;
  transition: box-shadow 150ms, transform 150ms;
  z-index: 20;
}
.gx-bar:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.18); transform: translateY(-1px); }
.gx-bar:active, .gx-bar.dragging { cursor: grabbing; transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
.gx-bar.milestone {
  width: 30px !important; height: 30px; padding: 0; top: 13px;
  border-radius: 50%;
}
.gx-bar.milestone .dot {
  width: 10px; height: 10px; background: #FFFFFF; border-radius: 50%;
}

/* resize handle on right edge */
.gx-bar .resize {
  position: absolute; right: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize;
  border-top-right-radius: 7px; border-bottom-right-radius: 7px;
}
.gx-bar .resize:hover { background: rgba(255,255,255,0.2); }

/* legend */
.gx-legend {
  padding: 8px 22px 10px; display: flex; align-items: center; gap: 16px;
  border-top: 1px solid #F0F0F0;
  font-size: 11px; color: #666666;
}
.gx-leg-item { display: inline-flex; align-items: center; gap: 6px; }
.gx-leg-dot { width: 10px; height: 10px; border-radius: 3px; }

/* tooltip */
.gx-tip {
  position: absolute; z-index: 30; pointer-events: none;
  background: #15192F; color: #FFFFFF; padding: 8px 10px; border-radius: 8px;
  font-size: 11px; max-width: 260px; line-height: 14px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}
.gx-tip .tip-title { font-weight: 700; font-size: 12px; margin-bottom: 2px; }
.gx-tip .tip-meta  { color: #FFE600; font-weight: 700; font-size: 10.5px; margin-bottom: 4px; }
.gx-tip .tip-desc  { color: rgba(255,255,255,0.85); }
.gx-tip .tip-days  { color: rgba(255,255,255,0.65); margin-top: 4px; font-size: 10.5px; }

/* toast */
.gx-toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: #15192F; color: #FFFFFF; padding: 12px 18px; border-radius: 10px;
  font-size: 13px; font-weight: 600; box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  display:flex; align-items:center; gap:10px; z-index: 1000;
}
@keyframes gxSpin { to { transform: rotate(360deg); } }
`;

if (!document.getElementById("gantt-css")) {
  const tag = document.createElement("style");
  tag.id = "gantt-css";
  tag.textContent = css;
  document.head.appendChild(tag);
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR ROW
// ═══════════════════════════════════════════════════════════════════════════
function PhaseRow({ phase, onChange, onDelete, onDragStart, onDragOver, onDrop, draggingId, dropOverId }) {
  const [openSwatch, setOpenSwatch] = useState(false);
  const swatchColor = phase.color || KIND[phase.kind].color;
  const isLocked = !!phase.locked;
  const isDragging = draggingId === phase.id;
  const dropAbove = dropOverId === phase.id;

  // close swatch on outside click
  useEffect(() => {
    if (!openSwatch) return;
    const h = () => setOpenSwatch(false);
    setTimeout(() => document.addEventListener("click", h, { once: true }), 0);
    return () => document.removeEventListener("click", h);
  }, [openSwatch]);

  return (
    <div
      className={`gx-phase-row ${isDragging ? "dragging" : ""} ${dropAbove ? "drop-above" : ""}`}
      draggable={!isLocked}
      onDragStart={(e) => { if (isLocked) return; onDragStart(phase.id); e.dataTransfer.effectAllowed = "move"; }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(phase.id); }}
      onDrop={(e) => { e.preventDefault(); onDrop(phase.id); }}
    >
      <div className={`gx-phase-grip ${isLocked ? "locked" : ""}`} title={isLocked ? "Fase fija" : "Arrastrar"}>
        {isLocked ? I.lock : I.drag}
      </div>
      <div className="gx-phase-info">
        <input
          className="gx-phase-name"
          value={phase.name}
          onChange={(e) => onChange(phase.id, { name: e.target.value })}
        />
        <div className="gx-phase-meta" title={phase.sla}>{phase.sla}</div>
      </div>
      <textarea
        className="gx-phase-desc"
        rows={2}
        value={phase.desc}
        onChange={(e) => onChange(phase.id, { desc: e.target.value })}
      />
      <input
        className="gx-num" type="number" min="0" max="60" value={phase.duration}
        title="Duración en días hábiles · 0 = hito"
        onChange={(e) => onChange(phase.id, { duration: Math.max(0, +e.target.value || 0), locationDriven: false })}
      />
      <div style={{ position: "relative" }}>
        <button className="gx-swatch" style={{ background: swatchColor }}
                onClick={(e) => { e.stopPropagation(); setOpenSwatch(s => !s); }} title="Categoría" />
        {openSwatch && (
          <div className="gx-swatch-pop" onClick={(e) => e.stopPropagation()}>
            {SWATCHES.map((s, i) => {
              const isSel = phase.kind === s.kind && (phase.color || KIND[s.kind].color) === s.color;
              return (
                <button key={i}
                        className={isSel ? "sel" : ""}
                        style={{ background: s.color }}
                        title={KIND[s.kind].label}
                        onClick={() => { onChange(phase.id, { kind: s.kind, color: s.color }); setOpenSwatch(false); }} />
              );
            })}
          </div>
        )}
      </div>
      <button className="gx-trash" onClick={() => onDelete(phase.id)} disabled={isLocked} title="Eliminar">
        {I.trash}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
const DAY_PX = 28;        // calendar day column width — wider bars
const LABEL_W = 200;      // calendar left label width
// total calendar span — si hay fecha de fin explícita, úsala; si no, computa desde fases
const computeTotalDays = (start, phases, endOverride) => {
  if (endOverride && endOverride > start) {
    return Math.max(14, dayDiff(start, endOverride) + 1); // +1 día después de la fecha de fin
  }
  let lastBizDay = 0;
  (phases || []).forEach(p => {
    const end = (p.offset || 0) + (p.duration || 0);
    if (end > lastBizDay) lastBizDay = end;
  });
  const endDate = addBusinessDays(start, lastBizDay);
  let pad = 3;
  const dow = endDate.getDay();
  if (dow > 0 && dow < 6) pad = 6 - dow + 3;
  const total = dayDiff(start, addDays(endDate, pad)) + 1;
  return Math.max(14, total);
};

function App() {
  const [startISO,     setStartISO]     = useState(DEFAULTS.startDate);
  const [endISO,       setEndISO]       = useState(() => toISO(addDays(parseISO(DEFAULTS.startDate), 42))); // +6 semanas por defecto
  const [currentStep,  setCurrentStep]  = useState(() => buildDefaults(DEFAULTS.location).length - 1); // null = auto desde fases
  const [location, setLocation] = useState(DEFAULTS.location);
  const [phases, setPhases] = useState(() => buildDefaults(DEFAULTS.location));
  const [tip, setTip] = useState(null);
  const [toast, setToast] = useState(null);
  const [durationOverride, setDurationOverride] = useState(null); // null = computed
  const [focusedMonth, setFocusedMonth] = useState(null); // null | 0 | 1
  const [hoverPhaseId, setHoverPhaseId] = useState(null);

  // read-only share mode
  const [readOnly, setReadOnly] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const h = window.location.hash;
    if (h && h.startsWith("#share=")) {
      try {
        const payload = JSON.parse(decodeURIComponent(escape(atob(h.slice(7)))));
        if (payload.startISO) setStartISO(payload.startISO);
        if (payload.location) setLocation(payload.location);
        if (Array.isArray(payload.phases)) setPhases(payload.phases);
        if (payload.durationOverride !== undefined) setDurationOverride(payload.durationOverride);
        if (payload.sellerName) DEFAULTS.sellerName = payload.sellerName;
        setReadOnly(true);
      } catch (e) { console.warn("share parse failed", e); }
    }
  }, []);
  const dragRef = useRef({ id: null, over: null });
  const [, setBump] = useState(0);
  const bump = () => setBump(b => b + 1);

  const start = parseISO(startISO);
  const endOverride = endISO ? parseISO(endISO) : null;
  const TOTAL_DAYS = useMemo(() => computeTotalDays(start, phases, endOverride), [startISO, endISO, phases]);
  const endCol     = endISO ? dayDiff(start, endOverride) : null;

  // ─── chart day columns ────────────────────────────────────────────────
  const chartDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < TOTAL_DAYS; i++) arr.push(addDays(start, i));
    return arr;
  }, [startISO, TOTAL_DAYS]);

  // ─── phase computed spans ─────────────────────────────────────────────
  const phaseSpans = useMemo(() => phases.map(p => {
    const startDate = addBusinessDays(start, p.offset);
    const endDate = p.duration === 0 ? startDate : addBusinessDays(startDate, p.duration);
    const startCol = dayDiff(start, startDate);
    const endCol = dayDiff(start, endDate);
    return { ...p, startDate, endDate, startCol, endCol };
  }), [phases, startISO]);

  const projectEnd = useMemo(() => {
    let max = start;
    phaseSpans.forEach(p => { if (p.endDate > max) max = p.endDate; });
    return max;
  }, [phaseSpans, startISO]);

  const computedDuration = businessDayDiff(addDays(start, -1), projectEnd);
  const displayDuration = durationOverride ?? computedDuration;

  // ─── month bands (Mes 1 = start's calendar month, Mes 2 = next) ───────
  const monthBands = useMemo(() => {
    // group consecutive days by year-month
    const bands = [];
    let cur = null;
    chartDays.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!cur || cur.key !== key) {
        cur = { key, start: i, end: i, monthIdx: bands.length, date: d };
        bands.push(cur);
      } else {
        cur.end = i;
      }
    });
    return bands;
  }, [chartDays]);

  // weekend column indices
  const weekendCols = useMemo(() => {
    const arr = [];
    chartDays.forEach((d, i) => { if (isWeekend(d)) arr.push(i); });
    return arr;
  }, [chartDays]);

  // month boundary day indices (where a new calendar month starts, not col 0)
  const monthBoundaries = useMemo(() => {
    return monthBands.slice(1).map(b => b.start);
  }, [monthBands]);

  // today
  const todayCol = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const c = dayDiff(start, t);
    return c >= 0 && c < TOTAL_DAYS ? c : null;
  }, [startISO, TOTAL_DAYS]);

  // ─── location change ──────────────────────────────────────────────────
  const onLocationChange = (next) => {
    if (next === location) return;
    const oldDays = ENVIO_DAYS[location];
    const newDays = ENVIO_DAYS[next];
    const delta = newDays - oldDays;
    setLocation(next);
    setPhases(prev => prev.map(p => {
      if (p.id === "p3" && p.locationDriven !== false) {
        return { ...p, duration: newDays, sla: ENVIO_LABEL[next] };
      }
      if (["p4", "p5", "p6"].includes(p.id)) {
        return { ...p, offset: Math.max(0, p.offset + delta) };
      }
      return p;
    }));
  };

  // ─── phase mutators ───────────────────────────────────────────────────
  const updatePhase = (id, patch) => setPhases(p => p.map(x => x.id === id ? { ...x, ...patch } : x));
  const deletePhase = (id) => setPhases(p => p.filter(x => x.id !== id || x.locked));
  const addPhase = () => {
    const id = "p" + Math.random().toString(36).slice(2, 7);
    const last = phases[phases.length - 1];
    const offset = last ? last.offset + Math.max(1, last.duration || 1) : 0;
    setPhases(p => {
      const next = [...p, {
        id, name: "Nueva fase", desc: "Describe la actividad.",
        sla: "1 día hábil", offset, duration: 1, kind: "preparacion", locked: false
      }];
      // Avanzar el stepper para que la nueva fase quede visible (no dimmed)
      setCurrentStep(next.length - 1);
      return next;
    });
  };

  // ─── reorder DnD ──────────────────────────────────────────────────────
  const onDragStart = (id) => { dragRef.current.id = id; bump(); };
  const onDragOver = (id) => { if (dragRef.current.id !== id) { dragRef.current.over = id; bump(); } };
  const onDrop = (id) => {
    const fromId = dragRef.current.id;
    if (!fromId || fromId === id) { dragRef.current = { id: null, over: null }; bump(); return; }
    setPhases(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(p => p.id === fromId);
      const toIdx = arr.findIndex(p => p.id === id);
      if (fromIdx < 0 || toIdx < 0) return arr;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
    dragRef.current = { id: null, over: null }; bump();
  };

  // ─── BAR DRAG: move bar to change offset ───────────────────────────
  const barDragRef = useRef(null);
  const onBarMouseDown = useCallback((e, phaseId, mode) => {
    e.preventDefault();
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    barDragRef.current = {
      id: phaseId, mode, // 'move' | 'resize'
      startX: e.clientX,
      origOffset: phase.offset,
      origDuration: phase.duration,
    };
    document.body.style.cursor = mode === "resize" ? "ew-resize" : "grabbing";
    const onMove = (ev) => {
      const d = barDragRef.current; if (!d) return;
      const dx = ev.clientX - d.startX;
      const stepDays = Math.round(dx / DAY_PX);
      // Convert calendar-day step to business-day step (approx: 5/7)
      // Better: when moving, treat offset directly in business days
      if (d.mode === "move") {
        const newOffset = Math.max(0, d.origOffset + stepDays);
        setPhases(prev => prev.map(p => p.id === d.id ? { ...p, offset: newOffset } : p));
      } else {
        const newDur = Math.max(0, d.origDuration + stepDays);
        setPhases(prev => prev.map(p => p.id === d.id ? { ...p, duration: newDur, locationDriven: false } : p));
      }
    };
    const onUp = () => {
      barDragRef.current = null;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [phases]);

  // ─── download ─────────────────────────────────────────────────────────
  // ─── download → genera PPTX nativo editable ──────────────────────────
  const ensurePptx = async () => {
    if (window.PptxGenJS) return;
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  };

  const onDownload = async () => {
    setToast("Generando PNG…");
    try {
      // ── Geometría de salida ──
      const OUT_W   = 1920;
      const SCALE   = 2;
      const LW      = 280;
      const HEAD_H  = 68;
      const MON_H   = 20;   // franja de mes (coloreada, encima de los días)
      const DOW_H   = 18;   // letras D/L/M/X/J/V/S
      const DNUM_H  = 22;   // número del día
      const DAY_H   = MON_H + DOW_H + DNUM_H;
      const ROW_H   = 58;
      const PAD     = 12;

      const cropEnd  = endISO ? parseISO(endISO) : addDays(start, 41);
      const totalCal = Math.max(dayDiff(start, cropEnd) + 1, 14);
      const COL_W    = (OUT_W - LW) / totalCal;

      const calDays  = [];
      for (let i = 0; i < totalCal; i++) calDays.push(addDays(start, i));

      const rowsTop  = HEAD_H + DAY_H;
      const rowsH    = phaseSpans.length * ROW_H;
      const OUT_H    = rowsTop + rowsH + 32;

      // ── Canvas ──
      const cv  = document.createElement('canvas');
      cv.width  = OUT_W * SCALE;
      cv.height = OUT_H * SCALE;
      const C   = cv.getContext('2d');
      C.scale(SCALE, SCALE);
      const rx  = (x) => Math.round(x);

      // ── Logo de Mercado Pago (carga asíncrona) ──
      const mpLogo = await new Promise((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = '/mp-logo.png';
      });

      // ── Fondo blanco ──
      C.fillStyle = '#FFFFFF';
      C.fillRect(0, 0, OUT_W, OUT_H);

      // ── Weekend shading (aplica a toda la altura desde el mes) ──
      calDays.forEach((d, i) => {
        if (isWeekend(d)) {
          C.fillStyle = 'rgba(0,0,0,0.03)';
          C.fillRect(rx(LW + i * COL_W), HEAD_H + MON_H, rx(COL_W), DOW_H + DNUM_H + rowsH);
        }
      });

      // ── Franjas de mes (coloreadas) ──
      const bandColors = ['#FFE600','#15192F','#ECEDFC','#E5E5E5','#FFE600','#15192F'];
      const bandTexts  = ['#15192F','#FFFFFF','#434CE4','#1A1A1A','#15192F','#FFFFFF'];
      let bandIdx = 0; let prevM = -1;
      calDays.forEach((d, i) => {
        if (d.getMonth() !== prevM) {
          if (prevM !== -1) bandIdx++;
          prevM = d.getMonth();
        }
        const bi  = bandIdx % bandColors.length;
        const x   = rx(LW + i * COL_W);
        C.fillStyle = bandColors[bi];
        C.fillRect(x, HEAD_H, rx(COL_W) + 1, MON_H);
      });

      // Texto de mes (centrado en la franja de su mes)
      bandIdx = 0; prevM = -1;
      let mStart = 0;
      const drawMonthLabel = (monthIdx, startI, endI, bi) => {
        const bx  = rx(LW + startI * COL_W);
        const bw  = rx((endI - startI) * COL_W);
        C.fillStyle = bandTexts[bi % bandColors.length];
        C.font = `800 10px -apple-system,Arial`;
        C.textAlign = 'center';
        const label = MONTHS_ES_LONG[monthIdx].toUpperCase();
        C.fillText(label, bx + bw / 2, HEAD_H + MON_H - 5);
        C.textAlign = 'left';
      };
      calDays.forEach((d, i) => {
        if (d.getMonth() !== prevM) {
          if (prevM !== -1) drawMonthLabel(prevM, mStart, i, bandIdx++);
          prevM = d.getMonth(); mStart = i;
        }
        if (i === calDays.length - 1) drawMonthLabel(d.getMonth(), mStart, i + 1, bandIdx);
      });

      // ── Fondo fila DOW + número ──
      C.fillStyle = '#F7F8FA';
      C.fillRect(0, HEAD_H + MON_H, OUT_W, DOW_H + DNUM_H);

      // ── Columnas de día ──
      const DOW_LABEL = ['D','L','M','X','J','V','S'];
      calDays.forEach((d, i) => {
        const x   = rx(LW + i * COL_W);
        const mid = x + COL_W / 2;
        const wk  = isWeekend(d);
        const yDow = HEAD_H + MON_H + DOW_H * 0.75;
        const yNum = HEAD_H + MON_H + DOW_H + DNUM_H * 0.72;

        // Separador vertical
        C.strokeStyle = 'rgba(0,0,0,0.05)';
        C.lineWidth = 0.5;
        C.beginPath(); C.moveTo(x, HEAD_H + MON_H); C.lineTo(x, rowsTop + rowsH); C.stroke();

        // DOW
        C.fillStyle = wk ? 'rgba(242,61,79,0.65)' : '#AAAAAA';
        C.font = `700 9px -apple-system,Arial`;
        C.textAlign = 'center';
        C.fillText(DOW_LABEL[d.getDay()], mid, yDow);

        // Número del día
        C.fillStyle = wk ? '#F23D4F' : '#1A1A1A';
        C.font = `${d.getDate() === 1 ? '800' : '400'} 12px -apple-system,Arial`;
        C.fillText(String(d.getDate()), mid, yNum);
      });
      C.textAlign = 'left';

      // ── Línea separadora fila días ──
      C.strokeStyle = '#E0E0E0';
      C.lineWidth = 1;
      C.beginPath(); C.moveTo(0, rowsTop); C.lineTo(OUT_W, rowsTop); C.stroke();

      // ── Separador columna etiqueta ──
      C.strokeStyle = '#E0E0E0';
      C.lineWidth = 1;
      C.beginPath(); C.moveTo(LW, HEAD_H); C.lineTo(LW, rowsTop + rowsH); C.stroke();

      // ── Filas de fases ──
      phaseSpans.forEach((p, i) => {
        const rowY   = rowsTop + i * ROW_H;
        const isDim  = i > currentStep;
        const kColor = p.color || (KIND[p.kind] || KIND.obligatoria).color;

        C.globalAlpha = isDim ? 0.28 : 1;

        // Fondo alterno
        if (i % 2 === 1) { C.fillStyle = 'rgba(0,0,0,0.018)'; C.fillRect(0, rowY, OUT_W, ROW_H); }

        // Línea inferior
        C.strokeStyle = '#EFEFEF'; C.lineWidth = 0.5;
        C.beginPath(); C.moveTo(0, rowY + ROW_H); C.lineTo(OUT_W, rowY + ROW_H); C.stroke();

        // ── Etiqueta ──
        // Punto de color
        C.fillStyle = kColor;
        C.beginPath(); C.arc(PAD + 6, rowY + ROW_H / 2, 5, 0, Math.PI * 2); C.fill();

        // Nombre
        C.fillStyle = '#1A1A1A';
        C.font = `600 12px -apple-system,Arial`;
        const maxLW = LW - PAD * 2 - 14;
        let name = p.name;
        while (C.measureText(name).width > maxLW && name.length > 3) name = name.slice(0, -4) + '…';
        C.fillText(name, PAD + 16, rowY + ROW_H / 2 - 3);

        // SLA
        C.fillStyle = '#8A8A8A';
        C.font = `400 9px -apple-system,Arial`;
        C.fillText((p.sla || '').slice(0, 32), PAD + 16, rowY + ROW_H / 2 + 11);

        // ── Barra o hito ──
        if (p.duration === 0) {
          // Hito: rombo
          const cx = rx(LW + p.startCol * COL_W + COL_W / 2);
          const cy = rowY + ROW_H / 2;
          const hs = 9;
          C.fillStyle = kColor;
          C.beginPath(); C.moveTo(cx, cy - hs); C.lineTo(cx + hs, cy);
          C.lineTo(cx, cy + hs); C.lineTo(cx - hs, cy); C.closePath(); C.fill();
        } else {
          const bx  = rx(LW + p.startCol * COL_W) + 3;
          const bw  = Math.max(COL_W * 0.7, rx((p.endCol - p.startCol) * COL_W) - 6);
          const bh  = ROW_H * 0.52;
          const by  = rowY + (ROW_H - bh) / 2;
          const r   = 5;

          // Sombra
          C.shadowColor = 'rgba(0,0,0,0.18)';
          C.shadowBlur = 6; C.shadowOffsetY = 2;

          // Barra
          C.fillStyle = kColor;
          C.beginPath();
          if (C.roundRect) { C.roundRect(bx, by, bw, bh, r); } else { C.rect(bx, by, bw, bh); }
          C.fill();
          C.shadowBlur = 0; C.shadowOffsetY = 0;

          // Texto en barra
          if (bw > 36) {
            C.fillStyle = 'rgba(255,255,255,0.92)';
            C.font = `700 10px -apple-system,Arial`;
            C.textAlign = 'center';
            C.fillText(`${p.duration}d`, bx + bw / 2, by + bh / 2 + 4);
            C.textAlign = 'left';
          }
        }

        C.globalAlpha = 1;
      });

      // ── Línea de inicio (verde) ──
      C.strokeStyle = '#00A650'; C.lineWidth = 2;
      C.beginPath(); C.moveTo(LW, rowsTop); C.lineTo(LW, rowsTop + rowsH); C.stroke();

      // ── Línea de fin (roja) ──
      const endX = rx(LW + (totalCal - 1) * COL_W);
      C.strokeStyle = '#F23D4F'; C.lineWidth = 2.5;
      C.setLineDash([4, 3]);
      C.beginPath(); C.moveTo(endX, HEAD_H + 2); C.lineTo(endX, rowsTop + rowsH); C.stroke();
      C.setLineDash([]);

      // Etiqueta fecha fin
      const endLabel = `Fin · ${fmtShort(cropEnd)}`;
      C.font = `700 9px -apple-system,Arial`;
      const elw = C.measureText(endLabel).width + 10;
      C.fillStyle = '#F23D4F';
      if (C.roundRect) { C.beginPath(); C.roundRect(endX - elw - 2, HEAD_H + 4, elw, 15, 3); C.fill(); }
      else { C.fillRect(endX - elw - 2, HEAD_H + 4, elw, 15); }
      C.fillStyle = '#FFFFFF';
      C.textAlign = 'right';
      C.fillText(endLabel, endX - 6, HEAD_H + 14);
      C.textAlign = 'left';

      // ── Header oscuro ──
      C.fillStyle = '#15192F';
      C.fillRect(0, 0, OUT_W, HEAD_H);

      // Logo de Mercado Pago — esquina izquierda
      if (mpLogo) {
        const lh = 28;
        const lw = mpLogo.naturalWidth * (lh / mpLogo.naturalHeight);
        C.drawImage(mpLogo, 16, (HEAD_H - lh) / 2, lw, lh);
      }

      // Título
      C.fillStyle = '#FFFFFF';
      C.font = `700 18px -apple-system,Arial`;
      C.fillText('Cronograma de implementación', LW + 12, HEAD_H * 0.48);
      C.fillStyle = 'rgba(255,255,255,0.55)';
      C.font = `400 12px -apple-system,Arial`;
      C.fillText(DEFAULTS.sellerName, LW + 12, HEAD_H * 0.82);

      // Rango de fechas (derecha)
      const rangeStr = `${fmtShort(start)} → ${fmtShort(cropEnd)}`;
      C.fillStyle = '#FFE600';
      C.font = `700 13px -apple-system,Arial`;
      const rw = C.measureText(rangeStr).width;
      C.fillText(rangeStr, OUT_W - rw - 16, HEAD_H * 0.58);

      // ── Leyenda ──
      let lx = LW + 12;
      const legY = rowsTop + rowsH + 14;
      Object.entries(KIND).forEach(([, v]) => {
        C.fillStyle = v.color;
        if (C.roundRect) { C.beginPath(); C.roundRect(lx, legY, 10, 10, 2); C.fill(); }
        else { C.fillRect(lx, legY, 10, 10); }
        C.fillStyle = '#737373';
        C.font = `400 10px -apple-system,Arial`;
        C.fillText(v.label, lx + 14, legY + 9);
        lx += C.measureText(v.label).width + 34;
      });

      // ── Descargar ──
      const url = cv.toDataURL('image/png');
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `Gantt-${(DEFAULTS.sellerName || 'seller').replace(/\s+/g, '-')}.png`;
      a.click();
      setToast("PNG descargado · listo para Google Slides");
      setTimeout(() => setToast(null), 4000);
      return;
    } catch(e) {
      console.error(e);
      setToast("Error al generar el PNG — " + e.message);
      setTimeout(() => setToast(null), 3000);
    }
    // fallback: pptx si falla el canvas
    setToast("Generando .pptx…");
    try {
      await ensurePptx();

      let pad = 3;
      const lastDow = projectEnd.getDay();
      if (lastDow < 6) pad = 6 - lastDow + 1;
      const visEnd = addDays(projectEnd, pad);
      let visibleDays = dayDiff(start, visEnd) + 1;
      if (visibleDays < 14) visibleDays = 14;

      const useWeekCols = visibleDays > 64;
      const daysPerCol = useWeekCols ? 7 : 1;
      const colCount = Math.ceil(visibleDays / daysPerCol);

      // build visible day list + bands
      const visDays = [];
      for (let i = 0; i < visibleDays; i++) visDays.push(addDays(start, i));
      const visBands = [];
      let cur = null;
      visDays.forEach((d, i) => {
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (!cur || cur.k !== k) { cur = { k, start: i, end: i, date: d, idx: visBands.length }; visBands.push(cur); }
        else cur.end = i;
      });

      const pptx = new window.PptxGenJS();
      pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };

      // ── header ──
      slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.95, fill: { color: "15192F" }, line: { width: 0 } });
      slide.addText("Gantt de implementación", { x: 0.5, y: 0.18, w: 8, h: 0.42, fontSize: 22, bold: true, color: "FFFFFF", fontFace: "Arial" });
      slide.addText(DEFAULTS.sellerName, { x: 0.5, y: 0.55, w: 8, h: 0.32, fontSize: 13, color: "B8BAC4", fontFace: "Arial" });
      slide.addShape("rect", { x: 10.3, y: 0.18, w: 2.7, h: 0.62, fill: { color: "1F2547" }, line: { color: "2A3050", width: 0.5 }, rectRadius: 0.06 });
      slide.addText("DURACIÓN ESTIMADA", { x: 10.3, y: 0.2, w: 2.7, h: 0.2, fontSize: 8, bold: true, color: "8C8FA0", align: "center", fontFace: "Arial" });
      slide.addText(`${displayDuration} días hábiles`, { x: 10.3, y: 0.38, w: 2.7, h: 0.36, fontSize: 16, bold: true, color: "FFE600", align: "center", fontFace: "Arial" });

      // ── chart geometry ──
      const chartX = 0.5;
      const labelW = 3.2; // wider to fit name + description + SLA
      const chartY = 1.2;
      const headerH = 0.36;
      const dowH = 0.22;
      const dayNumH = 0.26;
      const totalHeadH = headerH + dowH + dayNumH;
      const rowsY = chartY + totalHeadH;
      const chartW = 13.33 - chartX - 0.5; // 12.33 in
      const daysAreaW = chartW - labelW;
      const colW = daysAreaW / colCount;
      const dayUnit = colW / daysPerCol;
      const rowH = Math.min(0.78, Math.max(0.62, (5.5 - totalHeadH) / phaseSpans.length));

      // ── month bands ──
      const bandColors = ["FFE600", "1F2547", "ECEDFC", "E5E5E5", "FFE600", "1F2547"];
      const bandTexts  = ["15192F", "FFFFFF", "434CE4", "1A1A1A", "15192F", "FFFFFF"];
      visBands.forEach((b, i) => {
        const bx = chartX + labelW + b.start * dayUnit;
        const bw = (b.end - b.start + 1) * dayUnit;
        slide.addShape("rect", { x: bx, y: chartY, w: bw, h: headerH, fill: { color: bandColors[i % bandColors.length] }, line: { width: 0 } });
        slide.addText(`${MONTHS_ES_LONG[b.date.getMonth()]} ${useWeekCols ? "" : b.date.getFullYear()}`, {
          x: bx, y: chartY, w: bw, h: headerH,
          fontSize: 11, bold: true, color: bandTexts[i % bandTexts.length],
          align: "center", valign: "middle", fontFace: "Arial",
        });
      });

      // ── weekend strips ──
      if (!useWeekCols) {
        visDays.forEach((d, i) => {
          if (isWeekend(d)) {
            slide.addShape("rect", {
              x: chartX + labelW + i * dayUnit, y: rowsY, w: dayUnit, h: rowH * phaseSpans.length,
              fill: { color: "F4F4F4" }, line: { width: 0 },
            });
          }
        });
      }

      // ── header rows ──
      if (!useWeekCols) {
        visDays.forEach((d, i) => {
          const x = chartX + labelW + i * dayUnit;
          const wk = isWeekend(d);
          const isStart = i === 0;
          // DOW
          slide.addText(DOW_ES[d.getDay()], {
            x, y: chartY + headerH, w: dayUnit, h: dowH,
            fontSize: 7, bold: true, color: wk ? "F23D4F" : "999999",
            align: "center", valign: "middle", fontFace: "Arial",
          });
          if (isStart) {
            slide.addShape("rect", {
              x, y: chartY + headerH + dowH, w: dayUnit, h: dayNumH,
              fill: { color: "E5F6EC" }, line: { width: 0 },
            });
          }
          slide.addText(String(d.getDate()), {
            x, y: chartY + headerH + dowH, w: dayUnit, h: dayNumH,
            fontSize: 8, bold: isStart,
            color: isStart ? "00873F" : wk ? "B3B3B3" : "1A1A1A",
            align: "center", valign: "middle", fontFace: "Arial",
          });
        });
      } else {
        // Week mode: "Sem N" + start date
        for (let i = 0; i < colCount; i++) {
          const x = chartX + labelW + i * colW;
          const wkStart = addDays(start, i * 7);
          slide.addText(`Sem ${i + 1}`, {
            x, y: chartY + headerH, w: colW, h: dowH,
            fontSize: 8, bold: true, color: "999999",
            align: "center", valign: "middle", fontFace: "Arial",
          });
          slide.addText(`${wkStart.getDate()} ${MONTHS_ES[wkStart.getMonth()]}`, {
            x, y: chartY + headerH + dowH, w: colW, h: dayNumH,
            fontSize: 9, color: "1A1A1A",
            align: "center", valign: "middle", fontFace: "Arial",
          });
        }
      }

      // ── start line ──
      slide.addShape("line", {
        x: chartX + labelW, y: rowsY, w: 0, h: rowH * phaseSpans.length,
        line: { color: "00A650", width: 1.5 },
      });

      // ── phases ──
      phaseSpans.forEach((p, i) => {
        const rowY = rowsY + i * rowH;
        if (i % 2 === 1) {
          slide.addShape("rect", {
            x: chartX, y: rowY, w: chartW, h: rowH,
            fill: { color: "FAFAFA" }, line: { width: 0 },
          });
        }
        // name (bold)
        slide.addText(p.name, {
          x: chartX + 0.05, y: rowY + 0.04, w: labelW - 0.15, h: 0.24,
          fontSize: 11, bold: true, color: "1A1A1A",
          align: "left", valign: "top", fontFace: "Arial",
        });
        // description (wraps)
        if (p.desc) {
          slide.addText(p.desc, {
            x: chartX + 0.05, y: rowY + 0.27, w: labelW - 0.15, h: 0.3,
            fontSize: 8.5, color: "4A4A4A",
            align: "left", valign: "top", fontFace: "Arial",
          });
        }
        // SLA (italic small)
        slide.addText(p.sla, {
          x: chartX + 0.05, y: rowY + rowH - 0.22, w: labelW - 0.15, h: 0.2,
          fontSize: 7.5, italic: true, color: "737373",
          align: "left", valign: "top", fontFace: "Arial",
        });
        slide.addShape("line", {
          x: chartX + labelW - 0.04, y: rowY, w: 0, h: rowH,
          line: { color: "E5E5E5", width: 0.5 },
        });

        const barColor = (p.color || KIND[p.kind].color).replace("#", "");
        const isMs = p.duration === 0;
        if (isMs) {
          const cx = chartX + labelW + p.startCol * dayUnit + dayUnit / 2 - 0.14;
          slide.addShape("ellipse", {
            x: cx, y: rowY + (rowH - 0.28) / 2, w: 0.28, h: 0.28,
            fill: { color: barColor }, line: { width: 0 },
          });
        } else {
          const bx = chartX + labelW + p.startCol * dayUnit + 0.03;
          const bw = Math.max(dayUnit * 0.6, (p.endCol - p.startCol) * dayUnit - 0.06);
          slide.addShape("roundRect", {
            x: bx, y: rowY + (rowH - 0.36) / 2, w: bw, h: 0.36,
            fill: { color: barColor }, line: { width: 0 }, rectRadius: 0.05,
          });
          if (bw > 0.5) {
            slide.addText(`${p.duration} ${p.duration === 1 ? "día" : "días"}`, {
              x: bx, y: rowY + (rowH - 0.36) / 2, w: bw, h: 0.36,
              fontSize: 9, bold: true, color: "FFFFFF",
              align: "center", valign: "middle", fontFace: "Arial",
            });
          }
        }
      });

      // ── legend ──
      const legendY = rowsY + rowH * phaseSpans.length + 0.18;
      let lx = chartX;
      Object.entries(KIND).forEach(([k, v]) => {
        slide.addShape("rect", {
          x: lx, y: legendY + 0.04, w: 0.16, h: 0.16,
          fill: { color: v.color.replace("#", "") }, line: { width: 0 }, rectRadius: 0.02,
        });
        slide.addText(v.label, {
          x: lx + 0.22, y: legendY, w: 1.6, h: 0.24,
          fontSize: 9, color: "666666", valign: "middle", fontFace: "Arial",
        });
        lx += 1.85;
      });
      slide.addText(
        `${location === "metro" ? "CDMX / GDL / MTY" : "Resto del país"}  ·  ${fmtShort(start)} → ${fmtShort(projectEnd)}${useWeekCols ? "  ·  columnas semanales" : ""}`,
        { x: 8.5, y: legendY, w: 4.5, h: 0.24, fontSize: 9, color: "666666", align: "right", valign: "middle", fontFace: "Arial" }
      );

      await pptx.writeFile({ fileName: `Gantt-${(DEFAULTS.sellerName || "seller").replace(/\s+/g, "-")}.pptx` });
      setToast("Listo · Sube a Google Drive y ábrelo como Google Slides");
      setTimeout(() => setToast(null), 4500);
    } catch (e) {
      console.error(e);
      setToast("Error al generar el .pptx");
      setTimeout(() => setToast(null), 2500);
    }
  };

  // ─── share: open read-only in new tab ─────────────────────────────────
  const buildShareUrl = () => {
    const payload = { startISO, location, phases, durationOverride, sellerName: DEFAULTS.sellerName };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    return window.location.origin + window.location.pathname + "#share=" + b64;
  };
  const onShare = () => {
    const url = buildShareUrl();
    window.open(url, "_blank");
    setShareUrl(url);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2200);
      }).catch(() => {});
    }
  };
  const copyShareUrl = () => {
    if (!shareUrl || !navigator.clipboard) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };
  const dismissShare = () => setShareUrl(null);

  const gridWidth = TOTAL_DAYS * DAY_PX;
  const headerGridCols = `${LABEL_W}px repeat(${TOTAL_DAYS}, ${DAY_PX}px)`;

  return (
    <div className="gantt-modal" role="dialog" aria-label="Cronograma de despliegue">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div className="gx-head">
        {/* Logos: MP icon + seller logo, mismo tamaño, side-by-side */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
          {/* MP logo — tamaño icono */}
          <div style={{ width:48, height:48, borderRadius:10, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff' }}>
            <img src="/mp-logo.png" style={{ width:'100%', height:'100%', objectFit:'contain', padding:'4px' }} alt="Mercado Pago" />
          </div>
          {/* Seller logo — renderizado directo para soportar SVG, centrado y contenido */}
          <div style={{ width:48, height:48, borderRadius:10, overflow:'hidden', flexShrink:0, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.15)' }}>
            {(window.GANTT_INIT && window.GANTT_INIT.sellerLogo) ? (
              <img
                src={window.GANTT_INIT.sellerLogo}
                style={{ width:'100%', height:'100%', objectFit:'contain', padding:'4px' }}
                alt="Seller"
              />
            ) : (
              <span style={{ fontSize:9, color:'rgba(0,0,0,0.35)', fontWeight:700, letterSpacing:'0.06em', textAlign:'center', textTransform:'uppercase', lineHeight:1.3, padding:'4px' }}>Logo</span>
            )}
          </div>
        </div>
        <div>
          <div className="gx-title">Gantt de implementación</div>
          <div className="gx-sub">{DEFAULTS.sellerName}</div>
        </div>
        <div className="gx-spacer"></div>
        <div className="gx-duration">
          <div className="gx-dur-label">Duración estimada</div>
          <div className="gx-dur-row">
            <input
              className="gx-dur-value"
              type="number" min="1" max="120"
              value={displayDuration}
              onChange={(e) => setDurationOverride(Math.max(1, +e.target.value || 1))}
              readOnly={readOnly}
            />
            <span className="gx-dur-unit">días hábiles</span>
            {!readOnly && <span className="gx-dur-edit">{I.edit}</span>}
          </div>
          <div className="gx-dur-meta">{fmtShort(start)} → {fmtShort(projectEnd)}</div>
        </div>
        {readOnly ? (
          <div className="gx-readonly-badge" title="Vista de sólo lectura"><span>🔒</span> Sólo lectura</div>
        ) : (
          <button className="gx-close" aria-label="Cerrar">{I.close}</button>
        )}
      </div>

      {/* ─── STEPPER DE FASES ─────────────────────────────────────────── */}
      <div className="gx-stepper">
        {phases.map((p, i) => {
          const isDone   = i < currentStep;
          const isActive = i === currentStep;
          const isFuture = i > currentStep;
          const col = (KIND[p.kind] || KIND.obligatoria).color;
          return (
            <React.Fragment key={p.id}>
              {i > 0 && (
                <div className="gx-step-line" style={{ background: isDone || isActive ? col : '#E5E5E5' }} />
              )}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div
                  className={`gx-step-dot ${isDone ? 'done' : isActive ? 'active' : 'future'}`}
                  style={{ '--step-color': col }}
                  title={p.name}
                  onClick={() => !isFuture && setCurrentStep(i)}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <div className="gx-step-label" style={{ color: isFuture ? '#BDBDBD' : col }}>
                  {p.name.split(' ').slice(0, 2).join(' ')}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {/* botón avanzar — solo un paso */}
        <button
          className="gx-stepper-btn"
          onClick={() => setCurrentStep(s => Math.min(s + 1, phases.length - 1))}
          disabled={currentStep >= phases.length - 1}
        >
          Siguiente →
        </button>
      </div>

      {/* ─── BODY ───────────────────────────────────────────────────── */}
      <div className={`gx-body ${readOnly ? "ro" : ""}`}>
        {!readOnly && (
        <div className="gx-left">
          <div className="gx-left-head">
            <div className="gx-overline">Configuración</div>
            <div className="gx-label">Fecha de inicio</div>
            <input className="gx-input" type="date" value={startISO}
                   onChange={(e) => setStartISO(e.target.value)} />
            <div className="gx-label">Fecha de fin <span style={{ fontSize:10, color:'#F23D4F', fontWeight:400 }}>(límite del proyecto)</span></div>
            <input className="gx-input" type="date"
                   value={endISO || ''}
                   min={startISO}
                   onChange={(e) => e.target.value && setEndISO(e.target.value)} />
            <div className="gx-label">Ubicación del seller</div>
            <div className="gx-toggle">
              <button className={location === "metro" ? "active" : ""} onClick={() => onLocationChange("metro")}>
                CDMX / MTY / GDL
              </button>
              <button className={location === "resto" ? "active" : ""} onClick={() => onLocationChange("resto")}>
                Resto del país
              </button>
            </div>
          </div>

          <div className="gx-phases-head">
            <div></div>
            <div>Actividad</div>
            <div>Descripción</div>
            <div className="col-dur">Días</div>
            <div></div>
            <div></div>
          </div>

          <div className="gx-phases">
            {phases.map(p => (
              <PhaseRow
                key={p.id}
                phase={p}
                onChange={updatePhase}
                onDelete={deletePhase}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                draggingId={dragRef.current.id}
                dropOverId={dragRef.current.over}
              />
            ))}
            <button className="gx-add-row" onClick={addPhase}>
              {I.plus} Agregar fase
            </button>
          </div>

          <div className="gx-left-foot">
            <button className="gx-download" onClick={onDownload}>
              {I.download} Descargar PNG
            </button>
          </div>
        </div>
        )}

        {/* RIGHT */}
        <div className="gx-right">
          <div className="gx-right-head">
            <div className="gx-right-title">Calendario · 2 meses</div>
            <div className="gx-right-meta">
              {fmtShort(start)} — {fmtShort(projectEnd)} · {displayDuration} días hábiles
              {durationOverride !== null && computedDuration !== durationOverride &&
                <span style={{marginLeft:8, color:"#999999"}}>(calculado: {computedDuration})</span>}
            </div>
          </div>

          <div className="gx-chart">
            <div className="gx-grid" style={{ minWidth: LABEL_W + gridWidth }}>
              {/* ─── MULTI-ROW HEADER ────────────────────────────── */}
              <div className="gx-header-stack">
                {/* Row 1: month name cintilla (clickable to focus a single month) */}
                <div className="gx-h-row gx-h-mes" style={{ gridTemplateColumns: headerGridCols }}>
                  <div className="gx-header-side" style={{paddingBottom: 4}}></div>
                  {monthBands.map((b, i) => {
                    const isFocused = focusedMonth === b.monthIdx;
                    return (
                      <button key={i}
                           className={`mes-band ${i % 2 === 1 ? "alt" : ""} ${isFocused ? "focused" : ""}`}
                           onClick={() => setFocusedMonth(isFocused ? null : b.monthIdx)}
                           title={isFocused ? "Click para mostrar los 2 meses" : "Click para ver sólo este mes"}
                           style={{ gridColumn: `${b.start + 2} / ${b.end + 3}` }}>
                        {MONTHS_ES_LONG[b.date.getMonth()]} {b.date.getFullYear()}
                        {isFocused && <span className="focus-tick">✕</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Row 3: Day of week */}
                <div className="gx-h-row" style={{ gridTemplateColumns: headerGridCols }}>
                  <div className="gx-header-side gx-h-dow" style={{border:0, justifyContent:"flex-start"}}></div>
                  {chartDays.map((d, i) => (
                    <div key={i} className={`gx-h-dow ${isWeekend(d) ? "we" : ""}`}>
                      {DOW_ES[d.getDay()]}
                    </div>
                  ))}
                </div>

                {/* Row 4: Day number */}
                <div className="gx-h-row" style={{ gridTemplateColumns: headerGridCols }}>
                  <div className="gx-header-side" style={{borderBottom:"1px solid #E5E5E5", padding: "0 12px 6px"}}>SLA</div>
                  {chartDays.map((d, i) => {
                    const isMonthStart = d.getDate() === 1;
                    const isStartDay = i === 0;
                    const isToday = todayCol === i && !isStartDay;
                    const cls = [
                      "gx-h-day",
                      isWeekend(d) ? "we" : "",
                      isMonthStart ? "month-start" : "",
                      isStartDay ? "gx-h-start" : "",
                      isToday ? "gx-h-today" : "",
                    ].filter(Boolean).join(" ");
                    return <div key={i} className={cls}>{d.getDate()}</div>;
                  })}
                </div>
              </div>

              {/* ─── ROWS ──────────────────────────────────────── */}
              <div className="gx-rows">
                {phaseSpans.map((p, rowIdx) => {
                  const k = KIND[p.kind];
                  const barColor = p.color || k.color;
                  const isMilestone = p.duration === 0;
                  const left = p.startCol * DAY_PX + 4;
                  const width = isMilestone ? 30 : Math.max(DAY_PX, (p.endCol - p.startCol) * DAY_PX) - 8;
                  const dimmed = rowIdx > currentStep;
                  return (
                    <div key={p.id} className="gx-row"
                         style={{ gridTemplateColumns: `${LABEL_W}px ${gridWidth}px`, opacity: dimmed ? 0.3 : 1, transition: 'opacity 300ms' }}>
                      <div className="gx-row-label">
                        <div className="gx-row-name" title={p.name}>{p.name}</div>
                        <div className="gx-row-sla" title={p.sla}>{p.sla}</div>
                      </div>
                      <div className="gx-row-bg">
                        {/* day separator lines */}
                        {chartDays.map((d, i) => (
                          <div key={i} className="gx-day-line" style={{ left: i * DAY_PX }} />
                        ))}
                        {/* weekend strips */}
                        {weekendCols.map(i => (
                          <div key={`w${i}`} className="gx-weekend-strip"
                               style={{ left: i * DAY_PX, width: DAY_PX }} />
                        ))}
                        {/* month dividers */}
                        {monthBoundaries.map((idx, i) => (
                          <div key={`m${i}`} className="gx-month-divider" style={{ left: idx * DAY_PX }} />
                        ))}
                        {/* start line at col 0 (green) */}
                        {rowIdx === 0 && (
                          <div className="gx-start-line" style={{ left: 0 }} />
                        )}
                        {/* today line (red) — only if not at col 0 */}
                        {todayCol !== null && todayCol !== 0 && rowIdx === 0 && (
                          <div className="gx-today-line" style={{ left: todayCol * DAY_PX }} />
                        )}
                        {/* bar */}
                        <div
                          className={`gx-bar ${isMilestone ? "milestone" : ""}`}
                          style={{
                            left, width,
                            background: barColor,
                            color: k.fg,
                            cursor: readOnly ? "default" : "grab",
                          }}
                          onMouseDown={(e) => { if (!readOnly) onBarMouseDown(e, p.id, "move"); }}
                          onMouseEnter={(e) => {
                            setHoverPhaseId(p.id);
                            const r = e.currentTarget.getBoundingClientRect();
                            const parent = e.currentTarget.closest(".gx-chart").getBoundingClientRect();
                            setTip({
                              x: r.left - parent.left + 12,
                              y: r.top - parent.top - 8,
                              phase: p,
                            });
                          }}
                          onMouseLeave={() => { setTip(null); setHoverPhaseId(null); }}
                        >
                          {isMilestone && <span className="dot"></span>}
                          {!isMilestone && !readOnly && (
                            <div className="resize"
                                 onMouseDown={(e) => { e.stopPropagation(); onBarMouseDown(e, p.id, "resize"); }} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* línea de fecha de fin — si está configurada */}
                {endCol !== null && endCol > 0 && endCol < TOTAL_DAYS && (
                  <div className="gx-end-line" style={{ left: LABEL_W + endCol * DAY_PX, top: 0, bottom: 0, position: "absolute" }}>
                    <div className="gx-end-label">
                      Fin · {endOverride.getDate()} {MONTHS_ES[endOverride.getMonth()]}
                    </div>
                  </div>
                )}

                {/* phase end-guides — vertical dash only to its own row */}
                <div className="gx-rows-overlay" style={{ left: LABEL_W, width: gridWidth, top: 0, bottom: 0, position: "absolute" }}>
                  {phaseSpans.map((p, idx) => {
                    if (p.duration === 0) return null;
                    const isHover = hoverPhaseId === p.id;
                    const endX = p.endCol * DAY_PX - 4;
                    const height = (idx + 1) * 56; // each row is 56px tall
                    return (
                      <div key={`g-${p.id}`}
                           className={`gx-guide end ${isHover ? "hover" : ""}`}
                           style={{ left: endX, top: 0, height, bottom: "auto" }}>
                        {isHover && (
                          <div className="gx-guide-label" style={{ top: -2 }}>
                            fin · {p.endDate.getDate()} {MONTHS_ES[p.endDate.getMonth()]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {tip && (
                  <div className="gx-tip" style={{ left: tip.x, top: tip.y }}>
                    <div className="tip-title">{tip.phase.name}</div>
                    <div className="tip-meta">{tip.phase.sla}</div>
                    <div className="tip-desc">{tip.phase.desc}</div>
                    <div className="tip-days">
                      {tip.phase.duration === 0
                        ? `Hito · ${fmtShort(tip.phase.startDate)}`
                        : `${fmtShort(tip.phase.startDate)} → ${fmtShort(tip.phase.endDate)} · ${tip.phase.duration} días hábiles`}
                    </div>
                  </div>
                )}
              </div>

              {/* focus mask — dims the non-focused month */}
              {focusedMonth !== null && monthBands.map((b, i) => {
                if (i === focusedMonth) return null;
                return (
                  <div key={`fm-${i}`} className="gx-focus-mask" style={{
                    left: LABEL_W + b.start * DAY_PX,
                    width: (b.end - b.start + 1) * DAY_PX,
                  }} />
                );
              })}
            </div>
          </div>

          <div className="gx-legend">
            {Object.entries(KIND).map(([k, v]) => (
              <span key={k} className="gx-leg-item">
                <span className="gx-leg-dot" style={{ background: v.color }}></span>
                {v.label}
              </span>
            ))}
            <span style={{flex:1}}></span>
            <span style={{fontSize:10.5, color:"#999999"}}>Arrastra cualquier barra para reagendar · borde derecho ajusta duración</span>
          </div>
        </div>
      </div>


      {toast && (
        <div className="gx-toast">
          <span style={{
            display:"inline-block", width:14, height:14, border:"2px solid rgba(255,230,0,0.3)",
            borderTopColor:"#FFE600", borderRadius:"50%", animation:"gxSpin 800ms linear infinite"
          }}></span>
          {toast}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
