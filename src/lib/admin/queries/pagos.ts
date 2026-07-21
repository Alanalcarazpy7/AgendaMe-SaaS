import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type PagoAprobadoRow = {
  id: string;
  negocio_id: string;
  plan_id: string | null;
  monto_gs: number;
  fecha_pago: string | null;
  metodo: string | null;
};

/** Pagos aprobados de los últimos `mesesAtras` meses, para calcular ingresos por mes. */
export async function obtenerPagosAprobadosRecientes(mesesAtras = 13): Promise<PagoAprobadoRow[]> {
  const admin = createServiceRoleClient();

  const desde = new Date();
  desde.setUTCMonth(desde.getUTCMonth() - mesesAtras);
  desde.setUTCDate(1);

  const { data, error } = await admin
    .from("pagos_manuales")
    .select("id, negocio_id, plan_id, monto_gs, fecha_pago, metodo")
    .eq("estado", "aprobado")
    .gte("fecha_pago", desde.toISOString())
    .order("fecha_pago", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron obtener los pagos aprobados: ${error.message}`);
  }

  return (data ?? []) as PagoAprobadoRow[];
}

export type PagoConNegocioRow = {
  id: string;
  negocio_id: string;
  suscripcion_id: string | null;
  plan_id: string | null;
  monto_gs: number;
  metodo: string | null;
  estado: string;
  fecha_pago: string | null;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  ciclo_facturacion: string | null;
  comprobante_url: string | null;
  notas_cliente: string | null;
  notas_admin: string | null;
  aprobado_at: string | null;
  rechazado_at: string | null;
  created_at: string;
  negocios: { nombre: string; slug: string | null } | null;
  planes_saas: { clave: string; nombre: string } | null;
};

/** Todos los pagos (cualquier negocio), para /admin/pagos. Limitado a los más recientes. */
export async function obtenerTodosPagos(limite = 500): Promise<PagoConNegocioRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("pagos_manuales")
    .select(
      "id, negocio_id, suscripcion_id, plan_id, monto_gs, metodo, estado, fecha_pago, periodo_inicio, periodo_fin, ciclo_facturacion, comprobante_url, notas_cliente, notas_admin, aprobado_at, rechazado_at, created_at, negocios(nombre, slug), planes_saas(clave, nombre)"
    )
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    throw new Error(`No se pudieron obtener los pagos: ${error.message}`);
  }

  return (data ?? []) as unknown as PagoConNegocioRow[];
}

export async function contarPagosPendientes(): Promise<number> {
  const admin = createServiceRoleClient();

  const { count, error } = await admin
    .from("pagos_manuales")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente");

  if (error) {
    throw new Error(`No se pudo contar los pagos pendientes: ${error.message}`);
  }

  return count ?? 0;
}
