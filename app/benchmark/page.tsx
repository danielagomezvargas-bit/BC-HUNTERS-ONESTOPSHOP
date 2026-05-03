// app/benchmark/page.tsx
import BenchmarkDashboard from "@/components/BenchmarkDashboard";

export const metadata = {
  title: "Benchmark de Comisiones — Mercado Pago",
  description: "Base de datos de tasas reales por industria y proveedor",
};

export default function BenchmarkPage() {
  return <BenchmarkDashboard />;
}
