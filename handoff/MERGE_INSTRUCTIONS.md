# Instrucciones de Merge — Simulador inicial + Business Case Hunters

## Contexto

Se quieren unir dos proyectos Next.js:

1. **`businescase-hunters`** (este repo) — Tiene los Steps 6-7 completos + todos los exports
2. **Proyecto simulador inicial** — Tiene los Steps 1-5 (datos negocio, productos, proveedores, share, comisiones)

El objetivo es un solo wizard de 7 pasos que:
- Use Steps 1-5 del simulador inicial
- Use Steps 6-7 de businescase-hunters
- Comparta el mismo estado via `useWizard` (o equivalente)
- Mantenga todos los exports actuales

---

## Paso 1 — Analizar el simulador inicial

Antes de hacer cualquier cambio, pídele al usuario que comparta o describe:

- [ ] El `package.json` (versiones de Next.js, React, TypeScript)
- [ ] Los archivos de tipos (`types/index.ts` o similar)
- [ ] El hook de estado global (equivalente a `useWizard.ts`)
- [ ] Los componentes de los Steps 1-5
- [ ] El routing actual (`app/` directory structure)
- [ ] Si usa Supabase u otra DB

Haz las siguientes preguntas clave:
1. ¿Qué estructura tiene el objeto que representa al seller/negocio?
2. ¿Cómo se llaman los campos de TPV, tasas actuales, tasas MP?
3. ¿Los Steps guardan estado en localStorage o solo en React state?
4. ¿Usa Next.js App Router o Pages Router?

---

## Paso 2 — Reconciliar tipos

El archivo `types/index.ts` de businescase-hunters define:

```typescript
// Negocio
{ nombre: string, rfc: string, industria: string, logo: string|null, bdu: BDUResult|null }

// Tasas OT
ComOTRow: { l: string, sh: number, cu: number, mp: number }
// l=label (ej "T. Crédito"), sh=share (0-1), cu=tasa actual (%), mp=tasa MP (%)

// Tasas MSI
ComMSIRow: { l: string, sh: number, sb: number, sm: number }
// sb=sobretasa actual (%), sm=sobretasa MP (%)

// Share State
ShareState: { tpv: number, ot: ShareOT_PT|ShareOT_OP, msi: ShareMSI, msiActive: Set<MsiPlazo> }
```

Si el simulador inicial usa nombres distintos, hay dos opciones:
- **A (Recomendada):** Adaptar los Steps 1-5 para que emitan los mismos tipos
- **B (Alternativa):** Crear un adaptador/mapper que convierta el output del simulador al schema de businescase-hunters

---

## Paso 3 — Integrar useWizard.ts

El `useWizard.ts` de businescase-hunters ya tiene todos los estados de los 7 pasos:

```typescript
// Estado ya existente en useWizard.ts que los Steps 1-5 deben poblar:
const [negocio, setNegocio]       // Step 1
const [productos, setProductos]   // Step 2  
const [provData, updateProvData]  // Step 3
const [sharePT, setSharePT]       // Step 4
const [shareOP, setShareOP]       // Step 4
const [comPT_OT, comPT_MSI, ...]  // Step 5
const [comOP_OT, comOP_MSI, ...]  // Step 5
```

Los Steps del simulador inicial solo necesitan llamar a estos setters.

### Si el simulador tiene su propio hook de estado:
Migrar gradualmente — hacer que cada Step use `setNegocio`, `setProductos`, etc. del `useWizard` de este repo en lugar del hook propio.

---

## Paso 4 — Routing

El routing actual de businescase-hunters:
```
app/
├── page.tsx           → WizardShell (wizard completo)
├── share/page.tsx     → Vista seller
├── pdf/page.tsx       → PDF export
├── benchmark/         → Dashboard benchmarks
├── legacy/            → Simulador viejo (NO TOCAR)
└── api/
    └── export/excel/  → API Excel
```

Si el simulador inicial tiene su propio `app/page.tsx`, hay que decidir:
- Opción A: Reemplazar el WizardShell de businescase-hunters con los Steps del simulador + los steps 6-7
- Opción B: El simulador inicial ocupa un subroute (ej `/simulador`) y luego redirige al wizard completo

