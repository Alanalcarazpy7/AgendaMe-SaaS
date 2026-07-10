import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type SolicitudCambioPlanPendienteRow = {
  id: string;
  negocio_id: string;
  plan_actual_id: string | null;
  plan_solicitado_id: string | null;
  estado: string;
  mensaje: string | null;
  telefono_contacto: string | null;
  created_at: string;
  negocios: { nombre: string; slug: string | null; telefono: string | null; email: string | null } | null;
  plan_actual: { nombre: string; clave: string } | null;
  plan_solicitado: { nombre: string; clave: string } | null;
};

export async function contarSolicitudesCambioPlanPendientes(): Promise<number> {
  const admin = createServiceRoleClient();

  const { count, error } = await admin
    .from("solicitudes_cambio_plan")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente");

  if (error) {
    throw new Error(`No se pudo contar las solicitudes de cambio de plan: ${error.message}`);
  }

  return count ?? 0;
}

export async function obtenerSolicitudesCambioPlanPendientesDetalle(
  limite = 20
): Promise<SolicitudCambioPlanPendienteRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("solicitudes_cambio_plan")
    .select(
      "id, negocio_id, plan_actual_id, plan_solicitado_id, estado, mensaje, telefono_contacto, created_at"
    )
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true })
    .limit(limite);

  if (error) {
    throw new Error(`No se pudieron obtener las solicitudes pendientes: ${error.message}`);
  }

  const solicitudes = (data ?? []) as Omit<
    SolicitudCambioPlanPendienteRow,
    "negocios" | "plan_actual" | "plan_solicitado"
  >[];

  const negocioIds = [...new Set(solicitudes.map((s) => s.negocio_id).filter(Boolean))];
  const planIds = [
    ...new Set(
      solicitudes
        .flatMap((s) => [s.plan_actual_id, s.plan_solicitado_id])
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [{ data: negocios, error: negociosError }, { data: planes, error: planesError }] = await Promise.all([
    negocioIds.length
      ? admin.from("negocios").select("id, nombre, slug, telefono, email").in("id", negocioIds)
      : Promise.resolve({ data: [], error: null }),
    planIds.length ? admin.from("planes_saas").select("id, nombre, clave").in("id", planIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (negociosError) throw new Error(`No se pudieron obtener negocios de solicitudes: ${negociosError.message}`);
  if (planesError) throw new Error(`No se pudieron obtener planes de solicitudes: ${planesError.message}`);

  const negocioPorId = new Map((negocios ?? []).map((n) => [n.id as string, n]));
  const planPorId = new Map((planes ?? []).map((p) => [p.id as string, p]));

  return solicitudes.map((s) => ({
    ...s,
    negocios: (negocioPorId.get(s.negocio_id) as SolicitudCambioPlanPendienteRow["negocios"]) ?? null,
    plan_actual: s.plan_actual_id
      ? ((planPorId.get(s.plan_actual_id) as SolicitudCambioPlanPendienteRow["plan_actual"]) ?? null)
      : null,
    plan_solicitado: s.plan_solicitado_id
      ? ((planPorId.get(s.plan_solicitado_id) as SolicitudCambioPlanPendienteRow["plan_solicitado"]) ?? null)
      : null,
  }));
}
