import { EmpleadosPanel } from "@/components/empleados/empleados-panel";
import { SucursalEmpleadosPanel } from "@/components/sucursales/sucursal-empleados-panel";
import { UsersRound } from "lucide-react";
import { DashboardModuleHeader } from "@/components/dashboard/dashboard-module-header";
import { DashboardWorkspaceTabs } from "@/components/dashboard/dashboard-workspace-tabs";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type EmpleadoRaw = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  color_calendario: string | null;
  estado: "activo" | "inactivo";
  sucursal_id: string | null;
  created_at: string;
  updated_at: string | null;
  empleado_servicios: Array<{ servicio_id: string | null }> | null;
  horarios_empleado: Array<{
    id: string;
    dia_semana: number;
    activo: boolean;
    hora_inicio: string | null;
    hora_fin: string | null;
    descanso_inicio: string | null;
    descanso_fin: string | null;
  }> | null;
};

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
    { data: sucursalesData, error: sucursalesError },
  ] = await Promise.all([
    empleadosQuery,

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),
    mostrarAsignacionSucursal
      ? supabase
          .from("sucursales")
          .select("id, nombre, estado, es_principal")
          .eq("negocio_id", access.negocio.id)
          .order("es_principal", { ascending: false })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);
  if (sucursalesError) throw new Error(sucursalesError.message);

  const sucursales = sucursalesData ?? [];

  const empleadosNormalizados = ((empleados ?? []) as EmpleadoRaw[]).map((empleado) => {
    const servicioIds = (empleado.empleado_servicios ?? [])
      .map((item) => item.servicio_id)
      .filter((id): id is string => Boolean(id));

    return {
      ...empleado,
      servicio_ids: servicioIds,
      servicios_ids: servicioIds,
      horarios: empleado.horarios_empleado ?? [],
      horarios_empleado: empleado.horarios_empleado ?? [],
    };
  });
  const empleadosActivos = empleadosNormalizados.filter(
    (empleado) => empleado.estado === "activo",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <DashboardModuleHeader
        eyebrow="Equipo y disponibilidad"
        title="Empleados"
        description="Organizá quién atiende, qué servicios realiza y en qué horarios está disponible. Crear un empleado de agenda no le concede acceso al sistema."
        icon={<UsersRound className="size-5" />}
        aside={
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card text-sm shadow-sm">
            <div className="min-w-24 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Activos</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">
                {empleadosActivos}
              </p>
            </div>
            <div className="min-w-24 border-l px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">
                {empleadosNormalizados.length}
              </p>
            </div>
          </div>
        }
      />

      <DashboardWorkspaceTabs
        ariaLabel="Gestión de empleados"
        tabs={[
          {
            id: "equipo",
            label: "Equipo",
            count: empleadosNormalizados.length,
            description:
              "Editá los datos, servicios y horarios de cada persona.",
            content: (
              <EmpleadosPanel
                empleados={empleadosNormalizados}
                servicios={servicios ?? []}
              />
            ),
          },
          ...(mostrarAsignacionSucursal
            ? [
                {
                  id: "sucursales",
                  label: "Asignación por sucursal",
                  count: sucursales.filter(
                    (sucursal) => sucursal.estado !== "inactivo",
                  ).length,
                  description:
                    "Definí en qué sede trabaja cada integrante del equipo.",
                  content: (
                    <SucursalEmpleadosPanel
                      sucursales={sucursales}
                      initialSucursales={sucursales}
                      empleados={empleadosNormalizados}
                      initialEmpleados={empleadosNormalizados}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />

      {!mostrarAsignacionSucursal ? (
        <p className="border-l-2 border-primary/40 pl-3 text-xs leading-5 text-muted-foreground">
          En tu plan, el equipo trabaja con la sucursal principal del negocio.
          La asignación entre varias sedes está disponible en el Plan Empresarial.
        </p>
      ) : null}
    </div>
  );
}