**Recomendación:** Opción A — mantener `/` como el wizard completo de 7 pasos.

---

## Paso 5 — WizardShell.tsx

Actualmente `WizardShell.tsx` tiene Steps 1-5 como placeholders (`EnConstruccion`):

```typescript
// WizardShell.tsx — líneas 159-164 (reemplazar estos):
const steps = [
  <EnConstruccion num={1} onNext={goNext} isFirst />,   // ← Step1_Datos del simulador
  <EnConstruccion num={2} onNext={goNext} onBack={goBack} />,  // ← Step2_Producto
  <EnConstruccion num={3} onNext={goNext} onBack={goBack} />,  // ← Step3_Proveedores
  <EnConstruccion num={4} onNext={goNext} onBack={goBack} />,  // ← Step4_Share
  <EnConstruccion num={5} onNext={goNext} onBack={goBack} />,  // ← Step5_Comisiones
  <Step6_Propuesta ... />,  // ← Mantener
  <Step7_Resultado ... />,  // ← Mantener
];
```

Importar los componentes del simulador inicial y reemplazar los placeholders.

### Interface que cada Step debe cumplir:
```typescript
interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  // + sus props específicas desde wiz.*
}
```

---

## Paso 6 — Verificar simulator_summary

Antes de que Step 7 pueda funcionar, `handleGuardarPropuesta` en WizardShell guarda:

```typescript
const summary = {
  negocio:       wiz.negocio,          // populated by Step 1
  productos:     wiz.productos,        // populated by Step 2
  comPT_OT:      wiz.comPT_OT,         // populated by Step 5
  comPT_MSI:     wiz.comPT_MSI,        // populated by Step 5
  tpvPT:         wiz.sharePT.tpv,      // populated by Step 4
  comOP_OT:      wiz.comOP_OT,         // populated by Step 5
  comOP_MSI:     wiz.comOP_MSI,        // populated by Step 5
  tpvOP:         wiz.shareOP.tpv,      // populated by Step 4
  propuestaProd: wiz.propuestaProd,    // populated by Step 6
  palancasSel:   { pt: [...], op: [...] },  // populated by Step 6
  palancasPct:   { pt: {}, op: {} },         // populated by Step 6
}
```

Si los Steps 1-5 del simulador no populan `wiz.comPT_OT`, `wiz.sharePT.tpv`, etc., el PDF/Excel/Share no tendrán datos. Asegurarse de que cada setter se llama correctamente.

---

## Paso 7 — Checklist final pre-merge

- [ ] `types/index.ts` es compatible en ambos proyectos
- [ ] `useWizard.ts` tiene todos los setters necesarios para Steps 1-5
- [ ] `WizardShell.tsx` importa y usa los Steps reales (no placeholders)
- [ ] `handleGuardarPropuesta` guarda el `simulator_summary` completo
- [ ] `Step6_Propuesta` recibe `sharePT.tpv` y `shareOP.tpv` correctos
- [ ] `Step7_Resultado` puede calcular `computeOTRows` y `computeMSIRows` con datos reales
- [ ] El PDF, Excel y Share link generan contenido correcto con datos reales
- [ ] El Gantt precarga el seller name/logo correctamente
- [ ] Las rutas no colisionan
- [ ] Las variables de entorno (Supabase) están disponibles

---

## Archivos clave de referencia en este repo

```
handoff/
├── ARCHITECTURE.md          ← Este documento + descripción completa
├── MERGE_INSTRUCTIONS.md    ← Estas instrucciones
└── KEY_FILES_SNAPSHOT.md    ← Snapshot de los archivos más importantes

src clave:
├── hooks/useWizard.ts       ← Estado global (LEER PRIMERO)
├── types/index.ts           ← Tipos de todo el proyecto
├── components/WizardShell.tsx  ← Orquestador del wizard
├── components/steps/Step6_Propuesta.tsx  ← Step 6 completo
├── components/steps/Step7_Resultado.tsx  ← Step 7 + todos los exports
└── data/constants.ts        ← PALANCAS_PT, PALANCAS_OP, WIZARD_STEPS, COLORS
```
