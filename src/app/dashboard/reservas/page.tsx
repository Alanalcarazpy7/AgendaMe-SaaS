import { ReservasPendientesPanel } from "@/components/reservas/reservas-pendientes-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

type ClienteReserva = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  estado?: string | null;
};

type ClienteSucursalReserva = {
  clientes: Relacion<ClienteReserva>;
};

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
    .in("estado", ["pendiente", "confirmada"])
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

  // Antes, la consulta de clientes se esperaba (await) por separado, ANTES
  // de arrancar reservas/empleados/servicios: eso sumaba su latencia en vez
  // de solaparla. Ahora las 4 consultas arrancan juntas y se esperan en un
  // solo Promise.all, así que el tiempo total es el de la más lenta, no la
  // suma de todas — reduce el tiempo hasta el primer render en esta página.
  const clientesPorSucursal = access.scope === "sucursal" && Boolean(access.sucursalId);

  const clientesQuery = clientesPorSucursal
    ? supabase
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
        .eq("sucursal_id", access.sucursalId as string)
    : supabase
        .from("clientes")
        .select("id, nombre_completo, telefono, email, estado")
        .eq("negocio_id", access.negocio.id)
        .eq("estado", "activo")
        .order("nombre_completo", { ascending: true });

  const [
    { data: reservas, error: reservasError },
    { data: empleados, error: empleadosError },
    { data: servicios, error: serviciosError },
    { data: clientesRaw, error: clientesError },
  ] = await Promise.all([
    reservasQuery,

    empleadosQuery,

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, color, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),

    clientesQuery,
  ]);

  if (reservasError) throw new Error(reservasError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);
  if (clientesError) throw new Error(clientesError.message);

  const clientes: ClienteReserva[] = clientesPorSucursal
    ? ((clientesRaw ?? []) as unknown as ClienteSucursalReserva[])
        .map((row) => obtenerObjeto(row.clientes))
        .filter((cliente): cliente is ClienteReserva => cliente !== null)
        .filter((cliente) => cliente.estado === "activo")
    : ((clientesRaw ?? []) as unknown as ClienteReserva[]);

  return (
    <ReservasPendientesPanel
      reservas={reservas ?? []}
      clientes={clientes}
      servicios={servicios ?? []}
      empleados={empleados ?? []}
    />
  );
}
