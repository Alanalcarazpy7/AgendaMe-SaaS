import { ReservasPendientesPanel } from "@/components/reservas/reservas-pendientes-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

export default async function ReservasPage() {
  const access = await requireDashboardAccess();
  requirePermission(access, "puedeGestionarCitas");

const supabase = createServiceRoleClient();

  let reservasQuery = supabase
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
        precio
      ),
      empleados (
        id,
        nombre,
        sucursal_id
      ),
      sucursales (
        id,
        nombre
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .eq("estado", "pendiente")
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  reservasQuery = applySucursalScope(reservasQuery, access);

  let empleadosQuery = supabase
    .from("empleados")
    .select("id, nombre, email, telefono, color_calendario, estado, sucursal_id")
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
    { data: reservas, error: reservasError },
    { data: empleados, error: empleadosError },
    { data: servicios, error: serviciosError },
  ] = await Promise.all([
    reservasQuery,

    empleadosQuery,

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, color, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),
  ]);

  if (reservasError) throw new Error(reservasError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);

  return (
    <ReservasPendientesPanel
      reservas={reservas ?? []}
      clientes={clientes}
      servicios={servicios ?? []}
      empleados={empleados ?? []}
    />
  );
}