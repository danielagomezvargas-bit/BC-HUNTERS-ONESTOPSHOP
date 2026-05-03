"use client";
import { useRef, useCallback } from "react";
import type { Productos, ProvData, ProvCounts, ComOTRow, ComMSIRow } from "@/types";
import type { SecKey } from "@/types";
import { COLORS as C } from "@/data/constants";
import { fmx, dxStr, dxPct, dxCls, avg } from "@/utils/format";
import NavButtons from "@/components/ui/NavButtons";

interface Props {
  productos: Productos;
  provData: ProvData;
  provCounts: ProvCounts;
  comPT_OT: ComOTRow[]; comPT_MSI: ComMSIRow[];
  comOP_OT: ComOTRow[]; comOP_MSI: ComMSIRow[];
  updateComOT:  (sec: SecKey, idx: number, field: "cu"|"mp",  val: number) => void;
  updateComMSI: (sec: SecKey, idx: number, field: "sb"|"sm",  val: number) => void;
  tcActual: (sec: SecKey) => number;
  tcMP:     (sec: SecKey) => number;
  sharePT: { tpv: number };
  shareOP: { tpv: number };
  onNext: () => void;
  onBack: () => void;
}

// ── helpers ───────────────────────────────────────────────────
function getProvName(sec: SecKey, provData: ProvData, provCounts: ProvCounts) {
  const n = provCounts[sec];
  const names = Array.from({ length: n }, (_, i) => provData[`${sec}_${i}`]?.bank).filter(Boolean);
  return names.join(" · ") || "—";
}

function dxAvg(rows: { ca: number; cm: number }[]) {
  const v = rows.filter(r => r.ca > 0);
  return v.length ? v.reduce((s, r) => s + (r.ca - r.cm) / r.ca * 100, 0) / v.length : 0;
}

// ── Rate input ────────────────────────────────────────────────
function RateInp({ value, kind, onChange }: {
  value: number; kind: "cu"|"mp"|"sb"|"sm"; onChange: (v: number) => void;
}) {
  const isCu = kind === "cu" || kind === "sb";
  return (
    <div style={{
      display:"inline-flex", alignItems:"center",
      border:`1px solid ${isCu ? "#F0C070" : "#B3DDEF"}`,
      borderRadius:5, height:27, float:"right",
      background: isCu ? C.la : C.lb,
    }}>
      <input
        type="number" step="0.01"
        defaultValue={value.toFixed(2)}
        onBlur={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width:46, border:"none", background:"transparent", padding:"0 3px", fontSize:11, outline:"none", textAlign:"center", color:C.text }}
      />
      <span style={{ fontSize:10, color:C.muted, paddingRight:5 }}>%</span>
    </div>
  );
}

