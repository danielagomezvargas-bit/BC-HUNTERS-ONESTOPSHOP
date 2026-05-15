# Snapshot de archivos clave — Business Case Hunters

Este archivo contiene los contratos de interface más importantes para que el agente de merge pueda trabajar sin leer el repo completo.

---

## types/index.ts (completo)

```typescript
export type ProductoKey = "point" | "op";
export type SecKey = "pt" | "op";
export type StatusId = "por_definir" | "en_proceso" | "presentado" | "ganado" | "perdido" | "en_pausa";
export type MsiPlazo = "3x" | "6x" | "9x" | "12x" | "18x" | "24x";

// Paso 1
export interface Negocio {
  nombre: string; rfc: string; industria: string;
  logo: string | null; bdu: BDUResult | null;
}
export interface BDUResult { giro: string; tasa_debito: string; tasa_credito: string; }

// Paso 2
export interface Productos { point: boolean; op: boolean; }

// Paso 3
export interface ProvRow { rates: "si" | "no" | ""; bank: string; }
export type ProvData = Record<string, ProvRow>; // key: `${sec}_${idx}`
export type ProvCounts = { pt: number; op: number };

// Paso 4
export interface ShareOT_PT { td: number; tc: number; amex: number; intl: number; }
export interface ShareOT_OP { td: number; tc: number; amex: number; intl: number; oxxo: number; paycash: number; transfer: number; am: number; }
export type ShareMSI = Record<MsiPlazo, number>;
export interface ShareState { tpv: number; ot: ShareOT_PT | ShareOT_OP; msi: ShareMSI; msiActive: Set<MsiPlazo>; }

// Paso 5
export interface ComOTRow  { l: string; sh: number; cu: number; mp: number; } // cu=tasa actual, mp=tasa MP
export interface ComMSIRow { l: string; sh: number; sb: number; sm: number; } // sb=sobretasa actual, sm=sobretasa MP

// Paso 6
export type PalancaCategory = "producto" | "innovacion" | "marketing";
export interface Palanca { id: string; label: string; desc?: string; icon: string; range: string; category?: PalancaCategory; suboptions?: PalancaSuboption[]; }
export interface PalancaSuboption { id: string; label: string; defaultPct: number; }
```

---

## hooks/useWizard.ts — API pública del hook

```typescript
export function useWizard() {
  return {
    // Navegación
    step: number,
    goNext: () => void,
    goBack: () => void,
    goTo: (n: number) => void,

    // Paso 1
    negocio: Negocio,
    setNegocio: (n: Negocio) => void,

    // Paso 2
    productos: Productos,
    setProductos: (p: Productos) => void,

    // Paso 3
    provCounts: ProvCounts,
    setProvCounts: (c: ProvCounts) => void,
    provData: ProvData,
    updateProvData: (sec: SecKey, idx: number, field: "rates"|"bank", val: string) => void,
    getProvName: (sec: SecKey, idx: number) => string,

    // Paso 4
    sharePT: ShareState,  setSharePT: (s) => void,
    shareOP: ShareState,  setShareOP: (s) => void,
    simLoaded: boolean,   setSimLoaded: (b: boolean) => void,

    // Paso 5
    comPT_OT: ComOTRow[],   comPT_MSI: ComMSIRow[],
    comOP_OT: ComOTRow[],   comOP_MSI: ComMSIRow[],
    updateComOT:  (sec: SecKey, idx: number, field: "cu"|"mp", val: number) => void,
    updateComMSI: (sec: SecKey, idx: number, field: "sb"|"sm", val: number) => void,
    tcActual: (sec: SecKey) => number,
    tcMP:     (sec: SecKey) => number,

    // Paso 6
    propuestaProd: "pt" | "op" | "both",
    setPropuestaProd: (v) => void,
    palancasSel: { pt: Set<string>; op: Set<string> },
    togglePalanca: (sec: "pt"|"op", id: string) => void,
    palancasPct: { pt: Record<string,number>; op: Record<string,number> },
    setPalancaPct: (sec: "pt"|"op", id: string, val: number) => void,

    // Demo
    loadSellerMuestra: () => void,
  }
}
```

---

## data/constants.ts — WIZARD_STEPS y PALANCAS

