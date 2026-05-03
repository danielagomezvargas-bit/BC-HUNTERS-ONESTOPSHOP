"use client";
import { useState } from "react";
import { useWizard } from "@/hooks/useWizard";
import Topbar from "@/components/ui/Topbar";
import Stepper from "@/components/ui/Stepper";
import Step1_Datos from "@/components/steps/Step1_Datos";
import Step2_Producto from "@/components/steps/Step2_Producto";
import Step3_Proveedores from "@/components/steps/Step3_Proveedores";
import Step4_Share from "@/components/steps/Step4_Share";
import Step5_Comisiones from "@/components/steps/Step5_Comisiones";
import Step6_Propuesta from "@/components/steps/Step6_Propuesta";
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
  const [done, setDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  function handleGuardarPropuesta() {
    const records = buildBenchmarkRecords(wiz);
    if (records.length > 0) {
      const existing: BenchmarkRecord[] = JSON.parse(localStorage.getItem("benchmark_records") || "[]");
      localStorage.setItem("benchmark_records", JSON.stringify([...existing, ...records]));
      setSavedCount(records.length);
    }
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ fontFamily:"'IBM Plex Sans', -apple-system, sans-serif", background:COLORS.bg, minHeight:"100vh" }}>
        <Topbar negocio={negocio} productos={productos} />
        <div style={{ maxWidth:920, margin:"60px auto", padding:"0 20px", textAlign:"center" }}>
          <div style={{ background:"#fff", border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"48px 32px" }}>
            <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
            <h2 style={{ fontSize:22, fontWeight:700, color:COLORS.navy, marginBottom:8 }}>Propuesta generada</h2>
            {savedCount > 0 ? (
              <p style={{ fontSize:14, color:COLORS.muted, marginBottom:28 }}>
                Se guardaron <strong>{savedCount}</strong> registro{savedCount > 1 ? "s" : ""} con tasas reales en el benchmark de Mercado Pago.
              </p>
            ) : (
              <p style={{ fontSize:14, color:COLORS.muted, marginBottom:28 }}>
                No se guardaron tasas en el benchmark porque ningún proveedor indicó tasas reales en el Paso 3.
              </p>
            )}
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <a href="/benchmark" style={{
                display:"inline-block", padding:"11px 28px",
                background:COLORS.blue, color:"#fff",
                borderRadius:8, fontWeight:700, fontSize:14, textDecoration:"none",
              }}>
                Ver benchmark →
              </a>
              <a href="/simulator" style={{
                display:"inline-block", padding:"11px 28px",
                background:"#fff", color:COLORS.navy,
                border:`1px solid ${COLORS.border}`,
                borderRadius:8, fontWeight:700, fontSize:14, textDecoration:"none",
              }}>
                Nueva propuesta
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    <Step1_Datos
      negocio={wiz.negocio}
      setNegocio={wiz.setNegocio}
      onNext={goNext}
    />,
    <Step2_Producto
      productos={wiz.productos}
      setProductos={wiz.setProductos}
      onNext={goNext}
      onBack={goBack}
    />,
    <Step3_Proveedores
      productos={wiz.productos}
      provCounts={wiz.provCounts}
      setProvCounts={wiz.setProvCounts}
      provData={wiz.provData}
      updateProvData={wiz.updateProvData}
      onNext={goNext}
      onBack={goBack}
    />,
    <Step4_Share
      productos={wiz.productos}
      provData={wiz.provData}
      provCounts={wiz.provCounts}
      sharePT={wiz.sharePT} setSharePT={wiz.setSharePT}
      shareOP={wiz.shareOP} setShareOP={wiz.setShareOP}
      simLoaded={wiz.simLoaded} setSimLoaded={wiz.setSimLoaded}
      onNext={goNext} onBack={goBack}
    />,
    <Step5_Comisiones
      productos={wiz.productos}
      provData={wiz.provData}
      provCounts={wiz.provCounts}
      comPT_OT={wiz.comPT_OT} comPT_MSI={wiz.comPT_MSI}
      comOP_OT={wiz.comOP_OT} comOP_MSI={wiz.comOP_MSI}
      updateComOT={wiz.updateComOT} updateComMSI={wiz.updateComMSI}
      tcActual={wiz.tcActual} tcMP={wiz.tcMP}
      sharePT={wiz.sharePT} shareOP={wiz.shareOP}
      onNext={goNext} onBack={goBack}
    />,
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
  ];

  return (
    <div style={{ fontFamily:"'IBM Plex Sans', -apple-system, sans-serif", background:COLORS.bg, minHeight:"100vh" }}>
      <Topbar negocio={negocio} productos={productos} />
      <div style={{ maxWidth:920, margin:"20px auto", padding:"0 20px 40px" }}>
        <div style={{ background:"#fff", border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"22px 24px" }}>
          <Stepper currentStep={step} />
          {steps[step]}
        </div>
      </div>
    </div>
  );
}
