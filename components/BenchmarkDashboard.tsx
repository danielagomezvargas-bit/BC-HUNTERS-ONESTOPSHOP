"use client";
import { useState, useEffect, useCallback } from "react";
import type { BenchmarkRecord, StatusId, MsiPlazo } from "@/types";
import { INDUSTRIES, PROVEEDORES_PT, PROVEEDORES_OP, MSI_PLAZOS, STATUSES, TPV_RANGES, COLORS as C } from "@/data/constants";
import { fmx, fmtPct, avg, pctOf } from "@/utils/format";

// ── Seed data ─────────────────────────────────────────────────
const SEED: BenchmarkRecord[] = [
  {
    id:"s1", seller:"AUNA", rfc:"AUN200101ABC", industria:"Salud / Farmacia",
    producto:"Point", proveedor:"BBVA Bancomer", tpv:30_000_000, ticket:1200, hunter:"María González",
    tasas:{td:1.15,tc:1.67,amex:3.50,intl:2.50},
    tasas_mp:{td:1.11,tc:1.67,amex:3.40,intl:3.20},
    msi:{"3x":{ba:1.67,sb:3.20},"6x":{ba:1.67,sb:4.80},"9x":{ba:1.67,sb:7.50},"12x":{ba:1.67,sb:9.00},"18x":null,"24x":null},
    msi_mp:{"3x":{ba:1.67,sb:3.10},"6x":{ba:1.67,sb:4.67},"9x":{ba:1.67,sb:7.40},"12x":{ba:1.67,sb:8.50},"18x":null,"24x":null},
    status:"ganado", fecha:"2025-01-10", razon_perdida:null,
  },
  {
    id:"s2", seller:"San Angel Inn", rfc:"SAI190501XYZ", industria:"Restaurantes / Food & Bev",
    producto:"Point", proveedor:"Santander", tpv:4_500_000, ticket:850, hunter:"Carlos Ruiz",
    tasas:{td:1.40,tc:1.80,amex:3.50,intl:3.00},
    tasas_mp:{td:1.11,tc:1.67,amex:3.40,intl:3.20},
    msi:{"3x":{ba:1.80,sb:3.20},"6x":{ba:1.80,sb:4.80},"9x":null,"12x":null,"18x":null,"24x":null},
    msi_mp:{"3x":{ba:1.67,sb:3.10},"6x":{ba:1.67,sb:4.67},"9x":null,"12x":null,"18x":null,"24x":null},
    status:"presentado", fecha:"2025-02-14", razon_perdida:null,
  },
  {
    id:"s3", seller:"HangTen", rfc:"", industria:"Retail / Moda",
    producto:"Online Payments", proveedor:"Conekta", tpv:300_000, ticket:600, hunter:"María González",
    tasas:{td:1.60,tc:1.90,amex:3.40,intl:3.40},
    tasas_mp:{td:1.10,tc:1.87,amex:3.40,intl:3.20},
    msi:{"3x":null,"6x":null,"9x":null,"12x":{ba:1.90,sb:10.40},"18x":{ba:1.90,sb:16.00},"24x":null},
    msi_mp:{"3x":null,"6x":null,"9x":null,"12x":{ba:1.87,sb:10.40},"18x":{ba:1.87,sb:16.00},"24x":null},
    status:"en_proceso", fecha:"2025-03-01", razon_perdida:null,
  },
  {
    id:"s4", seller:"TechStore MX", rfc:"TSM210601GHI", industria:"Electrónica / Tech",
    producto:"Online Payments", proveedor:"Stripe", tpv:8_000_000, ticket:2400, hunter:"Ana López",
    tasas:{td:1.50,tc:2.10,amex:3.50,intl:3.50},
    tasas_mp:{td:1.10,tc:1.87,amex:3.40,intl:3.20},
    msi:{"3x":null,"6x":{ba:2.10,sb:4.80},"9x":null,"12x":{ba:2.10,sb:10.40},"18x":null,"24x":null},
    msi_mp:{"3x":null,"6x":{ba:1.87,sb:4.67},"9x":null,"12x":{ba:1.87,sb:10.40},"18x":null,"24x":null},
    status:"por_definir", fecha:"2025-03-15", razon_perdida:null,
  },
  {
    id:"s5", seller:"Grupo Palacio", rfc:"GPE170201JKL", industria:"Retail / Moda",
    producto:"Point", proveedor:"BBVA Bancomer", tpv:55_000_000, ticket:1800, hunter:"Carlos Ruiz",
    tasas:{td:1.10,tc:1.55,amex:3.20,intl:2.30},
    tasas_mp:{td:1.11,tc:1.67,amex:3.40,intl:3.20},
    msi:{"3x":{ba:1.55,sb:3.00},"6x":{ba:1.55,sb:4.50},"9x":{ba:1.55,sb:7.00},"12x":{ba:1.55,sb:8.50},"18x":{ba:1.55,sb:15.00},"24x":null},
    msi_mp:{"3x":{ba:1.67,sb:3.10},"6x":{ba:1.67,sb:4.67},"9x":{ba:1.67,sb:7.40},"12x":{ba:1.67,sb:8.50},"18x":{ba:1.67,sb:14.00},"24x":null},
    status:"ganado", fecha:"2025-01-28", razon_perdida:null,
  },
  {
    id:"s6", seller:"Pizza Roma", rfc:"PRM200801MNO", industria:"Restaurantes / Food & Bev",
    producto:"Point", proveedor:"Clip", tpv:2_200_000, ticket:180, hunter:"Ana López",
    tasas:{td:1.90,tc:2.30,amex:3.80,intl:3.50},
    tasas_mp:{td:1.11,tc:1.67,amex:3.40,intl:3.20},
    msi:{"3x":null,"6x":null,"9x":null,"12x":null,"18x":null,"24x":null},
    msi_mp:{"3x":null,"6x":null,"9x":null,"12x":null,"18x":null,"24x":null},
    status:"perdido", fecha:"2025-02-20", razon_perdida:"Precio — el seller prefirió Clip por menor costo fijo",
  },
];

