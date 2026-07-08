export type PlanPeriodo = "mensual" | "anual";

export type PlanPublico = {
  id: string;
  clave: string;
  nombre: string;
  precio_mensual_gs: number;
  precio_anual_gs: number;
  ahorro_anual_meses: number;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
  limite_sucursales: number | null;
  permite_reportes_avanzados: boolean;
  permite_personalizacion: boolean;
  permite_exportacion_csv: boolean;
  permite_multiples_sucursales: boolean;
  destacado: boolean;
  orden: number;
};

const FUNCIONALIDADES_A_MEDIDA = "Funcionalidades a medida bajo evaluacion";

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

  return `Ahorras ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

export function getAhorroAnualMontoLabel(plan: PlanPublico) {
  const ahorro = getAhorroAnualGs(plan);

  if (ahorro <= 0) return "";

  return `Ahorras ${formatGs(ahorro)} al ano`;
}

export function generarFeaturesPlan(plan: PlanPublico): string[] {
  const features = [
    formatLimit(plan.limite_citas_mensuales, "cita mensual", "citas mensuales"),
    formatLimit(plan.limite_clientes, "cliente activo", "clientes activos"),
    formatLimit(plan.limite_empleados, "empleado activo", "empleados activos"),
    formatLimit(plan.limite_servicios, "servicio activo", "servicios activos"),
    "Pagina publica de reservas",
  ];

  features.push(
    plan.permite_reportes_avanzados ? "Reportes avanzados" : "Estadisticas basicas"
  );

  if (plan.permite_exportacion_csv) {
    features.push("Exportacion XLSX / CSV");
  }

  if (plan.permite_personalizacion) {
    features.push("Logo, banner e imagenes de servicios");
  }

  if (plan.permite_multiples_sucursales) {
    features.push(
      formatLimit(plan.limite_sucursales, "sucursal", "sucursales")
    );
  }

  if (!plan.limite_citas_mensuales && !plan.limite_clientes) {
    features.push(FUNCIONALIDADES_A_MEDIDA);
  }

  return features;
}

export function generarMensajeWhatsAppPlan(
  plan: PlanPublico,
  periodo: PlanPeriodo = "mensual"
) {
  const precio = formatPlanPrice(plan, periodo);
  const frecuencia = periodo === "anual" ? "anual" : "mensual";

  return `Hola, quiero contratar el Plan ${plan.nombre} de AgendaMe (${frecuencia}, ${precio}). Podemos coordinar el alta?`;
}

