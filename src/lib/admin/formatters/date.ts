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
