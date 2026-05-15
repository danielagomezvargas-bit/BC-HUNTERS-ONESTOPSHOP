# Business Case Simulator — Arquitectura Completa

**Repo:** `danielagomezvargas-bit/Busseinesscase-hunters-monetizacion`  
**Branch activo:** `dev`  
**Stack:** Next.js 14 App Router · TypeScript · React 18 · Tailwind (solo para ui/) · inline styles (componentes del wizard)  
**Deploy:** Vercel (pendiente)

---

## 1. Propósito de la aplicación

Herramienta interna para **hunters de Mercado Pago México** que les permite:
1. Construir un Business Case personalizado para un seller
2. Comparar tasas actuales vs. tasas MP
3. Calcular ahorro en comisiones + incremental de ventas con palancas de valor
4. Exportar propuesta en PDF, Excel, Slide PNG y link para el seller

---

## 2. Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/` | Wizard completo (7 pasos) — ruta principal |
| `/share#<base64>` | Vista read-only para el seller (sin edición) |
| `/pdf` | Renderiza el PDF del business case (abre en nueva tab) |
| `/benchmark` | Dashboard de benchmarks por seller/industria |
| `/legacy` | Simulador monolítico viejo (deprecado, no tocar) |
| `/gantt/index.html` | Gantt standalone (iframe + nueva pestaña) |
| `/api/export/excel` | POST → genera .xlsx con ExcelJS |

---

## 3. Wizard — Flujo de 7 pasos

```
Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6
Datos     Producto  Proveed.  Share    Comisiones  Propuesta  Resultado
negocio             /bancos   pagos                valor
```

### Estado global: `hooks/useWizard.ts`
Todos los pasos comparten estado via `useWizard()`. Se expone desde `WizardShell.tsx`.

```typescript
// Tipos clave (types/index.ts)
Negocio       { nombre, rfc, industria, logo, bdu }
Productos     { point: boolean, op: boolean }
ShareState    { tpv, ot: ShareOT_PT|ShareOT_OP, msi: ShareMSI, msiActive }
ComOTRow      { l, sh, cu, mp }   // l=label, sh=share, cu=tasa actual, mp=tasa MP
ComMSIRow     { l, sh, sb, sm }   // sb=sobretasa actual, sm=sobretasa MP
Palanca       { id, label, desc, icon, range, category, suboptions? }
```

### Paso a paso

**Step 1** (`Step1_Datos`) — En construcción (usa placeholder genérico de WizardShell)
- Captura: nombre seller, RFC, industria, logo

**Step 2** (`Step2_Producto`) — En construcción
- Selecciona: Point, Online Payments, o ambos

**Step 3** (`Step3_Proveedores`) — En construcción
- Lista de bancos/proveedores actuales con toggle "tienen tasas / no tienen tasas"

**Step 4** (`Step4_Share`) — En construcción
- Distribución del TPV: % débito, crédito, AMEX, internacional, OXXO, etc.
- MSI por plazos (3x, 6x, 12x, 18x, 24x)

**Step 5** (`Step5_Comisiones`) — En construcción
- Tasas actuales vs tasas MP por medio de pago
- Sobretasas MSI

**Step 6** (`Step6_Propuesta`) — FUNCIONAL
- Catálogo de palancas agrupadas por categoría (producto/innovación/marketing)
- Sliders 0-3% por palanca
- Sub-opciones con % individuales
- Cálculo de impacto en tiempo real
- Escenarios: Reservado / Industria

**Step 7** (`Step7_Resultado`) — FUNCIONAL
- YellowHeader con ícono tendencia + "Estarás generando +$X al mes / a tu seller: Nombre"
- Ecuación: Ahorro tasas + Incremental ventas = Ganancia total
- Toggle de detalle: desglose por canal con tablas de comisiones
- Próximos pasos: PDF, Excel, Gantt, Slide, Share link

---

## 4. Lógica de negocio crítica

