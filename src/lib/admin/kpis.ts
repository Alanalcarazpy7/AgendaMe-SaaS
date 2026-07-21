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

export type RecursoConLimite = "citas" | "empleados" | "servicios" | "clientes" | "sucursales";

export const ETIQUETA_RECURSO_LIMITE: Record<RecursoConLimite, string> = {
  citas: "Citas/mes",
  empleados: "Empleados",
  servicios: "Servicios",
  clientes: "Clientes",
  sucursales: "Sucursales",
};

export type UsoLimitePlan = {
  /** Mayor ratio uso/limite entre los 5 recursos (0 si ninguno tiene limite configurado). */
  ratioMax: number;
  /** Cual de los 5 recursos produjo ese ratio maximo. */
  recursoMax: RecursoConLimite | null;
  /** true si ratioMax >= 0.8 (mismo umbral historico de "cerca del limite", ahora sobre los 5 recursos). */
  cercaOSobreLimite: boolean;
};

const RECURSOS_CON_TOTAL_EN_RESUMEN: {
  recurso: RecursoConLimite;
  usoKey: keyof Pick<
    NegocioResumenRow,
    "citas_usadas_mes_actual" | "empleados_total" | "servicios_total" | "clientes_total"
  >;
  limiteKey: keyof Pick<
    PlanAdminRow,
    "limite_citas_mensuales" | "limite_empleados" | "limite_servicios" | "limite_clientes"
  >;
}[] = [
  { recurso: "citas", usoKey: "citas_usadas_mes_actual", limiteKey: "limite_citas_mensuales" },
  { recurso: "empleados", usoKey: "empleados_total", limiteKey: "limite_empleados" },
  { recurso: "servicios", usoKey: "servicios_total", limiteKey: "limite_servicios" },
  { recurso: "clientes", usoKey: "clientes_total", limiteKey: "limite_clientes" },
];

/**
 * Compara el uso real de un negocio contra los 5 limites de su plan (citas,
 * empleados, servicios, clientes, sucursales) y devuelve el peor caso.
 * Antes, "cerca del limite" en /admin/analitica solo miraba citas — un
 * negocio bajado de plan que quedara sobre el limite de sucursales (por
 * ejemplo) no aparecia ahi. `sucursalesTotal` no viene en
 * `admin_obtener_negocios_resumen()`, por eso se recibe aparte (ver
 * `obtenerConteoSucursalesPorNegocio()`).
 */
export function calcularUsoLimitePlan(
  negocio: NegocioResumenRow,
  plan: PlanAdminRow | undefined,
  sucursalesTotal: number
): UsoLimitePlan {
  if (!plan) return { ratioMax: 0, recursoMax: null, cercaOSobreLimite: false };

  let ratioMax = 0;
  let recursoMax: RecursoConLimite | null = null;

  for (const { recurso, usoKey, limiteKey } of RECURSOS_CON_TOTAL_EN_RESUMEN) {
    const limite = plan[limiteKey];
    const uso = negocio[usoKey] ?? 0;
    if (typeof limite === "number" && limite > 0) {
      const ratio = uso / limite;
      if (ratio > ratioMax) {
        ratioMax = ratio;
        recursoMax = recurso;
      }
    }
  }

  if (typeof plan.limite_sucursales === "number" && plan.limite_sucursales > 0) {
    const ratio = sucursalesTotal / plan.limite_sucursales;
    if (ratio > ratioMax) {
      ratioMax = ratio;
      recursoMax = "sucursales";
    }
  }

  return { ratioMax, recursoMax, cercaOSobreLimite: ratioMax >= 0.8 };
}
