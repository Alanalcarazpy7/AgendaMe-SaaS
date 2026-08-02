export type PlanPeriodo = "mensual" | "anual";

export type PlanFeatureFlag =
  | "permite_reportes_basicos"
  | "permite_reportes_avanzados"
  | "permite_personalizacion"
  | "permite_exportacion_csv"
  | "permite_multiples_sucursales"
  | "permite_recordatorios_whatsapp"
  | "permite_soporte_prioritario"
  | "permite_funcionalidades_a_medida";

export type PlanPublico = {
  id: string;
  clave: string;
  nombre: string;
  descripcion_corta: string | null;
  texto_destacado: string | null;
  precio_mensual_gs: number;
  precio_anual_gs: number;
  ahorro_anual_meses: number;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
  limite_sucursales: number | null;
  permite_reportes_basicos: boolean;
  permite_reportes_avanzados: boolean;
  permite_personalizacion: boolean;
  permite_exportacion_csv: boolean;
  permite_multiples_sucursales: boolean;
  permite_recordatorios_whatsapp: boolean;
  permite_soporte_prioritario: boolean;
  permite_funcionalidades_a_medida: boolean;
  features: string[] | null;
  destacado: boolean;
  orden: number;
};

const FUNCIONALIDADES_A_MEDIDA = "Funcionalidades a medida bajo evaluación";

export function formatGs(valor: number | string | null | undefined) {
  const numero = Number(valor ?? 0);

  if (!numero) return "Gs. 0";

  return `Gs. ${numero.toLocaleString("es-PY")}`;
}

export function formatLimit(
  valor: number | null | undefined,
  singular: string,
  plural: string
) {
  if (valor === null || valor === undefined) {
    return FUNCIONALIDADES_A_MEDIDA;
  }

  const cantidad = Number(valor);
  const unidad = cantidad === 1 ? singular : plural;

  return `${cantidad.toLocaleString("es-PY")} ${unidad}`;
}

export function formatPlanPrice(plan: PlanPublico, periodo: PlanPeriodo) {
  const valor = periodo === "anual" ? plan.precio_anual_gs : plan.precio_mensual_gs;

  return formatGs(valor);
}

export function getAhorroAnualGs(plan: PlanPublico) {
  const totalPagandoMensual = Number(plan.precio_mensual_gs ?? 0) * 12;
  const totalAnual = Number(plan.precio_anual_gs ?? 0);
  const ahorro = totalPagandoMensual - totalAnual;

  return ahorro > 0 ? ahorro : 0;
}

export function getAhorroAnualLabel(plan: PlanPublico) {
  const meses = Number(plan.ahorro_anual_meses ?? 0);

  if (meses <= 0) return "";

  return `Ahorrás ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

export function getAhorroAnualMontoLabel(plan: PlanPublico) {
  const ahorro = getAhorroAnualGs(plan);

  if (ahorro <= 0) return "";

  return `Ahorrás ${formatGs(ahorro)} al año`;
}

export function getDescripcionPlan(plan: PlanPublico) {
  return plan.descripcion_corta?.trim() || "Descripción no disponible.";
}

export function getTextoDestacadoPlan(plan: PlanPublico) {
  return plan.texto_destacado?.trim() || "Plan AgendaMe";
}

export function planPermite(plan: PlanPublico, flag: PlanFeatureFlag) {
  return plan[flag];
}

export function generarCapacidadesPlan(plan: PlanPublico): string[] {
  return [
    formatLimit(plan.limite_citas_mensuales, "cita mensual", "citas mensuales"),
    formatLimit(plan.limite_clientes, "cliente activo", "clientes activos"),
    formatLimit(plan.limite_empleados, "empleado activo", "empleados activos"),
    formatLimit(plan.limite_servicios, "servicio activo", "servicios activos"),
    formatLimit(plan.limite_sucursales, "sucursal", "sucursales"),
  ];
}

export function generarFeaturesPlan(plan: PlanPublico): string[] {
  const features = Array.isArray(plan.features)
    ? plan.features.filter(
        (feature): feature is string =>
          typeof feature === "string" && feature.trim().length > 0
      )
    : [];

  return features;
}

export function generarMensajeWhatsAppPlan(
  plan: PlanPublico,
  periodo: PlanPeriodo = "mensual"
) {
  const precio = formatPlanPrice(plan, periodo);
  const frecuencia = periodo === "anual" ? "anual" : "mensual";

  return `Hola, quiero contratar el Plan ${plan.nombre} de AgendaMe (${frecuencia}, ${precio}). ¿Podemos coordinar el alta?`;
}
