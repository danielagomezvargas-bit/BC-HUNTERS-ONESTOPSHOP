/* ============================================================================
 * gantt-export.js
 * ----------------------------------------------------------------------------
 * Export a Gantt timeline to an editable Google Slides–compatible .pptx.
 *
 *  • Smart crop  → calendar only shows days with activity (+ buffer to end-of-week)
 *  • Auto weeks  → if visible range > 64 days, columns auto-collapse to weeks
 *  • Editable    → native shapes & text in PPTX (no images), so Google Slides
 *                  and PowerPoint can edit every cell.
 *
 * USAGE — drop this file into your project and add ONE script tag:
 *
 *   <script src="gantt-export.js"></script>
 *
 * PptxGenJS is lazy-loaded from CDN the first time you call the export,
 * so you don't need to add another <script> tag for it.
 *
 * Then, on your existing "Descargar" button:
 *
 *   button.onclick = () => exportGanttToPptx({
 *     sellerName: "ACME S.A. de C.V.",
 *     location: "metro",         // "metro" | "resto"  (used for the legend label only)
 *     startDate: new Date(2026, 4, 12),
 *     totalBusinessDays: 11,     // shown in the header pill — pass whatever you want
 *     phases: [
 *       { name: "Apertura de cuenta",         desc: "Alta del seller.",         sla: "15 min",   offset: 0, duration: 0, kind: "obligatoria" },
 *       { name: "Configuración de cuenta",    desc: "Tasas y métodos.",         sla: "1 día",    offset: 0, duration: 1, kind: "obligatoria" },
 *       { name: "Envío de terminales",        desc: "Logística a sucursal.",    sla: "2 días",   offset: 0, duration: 2, kind: "obligatoria" },
 *       { name: "Capacitación de cajeros",    desc: "Sesión en sitio.",         sla: "30 min",   offset: 2, duration: 0, kind: "preparacion" },
 *       { name: "Encendido de terminales",    desc: "Prueba de cobro real.",    sla: "Mismo día",offset: 2, duration: 1, kind: "lanzamiento" },
 *       { name: "Reportes de conciliación",   desc: "Seguimiento post go-live.",sla: "Semanal",  offset: 3, duration: 7, kind: "seguimiento" },
 *     ],
 *   });
 *
 * Phase fields:
 *   name       string  — required
 *   desc       string  — optional, shown under name
 *   sla        string  — optional, shown small at bottom of label cell
 *   offset     number  — business-day offset from project start
 *   duration   number  — business-day duration (0 ⇒ milestone, rendered as circle)
 *   kind       string  — one of: obligatoria | preparacion | lanzamiento | seguimiento
 *   color      string  — optional, overrides kind color (e.g. "#26B6E2")
 * ===========================================================================*/

