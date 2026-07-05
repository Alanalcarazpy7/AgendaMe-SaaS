import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { SucursalEmpleadosPanel } from "@/components/sucursales/sucursal-empleados-panel";
import { SucursalUsuariosPanel } from "@/components/sucursales/sucursal-usuarios-panel";
import { SucursalesPanel } from "@/components/sucursales/sucursales-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { requirePermission } from "@/lib/dashboard/scope-helpers";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function SucursalesPage() {
  const access = await requireDashboardAccess();

  if (nivelPlan(access.planClave) < 3) {
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

  requirePermission(access, "puedeGestionarSucursales");

  const supabase = createServiceRoleClient();

  await supabase.rpc("obtener_o_crear_sucursal_principal", {
    p_negocio_id: access.negocio.id,
  });

  const [
    { data: sucursales, error: sucursalesError },
    { data: accesos, error: accesosError },
    { data: empleados, error: empleadosError },
  ] = await Promise.all([
    supabase
      .from("sucursales")
      .select("id, nombre, direccion, telefono, estado, es_principal, created_at")
      .eq("negocio_id", access.negocio.id)
      .order("es_principal", { ascending: false })
      .order("created_at", { ascending: true }),

    supabase
      .from("sucursal_usuarios")
      .select(
        `
        id,
        sucursal_id,
        email,
        rol,
        activo,
        created_at,
        sucursales (
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("empleados")
      .select(
        `
        id,
        nombre,
        email,
        telefono,
        estado,
        sucursal_id,
        sucursales (
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .order("nombre", { ascending: true }),
  ]);

  if (sucursalesError) throw new Error(sucursalesError.message);
  if (accesosError) throw new Error(accesosError.message);
  if (empleadosError) throw new Error(empleadosError.message);

  const sucursalesBase = (sucursales ?? []).map((sucursal) => ({
    id: sucursal.id,
    nombre: sucursal.nombre,
    estado: sucursal.estado,
  }));

  return (
    <div className="space-y-5">
      <SucursalesPanel initialSucursales={sucursales ?? []} />

      <SucursalEmpleadosPanel
        sucursales={sucursalesBase}
        initialEmpleados={empleados ?? []}
      />

      <SucursalUsuariosPanel
        sucursales={sucursalesBase}
        initialAccesos={accesos ?? []}
      />
    </div>
  );
}