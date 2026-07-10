import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type AuditoriaConNegocioRow = {
  id: string;
  negocio_id: string | null;
  usuario_id: string | null;
  accion: string;
  tabla_afectada: string | null;
  registro_id: string | null;
  detalles: Record<string, unknown> | null;
  origen: string | null;
  created_at: string;
  negocios: { nombre: string } | null;
};

export type AuditoriaFiltro = {
  desde?: string;
  hasta?: string;
  accion?: string;
  tabla?: string;
  negocioId?: string;
  pagina?: number;
  porPagina?: number;
};

export type AuditoriaPaginada = {
  filas: AuditoriaConNegocioRow[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

/** Paginación real en servidor (Supabase .range()), no en memoria: la auditoría puede crecer mucho. */
export async function obtenerAuditoriaPaginada(filtro: AuditoriaFiltro): Promise<AuditoriaPaginada> {
  const admin = createServiceRoleClient();
  const porPagina = filtro.porPagina ?? 50;
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const inicio = (pagina - 1) * porPagina;

  let query = admin
    .from("auditoria")
    .select(
      "id, negocio_id, usuario_id, accion, tabla_afectada, registro_id, detalles, origen, created_at, negocios(nombre)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filtro.desde) query = query.gte("created_at", filtro.desde);
  if (filtro.hasta) query = query.lte("created_at", filtro.hasta);
  if (filtro.accion) query = query.ilike("accion", `%${filtro.accion}%`);
  if (filtro.tabla) query = query.eq("tabla_afectada", filtro.tabla);
  if (filtro.negocioId) query = query.eq("negocio_id", filtro.negocioId);

  const { data, error, count } = await query.range(inicio, inicio + porPagina - 1);

  if (error) {
    throw new Error(`No se pudo obtener la auditoría: ${error.message}`);
  }

  const total = count ?? 0;

  return {
    filas: (data ?? []) as unknown as AuditoriaConNegocioRow[],
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}