(function (global) {
  "use strict";

  // ─── kind palette (matches the modal in the project) ─────────────────────
  const KIND = {
    obligatoria: { label: "Fase obligatoria", color: "#15192F" },
    preparacion: { label: "Preparación",      color: "#26B6E2" },
    lanzamiento: { label: "Lanzamiento",      color: "#00A650" },
    seguimiento: { label: "Seguimiento",      color: "#737373" },
  };

  const MONTHS_ES       = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const MONTHS_ES_LONG  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DOW_ES          = ["D","L","M","X","J","V","S"];

  // ─── date helpers ────────────────────────────────────────────────────────
  const MS = 86_400_000;
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const isWeekend = (d) => { const x = d.getDay(); return x === 0 || x === 6; };
  const addBusinessDays = (d, n) => {
    if (n === 0) return new Date(d);
    let r = new Date(d), left = Math.abs(n), sign = Math.sign(n);
    while (left > 0) { r = addDays(r, sign); if (!isWeekend(r)) left--; }
    return r;
  };
  const dayDiff = (a, b) => Math.round((b - a) / MS);
  const fmtShort = (d) => `${d.getDate()} ${MONTHS_ES[d.getMonth()]}`;

  // ─── lazy-load PptxGenJS ────────────────────────────────────────────────
  let pptxLoading = null;
  const ensurePptx = () => {
    if (global.PptxGenJS) return Promise.resolve();
    if (pptxLoading) return pptxLoading;
    pptxLoading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return pptxLoading;
  };

  // ─── main entry ──────────────────────────────────────────────────────────
  async function exportGanttToPptx(opts) {
    const {
      sellerName = "Seller",
      location = "metro",
      startDate,
      totalBusinessDays,
      phases = [],
      fileName,
    } = opts || {};

    if (!(startDate instanceof Date)) {
      throw new Error("exportGanttToPptx: opts.startDate must be a Date");
    }

    await ensurePptx();
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    // ── compute phase spans + projectEnd ──
    const spans = phases.map(p => {
      const sd = addBusinessDays(start, p.offset || 0);
      const ed = (p.duration || 0) === 0 ? sd : addBusinessDays(sd, p.duration);
      return {
        ...p,
        startDate: sd, endDate: ed,
        startCol: dayDiff(start, sd),
        endCol: dayDiff(start, ed),
      };
    });
    let projectEnd = start;
    spans.forEach(s => { if (s.endDate > projectEnd) projectEnd = s.endDate; });

    // ── smart crop: from start to last phase end + pad to end-of-week ──
    let pad = 3;
    const lastDow = projectEnd.getDay();
    if (lastDow < 6) pad = 6 - lastDow + 1;
    const visEnd = addDays(projectEnd, pad);
    let visibleDays = dayDiff(start, visEnd) + 1;
    if (visibleDays < 14) visibleDays = 14;

    const useWeekCols = visibleDays > 64;
    const daysPerCol = useWeekCols ? 7 : 1;
    const colCount = Math.ceil(visibleDays / daysPerCol);

    // ── build visible day list + bands ──
    const visDays = [];
    for (let i = 0; i < visibleDays; i++) visDays.push(addDays(start, i));
    const visBands = [];
    let cur = null;
    visDays.forEach((d, i) => {
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (!cur || cur.k !== k) { cur = { k, start: i, end: i, date: d, idx: visBands.length }; visBands.push(cur); }
      else cur.end = i;
    });

    // ── pptx scaffold (LAYOUT_WIDE = 13.33 × 7.5 in) ──
    const pptx = new global.PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };

    // ── header band ──
    slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.95, fill: { color: "15192F" }, line: { width: 0 } });
    slide.addText("Gantt de implementación", { x: 0.5, y: 0.18, w: 8, h: 0.42, fontSize: 22, bold: true, color: "FFFFFF", fontFace: "Arial" });
    slide.addText(sellerName, { x: 0.5, y: 0.55, w: 8, h: 0.32, fontSize: 13, color: "B8BAC4", fontFace: "Arial" });

    // duration pill
    slide.addShape("rect", { x: 10.3, y: 0.18, w: 2.7, h: 0.62, fill: { color: "1F2547" }, line: { color: "2A3050", width: 0.5 }, rectRadius: 0.06 });
    slide.addText("DURACIÓN ESTIMADA", { x: 10.3, y: 0.2, w: 2.7, h: 0.2, fontSize: 8, bold: true, color: "8C8FA0", align: "center", fontFace: "Arial" });
    slide.addText(`${totalBusinessDays != null ? totalBusinessDays : "—"} días hábiles`, {
      x: 10.3, y: 0.38, w: 2.7, h: 0.36, fontSize: 16, bold: true, color: "FFE600", align: "center", fontFace: "Arial",
    });

    // ── chart geometry ──
    const chartX = 0.5;
    const labelW = 3.2;
    const chartY = 1.2;
    const headerH = 0.36;
    const dowH = 0.22;
    const dayNumH = 0.26;
    const totalHeadH = headerH + dowH + dayNumH;
    const rowsY = chartY + totalHeadH;
    const chartW = 13.33 - chartX - 0.5;
    const daysAreaW = chartW - labelW;
    const colW = daysAreaW / colCount;
    const dayUnit = colW / daysPerCol;
    const rowH = Math.min(0.78, Math.max(0.62, (5.5 - totalHeadH) / Math.max(1, spans.length)));

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

    // ── weekend strips (day mode only) ──
    if (!useWeekCols) {
      visDays.forEach((d, i) => {
        if (isWeekend(d)) {
          slide.addShape("rect", {
            x: chartX + labelW + i * dayUnit, y: rowsY,
            w: dayUnit, h: rowH * spans.length,
            fill: { color: "F4F4F4" }, line: { width: 0 },
          });
        }
      });
    }

    // ── DOW + day-number rows / week rows ──
    if (!useWeekCols) {
      visDays.forEach((d, i) => {
        const x = chartX + labelW + i * dayUnit;
        const wk = isWeekend(d);
        const isStart = i === 0;
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

    // ── start line (green) at col 0 ──
    slide.addShape("line", {
      x: chartX + labelW, y: rowsY, w: 0, h: rowH * spans.length,
      line: { color: "00A650", width: 1.5 },
    });

    // ── phase rows ──
    spans.forEach((p, i) => {
      const rowY = rowsY + i * rowH;
      if (i % 2 === 1) {
        slide.addShape("rect", {
          x: chartX, y: rowY, w: chartW, h: rowH,
          fill: { color: "FAFAFA" }, line: { width: 0 },
        });
      }
      slide.addText(p.name || "", {
        x: chartX + 0.05, y: rowY + 0.04, w: labelW - 0.15, h: 0.24,
        fontSize: 11, bold: true, color: "1A1A1A",
        align: "left", valign: "top", fontFace: "Arial",
      });
      if (p.desc) {
        slide.addText(p.desc, {
          x: chartX + 0.05, y: rowY + 0.27, w: labelW - 0.15, h: 0.3,
          fontSize: 8.5, color: "4A4A4A",
          align: "left", valign: "top", fontFace: "Arial",
        });
      }
      if (p.sla) {
        slide.addText(p.sla, {
          x: chartX + 0.05, y: rowY + rowH - 0.22, w: labelW - 0.15, h: 0.2,
          fontSize: 7.5, italic: true, color: "737373",
          align: "left", valign: "top", fontFace: "Arial",
        });
      }
      slide.addShape("line", {
        x: chartX + labelW - 0.04, y: rowY, w: 0, h: rowH,
        line: { color: "E5E5E5", width: 0.5 },
      });

      const barColor = (p.color || (KIND[p.kind] || KIND.obligatoria).color).replace("#", "");
      const isMs = (p.duration || 0) === 0;
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
    const legendY = rowsY + rowH * spans.length + 0.18;
    let lx = chartX;
    Object.entries(KIND).forEach(([, v]) => {
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

    await pptx.writeFile({
      fileName: fileName || `Gantt-${(sellerName || "seller").replace(/\s+/g, "-")}.pptx`,
    });
  }

  // expose
  global.exportGanttToPptx = exportGanttToPptx;
})(typeof window !== "undefined" ? window : globalThis);
