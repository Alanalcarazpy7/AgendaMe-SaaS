const TIMEZONE = "America/Asuncion";

export function anioMesAsuncion(fecha: string | Date): { anio: number; mes: number } {
  const valor = typeof fecha === "string" ? new Date(fecha) : fecha;

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(valor);

  const anio = Number(partes.find((p) => p.type === "year")?.value ?? 0);
  const mes = Number(partes.find((p) => p.type === "month")?.value ?? 0);

  return { anio, mes };
}

export function anioMesActualAsuncion(): { anio: number; mes: number } {
  return anioMesAsuncion(new Date());
}

export function formatearFechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—";

  return new Intl.DateTimeFormat("es-PY", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));
}

export function formatearFechaHora(fecha: string | null | undefined): string {
  if (!fecha) return "—";

  return new Intl.DateTimeFormat("es-PY", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
}

const NOMBRES_MES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function nombreMesCorto(mes: number): string {
  return NOMBRES_MES[(mes - 1 + 12) % 12];
}

/** Últimos `cantidad` pares {anio, mes} terminando en el mes actual (America/Asuncion), en orden ascendente. */
export function ultimosMeses(cantidad: number): { anio: number; mes: number }[] {
  const { anio, mes } = anioMesActualAsuncion();
  const resultado: { anio: number; mes: number }[] = [];

  for (let i = cantidad - 1; i >= 0; i--) {
    const total = anio * 12 + (mes - 1) - i;
    resultado.push({ anio: Math.floor(total / 12), mes: (total % 12) + 1 });
  }

  return resultado;
}

function partesFechaAsuncion(fecha: Date): { anio: number; mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  return {
    anio: Number(partes.find((p) => p.type === "year")?.value ?? 0),
    mes: Number(partes.find((p) => p.type === "month")?.value ?? 0),
    dia: Number(partes.find((p) => p.type === "day")?.value ?? 0),
  };
}

/**
 * Días de calendario (en America/Asuncion) entre `hoy` y `fechaObjetivo`.
 * Positivo si `fechaObjetivo` es futura, negativo si ya pasó. Compara los
 * componentes año/mes/día como un serial UTC-medianoche (no la diferencia
 * cruda de milisegundos entre los `Date`), para no depender de la hora del
 * día ni del huso horario del proceso.
 */
export function diasEntreFechasAsuncion(fechaObjetivo: string | Date, hoy: Date = new Date()): number {
  const objetivo = typeof fechaObjetivo === "string" ? new Date(fechaObjetivo) : fechaObjetivo;
  const { anio: a1, mes: m1, dia: d1 } = partesFechaAsuncion(hoy);
  const { anio: a2, mes: m2, dia: d2 } = partesFechaAsuncion(objetivo);

  const serialHoy = Date.UTC(a1, m1 - 1, d1);
  const serialObjetivo = Date.UTC(a2, m2 - 1, d2);

  return Math.round((serialObjetivo - serialHoy) / 86_400_000);
}

function diasEnMes(anio: number, mes1a12: number): number {
  // new Date(anio, mes1a12, 0) cae en el último día del mes `mes1a12` (1-12),
  // porque el día 0 de un mes es el último día del mes anterior.
  return new Date(anio, mes1a12, 0).getDate();
}

/**
 * Suma `meses` a la fecha (interpretada en America/Asuncion) conservando el
 * mismo día del mes — no "N días" fijos, que varían según cuántos días tenga
 * cada mes. Si el mes destino no tiene ese día (ej. 31 de enero + 1 mes),
 * se ajusta al último día disponible de ese mes.
 *
 * Trabaja enteramente con componentes de calendario (año/mes/día), nunca
 * con aritmética de `Date`/UTC: `Date.setMonth()` + `toISOString()` puede
 * correr la fecha un día para adelante o atrás según la hora exacta del
 * pago y el huso horario del proceso — por ejemplo, un pago hecho a la
 * noche en Paraguay (UTC-4) ya cae en el día siguiente en UTC. Eso
 * generaba fechas sugeridas incorrectas (o corridas un día).
 */
function sumarMesesCalendarioAsuncion(fechaBase: Date, meses: number): string {
  const { anio, mes, dia } = partesFechaAsuncion(fechaBase);
  const totalMeses = anio * 12 + (mes - 1) + meses;
  const anioDestino = Math.floor(totalMeses / 12);
  const mesDestino = (totalMeses % 12) + 1;
  const diaDestino = Math.min(dia, diasEnMes(anioDestino, mesDestino));

  return `${anioDestino}-${String(mesDestino).padStart(2, "0")}-${String(diaDestino).padStart(2, "0")}`;
}

function aFechaInputAsuncion(fecha: Date): string {
  return sumarMesesCalendarioAsuncion(fecha, 0);
}

/**
 * Sugiere la fecha de vencimiento al aprobar un pago manual, para no obligar
 * a recalcularla a mano cuando ya se sabe el ciclo. Orden de prioridad:
 * 1. Si el pago ya tiene `periodo_fin` cargado explícitamente (ej.
 *    registrado con los presets mensual/anual desde el panel admin), se usa
 *    tal cual (su día calendario en America/Asuncion).
 * 2. Si se conoce la fecha de vencimiento de la suscripción **actual** del
 *    negocio y el pago indica `ciclo_facturacion` ('mensual'|'anual'), la
 *    nueva fecha se calcula sumando 1 o 12 meses a partir de ESE
 *    vencimiento — no de la fecha en que se subió el comprobante. Un pago
 *    hecho unos días antes o después del vencimiento no debe correr el
 *    ciclo: si vence el 20/09 y paga el 18/09 (o el 22/09), el nuevo
 *    vencimiento sigue siendo 20/10, ancla al día del ciclo, no al día en
 *    que pagó.
 * 3. Si el negocio no tiene un vencimiento actual conocido (ej. su primer
 *    pago, todavía sin suscripción previa) pero sí se conoce la fecha real
 *    de pago y el ciclo, se suma desde la fecha de pago — ahí sí es el
 *    único ancla disponible para arrancar el primer período.
 * 4. Si no hay suficiente información, cae al comportamiento anterior:
 *    hoy + 1 mes. Siempre queda editable a mano en el diálogo (ej. si el
 *    negocio pagó dos meses por adelantado, o si el vencimiento anterior ya
 *    pasó hace mucho y conviene arrancar el ciclo desde hoy).
 *
 * Todos los cálculos de "sumar meses" conservan el mismo día del mes, nunca
 * "30 días" fijos (eso corre la fecha 1-2 días según el mes tenga 28-31
 * días).
 */
export function calcularVencimientoSugerido(args: {
  fechaPago: string | null | undefined;
  periodoFin: string | null | undefined;
  fechaVencimientoActual: string | null | undefined;
  cicloFacturacion: string | null | undefined;
}): string {
  const { fechaPago, periodoFin, fechaVencimientoActual, cicloFacturacion } = args;
  const cicloValido = cicloFacturacion === "mensual" || cicloFacturacion === "anual";
  const meses = cicloFacturacion === "anual" ? 12 : 1;

  if (periodoFin) {
    return aFechaInputAsuncion(new Date(periodoFin));
  }

  if (fechaVencimientoActual && cicloValido) {
    return sumarMesesCalendarioAsuncion(new Date(fechaVencimientoActual), meses);
  }

  if (fechaPago && cicloValido) {
    return sumarMesesCalendarioAsuncion(new Date(fechaPago), meses);
  }

  return sumarMesesCalendarioAsuncion(new Date(), 1);
}
