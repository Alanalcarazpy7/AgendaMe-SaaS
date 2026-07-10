import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type NegocioBase = {
  id: string;
  nombre: string;
  slug: string | null;
  rubro: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  estado: string;
  motivo_bloqueo: string | null;
  bloqueado_at: string | null;
  bloqueado_por: string | null;
  created_at: string;
};

/**
 * vista_admin_negocios_resumen (y por lo tanto admin_obtener_negocios_resumen())
 * no incluye un conteo de sucursales — se confirmó en la auditoría de
 * columnas de Fase 1. Necesario para comparar límites antes de bajar de
 * plan (citas/empleados/servicios/clientes sí vienen en el resumen).
 */
export async function contarSucursales(negocioId: string): Promise<number> {
  const admin = createServiceRoleClient();

  const { count, error } = await admin
    .from("sucursales")
    .select("id", { count: "exact", head: true })
    .eq("negocio_id", negocioId);

  if (error) {
    throw new Error(`No se pudo contar las sucursales: ${error.message}`);
  }

  return count ?? 0;
}

export async function obtenerNegocioBase(negocioId: string): Promise<NegocioBase | null> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("negocios")
    .select(
      "id, nombre, slug, rubro, telefono, email, direccion, estado, motivo_bloqueo, bloqueado_at, bloqueado_por, created_at"
    )
    .eq("id", negocioId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener el negocio: ${error.message}`);
  }

  return data as NegocioBase | null;
}

export type SuscripcionHistorialRow = {
  id: string;
  plan_id: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
  planes_saas: { clave: string; nombre: string } | null;
};

export async function obtenerHistorialSuscripciones(negocioId: string): Promise<SuscripcionHistorialRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("suscripciones")
    .select("id, plan_id, estado, fecha_inicio, fecha_vencimiento, notas, created_at, planes_saas(clave, nombre)")
    .eq("negocio_id", negocioId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo obtener el historial de suscripciones: ${error.message}`);
  }

  return (data ?? []) as unknown as SuscripcionHistorialRow[];
}

export type PagoNegocioRow = {
  id: string;
  suscripcion_id: string | null;
  plan_id: string | null;
  monto_gs: number;
  metodo: string | null;
  estado: string;
  fecha_pago: string | null;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  comprobante_url: string | null;
  notas_cliente: string | null;
  notas_admin: string | null;
  aprobado_at: string | null;
  rechazado_at: string | null;
  created_at: string;
};

export async function obtenerPagosNegocio(negocioId: string): Promise<PagoNegocioRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("pagos_manuales")
    .select(
      "id, suscripcion_id, plan_id, monto_gs, metodo, estado, fecha_pago, periodo_inicio, periodo_fin, comprobante_url, notas_cliente, notas_admin, aprobado_at, rechazado_at, created_at"
    )
    .eq("negocio_id", negocioId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo obtener los pagos del negocio: ${error.message}`);
  }

  return (data ?? []) as PagoNegocioRow[];
}

export type SolicitudCambioPlanRow = {
  id: string;
  plan_actual_id: string | null;
  plan_solicitado_id: string | null;
  estado: string;
  mensaje: string | null;
  telefono_contacto: string | null;
  created_at: string;
};

export async function obtenerSolicitudesCambioPlan(negocioId: string): Promise<SolicitudCambioPlanRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("solicitudes_cambio_plan")
    .select("id, plan_actual_id, plan_solicitado_id, estado, mensaje, telefono_contacto, created_at")
    .eq("negocio_id", negocioId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo obtener las solicitudes de cambio de plan: ${error.message}`);
  }

  return (data ?? []) as SolicitudCambioPlanRow[];
}

export type NotaAdminNegocioRow = {
  id: string;
  admin_id: string;
  nota: string;
  created_at: string;
};

export async function obtenerNotasNegocio(negocioId: string): Promise<NotaAdminNegocioRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("notas_admin_negocio")
    .select("id, admin_id, nota, created_at")
    .eq("negocio_id", negocioId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudo obtener las notas internas: ${error.message}`);
  }

  return (data ?? []) as NotaAdminNegocioRow[];
}

export type AuditoriaRow = {
  id: string;
  usuario_id: string | null;
  accion: string;
  tabla_afectada: string | null;
  registro_id: string | null;
  detalles: Record<string, unknown> | null;
  origen: string | null;
  created_at: string;
};

export async function obtenerAuditoriaNegocio(negocioId: string, limite = 30): Promise<AuditoriaRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("auditoria")
    .select("id, usuario_id, accion, tabla_afectada, registro_id, detalles, origen, created_at")
    .eq("negocio_id", negocioId)
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    throw new Error(`No se pudo obtener la auditoría del negocio: ${error.message}`);
  }

  return (data ?? []) as AuditoriaRow[];
}
