import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { SucursalesPanel } from "@/components/sucursales/sucursales-panel";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getDashboardPlanContext } from "@/lib/planes/get-dashboard-plan-context";
import { nivelPlan } from "@/lib/planes/plan-access";

export default async function SucursalesPage() {
  const { negocio, planClave } = await getDashboardPlanContext();
  const activo = nivelPlan(planClave) >= 3;

  if (!activo) {
    return (
      <PremiumFeaturePage
        titulo="Múltiples sucursales"
        descripcion="Gestioná varias ubicaciones o sucursales desde una misma cuenta de AgendaMe."
        desde="Plan Empresarial"
        activo={false}
        estadoActivoTitulo=""
        estadoActivoDescripcion=""
      />
    );
  }

  const supabase = createServiceRoleClient();

  await supabase.rpc("obtener_o_crear_sucursal_principal", {
    p_negocio_id: negocio.id,
  });

  const { data, error } = await supabase
    .from("sucursales")
    .select("id, nombre, direccion, telefono, estado, es_principal, created_at")
    .eq("negocio_id", negocio.id)
    .order("es_principal", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return <SucursalesPanel initialSucursales={data ?? []} />;
}