// ── Helpers ───────────────────────────────────────────────────
const getSt = (id: StatusId) => STATUSES.find(s => s.id === id) || STATUSES[0];

const avv = (arr: (number|null|undefined)[]) => {
  const v = arr.filter((x): x is number => x != null && !isNaN(x));
  return v.length ? v.reduce((a,b) => a+b, 0) / v.length : null;
};

// ── Shared styles ─────────────────────────────────────────────
const TH: React.CSSProperties = {
  padding:"7px 11px", fontSize:9, fontWeight:700, color:"#888",
  textTransform:"uppercase", letterSpacing:".06em",
  textAlign:"left", borderBottom:`2px solid ${C.border}`,
  background:"#FAFAFA", whiteSpace:"nowrap",
};
const TD: React.CSSProperties = {
  padding:"9px 11px", fontSize:12, color:C.navy,
  borderBottom:`1px solid #F2F2F2`, verticalAlign:"middle",
};
const badge = (color: string, bg: string): React.CSSProperties => ({
  display:"inline-block", padding:"2px 7px", borderRadius:4,
  fontSize:10, fontWeight:700, color, background:bg,
});
const INP: React.CSSProperties = {
  width:"100%", border:`1px solid ${C.border}`, borderRadius:6,
  padding:"7px 10px", fontSize:12, color:C.navy, outline:"none",
};
const SEL: React.CSSProperties = { ...INP, background:"#fff", cursor:"pointer" };
const LBL: React.CSSProperties = {
  fontSize:10, fontWeight:700, color:"#555",
  textTransform:"uppercase", letterSpacing:".06em",
  marginBottom:4, display:"block",
};

