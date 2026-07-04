import { ExportarPanel } from "@/components/exportar/exportar-panel";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { getDashboardPlanContext } from "@/lib/planes/get-dashboard-plan-context";
import { nivelPlan } from "@/lib/planes/plan-access";

export default async function ExportarPage() {
  const { planClave } = await getDashboardPlanContext();
  const activo = nivelPlan(planClave) >= 2;

  if (!activo) {
    return (
      <PremiumFeaturePage
        titulo="Exportar CSV"
        descripcion="Exportá información de citas, clientes, servicios y empleados para analizar tus datos fuera de AgendaMe."
        desde="Plan Profesional"
        activo={false}
        estadoActivoTitulo=""
        estadoActivoDescripcion=""
      />
    );
  }

  return <ExportarPanel />;
}