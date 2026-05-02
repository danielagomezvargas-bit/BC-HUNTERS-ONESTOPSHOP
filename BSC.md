# Business Case Simulator — Guía de Ownership Completa

> **Para: Ricardo**
> Este documento contiene todo lo necesario para operar, modificar y desplegar el Business Case Simulator desde cero. No necesitas a Fernando ni a nadie más — todo está aquí.

---

## Tabla de contenidos

1. [¿Qué es y para qué sirve?](#1-qué-es-y-para-qué-sirve)
2. [Tecnologías](#2-tecnologías)
3. [Setup local desde cero](#3-setup-local-desde-cero)
4. [Estructura de archivos](#4-estructura-de-archivos)
5. [Lógica de cálculo (el corazón)](#5-lógica-de-cálculo-el-corazón)
6. [Rutas API](#6-rutas-api)
7. [Datos: industrias y estacionalidad](#7-datos-industrias-y-estacionalidad)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Despliegue en Vercel](#9-despliegue-en-vercel)
10. [Logging en Airtable](#10-logging-en-airtable)
11. [Colores y branding](#11-colores-y-branding)
12. [Cómo modificar cosas comunes](#12-cómo-modificar-cosas-comunes)
13. [Pendientes conocidos](#13-pendientes-conocidos)

---

## 1. ¿Qué es y para qué sirve?

El **Business Case Simulator** es una web app que los hunters de BS Hunting MX usan para generar propuestas de valor para clientes de Mercado Pago. 

**Flujo del usuario:**
1. Entra a la app (local o Vercel)
2. Llena los datos del cliente: nombre, giro, proveedor actual, TPV mensual, mezcla de pagos, comisiones actuales
3. La app calcula en tiempo real cuánto ahorraría/ganaría el cliente si cambia a MP
4. Descarga el business case en **Excel**, **PDF** o **PowerPoint** ya con marca MP

**URLs:**
- Producción: `https://business-case-simulator.vercel.app`
- Local: `http://localhost:3001`

---

## 2. Tecnologías

| Capa | Tecnología | Para qué |
|------|-----------|---------|
| Framework | **Next.js 14** (App Router) | Routing, SSR, API routes |
| UI | **React 18** + **TypeScript 5** | Interfaz reactiva |
| Estilos | **Tailwind CSS 3.4** | Clases utilitarias |
| Gráficas | **Recharts 3.8** | Gráfica de barras en pantalla |
| Excel | **ExcelJS 4.4** | Genera `.xlsx` con fórmulas y estilos |
| PowerPoint | **pptxgenjs 4.0** | Genera `.pptx` con layout MP |
| PDF | **satori 0.26** + **sharp 0.34** + **pdf-lib 1.17** | JSX → SVG → PNG → PDF |
| Íconos | **Lucide React 0.378** | Íconos en botones |
| Logging | **Airtable API** | Registra cada descarga |
| Deploy | **Vercel** | Hosting y CI/CD |

---

## 3. Setup local desde cero

### Pre-requisitos
- **Node.js 18+** (verifica con `node -v`)
- **npm 9+** (viene con Node)
- No necesitas base de datos local — todo es en memoria o APIs externas

### Pasos

```bash
# 1. Clonar o copiar el proyecto
# (Si tienes acceso al repositorio)
git clone <url-del-repo>
cd business-case-simulator

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno (opcional — ver sección 8)
# Sin este archivo la app funciona igual, solo no loguea en Airtable
echo 'AIRTABLE_TOKEN=<TU_AIRTABLE_TOKEN>' > .env.local

# 4. Correr en desarrollo
npm run dev
# → Abre http://localhost:3001
```

### Si algo falla al instalar

`sharp` a veces da problemas porque usa binarios nativos:
```bash
npm install --ignore-scripts
npm rebuild sharp
```

### Scripts disponibles

```json
"dev":   "next dev -p 3001"    ← desarrollo (hot reload)
"build": "next build"          ← compilar para producción
"start": "next start -p 3001"  ← correr build de producción localmente
```

---

## 4. Estructura de archivos

```
business-case-simulator/
│
├── app/                          ← Todo el código Next.js App Router
│   ├── page.tsx                  ← UI principal + cálculo (1400 líneas)
│   ├── layout.tsx                ← Layout raíz (metadata, fuente)
│   ├── globals.css               ← Solo "@tailwind base/components/utilities"
│   └── api/
│       ├── generate/
│       │   └── route.ts          ← POST /api/generate → devuelve .xlsx
│       ├── generate-pdf/
│       │   └── route.tsx         ← POST /api/generate-pdf → devuelve .pdf
│       ├── generate-ppt/
│       │   └── route.ts          ← POST /api/generate-ppt → devuelve .pptx
│       └── log/
│           └── route.ts          ← POST /api/log → guarda en Airtable
│
├── lib/
│   └── seasonality-data.ts       ← Lista de industrias + benchmarks de estacionalidad + defaults
│
├── public/
│   ├── mp-logo.png               ← Logo MP (usado en PDF/PPT/header)
│   └── fonts/
│       ├── inter-latin-400-normal.woff2   ← Fuente para satori (PDF)
│       └── inter-latin-700-normal.woff2   ← Fuente bold para satori (PDF)
│
├── package.json
├── next.config.js                ← serverComponentsExternalPackages: ['sharp']
├── tailwind.config.ts            ← Colores MP custom (mp-yellow, mp-navy, etc.)
├── tsconfig.json
└── .env.local                    ← NO commitear — contiene AIRTABLE_TOKEN
```

### El archivo más importante: `app/page.tsx`

Tiene 3 responsabilidades en un solo archivo:
1. **`FormState` interface** — todos los campos del formulario tipados
2. **`calculate(f: FormState): CalcResult`** — motor de cálculo (sin estado, función pura)
3. **`HomePage` component** — la UI con React hooks

---

## 5. Lógica de cálculo (el corazón)

Esta es la función que hace todos los números. Está en `app/page.tsx` líneas ~162–292. Es una **función pura** — sin efectos secundarios, sin estado, siempre devuelve lo mismo para los mismos inputs.

### Helpers

```typescript
function n(s: string): number {
  const v = parseFloat(s.replace(/,/g, ''))
  return isNaN(v) ? 0 : v
}
function pct(s: string): number { return n(s) / 100 }
```

`n()` convierte string a número (tolerante a comas).  
`pct()` convierte "1.75" → 0.0175.

### Cálculo Point

```typescript
// Monto por tipo de pago
tdAmt  = tpv × tdShare%
tcAmt  = tpv × tcShare%
amexAmt = tpv × amexShare%
// (igual para MSI 3/6/9/12/18/24 y tarjetas internacionales)

// Ahorro por tipo de pago
tdSave   = (tdCurrent%   - tdMp%)   × tdAmt
tcSave   = (tcCurrent%   - tcMp%)   × tcAmt
amexSave = (amexCurrent% - amexMp%) × amexAmt

// MSI: tasa efectiva = TC base + addon MSI
msi3Save = ((tcCurrent% + msi3Current%) - (tcMp% + msi3Mp%)) × msi3Amt
// (igual para MSI 6, 9, 12, 18, 24)

// Costos fijos (MP cobra $0, proveedor actual cobra X)
deviceRentalSave = deviceRentalMonthly × max(1, deviceQuantity)
networkFeeSave   = networkFeeMonthly

// Total mensual Point
pointCommissionMonthly = suma de todos los saves (comisiones + costos fijos)
pointCommissionAnnual  = pointCommissionMonthly × 12
```

### Cálculo Online Payments (OP)

```typescript
// Comisiones solo aplican sobre TPV efectivamente aprobado con tasa MP
opEffectiveTpv = opTpvMonthly × opAcceptanceRateMp%

// Ahorro comisiones OP (misma lógica que Point)
opTdSave = (opTdCurrent% - opTdMp%) × (opEffectiveTpv × opTdShare%)
// (etc. para TC, AMEX, MSI, internacionales)

opCommissionMonthly = suma de saves OP
opCommissionAnnual  = opCommissionMonthly × 12

// Ganancia por mayor acceptance rate
// ← Esto no es "ahorro en comisión", es revenue adicional por más pagos aprobados
opAcceptanceGainMonthly = opTpvMonthly × (opAcceptanceRateMp% - opAcceptanceRateCurrent%)
opAcceptanceGainAnnual  = opAcceptanceGainMonthly × 12
```

### Crecimiento de ticket

```typescript
// MP históricamente aumenta el ticket promedio del seller
ticketWithMp        = ticketCurrent × (1 + ticketGrowthMp%)
ticketGrowthMonthly = tpvMonthly × ticketGrowthMp%
// Default: 5% de crecimiento en ticket promedio
```

### Estacionalidad

```typescript
// Se aplica sobre el TPV combinado (Point + OP efectivo)
combinedTpv = tpvMonthly + opEffectiveTpv

buenFinIncrement  = combinedTpv × buenFinGrowth%    // 1 vez al año
hotSaleIncrement  = combinedTpv × hotSaleGrowth%    // 1 vez al año
navidadIncrement  = combinedTpv × navidadGrowth%    // 1 vez al año

growthAnnualized = buenFinIncrement + hotSaleIncrement + navidadIncrement + (ticketGrowthMonthly × 12)
```

### Neto final

```typescript
netAnnualized = growthAnnualized + totalCommissionAnnual + opAcceptanceGainAnnual
netMonthly    = netAnnualized / 12

// totalCommissionAnnual = (pointCommissionAnnual + opCommissionAnnual)
// Puede ser NEGATIVO si MP es más caro en alguna dimensión
```

### ⚠️ Reglas de negocio importantes

- **MSI incluye la tasa base de TC** — MSI no es una tasa standalone, es un addon sobre TC. Por eso la fórmula es `(tcCurrent + msiXCurrent) - (tcMp + msiXMp)`.
- **Acceptance OP no es comisión** — es revenue adicional porque más pagos se aprueban. Se suma al neto pero se muestra separado.
- **Costos fijos: MP = $0** — Renta de devices y pago fijo de red se asumen $0 con MP (el seller deja de pagar esos costos).
- **Estacionalidad es TPV incremental, no comisión** — Son pesos adicionales que el seller procesa en esos eventos. El ahorro en comisión sobre ese TPV adicional se calcula por separado como `seasonalCommSavings` (informativo, **no se suma al neto**).

---

## 6. Rutas API

Todas las rutas son **POST** y reciben el mismo objeto `FormState` como body JSON.

### `POST /api/generate` → `.xlsx`

**Archivo:** `app/api/generate/route.ts`

Genera un workbook Excel con ExcelJS. Usa colores MP:
- Navy `#1A1F71`, Yellow `#FFE600`, Blue `#009EE3`
- Celdas editables (INPUT) en amarillo claro
- Celdas calculadas en azul claro

Devuelve `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

### `POST /api/generate-pdf` → `.pdf`

**Archivo:** `app/api/generate-pdf/route.tsx`

Pipeline de renderizado:
```
JSX (React) → satori → SVG → sharp → PNG → pdf-lib → PDF
```

Canvas: 1584×1224px (landscape letter ×2 para alta resolución).

Requiere las fuentes Inter en `public/fonts/` — si no están, el PDF falla.

Devuelve `Content-Type: application/pdf`.

### `POST /api/generate-ppt` → `.pptx`

**Archivo:** `app/api/generate-ppt/route.ts`

Genera una sola slide 13.33"×7.5" con pptxgenjs.  
Layout: header + banda hero navy + 3 columnas (comisiones | estacionalidad | gráfica).

Devuelve `Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation`.

### `POST /api/log` → Airtable

**Archivo:** `app/api/log/route.ts`

Fire-and-forget — el frontend no espera la respuesta.  
Si `AIRTABLE_TOKEN` no está configurado, retorna `{ok: false, reason: 'no_token'}` sin error.

---

## 7. Datos: industrias y estacionalidad

**Archivo:** `lib/seasonality-data.ts`

Este archivo tiene 3 exports principales:

### `INDUSTRIES` — array con los 22 giros disponibles

```typescript
export const INDUSTRIES = [
  'Retail / Tiendas de Ropa y Moda',
  'Restaurantes y Cafeterías',
  'Supermercados y Abarrotes',
  'Farmacias y Salud',
  'Electrónica y Tecnología',
  'Joyería y Accesorios',
  'Servicios Médicos y Dentales',
  'Hoteles y Hospedaje',
  'Educación y Academias',
  'Gimnasios y Bienestar',
  'Salones de Belleza y Estética',
  'Ferretería y Materiales de Construcción',
  'Automotriz y Refaccionarias',
  'Veterinarias',
  'Entretenimiento y Ocio',
  'Gasolineras',
  'E-commerce / Ventas en Línea',
  'Servicios Profesionales',
  'Ópticas',
  'Muebles y Decoración del Hogar',
  'Deportes y Artículos Deportivos',
  'Otro / General',
]
```

### `SEASONALITY_BY_INDUSTRY` — % de crecimiento por evento

Los valores son el incremento porcentual sobre el TPV base mensual durante ese evento (1 vez al año).

| Industria | Buen Fin | Hot Sale | Navidad |
|-----------|---------|---------|---------|
| Retail / Ropa y Moda | 70% | 45% | 90% |
| Restaurantes | 20% | 10% | 55% |
| Supermercados | 30% | 15% | 65% |
| Farmacias | 40% | 20% | 45% |
| Electrónica | 110% | 100% | 130% |
| Joyería | 130% | 35% | 180% |
| Servicios Médicos | 5% | 5% | 10% |
| Hoteles | 25% | 40% | 85% |
| Educación | 10% | 8% | 5% |
| Gimnasios | 15% | 12% | 15% |
| Salones de Belleza | 20% | 10% | 40% |
| Ferretería | 15% | 10% | 20% |
| Automotriz | 10% | 8% | 15% |
| Veterinarias | 8% | 6% | 12% |
| Entretenimiento | 35% | 25% | 70% |
| Gasolineras | 8% | 5% | 12% |
| E-commerce | 160% | 130% | 170% |
| Servicios Profesionales | 5% | 5% | 5% |
| Ópticas | 25% | 15% | 35% |
| Muebles | 65% | 50% | 85% |
| Deportes | 45% | 35% | 55% |
| Otro / General | 40% | 25% | 55% |

### `INDUSTRY_DEFAULTS` — benchmarks cuando el seller no tiene datos

Se activan con el toggle "¿Cuentas con datos del seller? → No".

| Industria | TPV/mes | Ticket | TD% | TC% | AMEX% | MSI3% | MSI6% | MSI9% |
|-----------|--------|--------|-----|-----|-------|-------|-------|-------|
| Retail | $3.5M | $580 | 35 | 42 | 5 | 12 | 4 | 1 |
| Restaurantes | $2.8M | $320 | 48 | 38 | 4 | 8 | 1 | 0 |
| Supermercados | $8M | $420 | 55 | 35 | 3 | 5 | 1 | 0 |
| Farmacias | $4.5M | $280 | 58 | 32 | 3 | 5 | 1 | 0 |
| Electrónica | $6M | $1,800 | 22 | 38 | 5 | 18 | 10 | 4 |
| Joyería | $2.2M | $2,400 | 18 | 40 | 10 | 15 | 10 | 5 |
| Servicios Médicos | $1.8M | $850 | 45 | 38 | 5 | 8 | 3 | 1 |
| Hoteles | $5M | $2,200 | 30 | 42 | 8 | 8 | 4 | 2 |
| Educación | $1.2M | $3,500 | 42 | 40 | 3 | 8 | 5 | 2 |
| Gimnasios | $900K | $650 | 48 | 38 | 4 | 8 | 2 | 0 |
| Salones de Belleza | $600K | $380 | 55 | 35 | 3 | 5 | 1 | 0 |
| Ferretería | $3.2M | $720 | 50 | 35 | 3 | 8 | 3 | 1 |
| Automotriz | $2.5M | $950 | 45 | 38 | 4 | 8 | 3 | 1 |
| Veterinarias | $800K | $480 | 52 | 36 | 3 | 6 | 2 | 0 |
| Entretenimiento | $2M | $520 | 40 | 42 | 5 | 8 | 3 | 1 |
| Gasolineras | $12M | $600 | 70 | 25 | 3 | 1 | 0 | 0 |
| E-commerce | $4.5M | $680 | 28 | 48 | 6 | 10 | 6 | 4 |
| Servicios Profesionales | $1.5M | $4,500 | 38 | 42 | 8 | 6 | 4 | 2 |
| Ópticas | $1.2M | $1,800 | 42 | 40 | 5 | 8 | 4 | 1 |
| Muebles | $2.8M | $3,200 | 28 | 40 | 5 | 15 | 8 | 4 |
| Deportes | $2M | $820 | 38 | 42 | 5 | 10 | 4 | 1 |
| Otro / General | $3M | $500 | 43 | 41 | 4 | 10 | 2 | 0 |

---

## 8. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (nunca lo commits):

```bash
# Token de Airtable para logging
# Si no lo configuras, la app funciona igual (solo no loguea descargas)
AIRTABLE_TOKEN=<TU_AIRTABLE_TOKEN>
```

**No hay más variables de entorno necesarias.** Excel, PDF y PPT se generan todo server-side sin deps externas.

En Vercel ya está configurado — si despliegas a un proyecto Vercel nuevo, necesitas agregarlo en:  
`Settings → Environment Variables → AIRTABLE_TOKEN`

---

## 9. Despliegue en Vercel

### Proyecto existente (recomendado)
```bash
# Desde la carpeta del proyecto
npx vercel --prod
```
Te pedirá login si no tienes sesión. Asocia al proyecto `business-case-simulator`.

### Proyecto nuevo desde cero
```bash
# 1. Login
npx vercel login

# 2. Deploy (primera vez te pregunta si crear nuevo proyecto)
npx vercel

# 3. Agregar variable de entorno en el dashboard de Vercel:
# Settings → Environment Variables
# AIRTABLE_TOKEN = <TU_AIRTABLE_TOKEN>

# 4. Redesplegar para que tome la variable
npx vercel --prod
```

### Consideraciones para Vercel

- `sharp` está marcado como `serverComponentsExternalPackages` en `next.config.js` — no tocar eso o el PDF falla
- Las fuentes Inter en `public/fonts/` se sirven estáticamente — deben estar en el repo
- Los timeouts de Vercel (10s default en plan gratuito, 60s en Pro) pueden afectar PDFs/PPTs grandes

---

## 10. Logging en Airtable

Cada vez que el usuario hace clic en PDF, PPT o Excel, se dispara `fireLog()` en `page.tsx`. Esto llama a `POST /api/log` que escribe en Airtable.

### Configuración

- **Base ID:** `appcm4BnunNpcCnJW`
- **Tabla:** `BCS_Simulator_Log`
- **Token:** `Se define en variable de entorno AIRTABLE_TOKEN`

### Campos que se guardan (61 columnas)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| Timestamp | Text | ISO 8601 |
| Cliente | Text | Nombre del cliente |
| RFC | Text | RFC opcional |
| Industria | Text | Giro seleccionado |
| Proveedor Actual | Text | Proveedor seleccionado |
| Tiene Datos | Text | "yes" o "no" |
| TPV Point | Number | TPV mensual Point en MXN |
| TPV OP | Number | TPV mensual OP en MXN |
| Ticket | Number | Ticket promedio |
| Neto Anualizado | Number | Impacto neto total anual |
| Comision Anual | Number | Delta comisiones anuales |
| Buen Fin | Number | Incremento Buen Fin |
| Hot Sale | Number | Incremento Hot Sale |
| Navidad | Number | Incremento Navidad |
| Mix TD/TC/AMEX/MSI*/Int Point | Number | % de mezcla por medio (11 cols) |
| Tasa TD/TC/AMEX/MSI*/Int Point | Number | Tasa proveedor actual por medio (11 cols) |
| Mix TD/TC/AMEX/MSI*/Int OP | Number | % mezcla OP (11 cols) |
| Tasa TD/TC/AMEX/MSI*/Int OP | Number | Tasa OP proveedor actual (11 cols) |
| Renta Device/mes | Number | Costo renta mensual por device |
| Cantidad Devices | Number | Número de devices |
| Pago Red/mes | Number | Pago fijo de red mensual |

### Para acceder a los registros

Entra a `https://airtable.com` → busca la base `BCS_Simulator_Log` o comparte el token con quien necesite acceso.

---

## 11. Colores y branding

Definidos en `tailwind.config.ts` y reutilizados en PDF/PPT hardcodeados:

| Token Tailwind | Hex | Uso |
|----------------|-----|-----|
| `mp-yellow` | `#FFE600` | Botón Excel, headline principal, acentos |
| `mp-navy` | `#1A1F71` | Fondos oscuros, textos importantes |
| `mp-blue` | `#009EE3` | Tasa MP (campos azules), OP section |
| `mp-dark` | `#333333` | Textos secundarios oscuros |

Logo MP: `public/mp-logo.png` — se embebe en base64 en PDF y PPT.

---

## 12. Cómo modificar cosas comunes

### Agregar una nueva industria

1. En `lib/seasonality-data.ts`, agregar el nombre al array `INDUSTRIES`
2. En `SEASONALITY_BY_INDUSTRY`, agregar la clave con los 3 valores (buenFin, hotSale, navidad)
3. En `INDUSTRY_DEFAULTS`, agregar los benchmarks del giro
4. El dropdown en la UI se actualiza automáticamente

### Cambiar las tasas MP default

En `app/page.tsx`, objeto `DEFAULT_FORM`:
```typescript
tdMp: '1.90',    // TD débito
tcMp: '2.00',    // TC crédito
amexMp: '3.40',  // AMEX
msi3Mp: '4.00',  // MSI 3 meses
msi6Mp: '4.50',  // MSI 6 meses
msi9Mp: '5.00',  // MSI 9 meses
msi12Mp: '5.50', // MSI 12 meses
msi18Mp: '6.50', // MSI 18 meses
msi24Mp: '7.50', // MSI 24 meses
tcIntMp: '3.60', // TC Internacional
tdIntMp: '2.50', // TD Internacional
```

Los mismos campos con prefijo `op` son para Online Payments.

### Cambiar el TPV y ticket default

```typescript
tpvMonthly: '7000000',  // $7M mensual
ticketCurrent: '300',   // $300 ticket promedio
```

### Agregar un nuevo proveedor al dropdown

En `app/page.tsx` línea ~807, array hardcodeado:
```typescript
{[
  'Banamex / Citibanamex', 'BBVA Bancomer', 'Santander', ...
  'TuNuevoProveedor',  // ← agregar aquí
].map((p) => <option key={p} value={p}>{p}</option>)}
```

### Cambiar el diseño del Excel

`app/api/generate/route.ts` — busca los colores en hexadecimal y los estilos de ExcelJS. La estructura de celdas está documentada con comentarios dentro del archivo.

### Cambiar el diseño del PDF

`app/api/generate-pdf/route.tsx` — es JSX renderizado con satori. Las dimensiones del canvas son `1584×1224`. Modifica el JSX como si fuera HTML/CSS normal (satori soporta un subset de CSS Flexbox).

### Cambiar el diseño del PPT

`app/api/generate-ppt/route.ts` — usa pptxgenjs. Las posiciones son en pulgadas (slide de 13.33"×7.5"). Consulta la [documentación de pptxgenjs](https://gitbrent.github.io/PptxGenJS/) si necesitas agregar shapes o cambiar el layout.

### Agregar un campo nuevo al formulario

1. Agregar el campo a la interface `FormState` en `page.tsx`
2. Agregar valor default en `DEFAULT_FORM`
3. Agregar el input en el JSX (seguir el patrón de `<Field>` o `<PaymentRow>`)
4. Usar el campo en `calculate()` si afecta los números
5. Si quieres loguearlo, agregar al payload en `fireLog()` y en `app/api/log/route.ts`

---

## 13. Pendientes conocidos

### BDU integration (RFC → Giro)
Fernando quería que al ingresar el RFC, la app consulte BDU (base de datos MELI) y muestre el giro automáticamente. El campo RFC ya existe pero el badge que aparece dice "Giro BDU: —". Pendiente integrar el lookup. Busca en `page.tsx` el comentario `// TODO: BDU integration`.

### Fury deployment bloqueado
Se intentó migrar a Fury (infraestructura MELI) pero está bloqueado por permiso `fury-applications:app-create-hidden-tech`. Mientras tanto vive en Vercel sin problema.

### PPT/PDF timeout en Vercel Free
En el plan gratuito de Vercel, las funciones serverless tienen 10s de timeout. Para clientes con muchos datos o imágenes pesadas, el PDF puede fallar. Solución: upgradar a Vercel Pro (60s) o usar generación en background con presigned URLs.

### No hay persistencia de sesión
Si el usuario recarga la página, pierde los datos del formulario. Para agregar persistencia se podría usar `localStorage` o una cookie.

---

## Quick reference — archivos y sus líneas clave

| Archivo | Líneas importantes |
|---------|-------------------|
| `app/page.tsx` | 1–67: interfaces TypeScript |
| | 69–109: `DEFAULT_FORM` con todos los valores default |
| | 112–292: función `calculate()` — toda la lógica de negocio |
| | 294–302: `fmtMXN()` — formateador de moneda |
| | 470+: `HomePage` — componente principal con hooks |
| | 525–526: `calculate(form)` — se llama en cada render |
| | 538–577: `fireLog()` — qué manda a Airtable |
| | 579–665: handlers de descarga (Excel/PDF/PPT) |
| `lib/seasonality-data.ts` | 12–35: lista de industrias |
| | 48–71: benchmarks estacionalidad |
| | 92–115: defaults por industria |
| `app/api/log/route.ts` | 6–7: constantes Airtable (Base ID + URL) |
| | 44+: función POST — mapeo de campos |

---

*Documento generado el 2026-04-21. El código fuente completo está en la carpeta del proyecto.*
