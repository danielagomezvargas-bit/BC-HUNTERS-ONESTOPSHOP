"use client";
import { useState, useCallback } from "react";
import type {
  Negocio, Productos, ProvData, ProvCounts,
  ShareState, ComOTRow, ComMSIRow,
  SecKey, MsiPlazo,
} from "@/types";
import { MSI_PLAZOS } from "@/data/constants";

// ── Defaults ─────────────────────────────────────────────────────
const defaultNegocio: Negocio = { nombre:"", rfc:"", industria:"", logo:null, bdu:null };
const defaultProductos: Productos = { point:false, op:false };

const defaultSharePT: ShareState = {
  tpv: 30_000_000,
  ot:  { td:29, tc:59, amex:4, intl:2 },
  msi: { "3x":2,"6x":3,"9x":1,"12x":0,"18x":0,"24x":0 },
  msiActive: new Set<MsiPlazo>(["3x","6x","9x","12x"]),
};
const defaultShareOP: ShareState = {
  tpv: 300_000,
  ot:  { td:29, tc:41, amex:13, intl:2, oxxo:2, paycash:2, transfer:4, am:0 } as any,
  msi: { "3x":0,"6x":0,"9x":0,"12x":5,"18x":1,"24x":0 },
  msiActive: new Set<MsiPlazo>(["3x","6x","12x","18x"]),
};

const defaultComPT_OT: ComOTRow[] = [
  { l:"T. Débito",    sh:0.29, cu:1.15, mp:1.11 },
  { l:"T. Crédito",   sh:0.59, cu:1.67, mp:1.67 },
  { l:"AMEX",         sh:0.04, cu:3.50, mp:3.40 },
  { l:"Internacional",sh:0.02, cu:2.50, mp:3.20 },
];
const defaultComPT_MSI: ComMSIRow[] = [
  { l:"MSI 3x",  sh:0.14, sb:3.20, sm:3.10 },
  { l:"MSI 6x",  sh:0.09, sb:4.80, sm:4.67 },
  { l:"MSI 12x", sh:0.01, sb:7.50, sm:7.40 },
  { l:"MSI 18x", sh:0.02, sb:10.5, sm:10.4 },
  { l:"MSI 24x", sh:0.00, sb:16.0, sm:16.0 },
];
const defaultComOP_OT: ComOTRow[] = [
  { l:"T. Débito",       sh:0.29, cu:1.60, mp:1.10 },
  { l:"T. Crédito",      sh:0.41, cu:1.90, mp:1.87 },
  { l:"AMEX",            sh:0.13, cu:3.40, mp:3.40 },
  { l:"Internacional",   sh:0.03, cu:3.40, mp:3.20 },
  { l:"OXXO",            sh:0.02, cu:3.00, mp:3.30 },
  { l:"Red PayCash",     sh:0.02, cu:3.00, mp:3.30 },
  { l:"Dep. y Transf.",  sh:0.04, cu:3.00, mp:2.00 },
  { l:"AM & MP Crédito", sh:0.00, cu:1.10, mp:1.10 },
];
const defaultComOP_MSI: ComMSIRow[] = [
  { l:"MSI 3x",  sh:0.00, sb:3.10, sm:3.10 },
  { l:"MSI 6x",  sh:0.00, sb:4.67, sm:4.67 },
  { l:"MSI 12x", sh:0.05, sb:10.4, sm:10.4 },
  { l:"MSI 18x", sh:0.01, sb:16.0, sm:16.0 },
];

// ── Hook ─────────────────────────────────────────────────────────
export function useWizard() {
  const [step, setStep] = useState(0);

  // Paso 1
  const [negocio, setNegocio] = useState<Negocio>(defaultNegocio);

  // Paso 2
  const [productos, setProductos] = useState<Productos>(defaultProductos);

  // Paso 3
  const [provCounts, setProvCounts] = useState<ProvCounts>({ pt:1, op:1 });
  const [provData, setProvData] = useState<ProvData>({});

  // Paso 4
  const [sharePT, setSharePT] = useState<ShareState>(defaultSharePT);
  const [shareOP, setShareOP] = useState<ShareState>(defaultShareOP);
  const [simLoaded, setSimLoaded] = useState(false);

  // Paso 5
  const [comPT_OT, setComPT_OT] = useState<ComOTRow[]>(defaultComPT_OT);
  const [comPT_MSI, setComPT_MSI] = useState<ComMSIRow[]>(defaultComPT_MSI);
  const [comOP_OT, setComOP_OT] = useState<ComOTRow[]>(defaultComOP_OT);
  const [comOP_MSI, setComOP_MSI] = useState<ComMSIRow[]>(defaultComOP_MSI);

  // Paso 6
  const [propuestaProd, setPropuestaProd] = useState<"pt"|"op"|"both">("pt");
  const [palancasSel, setPalancasSel] = useState<{ pt: Set<string>; op: Set<string> }>({ pt: new Set(), op: new Set() });
  const [palancasPct, setPalancasPct] = useState<{ pt: Record<string,number>; op: Record<string,number> }>({ pt:{}, op:{} });

  // ── Helpers ──────────────────────────────────────────────────
  const getProvName = useCallback((sec: SecKey, idx: number): string =>
    provData[`${sec}_${idx}`]?.bank || "", [provData]);

  const updateProvData = useCallback((sec: SecKey, idx: number, field: "rates"|"bank", val: string) => {
    const key = `${sec}_${idx}`;
    setProvData(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  }, []);

  const tcActual = useCallback((sec: SecKey): number =>
    (sec === "pt" ? comPT_OT : comOP_OT).find(r => r.l === "T. Crédito")?.cu || 0,
    [comPT_OT, comOP_OT]);

  const tcMP = useCallback((sec: SecKey): number =>
    (sec === "pt" ? comPT_OT : comOP_OT).find(r => r.l === "T. Crédito")?.mp || 0,
    [comPT_OT, comOP_OT]);

  const updateComOT = useCallback((sec: SecKey, idx: number, field: "cu"|"mp", val: number) => {
    const setter = sec === "pt" ? setComPT_OT : setComOP_OT;
    setter(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }, []);

  const updateComMSI = useCallback((sec: SecKey, idx: number, field: "sb"|"sm", val: number) => {
    const setter = sec === "pt" ? setComPT_MSI : setComOP_MSI;
    setter(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  }, []);

  const togglePalanca = useCallback((sec: "pt"|"op", id: string) => {
    setPalancasSel(prev => {
      const next = new Set(prev[sec]);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [sec]: next };
    });
  }, []);

  const setPalancaPct = useCallback((sec: "pt"|"op", id: string, val: number) => {
    setPalancasPct(prev => ({ ...prev, [sec]: { ...prev[sec], [id]: val } }));
  }, []);

  // ── Navigation ───────────────────────────────────────────────
  const goNext = useCallback(() => setStep(s => Math.min(s + 1, 5)), []);
  const goBack = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);
  const goTo   = useCallback((n: number) => setStep(n), []);

  return {
    step, goNext, goBack, goTo,
    negocio, setNegocio,
    productos, setProductos,
    provCounts, setProvCounts,
    provData, updateProvData, getProvName,
    sharePT, setSharePT,
    shareOP, setShareOP,
    simLoaded, setSimLoaded,
    comPT_OT, comPT_MSI, comOP_OT, comOP_MSI,
    updateComOT, updateComMSI, tcActual, tcMP,
    propuestaProd, setPropuestaProd,
    palancasSel, togglePalanca,
    palancasPct, setPalancaPct,
  };
}
