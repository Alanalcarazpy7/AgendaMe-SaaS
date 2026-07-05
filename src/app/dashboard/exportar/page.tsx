import { ExportarPanel } from "@/components/exportar/exportar-panel";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function ExportarPage() {
  const access = await requireDashboardAccess();

  if (!access.puedeExportar) {
    return (
      <PremiumFeaturePage
        titulo="Exportar CSV"
        descripcion="Exportá información de citas, clientes, servicios y empleados para analizar tus datos fuera de AgendaMe."
        desde={
          access.scope === "global"
            ? "Plan Profesional"
            : "Plan Empresarial para usuarios de sucursal"
        }
        activo={false}
        estadoActivoTitulo=""
        estadoActivoDescripcion=""
      />
    );
  }

  const supabase = createServiceRoleClient();

  const puedeFiltrarSucursal =
    access.scope === "global" && nivelPlan(access.planClave) >= 3;

  const { data: sucursales } = puedeFiltrarSucursal
    ? await supabase
        .from("sucursales")
        .select("id, nombre, estado")
        .eq("negocio_id", access.negocio.id)
        .eq("estado", "activo")
        .order("created_at", { ascending: true })
    : { data: [] };

  return (
    <ExportarPanel
      puedeExportarServicios={access.puedeVerTodo}
      puedeFiltrarSucursal={puedeFiltrarSucursal}
      sucursales={sucursales ?? []}
      scopeLabel={
        access.scope === "global"
          ? "Todas las sucursales"
          : access.sucursalNombre ?? "Tu sucursal"
      }
    />
  );
}