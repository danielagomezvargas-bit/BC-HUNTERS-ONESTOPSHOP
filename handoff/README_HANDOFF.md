# Handoff — Business Case Hunters

**Para Claude en otra terminal:** Lee este README primero, luego ARCHITECTURE.md, luego KEY_FILES_SNAPSHOT.md, luego MERGE_INSTRUCTIONS.md.

---

## TL;DR para el agente de merge

Estás recibiendo el repo `businescase-hunters` (branch `dev`) que tiene:
- ✅ Steps 6 y 7 del wizard completamente funcionales
- ✅ Todos los exports: PDF, Excel, Slide PNG, Gantt, Share link
- ⬜ Steps 1-5 son placeholders (`EnConstruccion`) — estos vienen del otro proyecto

Tu tarea es **integrar los Steps 1-5 del simulador inicial** para completar el wizard de 7 pasos.

---

## Comandos para empezar

```bash
# Clonar el repo
git clone https://github.com/danielagomezvargas-bit/Busseinesscase-hunters-monetizacion.git
cd Busseinesscase-hunters-monetizacion
git checkout dev

# Instalar
npm install

# Correr local (usa puerto 3001 por convención del proyecto)
npm run dev -- --port 3001
```

---

## Archivos en esta carpeta

| Archivo | Contenido |
|---------|-----------|
| `README_HANDOFF.md` | Este archivo — empieza aquí |
| `ARCHITECTURE.md` | Arquitectura completa de la app, todas las rutas, lógica de negocio |
| `MERGE_INSTRUCTIONS.md` | Paso a paso para hacer el merge con el simulador inicial |
| `KEY_FILES_SNAPSHOT.md` | Contratos TypeScript y schemas sin tener que abrir todos los archivos |

---

## Estructura del repo (lo más importante)

```
businescase-hunters/
├── app/
│   ├── page.tsx              ← WizardShell (wizard de 7 pasos)
│   ├── share/page.tsx        ← Vista read-only para sellers
│   ├── pdf/page.tsx          ← PDF export
│   └── api/export/excel/     ← API Excel
├── components/
│   ├── WizardShell.tsx       ← ORQUESTADOR PRINCIPAL — leer primero
│   ├── steps/
│   │   ├── Step6_Propuesta.tsx   ← Palancas de valor (COMPLETO)
│   │   └── Step7_Resultado.tsx   ← Resultado + exports (COMPLETO)
│   ├── SlideComisionesModal.tsx  ← Slide de comisiones
│   ├── GanttModal.tsx            ← Modal del Gantt
│   └── DownloadModal.tsx         ← Modal de exportar
├── hooks/
│   └── useWizard.ts          ← ESTADO GLOBAL — leer segundo
├── types/
│   └── index.ts              ← TIPOS — leer tercero
├── data/
│   └── constants.ts          ← PALANCAS, WIZARD_STEPS, COLORS
└── public/
    ├── gantt/                ← Gantt standalone (React+Babel)
    ├── mp-logo.png
    └── logo-hospital-auna.svg
```

---

## El simulador inicial que necesitas

El usuario tiene OTRO proyecto separado con los Steps 1-5. Necesitas:

1. Pedirle al usuario que comparta ese proyecto (o su URL de repo)
2. Identificar los componentes equivalentes a Steps 1-5
3. Adaptar sus tipos al schema de `types/index.ts` de este repo
4. Reemplazar los placeholders en `WizardShell.tsx` (líneas ~159-164)

**El único contrato que deben cumplir los Steps del simulador:**
```typescript
interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  // + props específicas desde wiz.* (ver KEY_FILES_SNAPSHOT.md)
}
```

---

## ⚠️ Cosas que NO debes cambiar

- `components/steps/Step6_Propuesta.tsx` — completamente funcional
- `components/steps/Step7_Resultado.tsx` — completamente funcional  
- `app/pdf/page.tsx` — PDF export funcional
- `app/share/page.tsx` — Share link funcional
- `app/api/export/excel/` — Excel export funcional
- `public/gantt/` — Gantt standalone funcional
- `components/SlideComisionesModal.tsx` — Slide export funcional
- `app/legacy/` — Simulador viejo, NO TOCAR

---

## Variables de entorno necesarias

```env
# .env.local (crear localmente, no está en el repo)
SUPABASE_URL=<pedir al equipo>
SUPABASE_ANON_KEY=<pedir al equipo>
```

Solo son necesarias para el módulo `/benchmark`. El wizard funciona sin ellas.