```typescript
export const WIZARD_STEPS = [
  "Datos del negocio",   // Step 0
  "Producto",            // Step 1
  "Proveedores",         // Step 2
  "Share de pagos",      // Step 3
  "Comisiones",          // Step 4
  "Propuesta de valor",  // Step 5
  "Resultado",           // Step 6
];

export const PALANCAS_PT: Palanca[] = [
  { id: "mas-medios",         label: "Más medios de pago",        ... category: "producto",   range: "0.01–0.5%", suboptions: [{id:"todos",label:"Todos los medios",defaultPct:0.5},...] },
  { id: "msi",                label: "Meses sin intereses",        ... category: "producto",   range: "0.01–0.5%" },
  { id: "bnpl",               label: "BNPL",                       ... category: "producto",   range: "0.1–0.5%"  },
  { id: "link-pago",          label: "Link de pago",               ... category: "innovacion", range: "0.1–3.0%"  },
  { id: "ruteo",              label: "Ruteo inteligente",          ... category: "innovacion", range: "0.1–3.0%"  },
  { id: "cuotas-interes",     label: "Cuotas con interés",         ... category: "innovacion", range: "0.5–3.0%"  },
  { id: "campanas-mensuales", label: "Campañas mensuales",         ... category: "marketing",  range: "0.5–3.0%"  },
  { id: "seasonals",          label: "Estacionalidades",           ... category: "marketing",  range: "0.5–3.0%"  },
  { id: "trafico",            label: "Tráfico digital",            ... category: "marketing",  range: "0.5–3.0%"  },
  { id: "material-pop",       label: "Material POP / In-store",    ... category: "marketing",  range: "0.5–3.0%"  },
];

export const PALANCAS_OP: Palanca[] = [
  // mismas palancas pero para Online Payments
];
```

---

## WizardShell.tsx — Puntos de integración

```typescript
// Líneas 159-193 — AQUÍ SE CONECTAN LOS STEPS:
const steps = [
  <Step1_Datos       negocio={wiz.negocio}     setNegocio={wiz.setNegocio}       onNext={goNext} />,
  <Step2_Producto    productos={wiz.productos}  setProductos={wiz.setProductos}   onNext={goNext} onBack={goBack} />,
  <Step3_Proveedores provData={wiz.provData}    updateProvData={wiz.updateProvData} provCounts={wiz.provCounts} setProvCounts={wiz.setProvCounts} onNext={goNext} onBack={goBack} />,
  <Step4_Share       sharePT={wiz.sharePT}      setSharePT={wiz.setSharePT}       shareOP={wiz.shareOP} setShareOP={wiz.setShareOP} onNext={goNext} onBack={goBack} />,
  <Step5_Comisiones  comPT_OT={wiz.comPT_OT}   updateComOT={wiz.updateComOT}     comPT_MSI={wiz.comPT_MSI} updateComMSI={wiz.updateComMSI} comOP_OT={wiz.comOP_OT} comOP_MSI={wiz.comOP_MSI} onNext={goNext} onBack={goBack} />,
  <Step6_Propuesta   ... />,   // NO CAMBIAR
  <Step7_Resultado   ... />,   // NO CAMBIAR
];
```

> Los Steps 1-5 actualmente son `<EnConstruccion>` (placeholders). Solo hay que importar los componentes reales del simulador inicial y conectarlos con los props de wiz.*.

---

## localStorage schema (simulator_summary)

```typescript
// Guardado por WizardShell.handleGuardarPropuesta() al avanzar Step 6 → Step 7
{
  negocio:       Negocio,
  productos:     { point: boolean, op: boolean },
  comPT_OT:      Array<{ l: string, sh: number, cu: number, mp: number }>,
  comPT_MSI:     Array<{ l: string, sh: number, sb: number, sm: number }>,
  tpvPT:         number,
  comOP_OT:      Array<{ l: string, sh: number, cu: number, mp: number }>,
  comOP_MSI:     Array<{ l: string, sh: number, sb: number, sm: number }>,
  tpvOP:         number,
  propuestaProd: "pt" | "op" | "both",
  palancasSel:   { pt: string[], op: string[] },
  palancasPct:   { pt: Record<string,number>, op: Record<string,number> }
}
```

---

## Defaults de prueba (useWizard.loadSellerMuestra)

```typescript
// Seller demo: Hospital Auna
negocio: { nombre:"Hospital Auna", rfc:"SEM010123AB1", industria:"Salud / Clínicas", logo:"/logo-hospital-auna.svg", bdu:null }
productos: { point:true, op:true }
sharePT: { tpv:10_000_000, ot:{td:29,tc:59,amex:4,intl:2}, msi:{3x:2,6x:3,...}, msiActive:Set["3x","6x","9x","12x"] }
shareOP: { tpv:1_000_000, ot:{td:29,tc:41,amex:13,...}, ... }
comPT_OT: [ {l:"T. Débito",sh:0.29,cu:3,mp:2}, {l:"T. Crédito",sh:0.59,cu:3,mp:2}, {l:"AMEX",sh:0.04,cu:3,mp:2}, {l:"Internacional",sh:0.02,cu:3,mp:2} ]
```

---

## Fórmulas de cálculo (para verificación)

```typescript
// Ahorro comisiones OT:
ahorro_i = TPV × sh_i × (cu_i - mp_i) / 100

// Ahorro MSI (IMPORTANTE: incluye tasa TC base):
tc_cu = comOT.find(r => r.l === "T. Crédito")?.cu ?? 0
tc_mp = comOT.find(r => r.l === "T. Crédito")?.mp ?? 0
ahorro_msi_i = TPV × sh_i × ((tc_cu + sb_i) - (tc_mp + sm_i)) / 100

// Ganancia total:
monthlyGain = Σ ahorro_OT + Σ ahorro_MSI + Σ (TPV × pct_palanca / 100)
```
