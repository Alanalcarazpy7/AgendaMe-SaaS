import { CitasPanel } from "@/components/citas/citas-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

export default async function CitasPage() {
  const access = await requireDashboardAccess();
  requirePermission(access, "puedeGestionarCitas");

  const supabase = createServiceRoleClient();

  let citasQuery = supabase
    .from("citas")
    .select(
      `
      id,
      negocio_id,
      sucursal_id,
      cliente_id,
      servicio_id,
      empleado_id,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      precio,
      notas,
      origen,
      seguimiento_token,
      created_at,
      clientes (
        id,
        nombre_completo,
        telefono,
        email
      ),
      servicios (
        id,
        nombre,
        duracion_minutos,
        precio,
        color
      ),
      empleados (
        id,
        nombre,
        color_calendario,
        sucursal_id
      ),
      sucursales (
        id,
        nombre
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  citasQuery = applySucursalScope(citasQuery, access);

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
    .eq("estado", "activo")
    .order("nombre", { ascending: true });

  empleadosQuery = applySucursalScope(empleadosQuery, access);

  let clientes: any[] = [];

  if (access.scope === "sucursal" && access.sucursalId) {
    const { data: clientesSucursal, error: clientesSucursalError } = await supabase
      .from("cliente_sucursales")
      .select(
        `
        clientes (
          id,
          nombre_completo,
          telefono,
          email,
          estado
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .eq("sucursal_id", access.sucursalId);

    if (clientesSucursalError) {
      throw new Error(clientesSucursalError.message);
    }

    clientes = (clientesSucursal ?? [])
      .map((row: any) => obtenerObjeto(row.clientes))
      .filter(Boolean)
      .filter((cliente: any) => cliente.estado === "activo");
  } else {
    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nombre_completo, telefono, email, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre_completo", { ascending: true });

    if (clientesError) {
      throw new Error(clientesError.message);
    }

    clientes = clientesData ?? [];
  }

  const [
    { data: citas, error: citasError },
    { data: empleados, error: empleadosError },
    { data: servicios, error: serviciosError },
  ] = await Promise.all([
    citasQuery,

    empleadosQuery,

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, color, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),
  ]);

  if (citasError) throw new Error(citasError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);

  const empleadosNormalizados = (empleados ?? []).map((empleado: any) => {
    const servicioIds = (empleado.empleado_servicios ?? [])
      .map((item: any) => item.servicio_id)
      .filter(Boolean);

    const horarios = empleado.horarios_empleado ?? [];

    return {
      ...empleado,
      servicio_ids: servicioIds,
      servicios_ids: servicioIds,
      horarios,
      horarios_empleado: horarios,
      empleado_servicios: empleado.empleado_servicios ?? [],
    };
  });

  const empleadoServicios = empleadosNormalizados.flatMap((empleado: any) => {
    return (empleado.empleado_servicios ?? [])
      .map((relacion: any) => ({
        empleado_id: empleado.id,
        servicio_id: relacion.servicio_id,
      }))
      .filter((relacion: any) => relacion.empleado_id && relacion.servicio_id);
  });

  return (
    <CitasPanel
      citas={citas ?? []}
      clientes={clientes}
      servicios={servicios ?? []}
      empleados={empleadosNormalizados}
      empleadoServicios={empleadoServicios}
    />
  );
}