### Fórmula de ahorro en tasas (OT — One-time/contado)
```
ahorro = TPV × share_i × (tasa_actual_i - tasa_MP_i) / 100
```

### Fórmula MSI (IMPORTANTE — corrección implementada)
```
tasa_total_actual = tasa_TC_credito_actual + sobretasa_actual
tasa_total_MP     = tasa_TC_credito_MP     + sobretasa_MP
ahorro_MSI        = TPV × share_MSI × (tasa_total_actual - tasa_total_MP) / 100
```
> La sobretasa MSI es ADICIONAL a la comisión de crédito. Ambas se suman para el costo total.

### Cálculo de impacto de palancas
```
impacto_palanca = TPV × pct_palanca / 100
impacto_total   = Σ impacto_palancas_seleccionadas
```

### Ganancia total mensual
```
monthlyGain = totalSave (ahorro comisiones) + incrSalesMxn (palancas)
```

---

## 5. Exports

### PDF (`app/pdf/page.tsx`)
- Renderiza HTML styled como PDF (imprimible)
- Usa fuentes Proxima Nova desde `/public/pdf-assets/fonts/`
- DocHeader con logo MP × seller en cada página
- Páginas: Portada, Detalle Point, Detalle OP, Palancas

### Excel (`app/api/export/excel/route.ts`)
- POST recibe JSON del `localStorage.simulator_summary`
- Genera .xlsx con ExcelJS con hojas: Resumen, OT Point, MSI Point, OT OP, MSI OP, Palancas

### Slide de comisiones (`components/SlideComisionesModal.tsx`)
- Modal 1920×1080 escalado (preview a ~920px)
- Tabs: Point / OP / Combo
- Columnas: logos de medios de pago (Visa/MC, Amex, Débito, etc.)
- Export PNG solo del slide activo via `html-to-image`
- Modal resizable desde esquina inferior derecha

### Gantt (`public/gantt/`)
- `index.html` — entry point, carga React+Babel+PptxGenJS desde CDN
- `gantt.jsx` — componente React completo (66KB)
- `gantt-export.js` — export PPTX programático (fallback)
- `image-slot.js` — web component para logo drop
- Export PNG: canvas programático 1920×auto con smart crop a fecha de fin

### Share link (`app/share/page.tsx`)
- Decodifica datos de URL hash (`atob` + `decodeURIComponent`)
- Read-only: sin botones de edición, sin NextSteps, sin InternalFooter
- Header amarillo + reveal progresivo de 3 tarjetas
- Cintilla igual al PDF (logo MP × seller + seller name)

---

## 6. localStorage

El componente `WizardShell.tsx` guarda al avanzar de Step 6 a Step 7:
```javascript
localStorage.setItem("simulator_summary", JSON.stringify({
  negocio, productos,
  comPT_OT, comPT_MSI, tpvPT,
  comOP_OT, comOP_MSI, tpvOP,
  propuestaProd,
  palancasSel: { pt: Array.from(palancasSel.pt), op: Array.from(palancasSel.op) },
  palancasPct,
}))
```

El Gantt (`public/gantt/index.html`) lee esto para precargar:
```javascript
window.GANTT_INIT = {
  sellerName: summary.negocio.nombre,
  sellerLogo: summary.negocio.logo,
  startDate:  new Date().toISOString().split('T')[0],
}
```

---

## 7. Datos de prueba / Demo seller

El mock data se activa con el botón "Cargar Seller Muestra" en Step 0:

```typescript
// hooks/useWizard.ts → loadSellerMuestra()
negocio: { nombre: "Hospital Auna", industria: "Salud / Clínicas", logo: "/logo-hospital-auna.svg" }
tpvPT: 10_000_000   // $10M MXN/mes Point
tpvOP: 1_000_000    // $1M MXN/mes Online Payments
// tasas actuales: 3% en todos los medios
// tasas MP: 2% en todos los medios
```

---

## 8. Palancas de valor (catálogo)

Definidas en `data/constants.ts` como `PALANCAS_PT` y `PALANCAS_OP`.

