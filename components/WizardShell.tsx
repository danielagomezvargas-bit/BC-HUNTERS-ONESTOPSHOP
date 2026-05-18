"use client";
import { useEffect } from "react";
import { useWizard } from "@/hooks/useWizard";
import Topbar from "@/components/ui/Topbar";
import Stepper from "@/components/ui/Stepper";
import Step1_Datos from "@/components/steps/Step1_Datos";
import Step2_Producto from "@/components/steps/Step2_Producto";
import Step3_Proveedores from "@/components/steps/Step3_Proveedores";
import Step4_Share from "@/components/steps/Step4_Share";
import Step5_Comisiones from "@/components/steps/Step5_Comisiones";
import Step6_Propuesta from "@/components/steps/Step6_Propuesta";
import Step7_Resultado from "@/components/steps/Step7_Resultado";
import { COLORS } from "@/data/constants";
import type { BenchmarkRecord, MsiPlazo } from "@/types";

const MSI_PLAZOS: MsiPlazo[] = ["3x","6x","9x","12x","18x","24x"];

function buildBenchmarkRecords(wiz: ReturnType<typeof useWizard>): BenchmarkRecord[] {
  const { negocio, productos, provData, provCounts, sharePT, shareOP, comPT_OT, comPT_MSI, comOP_OT, comOP_MSI } = wiz;
  const records: BenchmarkRecord[] = [];

  const sections = [
    ...(productos.point ? [{ sec: "pt" as const, producto: "Point" as const,            count: provCounts.pt, tpv: sharePT.tpv, comOT: comPT_OT, comMSI: comPT_MSI }] : []),
    ...(productos.op    ? [{ sec: "op" as const, producto: "Online Payments" as const,   count: provCounts.op, tpv: shareOP.tpv, comOT: comOP_OT, comMSI: comOP_MSI }] : []),
  ];

  for (const s of sections) {
    for (let i = 0; i < s.count; i++) {
      const d = provData[`${s.sec}_${i}`];
      if (!d || d.rates !== "si") continue;

      const rate   = (label: string) => s.comOT.find(r => r.l === label)?.cu  ?? null;
      const rateMP = (label: string) => s.comOT.find(r => r.l === label)?.mp  ?? null;

      const msi:    BenchmarkRecord["msi"]    = {} as any;
      const msi_mp: BenchmarkRecord["msi_mp"] = {} as any;
      for (const p of MSI_PLAZOS) {
        const row = s.comMSI.find(r => r.l === `MSI ${p}`);
        msi[p]    = row ? { ba: rate("T. Crédito")   ?? 0, sb: row.sb } : null;
        msi_mp[p] = row ? { ba: rateMP("T. Crédito") ?? 0, sb: row.sm } : null;
      }

      records.push({
        id:            `wiz_${Date.now()}_${s.sec}_${i}`,
        seller:        negocio.nombre,
        rfc:           negocio.rfc,
        industria:     negocio.industria,
        producto:      s.producto,
        proveedor:     d.bank,
        tpv:           s.tpv,
        ticket:        0,
        hunter:        "",
        tasas:         { td: rate("T. Débito") ?? 0, tc: rate("T. Crédito") ?? 0, amex: rate("AMEX"), intl: rate("Internacional") },
        tasas_mp:      { td: rateMP("T. Débito"), tc: rateMP("T. Crédito"), amex: rateMP("AMEX"), intl: rateMP("Internacional") },
        msi, msi_mp,
        status:        "por_definir",
        fecha:         new Date().toISOString().split("T")[0],
        razon_perdida: null,
      });
    }
  }
  return records;
}

