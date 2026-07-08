import { EmpleadosPanel } from "@/components/empleados/empleados-panel";
import { SucursalEmpleadosPanel } from "@/components/sucursales/sucursal-empleados-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function EmpleadosPage() {
  const access = await requireDashboardAccess();
  requirePermission(access, "puedeGestionarEmpleados");

  const supabase = createServiceRoleClient();

  const mostrarAsignacionSucursal =
    access.scope === "global" && nivelPlan(access.planClave) >= 3;

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

  let sucursales: any[] = [];

  if (mostrarAsignacionSucursal) {
    const { data: sucursalesData, error: sucursalesError } = await supabase
      .from("sucursales")
      .select("id, nombre, estado, es_principal")
      .eq("negocio_id", access.negocio.id)
      .order("es_principal", { ascending: false })
      .order("created_at", { ascending: true });

    if (sucursalesError) throw new Error(sucursalesError.message);

    sucursales = sucursalesData ?? [];
  }

  const empleadosNormalizados = (empleados ?? []).map((empleado: any) => {
    const servicioIds = (empleado.empleado_servicios ?? [])
      .map((item: any) => item.servicio_id)
      .filter(Boolean);

    return {
      ...empleado,
      servicio_ids: servicioIds,
      servicios_ids: servicioIds,
      horarios: empleado.horarios_empleado ?? [],
      horarios_empleado: empleado.horarios_empleado ?? [],
    };
  });

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
        <p className="text-sm text-muted-foreground">Empleados de agenda</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Empleados que atienden citas
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Estos empleados se usan para la agenda, horarios, servicios,
          disponibilidad y reportes. Crear un empleado acá no le da acceso
          automático al sistema.
        </p>

        {mostrarAsignacionSucursal ? (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
            <strong>Plan Empresarial:</strong> además de crear empleados, podés
            asignarlos a una sucursal desde esta misma vista.
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border bg-muted/50 p-4 text-sm text-muted-foreground">
            En planes no empresariales, los empleados se asignan automáticamente
            a la sucursal principal interna del negocio.
          </div>
        )}
      </section>

      {mostrarAsignacionSucursal && (
        <SucursalEmpleadosPanel
          sucursales={sucursales}
          initialSucursales={sucursales}
          empleados={empleadosNormalizados}
          initialEmpleados={empleadosNormalizados}
        />
      )}

      <EmpleadosPanel
        empleados={empleadosNormalizados}
        servicios={servicios ?? []}
      />
    </div>
  );
}
