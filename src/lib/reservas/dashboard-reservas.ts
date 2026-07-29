import "server-only";

import type { DashboardAccess } from "@/lib/dashboard/scope-helpers";
import { applySucursalScope } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const RESERVA_SELECT = `
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
`;

export async function listarReservasDashboard(
  supabase: ReturnType<typeof createServiceRoleClient>,
  access: DashboardAccess,
) {
  let activasQuery = supabase
    .from("citas")
    .select(RESERVA_SELECT)
    .eq("negocio_id", access.negocio.id)
    .in("estado", ["pendiente", "confirmada"])
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  activasQuery = applySucursalScope(activasQuery, access);

  let completadasQuery = supabase
    .from("citas")
    .select(RESERVA_SELECT)
    .eq("negocio_id", access.negocio.id)
    .eq("estado", "completada")
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false })
    .limit(200);

  completadasQuery = applySucursalScope(completadasQuery, access);

  let cerradasQuery = supabase
    .from("citas")
    .select(RESERVA_SELECT)
    .eq("negocio_id", access.negocio.id)
    .in("estado", ["cancelada", "no_asistio"])
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: false })
    .limit(100);

  cerradasQuery = applySucursalScope(cerradasQuery, access);

  const [
    { data: activas, error: activasError },
    { data: completadas, error: completadasError },
    { data: cerradas, error: cerradasError },
  ] = await Promise.all([activasQuery, completadasQuery, cerradasQuery]);

  if (activasError) throw new Error(activasError.message);
  if (completadasError) throw new Error(completadasError.message);
  if (cerradasError) throw new Error(cerradasError.message);

  return [
    ...(activas ?? []),
    ...(completadas ?? []),
    ...(cerradas ?? []),
  ];
}
