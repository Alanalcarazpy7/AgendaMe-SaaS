import "server-only";
import type { PagoConNegocioRow } from "@/lib/admin/queries/pagos";

export type RelacionPlan = "renovacion" | "upgrade" | "downgrade" | "desconocido";

export type ContextoPago = {
  planActualNombre: string | null;
  planActualClave: string | null;
  planPagadoNombre: string | null;
  relacion: RelacionPlan;
  cicloLabel: string;
  montoEsperadoGs: number | null;
  montoCoincide: boolean | null;
};

/**
 * Compara el plan que el negocio tiene activo AHORA contra el plan por el
 * que está pagando este comprobante, para que el admin vea de un vistazo
 * si es una renovación del mismo plan, una mejora (upgrade) o una baja
 * (downgrade) — y si el monto enviado coincide con el precio real del
 * plan/ciclo, sin tener que ir a mirar la tabla de planes aparte.
 */
export function calcularContextoPago({
  pago,
  planActualClave,
  planActualNombre,
  ordenPorClave,
}: {
  pago: Pick<PagoConNegocioRow, "ciclo_facturacion" | "monto_gs" | "planes_saas">;
  planActualClave: string | null | undefined;
  planActualNombre: string | null | undefined;
  ordenPorClave: Map<string, number>;
}): ContextoPago {
  const planPagado = pago.planes_saas;

  let relacion: RelacionPlan = "desconocido";

  if (planPagado && planActualClave) {
    if (planPagado.clave === planActualClave) {
      relacion = "renovacion";
    } else {
      const ordenActual = ordenPorClave.get(planActualClave);
      if (typeof ordenActual === "number") {
        relacion = planPagado.orden > ordenActual ? "upgrade" : "downgrade";
      }
    }
  }

  const cicloLabel =
    pago.ciclo_facturacion === "mensual"
      ? "Mensual"
      : pago.ciclo_facturacion === "anual"
        ? "Anual"
        : "Sin ciclo definido";

  const montoEsperadoGs = planPagado
    ? pago.ciclo_facturacion === "anual"
      ? planPagado.precio_anual_gs
      : pago.ciclo_facturacion === "mensual"
        ? planPagado.precio_mensual_gs
        : null
    : null;

  const montoCoincide = montoEsperadoGs === null ? null : montoEsperadoGs === pago.monto_gs;

  return {
    planActualNombre: planActualNombre ?? null,
    planActualClave: planActualClave ?? null,
    planPagadoNombre: planPagado?.nombre ?? null,
    relacion,
    cicloLabel,
    montoEsperadoGs,
    montoCoincide,
  };
}
