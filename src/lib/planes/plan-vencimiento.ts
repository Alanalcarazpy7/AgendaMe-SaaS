import "server-only";

import type { createServiceRoleClient } from "@/lib/supabase/service-role";
import { diasEntreFechasAsuncion } from "@/lib/admin/formatters/date";

type SupabaseAdmin = ReturnType<typeof createServiceRoleClient>;

export type SeveridadVencimiento = "amarillo" | "rojo";

export type VencimientoPlanSnapshot = {
  fechaVencimiento: string;
  diasParaVencer: number;
  ciclo: "mensual" | "anual";
  severidad: SeveridadVencimiento | null;
};

/**
 * Umbrales pedidos explícitamente por el propietario, distintos según el
 * ciclo de facturación: un plan anual da más margen para avisar (el pago es
 * más grande y menos frecuente) que uno mensual.
 * - Mensual: amarillo entre 12 y 5 días restantes, rojo con 4 días o menos
 *   (incluye ya vencido).
 * - Anual: amarillo en el último mes (<=30 días), rojo en las últimas 2
 *   semanas (<=14 días, incluye ya vencido).
 */
function calcularSeveridad(diasParaVencer: number, ciclo: "mensual" | "anual"): SeveridadVencimiento | null {
  if (ciclo === "anual") {
    if (diasParaVencer <= 14) return "rojo";
    if (diasParaVencer <= 30) return "amarillo";
    return null;
  }

  if (diasParaVencer <= 4) return "rojo";
  if (diasParaVencer <= 12) return "amarillo";
  return null;
}

/**
 * Determina el ciclo de facturación "real" del negocio para elegir qué
 * umbrales aplicar. `suscripciones.ciclo_facturacion` no se setea todavía
 * en ningún flujo de código (admin_cambiar_plan_negocio no lo recibe), así
 * que siempre queda en su default de columna ('mensual') sin importar lo
 * que el negocio haya pagado realmente. Por eso se usa el pago aprobado más
 * reciente (`pagos_manuales.ciclo_facturacion`, que sí se captura desde el
 * formulario del dashboard) como mejor aproximación disponible hoy.
 */
async function obtenerCicloFacturacionReal(
  supabase: SupabaseAdmin,
  negocioId: string
): Promise<"mensual" | "anual"> {
  const { data, error } = await supabase
    .from("pagos_manuales")
    .select("ciclo_facturacion")
    .eq("negocio_id", negocioId)
    .eq("estado", "aprobado")
    .order("aprobado_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const ciclo = (data as { ciclo_facturacion: string | null } | null)?.ciclo_facturacion;
  return ciclo === "anual" ? "anual" : "mensual";
}

/** null si el negocio no tiene una suscripción activa con fecha de vencimiento. */
export async function obtenerVencimientoPlanNegocio(
  supabase: SupabaseAdmin,
  negocioId: string
): Promise<VencimientoPlanSnapshot | null> {
  const { data: suscripcion, error } = await supabase
    .from("suscripciones")
    .select("fecha_vencimiento")
    .eq("negocio_id", negocioId)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!suscripcion?.fecha_vencimiento) return null;

  const [ciclo, diasParaVencer] = await Promise.all([
    obtenerCicloFacturacionReal(supabase, negocioId),
    Promise.resolve(diasEntreFechasAsuncion(suscripcion.fecha_vencimiento)),
  ]);

  return {
    fechaVencimiento: suscripcion.fecha_vencimiento,
    diasParaVencer,
    ciclo,
    severidad: calcularSeveridad(diasParaVencer, ciclo),
  };
}
