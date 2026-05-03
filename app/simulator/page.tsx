// app/simulator/page.tsx
// Server component — delegates all interactivity to WizardShell (client)
import WizardShell from "@/components/WizardShell";

export const metadata = {
  title: "Business Case Simulator — Mercado Pago",
  description: "Herramienta de monetización para hunters de Mercado Pago",
};

export default function SimulatorPage() {
  return <WizardShell />;
}