// ─────────────────────────────────────────────────────────────
export default function BenchmarkDashboard() {
  const [tab, setTab]       = useState<"dashboard"|"tasas"|"lista"|"add"|"upload">("dashboard");
  const [records, setRecords] = useState<BenchmarkRecord[]>(SEED);

  // Filters
  const [fInd,    setFInd]    = useState("Todas");
  const [fProd,   setFProd]   = useState("Todos");
  const [fRange,  setFRange]  = useState("Todos");
  const [fHunter, setFHunter] = useState("Todos");
  const [fStatus, setFStatus] = useState("Todos");

  // Sort
  const [sortCol, setSortCol] = useState("fecha");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");

  // Status inline edit
  const [editSt, setEditSt] = useState<{id:string;val:StatusId}|null>(null);

  // IA upload
  const [uploadText,   setUploadText]   = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [uploadNotes,  setUploadNotes]  = useState<string|null>(null);
  const [uploadErr,    setUploadErr]    = useState<string|null>(null);
  const [pendingForm,  setPendingForm]  = useState<Partial<FormState>|null>(null);

  // Form
  type MsiEntry = { active:boolean; sb:string; sb_mp:string };
  interface FormState {
    seller:string; rfc:string; industria:string; producto:"Point"|"Online Payments";
    proveedor:string; tpv:string; ticket:string; hunter:string;
    tasas:{td:string;tc:string;amex:string;intl:string};
    tasas_mp:{td:string;tc:string;amex:string;intl:string};
    msi: Record<MsiPlazo, MsiEntry>;
    razon_perdida:string;
  }
  const emptyMsi: Record<MsiPlazo,MsiEntry> = Object.fromEntries(
    MSI_PLAZOS.map(p => [p,{active:false,sb:"",sb_mp:""}])
  ) as any;
  const emptyForm: FormState = {
    seller:"", rfc:"", industria:"", producto:"Point", proveedor:"",
    tpv:"", ticket:"", hunter:"",
    tasas:{td:"",tc:"",amex:"",intl:""},
    tasas_mp:{td:"",tc:"",amex:"",intl:""},
    msi: emptyMsi, razon_perdida:"",
  };
  const [form,  setForm]  = useState<FormState>(emptyForm);
  const [fErr,  setFErr]  = useState<Record<string,string>>({});
  const [saved, setSaved] = useState(false);

  // Persist
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bm_v4");
      if (raw) { const d = JSON.parse(raw); if (d?.length) setRecords(d); }
    } catch {}
  }, []);

  const persist = useCallback((data: BenchmarkRecord[]) => {
    try { localStorage.setItem("bm_v4", JSON.stringify(data)); } catch {}
  }, []);

  // Derived
  const allHunters = [...new Set(records.map(r => r.hunter).filter(Boolean))].sort();
  const allProvs   = [...new Set(records.map(r => r.proveedor).filter(Boolean))].sort();

  const filtered = records.filter(r => {
    if (fInd    !== "Todas" && r.industria !== fInd)    return false;
    if (fProd   !== "Todos" && r.producto  !== fProd)   return false;
    if (fHunter !== "Todos" && r.hunter    !== fHunter) return false;
    if (fStatus !== "Todos" && r.status    !== fStatus) return false;
    if (fRange  !== "Todos") {
      const rng = TPV_RANGES.find(x => x.id === fRange);
      if (rng && (r.tpv < rng.min || r.tpv >= rng.max)) return false;
    }
    return true;
  }).sort((a, b) => {
    const v = sortDir === "asc" ? 1 : -1;
    if (sortCol === "tpv")    return (a.tpv - b.tpv) * v;
    if (sortCol === "seller") return a.seller.localeCompare(b.seller) * v;
    return (a.fecha || "").localeCompare(b.fecha || "") * v * -1;
  });

  function tSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }
  const arrow = (col: string) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  function updateStatus(id: string, val: StatusId) {
    const u = records.map(r => r.id === id ? { ...r, status: val } : r);
    setRecords(u); persist(u); setEditSt(null);
  }
  function delRec(id: string) {
    const u = records.filter(r => r.id !== id);
    setRecords(u); persist(u);
  }

  // Form helpers
  const provOpts = form.producto === "Point" ? PROVEEDORES_PT : PROVEEDORES_OP;

  function validate() {
    const e: Record<string,string> = {};
    if (!form.seller.trim())  e.seller   = "Obligatorio";
    if (!form.industria)      e.industria = "Obligatorio";
    if (!form.proveedor)      e.proveedor = "Obligatorio";
    if (!form.hunter.trim())  e.hunter   = "Obligatorio";
    if (!form.tpv  || isNaN(+form.tpv))   e.tpv  = "Número requerido";
    if (!form.ticket || isNaN(+form.ticket)) e.ticket = "Número requerido";
    if (!form.tasas.td || isNaN(+form.tasas.td)) e.td = "Requerido";
    if (!form.tasas.tc || isNaN(+form.tasas.tc)) e.tc = "Requerido";
    setFErr(e);
    return Object.keys(e).length === 0;
  }

  function submitForm() {
    if (!validate()) return;
    const tcBase   = +form.tasas.tc;
    const tcMpBase = +form.tasas_mp.tc || tcBase;
    const msiOut: BenchmarkRecord["msi"]    = {} as any;
    const msiMpOut: BenchmarkRecord["msi_mp"] = {} as any;
    (MSI_PLAZOS as unknown as MsiPlazo[]).forEach(p => {
      const e = form.msi[p];
      msiOut[p]   = e.active && e.sb   ? { ba:tcBase,   sb:+e.sb    } : null;
      msiMpOut[p] = e.active && e.sb_mp? { ba:tcMpBase, sb:+e.sb_mp } : null;
    });
    const rec: BenchmarkRecord = {
      id: "s"+Date.now(),
      seller: form.seller.trim(), rfc: form.rfc.trim(),
      industria: form.industria, producto: form.producto, proveedor: form.proveedor,
      tpv: +form.tpv, ticket: +form.ticket, hunter: form.hunter.trim(),
      tasas: { td:+form.tasas.td, tc:+form.tasas.tc, amex:form.tasas.amex?+form.tasas.amex:null, intl:form.tasas.intl?+form.tasas.intl:null },
      tasas_mp: { td:form.tasas_mp.td?+form.tasas_mp.td:null, tc:form.tasas_mp.tc?+form.tasas_mp.tc:null, amex:form.tasas_mp.amex?+form.tasas_mp.amex:null, intl:form.tasas_mp.intl?+form.tasas_mp.intl:null },
      msi: msiOut, msi_mp: msiMpOut,
      status:"por_definir", fecha: new Date().toISOString().slice(0,10),
      razon_perdida: form.razon_perdida || null,
    };
    const u = [...records, rec];
    setRecords(u); persist(u);
    setForm(emptyForm); setFErr({});
    setSaved(true);
    setTimeout(() => { setSaved(false); setTab("dashboard"); }, 1400);
  }

  // IA interpret
  async function interpretFile() {
    if (!uploadText.trim()) { setUploadErr("Pega el contenido del ejercicio"); return; }
    setUploading(true); setUploadErr(null); setUploadNotes(null);
    try {
      const res = await fetch("/api/interpret-exercise", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ content: uploadText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      const p = data.parsed;
      const msiPre: Record<MsiPlazo, MsiEntry> = { ...emptyMsi };
      (MSI_PLAZOS as unknown as MsiPlazo[]).forEach(pl => {
        const m = p.msi?.[pl];
        msiPre[pl] = m ? { active:true, sb:String(m.sb||""), sb_mp:String(p.msi_mp?.[pl]?.sb||"") } : { active:false, sb:"", sb_mp:"" };
      });
      setPendingForm({
        seller:p.seller||"", rfc:p.rfc||"", industria:p.industria||"",
        producto:p.producto||"Point", proveedor:p.proveedor||"",
        tpv:p.tpv?String(p.tpv):"", ticket:p.ticket?String(p.ticket):"",
        hunter:p.hunter||"",
        tasas:{td:String(p.tasas?.td||""),tc:String(p.tasas?.tc||""),amex:String(p.tasas?.amex||""),intl:String(p.tasas?.intl||"")},
        tasas_mp:{td:String(p.tasas_mp?.td||""),tc:String(p.tasas_mp?.tc||""),amex:String(p.tasas_mp?.amex||""),intl:String(p.tasas_mp?.intl||"")},
        msi: msiPre,
      });
      setUploadNotes(p.notas_ia || null);
    } catch (e: any) {
      setUploadErr("No se pudo interpretar. Verifica que pegaste datos del ejercicio. " + e.message);
    }
    setUploading(false);
  }

  function confirmUpload() {
    if (!pendingForm) return;
    setForm(prev => ({ ...prev, ...pendingForm }));
    setPendingForm(null); setUploadText(""); setUploadNotes(null);
    setTab("add");
  }

  // ── Benchmark calcs ──────────────────────────────────────────
  const benchInd = INDUSTRIES.map(ind => {
    const recs = filtered.filter(r => r.industria === ind);
    if (!recs.length) return null;
    return {
      industria: ind, count: recs.length,
      td:   avv(recs.map(r => r.tasas?.td)),
      tc:   avv(recs.map(r => r.tasas?.tc)),
      amex: avv(recs.map(r => r.tasas?.amex)),
      intl: avv(recs.map(r => r.tasas?.intl)),
      td_mp: avv(recs.map(r => r.tasas_mp?.td)),
      tc_mp: avv(recs.map(r => r.tasas_mp?.tc)),
    };
  }).filter(Boolean) as NonNullable<ReturnType<typeof benchInd[0]>>[];

  const benchProv = allProvs.map(prov => {
    const recs = filtered.filter(r => r.proveedor === prov);
    if (!recs.length) return null;
    const msiA: Record<string, number|null> = {};
    (MSI_PLAZOS as unknown as MsiPlazo[]).forEach(p => {
      const vals = recs.map(r => { const m = r.msi?.[p]; return m ? m.ba + m.sb : null; }).filter((v): v is number => v != null);
      msiA[p] = vals.length ? avv(vals) : null;
    });
    return {
      proveedor:prov, count:recs.length,
      td:   avv(recs.map(r => r.tasas?.td)),
      tc:   avv(recs.map(r => r.tasas?.tc)),
      amex: avv(recs.map(r => r.tasas?.amex)),
      intl: avv(recs.map(r => r.tasas?.intl)),
      ...msiA,
    };
  }).filter(Boolean) as any[];

  const stDist = STATUSES.map(s => ({ ...s, count: filtered.filter(r => r.status === s.id).length }));
  const ganados  = filtered.filter(r => r.status === "ganado").length;
  const perdidos = filtered.filter(r => r.status === "perdido");
  const total    = filtered.length;

  // Auto description
  const desc = (() => {
    if (!total) return "Sin datos suficientes.";
    const lines: string[] = [];
    if (ganados)  lines.push(`✅ ${pctOf(ganados, total)} de las propuestas se ganaron`);
    const perd = perdidos.length;
    if (perd)     lines.push(`❌ ${pctOf(perd, total)} se perdieron`);
    const enProc = filtered.filter(r => r.status === "en_proceso").length;
    if (enProc)   lines.push(`🔄 ${pctOf(enProc, total)} están en proceso activo`);
    const porDef = filtered.filter(r => r.status === "por_definir").length;
    if (porDef)   lines.push(`⏳ ${pctOf(porDef, total)} sin definir`);
    const conRazon = perdidos.filter(r => r.razon_perdida).slice(0, 2);
    if (conRazon.length) lines.push(`📋 Razones de pérdida: ${conRazon.map(r => r.razon_perdida).join(" · ")}`);
    const hunters = [...new Set(filtered.map(r => r.hunter).filter(Boolean))];
    if (hunters.length) lines.push(`👤 ${hunters.length} hunter${hunters.length > 1 ? "s" : ""} con propuestas registradas`);
    return lines.join("\n");
  })();

  // ── Render ────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding:"8px 16px", borderRadius:"8px 8px 0 0", fontSize:12, fontWeight:700,
    cursor:"pointer", border:`1px solid ${C.border}`,
    borderBottom: active ? "2px solid #fff" : "none",
    background:"#fff", color: active ? C.navy : "#888",
  });

  const fbarSel: React.CSSProperties = {
    padding:"5px 9px", border:`1px solid ${C.border}`, borderRadius:6,
    fontSize:11, background:"#fff", color:C.navy, outline:"none", cursor:"pointer",
  };

  const FilterBar = () => (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:14, padding:"9px 13px", background:"#F9FAFB", border:`1px solid ${C.border}`, borderRadius:8 }}>
      <span style={{ fontSize:9, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:".07em" }}>Filtrar</span>
      <select style={fbarSel} value={fInd}    onChange={e => setFInd(e.target.value)}>
        <option>Todas</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}
      </select>
      <select style={fbarSel} value={fProd}   onChange={e => setFProd(e.target.value)}>
        <option>Todos</option><option>Point</option><option>Online Payments</option>
      </select>
      <select style={fbarSel} value={fRange}  onChange={e => setFRange(e.target.value)}>
        <option value="Todos">Todos los rangos</option>
        {TPV_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      <select style={fbarSel} value={fHunter} onChange={e => setFHunter(e.target.value)}>
        <option>Todos los hunters</option>{allHunters.map(h => <option key={h}>{h}</option>)}
      </select>
      <select style={fbarSel} value={fStatus} onChange={e => setFStatus(e.target.value)}>
        <option value="Todos">Todos los status</option>
        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <span style={{ fontSize:10, color:"#888", marginLeft:"auto" }}>{filtered.length} sellers</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", background:C.bg, minHeight:"100vh" }}>

      {/* Topbar */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"10px 24px", display:"flex", alignItems:"center", gap:14 }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Logotipo_de_Mercado_Pago.svg/512px-Logotipo_de_Mercado_Pago.svg.png"
          style={{ height:32 }} alt="MP" onError={(e:any) => e.target.style.display="none"}/>
        <div style={{ width:1, height:32, background:C.border, margin:"0 12px" }}/>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:C.navy }}>Benchmark de Comisiones</div>
          <div style={{ fontSize:10, color:"#888" }}>Solo tasas reales confirmadas · Mercado Pago Monetización</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.navy }}>{records.length} sellers</div>
            <div style={{ fontSize:10, color:"#888" }}>{allHunters.length} hunters registrados</div>
          </div>
          <button onClick={() => setTab("upload")} style={{ padding:"8px 16px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", color:C.navy }}>
            🤖 Cargar ejercicio
          </button>
          <button onClick={() => setTab("add")} style={{ padding:"8px 18px", background:C.blue, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            + Registrar seller
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1060, margin:"0 auto", padding:"0 20px 32px" }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:4, paddingTop:14 }}>
          {([["dashboard","📊 Dashboard"],["tasas","📈 Tasas benchmark"],["lista","📋 Lista"],["upload","🤖 Cargar ejercicio"],["add","➕ Registrar"]] as const).map(([id, lbl]) => (
            <div key={id} style={tabStyle(tab === id)} onClick={() => setTab(id)}>{lbl}</div>
          ))}
        </div>

        <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"0 10px 10px 10px", padding:"20px 22px", marginBottom:18 }}>

          {/* ══ DASHBOARD ══ */}
          {tab === "dashboard" && <>
            <FilterBar />

            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
              {[
                { lbl:"Total propuestas",       val:<span style={{ fontSize:28, fontWeight:700, color:C.blue }}>{total}</span>,  sub:`${allHunters.length} hunters · ${[...new Set(filtered.map(r=>r.industria))].length} industrias`, top:"none" },
                { lbl:"Tasa de éxito",          val:<span style={{ fontSize:24, fontWeight:700, color:C.green }}>{pctOf(ganados,total)}</span>, sub:"propuestas ganadas", top:`3px solid ${C.green}` },
                { lbl:"Com. TD prom. actual",   val:<span style={{ fontSize:24, fontWeight:700, color:C.amber }}>{fmtPct(avv(filtered.map(r=>r.tasas?.td)))}</span>, sub:"benchmark mercado", top:`3px solid ${C.amber}` },
                { lbl:"Com. TD prom. MP",       val:<span style={{ fontSize:24, fontWeight:700, color:C.green }}>{fmtPct(avv(filtered.map(r=>r.tasas_mp?.td)))}</span>, sub:"vs solución actual", top:`3px solid ${C.green}` },
              ].map((k, i) => (
                <div key={i} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:9, padding:"12px 16px", borderTop:k.top }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:".07em", marginBottom:3 }}>{k.lbl}</div>
                  {k.val}
                  <div style={{ fontSize:9, color:"#888", marginTop:2 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ background:"#F9FAFB", border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px", marginBottom:18, fontSize:12, color:C.navy, lineHeight:1.7, whiteSpace:"pre-line" }}>
              {desc}
            </div>

            {/* Status + Hunters */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>Estado de propuestas</div>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  {stDist.map(s => {
                    const p = total ? s.count / total : 0;
                    return (
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:9, height:9, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
                        <span style={{ fontSize:11, color:C.navy, minWidth:110 }}>{s.label}</span>
                        <div style={{ flex:1, height:6, background:"#F0F0F0", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${p*100}%`, background:s.color, borderRadius:3, transition:"width .3s" }}/>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:s.color, minWidth:22, textAlign:"right" }}>{s.count}</span>
                        <span style={{ fontSize:10, color:"#888", minWidth:30, textAlign:"right" }}>{pctOf(s.count,total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>Hunters activos</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {allHunters.map(h => {
                    const cnt  = records.filter(r => r.hunter === h).length;
                    const won  = records.filter(r => r.hunter === h && r.status === "ganado").length;
                    const isAct = fHunter === h;
                    return (
                      <div key={h} onClick={() => setFHunter(isAct ? "Todos" : h)} style={{
                        padding:"8px 14px", border:`1.5px solid ${isAct ? C.blue : C.border}`,
                        borderRadius:8, background: isAct ? "#E6F6FD" : "#fff", cursor:"pointer",
                      }}>
                        <div style={{ fontSize:12, fontWeight:700, color: isAct ? C.blue : C.navy }}>{h}</div>
                        <div style={{ fontSize:10, color:"#888" }}>{cnt} propuestas · <span style={{ color:C.green, fontWeight:700 }}>{won} ganadas</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Propuestas table */}
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>Propuestas del segmento</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  {[["Seller","seller"],["Industria",""],["Proveedor",""],["TPV","tpv"],["Hunter",""],["Status",""],["Fecha",""],["",""]].map(([lbl,col],i) => (
                    <th key={i} style={{ ...TH, cursor:col?"pointer":"default", color:sortCol===col?C.navy:"#888", background:sortCol===col?"#F0F4FA":"#FAFAFA" }}
                      onClick={() => col && tSort(col)}>
                      {lbl}{col?arrow(col):""}
                    </th>
                  ))}
                </tr></thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={8} style={{ ...TD, textAlign:"center", color:"#888", padding:24 }}>Sin resultados para los filtros seleccionados</td></tr>
                    : filtered.map(r => {
                      const st = getSt(r.status);
                      return (
                        <tr key={r.id} style={{ background:"#fff" }}>
                          <td style={TD}><div style={{ fontWeight:700 }}>{r.seller}</div>{r.rfc&&<div style={{ fontSize:10,color:"#888" }}>{r.rfc}</div>}</td>
                          <td style={{ ...TD, fontSize:11 }}>{r.industria}</td>
                          <td style={{ ...TD, fontSize:11 }}>{r.proveedor}</td>
                          <td style={{ ...TD, fontWeight:600 }}>{fmx(r.tpv)}</td>
                          <td style={{ ...TD, fontSize:11 }}>{r.hunter}</td>
                          <td style={TD}>
                            {editSt?.id === r.id
                              ? <select autoFocus value={editSt.val}
                                  style={{ ...SEL, fontSize:11, padding:"3px 6px", width:"auto" }}
                                  onChange={e => setEditSt(x => x ? { ...x, val:e.target.value as StatusId } : null)}
                                  onBlur={() => editSt && updateStatus(r.id, editSt.val)}>
                                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                              : <span style={{ ...badge(st.color, st.bg), cursor:"pointer" }} title="Click para editar"
                                  onClick={() => setEditSt({ id:r.id, val:r.status })}>
                                  {st.label}
                                </span>
                            }
                          </td>
                          <td style={{ ...TD, fontSize:11, color:"#888" }}>{r.fecha}</td>
                          <td style={{ ...TD, textAlign:"center" }}>
                            <span style={{ fontSize:11, color:C.red, cursor:"pointer", fontWeight:700 }} onClick={() => delRec(r.id)}>✕</span>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </>}

          {/* ══ TASAS BENCHMARK ══ */}
          {tab === "tasas" && <>
            <FilterBar />

            {/* Por industria — promedio general arriba, luego por proveedor */}
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>
              Tasa promedio por industria — pagos de contado
            </div>
            <div style={{ overflowX:"auto", marginBottom:22 }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <th style={TH}>Industria</th>
                  <th style={{ ...TH, textAlign:"center" }}>#</th>
                  <th style={{ ...TH, color:C.amber }}>T. Débito</th>
                  <th style={{ ...TH, color:C.amber }}>T. Crédito</th>
                  <th style={{ ...TH, color:C.amber }}>AMEX</th>
                  <th style={{ ...TH, color:C.amber }}>Internacional</th>
                  <th style={{ ...TH, color:C.green }}>TD MP prom.</th>
                  <th style={{ ...TH, color:C.green }}>TC MP prom.</th>
                </tr></thead>
                <tbody>
                  {/* General average row */}
                  <tr style={{ background:"#EEF0F6", borderBottom:`2px solid ${C.border}` }}>
                    <td style={{ ...TD, fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:".05em", color:"#888" }}>Promedio general</td>
                    <td style={{ ...TD, textAlign:"center" }}><span style={badge(C.blue,"#E6F6FD")}>{filtered.length}</span></td>
                    <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(avv(filtered.map(r=>r.tasas?.td)))}</td>
                    <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(avv(filtered.map(r=>r.tasas?.tc)))}</td>
                    <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(avv(filtered.map(r=>r.tasas?.amex)))}</td>
                    <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(avv(filtered.map(r=>r.tasas?.intl)))}</td>
                    <td style={{ ...TD, color:C.green, fontWeight:700, background:C.lg }}>{fmtPct(avv(filtered.map(r=>r.tasas_mp?.td)))}</td>
                    <td style={{ ...TD, color:C.green, fontWeight:700, background:C.lg }}>{fmtPct(avv(filtered.map(r=>r.tasas_mp?.tc)))}</td>
                  </tr>
                  {benchInd.length === 0
                    ? <tr><td colSpan={8} style={{ ...TD, textAlign:"center", color:"#888" }}>Sin datos para los filtros seleccionados</td></tr>
                    : benchInd.map(row => (
                      <tr key={row.industria}>
                        <td style={{ ...TD, fontWeight:600 }}>{row.industria}</td>
                        <td style={{ ...TD, textAlign:"center" }}><span style={badge(C.blue,"#E6F6FD")}>{row.count}</span></td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.td)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.tc)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.amex)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.intl)}</td>
                        <td style={{ ...TD, color:C.green, fontWeight:700, background:C.lg }}>{fmtPct(row.td_mp)}</td>
                        <td style={{ ...TD, color:C.green, fontWeight:700, background:C.lg }}>{fmtPct(row.tc_mp)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {/* Por banco */}
            <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:10 }}>
              Tasa promedio por banco / proveedor — contado + MSI
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <th style={TH} rowSpan={2}>Banco / Proveedor</th>
                    <th style={{ ...TH, textAlign:"center" }} rowSpan={2}>#</th>
                    <th style={{ ...TH, color:C.amber, background:"#FFFBF5", textAlign:"center", borderBottom:"none" }} colSpan={4}>💳 Pagos de contado</th>
                    <th style={{ ...TH, color:C.blue, background:C.bg, textAlign:"center", borderBottom:"none" }} colSpan={6}>📅 MSI — Tasa total</th>
                  </tr>
                  <tr>
                    {["T. Débito","T. Crédito","AMEX","Intl"].map(h => (
                      <th key={h} style={{ ...TH, color:C.amber, background:"#FFFBF5", borderTop:"none" }}>{h}</th>
                    ))}
                    {(MSI_PLAZOS as unknown as string[]).map(p => (
                      <th key={p} style={{ ...TH, color:C.blue, background:C.bg, borderTop:"none" }}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {benchProv.length === 0
                    ? <tr><td colSpan={12} style={{ ...TD, textAlign:"center", color:"#888" }}>Sin datos</td></tr>
                    : benchProv.map((row: any) => (
                      <tr key={row.proveedor}>
                        <td style={{ ...TD, fontWeight:600 }}>{row.proveedor}</td>
                        <td style={{ ...TD, textAlign:"center" }}><span style={badge(C.blue,"#E6F6FD")}>{row.count}</span></td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.td)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.tc)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.amex)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700, background:"#FFFBF5" }}>{fmtPct(row.intl)}</td>
                        {(MSI_PLAZOS as unknown as string[]).map(p => (
                          <td key={p} style={{ ...TD, color:row[p]?C.blue:"#CCC", fontWeight:700, background:C.bg }}>{fmtPct(row[p])}</td>
                        ))}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>}

          {/* ══ LISTA ══ */}
          {tab === "lista" && <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.navy }}>{records.length} sellers — tasas reales confirmadas</div>
              <button onClick={() => setTab("add")} style={{ padding:"8px 18px", background:C.blue, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>+ Registrar</button>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>
                  <th style={TH}>Seller</th><th style={TH}>Industria</th>
                  <th style={TH}>Prod.</th><th style={TH}>Proveedor</th>
                  <th style={TH}>TPV</th><th style={TH}>Ticket</th>
                  <th style={{ ...TH, color:C.amber }}>TD act.</th>
                  <th style={{ ...TH, color:C.amber }}>TC act.</th>
                  <th style={{ ...TH, color:C.green }}>TD MP</th>
                  <th style={{ ...TH, color:C.green }}>TC MP</th>
                  <th style={TH}>Hunter</th><th style={TH}>Status</th>
                  <th style={TH}/>
                </tr></thead>
                <tbody>
                  {records.map(r => {
                    const st = getSt(r.status);
                    return (
                      <tr key={r.id}>
                        <td style={{ ...TD, fontWeight:700 }}>{r.seller}{r.rfc&&<div style={{ fontSize:9,color:"#888" }}>{r.rfc}</div>}</td>
                        <td style={{ ...TD, fontSize:11 }}>{r.industria}</td>
                        <td style={TD}><span style={badge(r.producto==="Point"?C.navy:C.green,r.producto==="Point"?"#E6F0F5":"#E6F5ED")}>{r.producto==="Point"?"🖥":"🌐"}</span></td>
                        <td style={{ ...TD, fontSize:11 }}>{r.proveedor}</td>
                        <td style={{ ...TD, fontWeight:600, fontSize:11 }}>{fmx(r.tpv)}</td>
                        <td style={{ ...TD, fontSize:11 }}>{fmx(r.ticket)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700 }}>{fmtPct(r.tasas?.td)}</td>
                        <td style={{ ...TD, color:C.amber, fontWeight:700 }}>{fmtPct(r.tasas?.tc)}</td>
                        <td style={{ ...TD, color:C.green, fontWeight:700 }}>{fmtPct(r.tasas_mp?.td)}</td>
                        <td style={{ ...TD, color:C.green, fontWeight:700 }}>{fmtPct(r.tasas_mp?.tc)}</td>
                        <td style={{ ...TD, fontSize:11 }}>{r.hunter}</td>
                        <td style={TD}><span style={{ ...badge(st.color,st.bg), cursor:"pointer" }} onClick={() => setEditSt({id:r.id,val:r.status})}>{st.label}</span></td>
                        <td style={{ ...TD, textAlign:"center" }}><span style={{ fontSize:11, color:C.red, cursor:"pointer", fontWeight:700 }} onClick={() => delRec(r.id)}>✕</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>}

          {/* ══ CARGAR EJERCICIO (IA) ══ */}
          {tab === "upload" && <>
            <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:4 }}>Cargar ejercicio de monetización</div>
            <div style={{ fontSize:12, color:"#888", marginBottom:16 }}>
              Pega el contenido de un ejercicio anterior y la IA extraerá los datos automáticamente
            </div>
            <div style={{ background:C.la, border:`1px solid #F0C070`, borderRadius:7, padding:"9px 12px", fontSize:11, color:C.amber, marginBottom:16 }}>
              ⚠ Solo se guardarán los datos si el hunter confirma que las tasas son reales en el siguiente paso.
            </div>

            <textarea
              value={uploadText}
              onChange={e => setUploadText(e.target.value)}
              placeholder={"Pega aquí el contenido del ejercicio...\n\nEjemplo:\nSeller: AUNA\nTPV: $30,000,000\nBanco: BBVA\nTasa débito: 1.15%\nTasa crédito: 1.67%\n..."}
              style={{
                width:"100%", minHeight:200, border:`1px solid ${C.border}`,
                borderRadius:8, padding:"12px 14px", fontSize:12, color:C.text,
                outline:"none", resize:"vertical", fontFamily:"inherit", lineHeight:1.6,
              }}
            />

            {uploadErr && (
              <div style={{ background:"#FEE8EA", border:"1px solid #FFCDD2", borderRadius:7, padding:"9px 12px", fontSize:12, color:C.red, marginTop:8 }}>
                ⚠ {uploadErr}
              </div>
            )}

            {uploadNotes && !pendingForm && (
              <div style={{ background:C.lb, border:`1px solid #B3DDEF`, borderRadius:7, padding:"9px 12px", fontSize:12, color:C.navy, marginTop:8 }}>
                <strong>Notas de la IA:</strong> {uploadNotes}
              </div>
            )}

            {pendingForm && (
              <div style={{ background:C.lg, border:`1px solid #A3D9B8`, borderRadius:8, padding:"14px 16px", marginTop:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.navy, marginBottom:8 }}>✅ Datos extraídos — revisa antes de confirmar</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px 20px", fontSize:11, color:C.navy }}>
                  {[
                    ["Seller", (pendingForm as any).seller],
                    ["Industria", (pendingForm as any).industria],
                    ["Producto", (pendingForm as any).producto],
                    ["Proveedor", (pendingForm as any).proveedor],
                    ["TPV", (pendingForm as any).tpv ? fmx(+(pendingForm as any).tpv) : "—"],
                    ["T. Débito", (pendingForm as any).tasas?.td ? `${(pendingForm as any).tasas.td}%` : "—"],
                    ["T. Crédito", (pendingForm as any).tasas?.tc ? `${(pendingForm as any).tasas.tc}%` : "—"],
                    ["Hunter", (pendingForm as any).hunter || "—"],
                  ].map(([k,v]) => (
                    <div key={k}><span style={{ fontWeight:700, color:"#888" }}>{k}:</span> {v||"—"}</div>
                  ))}
                </div>
                {uploadNotes && <div style={{ fontSize:11, color:"#555", marginTop:8, borderTop:`1px solid #A3D9B8`, paddingTop:8 }}>{uploadNotes}</div>}
                <div style={{ display:"flex", gap:10, marginTop:12 }}>
                  <button onClick={confirmUpload} style={{ padding:"8px 20px", background:C.green, color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    Confirmar y completar registro →
                  </button>
                  <button onClick={() => setPendingForm(null)} style={{ padding:"8px 16px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", color:C.navy }}>
                    Descartar
                  </button>
                </div>
              </div>
            )}

            {!pendingForm && (
              <div style={{ display:"flex", gap:10, marginTop:12 }}>
                <button
                  onClick={interpretFile}
                  disabled={uploading || !uploadText.trim()}
                  style={{ padding:"9px 22px", background: uploading ? "#ccc" : C.blue, color:"#fff", border:"none", borderRadius:7, fontSize:13, fontWeight:700, cursor: uploading ? "default" : "pointer" }}>
                  {uploading ? "Interpretando…" : "🤖 Interpretar con IA"}
                </button>
                <button onClick={() => { setUploadText(""); setUploadErr(null); setUploadNotes(null); }} style={{ padding:"9px 18px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", color:C.navy }}>
                  Limpiar
                </button>
              </div>
            )}
          </>}

          {/* ══ REGISTRAR ══ */}
          {tab === "add" && <>
            <div style={{ fontSize:15, fontWeight:700, color:C.navy, marginBottom:4 }}>Registrar seller en benchmark</div>
            <div style={{ fontSize:12, color:C.amber, marginBottom:16, padding:"9px 12px", background:C.la, border:`1px solid #F0C070`, borderRadius:7 }}>
              ⚠ Solo completa este formulario cuando tienes las tasas reales del contrato del seller. Datos estimados no se incluyen en el benchmark.
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 20px", marginBottom:16 }}>
              {([
                ["seller","Nombre del seller *",form.seller,(v:string)=>setForm(f=>({...f,seller:v})),fErr.seller,"text"],
                ["rfc","RFC (opcional)",form.rfc,(v:string)=>setForm(f=>({...f,rfc:v})),null,"text"],
                ["hunter","Hunter (tu nombre) *",form.hunter,(v:string)=>setForm(f=>({...f,hunter:v})),fErr.hunter,"text"],
                ["tpv","TPV mensual MXN *",form.tpv,(v:string)=>setForm(f=>({...f,tpv:v})),fErr.tpv,"number"],
                ["ticket","Ticket promedio MXN *",form.ticket,(v:string)=>setForm(f=>({...f,ticket:v})),fErr.ticket,"number"],
              ] as const).map(([k,lbl,val,onChange,err,type]) => (
                <div key={k}>
                  <label style={LBL}>{lbl}</label>
                  <input style={err?{...INP,border:`2px solid ${C.red}`}:INP} type={type} value={val} onChange={e=>onChange(e.target.value)}/>
                  {err&&<div style={{ fontSize:10,color:C.red,marginTop:2 }}>{err}</div>}
                </div>
              ))}
              <div>
                <label style={LBL}>Industria *</label>
                <select style={fErr.industria?{...SEL,border:`2px solid ${C.red}`}:SEL} value={form.industria} onChange={e=>setForm(f=>({...f,industria:e.target.value}))}>
                  <option value="">Selecciona…</option>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
                {fErr.industria&&<div style={{ fontSize:10,color:C.red,marginTop:2 }}>{fErr.industria}</div>}
              </div>
              <div>
                <label style={LBL}>Producto *</label>
                <select style={SEL} value={form.producto} onChange={e=>setForm(f=>({...f,producto:e.target.value as any,proveedor:""}))}>
                  <option>Point</option><option>Online Payments</option>
                </select>
              </div>
              <div>
                <label style={LBL}>Proveedor actual *</label>
                <select style={fErr.proveedor?{...SEL,border:`2px solid ${C.red}`}:SEL} value={form.proveedor} onChange={e=>setForm(f=>({...f,proveedor:e.target.value}))}>
                  <option value="">Selecciona…</option>{provOpts.map(p=><option key={p}>{p}</option>)}
                </select>
                {fErr.proveedor&&<div style={{ fontSize:10,color:C.red,marginTop:2 }}>{fErr.proveedor}</div>}
              </div>
              <div>
                <label style={LBL}>Razón de pérdida <span style={{ fontWeight:400,fontSize:9,color:"#888" }}>(si aplica)</span></label>
                <input style={INP} value={form.razon_perdida} onChange={e=>setForm(f=>({...f,razon_perdida:e.target.value}))} placeholder="Ej. Precio — seller prefirió Clip"/>
              </div>
            </div>

            {/* Tasas contado */}
            <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${C.border}` }}>
              💳 Tasas de contado
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px 16px", marginBottom:16 }}>
              {(["td","tc","amex","intl"] as const).map(k => (
                <div key={k}>
                  <label style={{ ...LBL, color:C.amber }}>{k==="td"?"T. Débito":k==="tc"?"T. Crédito":k==="amex"?"AMEX":"Internacional"} actual {(k==="td"||k==="tc")?"*":""}</label>
                  <input style={(k==="td"||k==="tc")&&fErr[k]?{...INP,border:`2px solid ${C.red}`}:INP} type="number" step="0.01" placeholder="Ej. 1.67"
                    value={form.tasas[k]} onChange={e=>setForm(f=>({...f,tasas:{...f.tasas,[k]:e.target.value}}))}/>
                  {(k==="td"||k==="tc")&&fErr[k]&&<div style={{ fontSize:10,color:C.red,marginTop:2 }}>{fErr[k]}</div>}
                </div>
              ))}
              {(["td","tc","amex","intl"] as const).map(k => (
                <div key={"mp_"+k}>
                  <label style={{ ...LBL, color:C.green }}>{k==="td"?"T. Débito":k==="tc"?"T. Crédito":k==="amex"?"AMEX":"Internacional"} MP</label>
                  <input style={INP} type="number" step="0.01" placeholder="Ej. 1.11"
                    value={form.tasas_mp[k]} onChange={e=>setForm(f=>({...f,tasas_mp:{...f.tasas_mp,[k]:e.target.value}}))}/>
                </div>
              ))}
            </div>

            {/* MSI */}
            <div style={{ fontSize:12, fontWeight:700, color:C.navy, marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${C.border}` }}>
              📅 Meses sin intereses — activa los plazos que ofrece el seller
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
              {(MSI_PLAZOS as unknown as MsiPlazo[]).map(p => (
                <div key={p} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                  border:`1px solid ${form.msi[p].active?C.blue:C.border}`,
                  borderRadius:7, background:form.msi[p].active?"#EEF6FD":"#FAFAFA",
                }}>
                  <input type="checkbox" checked={form.msi[p].active}
                    onChange={e=>setForm(f=>({...f,msi:{...f.msi,[p]:{...f.msi[p],active:e.target.checked}}}))}
                    style={{ width:14,height:14,cursor:"pointer" }}/>
                  <span style={{ fontSize:12,fontWeight:700,color:C.blue,minWidth:36 }}>{p}</span>
                  {form.msi[p].active && <>
                    <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                      <span style={{ fontSize:10,color:C.amber,fontWeight:700,whiteSpace:"nowrap" }}>Sobretasa actual</span>
                      <input style={{ ...INP,width:70 }} type="number" step="0.01" placeholder="3.20"
                        value={form.msi[p].sb}
                        onChange={e=>setForm(f=>({...f,msi:{...f.msi,[p]:{...f.msi[p],sb:e.target.value}}}))}/>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                      <span style={{ fontSize:10,color:C.green,fontWeight:700,whiteSpace:"nowrap" }}>Sobretasa MP</span>
                      <input style={{ ...INP,width:70 }} type="number" step="0.01" placeholder="3.10"
                        value={form.msi[p].sb_mp}
                        onChange={e=>setForm(f=>({...f,msi:{...f.msi,[p]:{...f.msi[p],sb_mp:e.target.value}}}))}/>
                    </div>
                    <span style={{ fontSize:9,color:"#888",marginLeft:"auto" }}>Tasa base = T. Crédito del seller</span>
                  </>}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={submitForm} style={{ padding:"9px 22px", background:saved?"#ccc":C.blue, color:"#fff", border:"none", borderRadius:7, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                {saved ? "✓ Guardado" : "Guardar en benchmark"}
              </button>
              <button onClick={() => { setForm(emptyForm); setFErr({}); setTab("dashboard"); }} style={{ padding:"9px 18px", background:"#fff", border:`1px solid ${C.border}`, borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer", color:C.navy }}>
                Cancelar
              </button>
            </div>
          </>}

        </div>
      </div>
    </div>
  );
}
