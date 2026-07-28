const ZONA_HORARIA_NEGOCIO = "America/Asuncion";
const FECHA_ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const HORA_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)/;

function partesActuales(ahora: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(ahora);
}

function obtenerParte(
  partes: Intl.DateTimeFormatPart[],
  tipo: Intl.DateTimeFormatPartTypes,
) {
  return partes.find((parte) => parte.type === tipo)?.value ?? "";
}

export function fechaActualNegocio(ahora = new Date()) {
  const partes = partesActuales(ahora);

  return `${obtenerParte(partes, "year")}-${obtenerParte(
    partes,
    "month",
  )}-${obtenerParte(partes, "day")}`;
}

export function fechaIsoValida(fecha: string) {
  const match = FECHA_ISO_PATTERN.exec(fecha);

  if (!match) return false;

  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const date = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    date.getUTCFullYear() === anio &&
    date.getUTCMonth() === mes - 1 &&
    date.getUTCDate() === dia
  );
}

export function fechaReservaPasada(fecha: string, ahora = new Date()) {
  return !fechaIsoValida(fecha) || fecha < fechaActualNegocio(ahora);
}

export function fechaHoraReservaPasada(
  fecha: string,
  hora: string,
  ahora = new Date(),
) {
  if (!fechaIsoValida(fecha) || !HORA_PATTERN.test(hora)) return true;

  const partes = partesActuales(ahora);
  const actual = `${obtenerParte(partes, "year")}-${obtenerParte(
    partes,
    "month",
  )}-${obtenerParte(partes, "day")} ${obtenerParte(
    partes,
    "hour",
  )}:${obtenerParte(partes, "minute")}`;

  return `${fecha} ${hora.slice(0, 5)}` < actual;
}
