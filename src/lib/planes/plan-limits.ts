import "server-only";

import type { createServiceRoleClient } from "@/lib/supabase/service-role";

export type PlanLimitKey =
  | "citas"
  | "empleados"
  | "servicios"
  | "clientes"
  | "sucursales";

export type PlanLimitResource = {
  key: PlanLimitKey;
  label: string;
  used: number;
  limit: number | null;
  overLimit: boolean;
  reached: boolean;
  remaining: number | null;
};

export type PlanLimitSnapshot = {
  planClave: string;
  planNombre: string;
  resources: PlanLimitResource[];
  exceeded: PlanLimitResource[];
};

type SupabaseAdmin = ReturnType<typeof createServiceRoleClient>;

type PlanRow = {
  clave: string | null;
  nombre: string | null;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
  limite_sucursales: number | null;
};

const RESOURCE_LABELS: Record<PlanLimitKey, string> = {
  citas: "Citas del mes",
  empleados: "Empleados activos",
  servicios: "Servicios activos",
  clientes: "Clientes activos",
  sucursales: "Sucursales activas",
};

function normalizarFechaMes(fecha?: string | null) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(String(fecha ?? ""))
    ? new Date(`${fecha}T12:00:00Z`)
    : new Date();

  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const inicio = new Date(Date.UTC(year, month, 1, 12));
  const siguiente = new Date(Date.UTC(year, month + 1, 1, 12));

  return {
    inicio: inicio.toISOString().slice(0, 10),
    siguiente: siguiente.toISOString().slice(0, 10),
  };
}

function armarRecurso(key: PlanLimitKey, used: number, limit: number | null): PlanLimitResource {
  const hasLimit = typeof limit === "number" && limit >= 0;

  return {
    key,
    label: RESOURCE_LABELS[key],
    used,
    limit: hasLimit ? limit : null,
    overLimit: hasLimit && used > limit,
    reached: hasLimit && used >= limit,
    remaining: hasLimit ? Math.max(limit - used, 0) : null,
  };
}

async function obtenerPlanActivoConLimites(
  supabase: SupabaseAdmin,
  negocioId: string
): Promise<PlanRow> {
  const { data: suscripcion, error } = await supabase
    .from("suscripciones")
    .select(
      `
      planes_saas (
        clave,
        nombre,
        limite_citas_mensuales,
        limite_empleados,
        limite_servicios,
        limite_clientes,
        limite_sucursales
      )
    `
    )
    .eq("negocio_id", negocioId)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const plan = Array.isArray((suscripcion as any)?.planes_saas)
    ? (suscripcion as any).planes_saas[0]
    : (suscripcion as any)?.planes_saas;

  if (plan) return plan as PlanRow;

  const { data: gratis, error: gratisError } = await supabase
    .from("planes_saas")
    .select(
      "clave, nombre, limite_citas_mensuales, limite_empleados, limite_servicios, limite_clientes, limite_sucursales"
    )
    .eq("clave", "gratis")
    .maybeSingle();

  if (gratisError) throw new Error(gratisError.message);

  return (
    (gratis as PlanRow | null) ?? {
      clave: "gratis",
      nombre: "Gratis",
      limite_citas_mensuales: null,
      limite_empleados: null,
      limite_servicios: null,
      limite_clientes: null,
      limite_sucursales: null,
    }
  );
}

export async function obtenerUsoPlanNegocio({
  supabase,
  negocioId,
  fechaCitas,
}: {
  supabase: SupabaseAdmin;
  negocioId: string;
  fechaCitas?: string | null;
}): Promise<PlanLimitSnapshot> {
  const plan = await obtenerPlanActivoConLimites(supabase, negocioId);
  const mes = normalizarFechaMes(fechaCitas);

  const [citasResult, empleadosResult, serviciosResult, clientesResult, sucursalesResult] =
    await Promise.all([
      supabase
        .from("citas")
        .select("id", { count: "exact", head: true })
        .eq("negocio_id", negocioId)
        .gte("fecha", mes.inicio)
        .lt("fecha", mes.siguiente)
        .neq("estado", "cancelada"),
      supabase
        .from("empleados")
        .select("id", { count: "exact", head: true })
        .eq("negocio_id", negocioId)
        .eq("estado", "activo"),
      supabase
        .from("servicios")
        .select("id", { count: "exact", head: true })
        .eq("negocio_id", negocioId)
        .eq("estado", "activo"),
      supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("negocio_id", negocioId)
        .eq("estado", "activo"),
      supabase
        .from("sucursales")
        .select("id", { count: "exact", head: true })
        .eq("negocio_id", negocioId)
        .eq("estado", "activo"),
    ]);

  const error =
    citasResult.error ??
    empleadosResult.error ??
    serviciosResult.error ??
    clientesResult.error ??
    sucursalesResult.error;

  if (error) throw new Error(error.message);

  const resources = [
    armarRecurso("citas", citasResult.count ?? 0, plan.limite_citas_mensuales),
    armarRecurso("empleados", empleadosResult.count ?? 0, plan.limite_empleados),
    armarRecurso("servicios", serviciosResult.count ?? 0, plan.limite_servicios),
    armarRecurso("clientes", clientesResult.count ?? 0, plan.limite_clientes),
    armarRecurso("sucursales", sucursalesResult.count ?? 0, plan.limite_sucursales),
  ];

  return {
    planClave: plan.clave ?? "gratis",
    planNombre: plan.nombre ?? "Gratis",
    resources,
    exceeded: resources.filter((resource) => resource.overLimit),
  };
}

export async function validarCapacidadPlan({
  supabase,
  negocioId,
  recurso,
  fechaCitas,
}: {
  supabase: SupabaseAdmin;
  negocioId: string;
  recurso: PlanLimitKey;
  fechaCitas?: string | null;
}) {
  const snapshot = await obtenerUsoPlanNegocio({
    supabase,
    negocioId,
    fechaCitas,
  });
  const resource = snapshot.resources.find((item) => item.key === recurso);

  if (!resource || resource.limit === null || !resource.reached) {
    return {
      ok: true as const,
      snapshot,
      resource,
    };
  }

  return {
    ok: false as const,
    snapshot,
    resource,
    message: `Tu negocio supera los limites del plan ${snapshot.planNombre}. Para crear mas ${resource.label.toLowerCase()}, subi de plan o desactiva registros hasta quedar dentro del limite.`,
  };
}
