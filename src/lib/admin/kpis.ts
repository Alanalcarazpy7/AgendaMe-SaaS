import type { NegocioResumenRow } from "@/lib/admin/types/negocio";
import type { PlanAdminRow } from "@/lib/admin/queries/planes";
import type { PagoAprobadoRow } from "@/lib/admin/queries/pagos";
import { anioMesActualAsuncion, anioMesAsuncion, nombreMesCorto, ultimosMeses } from "@/lib/admin/formatters/date";

export type PlatformKpis = {
  negociosTotales: number;
  negociosActivos: number;
  negociosBloqueados: number;
  negociosNuevosEsteMes: number;
  suscripcionesActivas: number;
  suscripcionesVencidas: number;
  suscripcionesPorVencer7: number;
  suscripcionesPorVencer30: number;
  negociosGratuitos: number;
  negociosPagos: number;
  citasTotalesProcesadas: number;
  citasEsteMes: number;
  pagosPendientes: number;
  ingresoCobradoMesGs: number;
  ingresoCobradoAnioGs: number;
  mrrEstimadoGs: number;
  arrEstimadoGs: number;
};

export type PuntoIngresoMes = { etiqueta: string; anio: number; mes: number; montoGs: number };
export type PuntoNegociosMes = { etiqueta: string; anio: number; mes: number; cantidad: number };
export type PuntoDistribucionPlan = { clave: string; nombre: string; cantidad: number };
export type PuntoSuscripciones = { estado: string; cantidad: number };

function esPlanGratis(claveOrdenPrecio: { clave: string | null; precioMensual: number }): boolean {
  return claveOrdenPrecio.clave === "gratis" || claveOrdenPrecio.precioMensual === 0;
}

export function calcularKpis(args: {
  negocios: NegocioResumenRow[];
  planes: PlanAdminRow[];
  pagosAprobados: PagoAprobadoRow[];
  pagosPendientes: number;
}): PlatformKpis {
  const { negocios, planes, pagosAprobados, pagosPendientes } = args;
  const { anio: anioActual, mes: mesActual } = anioMesActualAsuncion();
  const planPorClave = new Map(planes.map((p) => [p.clave, p]));

  let negociosActivos = 0;
  let negociosBloqueados = 0;
  let negociosNuevosEsteMes = 0;
  let suscripcionesActivas = 0;
  let suscripcionesVencidas = 0;
  let suscripcionesPorVencer7 = 0;
  let suscripcionesPorVencer30 = 0;
  let negociosGratuitos = 0;
  let negociosPagos = 0;
  let citasTotalesProcesadas = 0;
  let citasEsteMes = 0;
  let mrrEstimadoGs = 0;

  for (const n of negocios) {
    if (n.estado === "activo") negociosActivos++;
    if (n.estado === "bloqueado") negociosBloqueados++;

    if (n.created_at) {
      const creado = anioMesAsuncion(n.created_at);
      if (creado.anio === anioActual && creado.mes === mesActual) negociosNuevosEsteMes++;
    }

    if (n.suscripcion_estado === "activa") {
      suscripcionesActivas++;

      if (typeof n.dias_para_vencer === "number") {
        if (n.dias_para_vencer < 0) suscripcionesVencidas++;
        else if (n.dias_para_vencer <= 7) suscripcionesPorVencer7++;
        else if (n.dias_para_vencer <= 30) suscripcionesPorVencer30++;
      }

      const plan = n.plan_clave ? planPorClave.get(n.plan_clave) : undefined;
      const precioMensual = plan?.precio_mensual_gs ?? n.precio_gs ?? 0;

      if (esPlanGratis({ clave: n.plan_clave, precioMensual })) {
        negociosGratuitos++;
      } else {
        negociosPagos++;
        mrrEstimadoGs += precioMensual;
      }
    } else if (n.suscripcion_estado === "vencida") {
      suscripcionesVencidas++;
    } else if (!n.suscripcion_estado) {
      negociosGratuitos++;
    }

    citasTotalesProcesadas += n.citas_total ?? 0;
    citasEsteMes += n.citas_mes_actual ?? 0;
  }

  let ingresoCobradoMesGs = 0;
  let ingresoCobradoAnioGs = 0;

  for (const pago of pagosAprobados) {
    if (!pago.fecha_pago) continue;
    const { anio, mes } = anioMesAsuncion(pago.fecha_pago);
    if (anio === anioActual) {
      ingresoCobradoAnioGs += pago.monto_gs ?? 0;
      if (mes === mesActual) ingresoCobradoMesGs += pago.monto_gs ?? 0;
    }
  }

  return {
    negociosTotales: negocios.length,
    negociosActivos,
    negociosBloqueados,
    negociosNuevosEsteMes,
    suscripcionesActivas,
    suscripcionesVencidas,
    suscripcionesPorVencer7,
    suscripcionesPorVencer30,
    negociosGratuitos,
    negociosPagos,
    citasTotalesProcesadas,
    citasEsteMes,
    pagosPendientes,
    ingresoCobradoMesGs,
    ingresoCobradoAnioGs,
    mrrEstimadoGs,
    arrEstimadoGs: mrrEstimadoGs * 12,
  };
}