Categorías:
- `producto` — Más medios de pago, MSI, BNPL, Link de pago, Ruteo
- `innovacion` — Cuotas con interés
- `marketing` — Campañas mensuales, Seasonal, Tráfico, Material POP

Cada palanca tiene:
- `range` — ej. "0.5–3.0%" (rango de impacto esperado)
- `suboptions?` — sub-opciones con defaultPct individual
- `category` — para colores/agrupación en Step 6

---

## 9. Topbar y Stepper

**Topbar** (`components/ui/Topbar.tsx`)
- Logo MP + logo seller (si existe en negocio.logo)
- Título "Business Case Simulator"
- Botón "Inicio" con confirmación → `window.location.href = "/"`

**Stepper** (`components/ui/Stepper.tsx`)
- 7 pasos: Datos negocio, Producto, Proveedores, Share de pagos, Comisiones, Propuesta de valor, Resultado
- Pasos completados (verde ✓): clickables → navegación hacia atrás
- Paso actual (azul): no clickable
- Pasos futuros (gris): no clickables
- Props: `currentStep`, `onGoTo`

---

## 10. Variables de entorno

```env
# .env.local (no en repo)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```
Supabase se usa en `/benchmark` para leer/escribir benchmarks.

---

## 11. Assets públicos

```
public/
├── mp-logo.png                    # Logo MP horizontal (colores)
├── mp-logo-white.png              # Logo MP horizontal (blanco)
├── logo-manitas.png               # Mark/ícono MP (solo el apretón de manos)
├── logo-hospital-auna.svg         # Logo demo seller
├── gantt/
│   ├── index.html                 # Entry point Gantt (carga CDN scripts)
│   ├── gantt.jsx                  # Componente React del Gantt
│   ├── gantt-export.js            # Export PPTX programático
│   ├── image-slot.js              # Web component logo slot
│   ├── colors_and_type.css        # Tokens Andes X
│   └── fonts.css                  # Proxima Nova → /pdf-assets/fonts/
└── pdf-assets/
    ├── fonts/                     # Proxima Nova (.otf)
    ├── logo-mercadopago.svg
    └── mark-mercadopago.svg
```

---

## 12. Dependencias clave del package.json

```json
{
  "next": "14.2.3",
  "react": "^18",
  "exceljs": "*",
  "html-to-image": "*",
  "@supabase/supabase-js": "*"
}
```

---

## 13. Notas para el merge con el proyecto del simulador

### Lo que tiene **este repo** (Business Case Hunters):
- Steps 6 y 7 completamente funcionales
- Todos los exports (PDF, Excel, Slide, Gantt, Share)
- Sistema de palancas de valor
- Templates de email
- Benchmark dashboard

### Lo que tiene el **otro proyecto** (simulador inicial):
- Steps 1-5 funcionales (datos negocio, productos, proveedores, share, comisiones)
- Posiblemente diferente estructura de estado
- Posiblemente diferente routing

### Para el merge, el agente necesita:
1. Ver los tipos en `types/index.ts` de ambos proyectos (deben ser compatibles)
2. Ver `useWizard.ts` de ambos proyectos
3. Los Steps 1-5 del simulador deben poder usar el mismo estado que espera `Step6_Propuesta`
4. Asegurarse de que `simulator_summary` en localStorage tiene el mismo schema
5. Verificar que el routing de Next.js no colisione

### Schema mínimo de `simulator_summary` que necesita Step 7:
```typescript
{
  negocio:       Negocio,
  productos:     Productos,
  comPT_OT:      ComOTRow[],
  comPT_MSI:     ComMSIRow[],
  tpvPT:         number,
  comOP_OT:      ComOTRow[],
  comOP_MSI:     ComMSIRow[],
  tpvOP:         number,
  propuestaProd: "pt" | "op" | "both",
  palancasSel:   { pt: string[], op: string[] },
  palancasPct:   { pt: Record<string,number>, op: Record<string,number> },
}
```