// ── Resumen Excel-style ───────────────────────────────────────
function ResumenBlock({ sec, prov, otDf, msDf, otAvg, msAvg, prod }: {
  sec: SecKey; prov: string; otDf: number; msDf: number;
  otAvg: number; msAvg: number; prod: string;
}) {
  const tot = otDf + msDf;
  const totAvg = (otAvg + msAvg) / 2;
  const sc = (d: number) => d >= 0 ? "pos" : "neg";
  const sign = (d: number) => d >= 0 ? "▼" : "▲";

  const thBase: React.CSSProperties = {
    padding:"0 8px", fontSize:9, fontWeight:700,
    textTransform:"uppercase", letterSpacing:".07em",
    textAlign:"center", verticalAlign:"middle", height:26,
  };
  const tdLbl: React.CSSProperties = {
    padding:"0 12px", fontSize:12, color:C.text,
    verticalAlign:"middle", textAlign:"left",
    background:"#fff", borderBottom:`1px solid #F0F0F0`,
  };
  const tdVal = (d: number, highlight = false): React.CSSProperties => ({
    padding:"0 12px", fontSize:13, fontWeight:700,
    textAlign:"right", verticalAlign:"middle",
    color: d >= 0 ? C.green : C.red,
    background: highlight ? (d >= 0 ? "#D6EDD9" : "#FAD7D7") : "#fff",
    borderBottom:`1px solid #F0F0F0`,
  });
  const tdDx = (d: number, highlight = false): React.CSSProperties => ({
    padding:"0 12px", fontSize:12, fontWeight:700,
    textAlign:"right", verticalAlign:"middle",
    color: d >= 0 ? "#1A6B2A" : C.red,
    background: highlight ? (d >= 0 ? "#D6EDD9" : "#FAD7D7") : "#fff",
    borderBottom:`1px solid #F0F0F0`,
  });

  return (
    <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed", borderBottom:`2px solid ${C.border}` }}>
      <colgroup>
        <col style={{ width:170 }}/><col/>
        <col style={{ width:120 }}/><col style={{ width:14 }}/><col style={{ width:120 }}/>
        <col style={{ width:14 }}/><col style={{ width:80 }}/>
      </colgroup>
      <thead>
        <tr>
          <th style={{ ...thBase, background:"#F7F8FA", borderBottom:`1px solid ${C.border}` }} colSpan={2}/>
          <th style={{ ...thBase, background:C.navy, color:"#fff" }}>Mensual</th>
          <th style={{ ...thBase, background:"#F7F8FA", borderBottom:`1px solid ${C.border}` }}/>
          <th style={{ ...thBase, background:"#3A5A72", color:"#fff" }}>Anual</th>
          <th style={{ ...thBase, background:"#F7F8FA", borderBottom:`1px solid ${C.border}` }}/>
          <th style={{ ...thBase, background:"#3A7D44", color:"#fff" }}>Δ</th>
        </tr>
      </thead>
      <tbody>
        {/* Row 1 — One-time */}
        <tr>
          <td rowSpan={2} style={{ background:"#4A5568", color:"#fff", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", padding:"0 12px", verticalAlign:"middle", borderBottom:`1px solid #5A6578` }}>
            MP vs. {prov}
          </td>
          <td style={tdLbl}>{otDf >= 0 ? "Ahorro" : "Inversión"} One-time</td>
          <td style={tdVal(otDf)}>{fmx(Math.abs(otDf))}</td>
          <td style={{ background:"#F4F6FA", borderBottom:`1px solid #F0F0F0` }}/>
          <td style={tdVal(otDf)}>{fmx(Math.abs(otDf * 12))}</td>
          <td style={{ background:"#F4F6FA", borderBottom:`1px solid #F0F0F0` }}/>
          <td style={tdDx(otAvg)}>{Math.abs(otAvg).toFixed(1)}%</td>
        </tr>
        {/* Row 2 — MSI */}
        <tr>
          <td style={tdLbl}>{msDf >= 0 ? "Ahorro" : "Inversión"} MSI</td>
          <td style={tdVal(msDf)}>{fmx(Math.abs(msDf))}</td>
          <td style={{ background:"#F4F6FA", borderBottom:`1px solid #F0F0F0` }}/>
          <td style={tdVal(msDf)}>{fmx(Math.abs(msDf * 12))}</td>
          <td style={{ background:"#F4F6FA", borderBottom:`1px solid #F0F0F0` }}/>
          <td style={tdDx(msAvg)}>{Math.abs(msAvg).toFixed(1)}%</td>
        </tr>
        {/* Subtotal */}
        <tr style={{ borderTop:"2px solid #555", borderBottom:"2px solid #555" }}>
          <td style={{ background:"#3A4455", color:"#fff", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", padding:"0 12px", verticalAlign:"middle" }}>
            Subtotal
          </td>
          <td style={{ ...tdLbl, fontWeight:700 }}>Subtotal {prod}</td>
          <td style={{ ...tdVal(tot, true), fontWeight:700 }}>
            {sign(tot)} {fmx(Math.abs(tot))}
          </td>
          <td style={{ background:"#F4F6FA" }}/>
          <td style={{ ...tdVal(tot, true), fontWeight:700 }}>
            {sign(tot)} {fmx(Math.abs(tot * 12))}
          </td>
          <td style={{ background:"#F4F6FA" }}/>
          <td style={{ ...tdDx(totAvg, true), fontWeight:700 }}>
            {sign(totAvg)} {Math.abs(totAvg).toFixed(1)}%
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ── Scroll indicator ──────────────────────────────────────────
function ScrollHint({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement> }) {
  const thumbRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = scrollRef.current;
    const th = thumbRef.current;
    if (!el || !th) return;
    const mx = el.scrollWidth - el.clientWidth;
    if (!mx) return;
    const p = el.scrollLeft / mx;
    const tw = el.clientWidth * 0.32;
    th.style.width = tw + "px";
    th.style.left = (p * (el.clientWidth - tw)) + "px";
  }

  if (typeof window !== "undefined") {
    scrollRef.current?.addEventListener("scroll", onScroll);
  }

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", background:"#F7F8FA", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
      <span style={{ fontSize:10, fontWeight:700, color:C.amber }}>💳 Contado</span>
      <div style={{ flex:1, height:4, background:"#E0E0E0", borderRadius:2, position:"relative", overflow:"hidden" }}>
        <div ref={thumbRef} style={{ height:"100%", width:"32%", background:C.blue, borderRadius:2, position:"absolute", left:0, transition:"left .08s" }}/>
      </div>
      <span style={{ fontSize:10, fontWeight:700, color:C.blue }}>📅 MSI</span>
      <span style={{ fontSize:10, color:C.muted, marginLeft:4 }}>← desliza →</span>
    </div>
  );
}

// ── OT table ──────────────────────────────────────────────────
function OTTable({ sec, rows, tpv, onUpdate }: {
  sec: SecKey; rows: ComOTRow[]; tpv: number;
  onUpdate: (idx: number, field: "cu"|"mp", val: number) => void;
}) {
  const thS = (color?: string, bg?: string): React.CSSProperties => ({
    padding:"0 11px", fontSize:9, fontWeight:700, textTransform:"uppercase",
    letterSpacing:".06em", verticalAlign:"middle", textAlign:"right",
    whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`,
    color: color || C.muted, background: bg || "#FAFAFA",
  });

  let totCa = 0, totCm = 0;
  const rowData = rows.map(r => {
    const vol = tpv * r.sh;
    const ca = vol * r.cu / 100;
    const cm = vol * r.mp / 100;
    totCa += ca; totCm += cm;
    return { ...r, ca, cm, df: ca - cm };
  });
  const totDf = totCa - totCm;
  const totAvgVal = dxAvg(rowData.map(r => ({ ca: r.ca, cm: r.cm })));
  const invCls = totDf >= 0 ? "save" : "invest";
  const invLbl = totDf >= 0 ? "Ahorro" : "Inversión";

  return (
    <div style={{ flex:"0 0 auto" }}>
      <div style={{ padding:"8px 14px", background:"#FFF8F0", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>💳 Pagos de contado</span>
        <span style={{ fontSize:10, color:C.muted }}>Tasa actual vs Mercado Pago</span>
      </div>
      <table style={{ width:640, borderCollapse:"collapse", tableLayout:"fixed" }}>
        <colgroup><col style={{ width:140 }}/><col style={{ width:100 }}/><col style={{ width:100 }}/><col style={{ width:110 }}/><col style={{ width:110 }}/><col style={{ width:90 }}/><col style={{ width:90 }}/></colgroup>
        <thead>
          <tr style={{ height:32, background:"#FAFAFA", borderBottom:`1px solid #EBEBEB` }}>
            <th style={{ ...thS(), textAlign:"left" }}>Tipo de pago</th>
            <th style={thS(C.amber, "#FFFBF5")}>Tasa actual</th>
            <th style={thS(C.blue, C.lb)}>Tasa MP</th>
            <th style={thS(C.amber, "#FFFBF5")}>Comisión actual $</th>
            <th style={thS(C.blue, C.lb)}>Comisión MP $</th>
            <th style={thS("#fff", "#5B6370")}>Diferencia $</th>
            <th style={thS("#fff", "#3A7D44")}>Delta %</th>
          </tr>
        </thead>
        <tbody>
          {rowData.map((r, i) => (
            <tr key={i} style={{ height:42, borderBottom:`1px solid #F2F2F2` }}>
              <td style={{ padding:"0 11px", fontSize:13, fontWeight:500, color:C.text }}>{r.l}</td>
              <td style={{ padding:"0 11px", background:"#FFFBF5" }}>
                <RateInp value={r.cu} kind="cu" onChange={v => onUpdate(i, "cu", v)} />
              </td>
              <td style={{ padding:"0 11px", background:C.lb }}>
                <RateInp value={r.mp} kind="mp" onChange={v => onUpdate(i, "mp", v)} />
              </td>
              <td style={{ padding:"0 11px", fontSize:11, color:C.muted, textAlign:"right", background:"#FFFBF5" }}>{fmx(r.ca)}</td>
              <td style={{ padding:"0 11px", fontSize:11, color:C.blue,  textAlign:"right", background:C.lb }}>{fmx(r.cm)}</td>
              <td style={{ padding:"0 11px", fontSize:11, color:C.muted, textAlign:"right" }}>{dxStr(r.df)}</td>
              <td style={{ padding:"0 11px", fontSize:12, textAlign:"right", color: r.df > 0 ? C.green : r.df < 0 ? C.red : C.muted }}>
                {dxPct(r.ca, r.cm)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ height:40, background:"#EEF0F6", borderTop:`2px solid ${C.border}` }}>
            <td style={{ padding:"0 11px", fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".05em" }}>Total comisiones</td>
            <td/><td/>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#FFFBF5", color:C.amber }}>{fmx(totCa)}</td>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#EEF6FD", color:C.blue }}>{fmx(totCm)}</td>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#EAECF0", color: totDf > 0 ? C.green : C.red }}>{dxStr(totDf)}</td>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#D6EDD9", color:"#1A6B2A" }}>
              {totAvgVal > 0 ? "▼ " : "▲ "}{Math.abs(totAvgVal).toFixed(1)}%
            </td>
          </tr>
          <tr style={{ height:36, background:"#EEF0F6" }}>
            <td style={{ padding:"0 11px", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".05em" }}>{invLbl} One-time</td>
            <td/><td/><td/><td/><td/>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background: totDf >= 0 ? "#D6EDD9" : "#FAD7D7", color: totDf >= 0 ? "#1A6B2A" : C.red, borderRadius:4 }}>
              {totDf >= 0 ? "▼ " : "▲ "}{fmx(Math.abs(totDf))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── MSI table ─────────────────────────────────────────────────
function MSITable({ sec, rows, tpv, tcA, tcM, onUpdate }: {
  sec: SecKey; rows: ComMSIRow[]; tpv: number;
  tcA: number; tcM: number;
  onUpdate: (idx: number, field: "sb"|"sm", val: number) => void;
}) {
  const thS = (color?: string, bg?: string): React.CSSProperties => ({
    padding:"0 11px", fontSize:9, fontWeight:700, textTransform:"uppercase",
    letterSpacing:".06em", verticalAlign:"middle", textAlign:"right",
    whiteSpace:"nowrap", borderBottom:`1px solid ${C.border}`,
    color: color || C.muted, background: bg || "#FAFAFA",
  });

  let totCa = 0, totCm = 0;
  const rowData = rows.map(r => {
    const vol = tpv * r.sh;
    const cu  = tcA + r.sb;
    const mp  = tcM + r.sm;
    const ca  = vol * cu / 100;
    const cm  = vol * mp / 100;
    totCa += ca; totCm += cm;
    return { ...r, cu, mp, ca, cm, df: ca - cm };
  });
  const totDf = totCa - totCm;
  const totAvgVal = dxAvg(rowData.map(r => ({ ca: r.ca, cm: r.cm })));
  const invLbl = totDf >= 0 ? "Ahorro" : "Inversión";

  return (
    <div style={{ flex:"0 0 auto" }}>
      <div style={{ padding:"8px 14px", background:C.lb, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>📅 Meses sin intereses</span>
        <span style={{ fontSize:10, color:C.muted }}>Tasa base = T. Crédito (live) + Sobretasa editable</span>
      </div>
      <table style={{ width:860, borderCollapse:"collapse", tableLayout:"fixed" }}>
        <colgroup>
          <col style={{ width:80 }}/><col style={{ width:65 }}/><col style={{ width:96 }}/><col style={{ width:96 }}/>
          <col style={{ width:96 }}/><col style={{ width:96 }}/><col style={{ width:105 }}/><col style={{ width:105 }}/>
          <col style={{ width:90 }}/><col style={{ width:85 }}/>
        </colgroup>
        <thead>
          <tr style={{ height:32, background:"#FAFAFA", borderBottom:`1px solid #EBEBEB` }}>
            <th style={{ ...thS(), textAlign:"left" }}>Plazo</th>
            <th style={thS()}>Share</th>
            <th style={thS(C.amber, "#FFFBF5")}>Tasa base act.</th>
            <th style={thS("#9A5500", "#FFF5E6")}>Sobretasa act.</th>
            <th style={thS(C.blue, C.lb)}>Tasa base MP</th>
            <th style={thS("#0066AA", "#EDF6FC")}>Sobretasa MP</th>
            <th style={thS(C.amber, "#FFFBF5")}>Comisión actual $</th>
            <th style={thS(C.blue, C.lb)}>Comisión MP $</th>
            <th style={thS("#fff", "#5B6370")}>Diferencia $</th>
            <th style={thS("#fff", "#3A7D44")}>Delta %</th>
          </tr>
        </thead>
        <tbody>
          {rowData.map((r, i) => (
            <tr key={i} style={{ height:42, borderBottom:`1px solid #F2F2F2` }}>
              <td style={{ padding:"0 11px", fontSize:13, fontWeight:600, color:C.text, textAlign:"left" }}>{r.l}</td>
              <td style={{ padding:"0 11px", fontSize:11, color:C.muted, textAlign:"right" }}>{(r.sh*100).toFixed(0)}%</td>
              {/* Tasa base actual — NOT editable, live from TC */}
              <td style={{ padding:"0 11px", fontSize:12, color:C.amber, textAlign:"right", background:"#FFFBF5" }}>{tcA.toFixed(2)}%</td>
              <td style={{ padding:"0 11px", background:"#FFF5E6" }}>
                <RateInp value={r.sb} kind="sb" onChange={v => onUpdate(i, "sb", v)} />
              </td>
              {/* Tasa base MP — NOT editable, live from TC MP */}
              <td style={{ padding:"0 11px", fontSize:12, color:C.blue, textAlign:"right", background:C.lb }}>{tcM.toFixed(2)}%</td>
              <td style={{ padding:"0 11px", background:"#EDF6FC" }}>
                <RateInp value={r.sm} kind="sm" onChange={v => onUpdate(i, "sm", v)} />
              </td>
              <td style={{ padding:"0 11px", fontSize:11, color:C.muted, textAlign:"right", background:"#FFFBF5" }}>{fmx(r.ca)}</td>
              <td style={{ padding:"0 11px", fontSize:11, color:C.blue,  textAlign:"right", background:C.lb }}>{fmx(r.cm)}</td>
              <td style={{ padding:"0 11px", fontSize:11, color:C.muted, textAlign:"right" }}>{dxStr(r.df)}</td>
              <td style={{ padding:"0 11px", fontSize:12, textAlign:"right", color: r.df > 0 ? C.green : r.df < 0 ? C.red : C.muted }}>
                {dxPct(r.ca, r.cm)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ height:40, background:"#EEF0F6", borderTop:`2px solid ${C.border}` }}>
            <td style={{ padding:"0 11px", fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".05em" }}>Total</td>
            <td/><td/><td/><td/><td/>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#FFFBF5", color:C.amber }}>{fmx(totCa)}</td>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#EEF6FD", color:C.blue }}>{fmx(totCm)}</td>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#EAECF0", color: totDf > 0 ? C.green : C.red }}>{dxStr(totDf)}</td>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background:"#D6EDD9", color:"#1A6B2A" }}>
              {totAvgVal > 0 ? "▼ " : "▲ "}{Math.abs(totAvgVal).toFixed(1)}%
            </td>
          </tr>
          <tr style={{ height:36, background:"#EEF0F6" }}>
            <td style={{ padding:"0 11px", fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".05em" }}>{invLbl} MSI</td>
            <td/><td/><td/><td/><td/><td/><td/><td/>
            <td style={{ padding:"0 11px", fontSize:12, fontWeight:700, textAlign:"right", background: totDf >= 0 ? "#D6EDD9" : "#FAD7D7", color: totDf >= 0 ? "#1A6B2A" : C.red, borderRadius:4 }}>
              {totDf >= 0 ? "▼ " : "▲ "}{fmx(Math.abs(totDf))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Solution block ────────────────────────────────────────────
function SolutionBlock({ sec, prov, prod, tpv, otRows, msiRows, onUpdateOT, onUpdateMSI, tcA, tcM }: {
  sec: SecKey; prov: string; prod: string; tpv: number;
  otRows: ComOTRow[]; msiRows: ComMSIRow[];
  onUpdateOT:  (idx: number, field: "cu"|"mp", val: number) => void;
  onUpdateMSI: (idx: number, field: "sb"|"sm", val: number) => void;
  tcA: number; tcM: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute totals for resumen
  let otTotCa = 0, otTotCm = 0, msTotCa = 0, msTotCm = 0;
  const otCalc = otRows.map(r => { const vol=tpv*r.sh; const ca=vol*r.cu/100; const cm=vol*r.mp/100; otTotCa+=ca; otTotCm+=cm; return {ca,cm}; });
  const msCalc = msiRows.map(r => { const vol=tpv*r.sh; const ca=vol*(tcA+r.sb)/100; const cm=vol*(tcM+r.sm)/100; msTotCa+=ca; msTotCm+=cm; return {ca,cm}; });
  const otDf = otTotCa - otTotCm;
  const msDf = msTotCa - msTotCm;
  const otAvgV = dxAvg(otCalc);
  const msAvgV = dxAvg(msCalc);
  const totDf = otDf + msDf;

  const isPT = sec === "pt";

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:28 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", background: isPT ? C.navy : "#1A4A5E" }}>
        <span style={{ fontSize:18 }}>{isPT ? "🖥" : "🌐"}</span>
        <div style={{ flex:1 }}>
          <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>{isPT ? "Point" : "Online Payments"} — Solución 1</div>
          <div style={{ color:"rgba(255,255,255,.8)", fontSize:12, fontWeight:600, marginTop:2, display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:C.blue, flexShrink:0 }}/>
            {prov}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>TPV mensual</div>
          <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{fmx(tpv)}</div>
        </div>
      </div>

      {/* Resumen */}
      <ResumenBlock sec={sec} prov={prov} otDf={otDf} msDf={msDf} otAvg={otAvgV} msAvg={msAvgV} prod={prod} />

      {/* Scroll hint */}
      <ScrollHint scrollRef={scrollRef} />

      {/* Tables */}
      <div ref={scrollRef} style={{ overflowX:"auto", borderBottom:`1px solid ${C.border}` }}
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          const mx = el.scrollWidth - el.clientWidth;
          if (!mx) return;
        }}>
        <div style={{ display:"flex", minWidth:"max-content" }}>
          <OTTable sec={sec} rows={otRows} tpv={tpv} onUpdate={onUpdateOT} />
          {/* Divider */}
          <div style={{ width:24, background:C.bg, borderLeft:`1px solid ${C.border}`, borderRight:`1px solid ${C.border}`, flexShrink:0 }}/>
          <MSITable sec={sec} rows={msiRows} tpv={tpv} tcA={tcA} tcM={tcM} onUpdate={onUpdateMSI} />
        </div>
      </div>

      {/* Save bar */}
      <div style={{ display:"flex", border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 10px 10px", overflow:"hidden" }}>
        {[
          { label:"Comisión actual / mes", val: fmx(otTotCa + msTotCa), color:C.text },
          { label:"Con Mercado Pago / mes", val: fmx(otTotCm + msTotCm), color:C.blue },
          { label:"Ahorro mensual", val: fmx(Math.abs(totDf)), color: totDf >= 0 ? C.green : C.red },
          { label:"Ahorro anual",   val: fmx(Math.abs(totDf * 12)), color: totDf >= 0 ? C.green : C.red, highlight: true },
        ].map((item, i) => (
          <div key={i} style={{ flex:1, padding:"10px 12px", textAlign:"center", borderRight: i < 3 ? `1px solid ${C.border}` : "none", background: item.highlight ? C.lg : "#fff" }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:3 }}>{item.label}</div>
            <div style={{ fontSize:16, fontWeight:700, color:item.color }}>{item.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Step5_Comisiones({
  productos, provData, provCounts,
  comPT_OT, comPT_MSI, comOP_OT, comOP_MSI,
  updateComOT, updateComMSI, tcActual, tcMP,
  sharePT, shareOP,
  onNext, onBack,
}: Props) {
  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.navy, marginBottom:4 }}>Comisiones</h2>
      <p style={{ fontSize:13, color:C.muted, marginBottom:20 }}>
        Desliza para ver MSI · Tasa base MSI = T. Crédito en tiempo real
      </p>

      {productos.point && (
        <SolutionBlock
          sec="pt" prod="Point"
          prov={getProvName("pt", provData, provCounts)}
          tpv={sharePT.tpv}
          otRows={comPT_OT} msiRows={comPT_MSI}
          onUpdateOT={(i, f, v)  => updateComOT("pt", i, f, v)}
          onUpdateMSI={(i, f, v) => updateComMSI("pt", i, f, v)}
          tcA={tcActual("pt")} tcM={tcMP("pt")}
        />
      )}

      {productos.op && (
        <SolutionBlock
          sec="op" prod="Online Payments"
          prov={getProvName("op", provData, provCounts)}
          tpv={shareOP.tpv}
          otRows={comOP_OT} msiRows={comOP_MSI}
          onUpdateOT={(i, f, v)  => updateComOT("op", i, f, v)}
          onUpdateMSI={(i, f, v) => updateComMSI("op", i, f, v)}
          tcA={tcActual("op")} tcM={tcMP("op")}
        />
      )}

      <NavButtons
        onBack={onBack} onNext={onNext}
        backLabel="← Revisar share de pagos"
        nextLabel="Elegir propuesta de valor →"
        backAction="Paso anterior" nextAction="Siguiente paso"
      />
    </div>
  );
}
