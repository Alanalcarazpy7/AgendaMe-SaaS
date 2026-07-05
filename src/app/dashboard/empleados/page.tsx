import { EmpleadosPanel } from "@/components/empleados/empleados-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function EmpleadosPage() {
  const access = await requireDashboardAccess();
  requirePermission(access, "puedeGestionarEmpleados");

  const supabase = createServiceRoleClient();

  let empleadosQuery = supabase
    .from("empleados")
    .select(
      `
      id,
      nombre,
      email,
      telefono,
      color_calendario,
      estado,
      sucursal_id,
      created_at,
      updated_at,
      empleado_servicios (
        servicio_id
      ),
      horarios_empleado (
        id,
        dia_semana,
        activo,
        hora_inicio,
        hora_fin,
        descanso_inicio,
        descanso_fin
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .order("created_at", { ascending: false });

  empleadosQuery = applySucursalScope(empleadosQuery, access);

  const [
    { data: empleados, error: empleadosError },
    { data: servicios, error: serviciosError },
  ] = await Promise.all([
    empleadosQuery,

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),
  ]);

  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);

  const empleadosNormalizados = (empleados ?? []).map((empleado: any) => {
    const servicioIds = (empleado.empleado_servicios ?? [])
      .map((item: any) => item.servicio_id)
      .filter(Boolean);

    return {
      ...empleado,

      // Compatibilidad con el panel actual
      servicio_ids: servicioIds,
      servicios_ids: servicioIds,

      // Compatibilidad con horarios
      horarios: empleado.horarios_empleado ?? [],
      horarios_empleado: empleado.horarios_empleado ?? [],
    };
  });

  return (
    <EmpleadosPanel
      empleados={empleadosNormalizados}
      servicios={servicios ?? []}
    />
  );
}