/** Serie de ingresos cobrados (pagos aprobados) por mes, últimos `cantidadMeses`. */
export function calcularIngresosPorMes(
  pagosAprobados: PagoAprobadoRow[],
  cantidadMeses = 6
): PuntoIngresoMes[] {
  const meses = ultimosMeses(cantidadMeses);
  const totales = new Map<string, number>();

  for (const pago of pagosAprobados) {
    if (!pago.fecha_pago) continue;
    const { anio, mes } = anioMesAsuncion(pago.fecha_pago);
    const clave = `${anio}-${mes}`;
    totales.set(clave, (totales.get(clave) ?? 0) + (pago.monto_gs ?? 0));
  }

  return meses.map(({ anio, mes }) => ({
    etiqueta: `${nombreMesCorto(mes)} ${String(anio).slice(2)}`,
    anio,
    mes,
    montoGs: totales.get(`${anio}-${mes}`) ?? 0,
  }));
}

/** Serie de negocios nuevos por mes (según created_at), últimos `cantidadMeses`. */
export function calcularNegociosNuevosPorMes(
  negocios: NegocioResumenRow[],
  cantidadMeses = 6
): PuntoNegociosMes[] {
  const meses = ultimosMeses(cantidadMeses);
  const totales = new Map<string, number>();

  for (const n of negocios) {
    if (!n.created_at) continue;
    const { anio, mes } = anioMesAsuncion(n.created_at);
    const clave = `${anio}-${mes}`;
    totales.set(clave, (totales.get(clave) ?? 0) + 1);
  }

  return meses.map(({ anio, mes }) => ({
    etiqueta: `${nombreMesCorto(mes)} ${String(anio).slice(2)}`,
    anio,
    mes,
    cantidad: totales.get(`${anio}-${mes}`) ?? 0,
  }));
}

export function calcularDistribucionPorPlan(
  negocios: NegocioResumenRow[],
  planes: PlanAdminRow[]
): PuntoDistribucionPlan[] {
  const nombrePorClave = new Map(planes.map((p) => [p.clave, p.nombre]));
  const totales = new Map<string, number>();

  for (const n of negocios) {
    const clave = n.plan_clave ?? "sin_plan";
    totales.set(clave, (totales.get(clave) ?? 0) + 1);
  }

  return Array.from(totales.entries())
    .map(([clave, cantidad]) => ({
      clave,
      nombre: clave === "sin_plan" ? "Sin plan" : (nombrePorClave.get(clave) ?? clave),
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

export function calcularDistribucionSuscripciones(kpis: PlatformKpis): PuntoSuscripciones[] {
  return [
    { estado: "Activas", cantidad: kpis.suscripcionesActivas - kpis.suscripcionesVencidas },
    { estado: "Vencidas", cantidad: kpis.suscripcionesVencidas },
    { estado: "Por vencer (30d)", cantidad: kpis.suscripcionesPorVencer30 },
  ].map((p) => ({ ...p, cantidad: Math.max(0, p.cantidad) }));
}
