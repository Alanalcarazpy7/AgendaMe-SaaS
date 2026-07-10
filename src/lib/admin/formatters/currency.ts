const formatoGuaranies = new Intl.NumberFormat("es-PY", {
  style: "currency",
  currency: "PYG",
  maximumFractionDigits: 0,
});

const formatoNumero = new Intl.NumberFormat("es-PY");

export function formatearGuaranies(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return formatoGuaranies.format(valor);
}

export function formatearNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return formatoNumero.format(valor);
}