export default function WizardShell() {
  const wiz = useWizard();
  const { step, goNext, goBack, negocio, productos } = wiz;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  function handleGuardarPropuesta() {
    // Save benchmark records (only real rates)
    const records = buildBenchmarkRecords(wiz);
    if (records.length > 0) {
      const existing: BenchmarkRecord[] = JSON.parse(localStorage.getItem("benchmark_records") || "[]");
      const today = new Date().toISOString().slice(0, 10);
      const merged = [...existing];
      for (const rec of records) {
        const idx = merged.findIndex(r =>
          (rec.rfc && r.rfc.toLowerCase() === rec.rfc.toLowerCase()) ||
          r.seller.toLowerCase() === rec.seller.toLowerCase()
        );
        if (idx >= 0) {
          merged[idx] = { ...rec, id: merged[idx].id, status: merged[idx].status, fecha: merged[idx].fecha, updatedAt: today };
        } else {
          merged.push(rec);
        }
      }
      localStorage.setItem("benchmark_records", JSON.stringify(merged));
    }

    // Save one pager summary (all data for the PDF/Excel export)
    const summary = {
      negocio:       wiz.negocio,
      productos:     wiz.productos,
      comPT_OT:      wiz.comPT_OT,
      comPT_MSI:     wiz.comPT_MSI,
      tpvPT:         wiz.sharePT.tpv,
      comOP_OT:      wiz.comOP_OT,
      comOP_MSI:     wiz.comOP_MSI,
      tpvOP:         wiz.shareOP.tpv,
      propuestaProd: wiz.propuestaProd,
      palancasSel:   { pt: Array.from(wiz.palancasSel.pt), op: Array.from(wiz.palancasSel.op) },
      palancasPct:   wiz.palancasPct,
    };
    localStorage.setItem("simulator_summary", JSON.stringify(summary));

    goNext();
  }

  function EnConstruccion({ num, onNext, onBack, isFirst }: { num: number; onNext: () => void; onBack?: () => void; isFirst?: boolean }) {
    return (
      <div style={{ textAlign: "center", padding: "56px 32px" }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🚧</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>
          Paso {num} — En construcción
        </h3>
        <p style={{ fontSize: 13, color: COLORS.muted, marginBottom: 32 }}>
          Fernando está trabajando en este paso.
        </p>
        {isFirst && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => { wiz.loadSellerMuestra(); wiz.goTo(5); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 28px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                background: "#FFE600", color: COLORS.navy, border: "none", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,.12)",
              }}
            >
              ⚡ Cargar Seller Muestra → ir al Paso 6
            </button>
            <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
              Point $10M · OP $1M · Tasas 3% actual → 2% MP
            </p>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {onBack && (
            <button onClick={onBack} style={{
              padding: "10px 24px", borderRadius: 8, fontWeight: 700, fontSize: 13,
              background: "#fff", color: COLORS.navy, border: `1px solid ${COLORS.border}`, cursor: "pointer",
            }}>← Atrás</button>
          )}
          <button onClick={onNext} style={{
            padding: "10px 24px", borderRadius: 8, fontWeight: 700, fontSize: 13,
            background: COLORS.navy, color: "#fff", border: "none", cursor: "pointer",
          }}>Siguiente →</button>
        </div>
      </div>
    );
  }

  const steps = [
    <Step1_Datos
      negocio={wiz.negocio}
      setNegocio={wiz.setNegocio}
      simData={wiz.simData}
      setSimData={wiz.setSimData}
      onNext={goNext}
    />,
    <EnConstruccion num={2} onNext={goNext} onBack={goBack} />,
    <EnConstruccion num={3} onNext={goNext} onBack={goBack} />,
    <EnConstruccion num={4} onNext={goNext} onBack={goBack} />,
    <EnConstruccion num={5} onNext={goNext} onBack={goBack} />,
    <Step6_Propuesta
      productos={wiz.productos}
      provData={wiz.provData}
      provCounts={wiz.provCounts}
      sharePT={wiz.sharePT}
      shareOP={wiz.shareOP}
      propuestaProd={wiz.propuestaProd}
      setPropuestaProd={wiz.setPropuestaProd}
      palancasSel={wiz.palancasSel}
      togglePalanca={wiz.togglePalanca}
      palancasPct={wiz.palancasPct}
      setPalancaPct={wiz.setPalancaPct}
      onNext={handleGuardarPropuesta}
      onBack={goBack}
    />,
    <Step7_Resultado
      negocio={wiz.negocio}
      productos={wiz.productos}
      sharePT={wiz.sharePT}
      shareOP={wiz.shareOP}
      comPT_OT={wiz.comPT_OT}
      comPT_MSI={wiz.comPT_MSI}
      comOP_OT={wiz.comOP_OT}
      comOP_MSI={wiz.comOP_MSI}
      palancasSel={wiz.palancasSel}
      palancasPct={wiz.palancasPct}
      onBack={goBack}
    />,
  ];

  return (
    <>
    <div style={{ fontFamily:"'IBM Plex Sans', -apple-system, sans-serif", background:COLORS.bg, minHeight:"100vh" }}>
      <Topbar
        negocio={negocio}
        productos={productos}
        onReset={() => { window.location.href = "/"; }}
      />
      <div style={{ maxWidth:1280, margin:"28px auto", padding:"0 20px 56px" }}>
        <div style={{ background:"#fff", border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"32px 36px" }}>
          <Stepper currentStep={step} onGoTo={wiz.goTo} />
          {steps[step]}
        </div>
      </div>
    </div>
    </>
  );
}
