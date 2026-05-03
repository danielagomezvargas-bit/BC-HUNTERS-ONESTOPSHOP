"use client";
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

const ComingSoon = ({ label }: { label: string }) => (
  <div style={{ textAlign:"center", padding:40, color:COLORS.muted }}>
    <div style={{ fontSize:48, marginBottom:16 }}>🚧</div>
    <div style={{ fontSize:16, fontWeight:700, color:COLORS.navy }}>{label}</div>
    <div style={{ fontSize:12, marginTop:8, color:COLORS.muted }}>Próximamente disponible</div>
  </div>
);

export default function WizardShell() {
  const wiz = useWizard();
  const { step, goNext, goBack, negocio, setNegocio, productos, setProductos } = wiz;

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
      onNext={goNext}
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
