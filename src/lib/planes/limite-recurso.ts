import "server-only";

import type { createServiceRoleClient } from "@/lib/supabase/service-role";
import { obtenerUsoPlanNegocio, type PlanLimitKey } from "@/lib/planes/plan-limits";

type SupabaseAdmin = ReturnType<typeof createServiceRoleClient>;

export type LimiteRecursoInfo = {
  recurso: PlanLimitKey;
  tituloRecurso: string;
  etiquetaUso: string;
  alcanzado: boolean;
  usados: number;
  limite: number | null;
  planActualNombre: string;
  siguientePlan: {
    nombre: string;
    destacado: boolean;
    precioMensualGs: number;
    precioAnualGs: number;
    ahorroAnualMeses: number;
    limiteRecurso: number | null;
    beneficios: string[];
  } | null;
};

type PlanCatalogoRow = {
  clave: string;
  nombre: string;
  orden: number;
  destacado: boolean;
  precio_mensual_gs: number;
  precio_anual_gs: number;
  ahorro_anual_meses: number;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
  limite_sucursales: number | null;
  permite_reportes_basicos: boolean;
  permite_personalizacion: boolean;
  permite_reportes_avanzados: boolean;
  permite_recordatorios_whatsapp: boolean;
  permite_exportacion_csv: boolean;
  permite_multiples_sucursales: boolean;
  permite_soporte_prioritario: boolean;
};

const COLUMNAS_PLAN =
  "clave, nombre, orden, destacado, precio_mensual_gs, precio_anual_gs, ahorro_anual_meses, limite_citas_mensuales, limite_empleados, limite_servicios, limite_clientes, limite_sucursales, permite_reportes_basicos, permite_personalizacion, permite_reportes_avanzados, permite_recordatorios_whatsapp, permite_exportacion_csv, permite_multiples_sucursales, permite_soporte_prioritario";

const COLUMNA_LIMITE: Record<PlanLimitKey, keyof PlanCatalogoRow> = {
  servicios: "limite_servicios",
  empleados: "limite_empleados",
  clientes: "limite_clientes",
  citas: "limite_citas_mensuales",
  sucursales: "limite_sucursales",
};

const BENEFICIOS_PLAN: { key: keyof PlanCatalogoRow; label: string }[] = [
  { key: "permite_reportes_avanzados", label: "Reportes avanzados de ingresos y demanda" },
  { key: "permite_recordatorios_whatsapp", label: "Recordatorios manuales por WhatsApp" },
  { key: "permite_multiples_sucursales", label: "Gestión de varias sucursales" },
  { key: "permite_exportacion_csv", label: "Exportación de datos a Excel y CSV" },
  { key: "permite_soporte_prioritario", label: "Soporte prioritario" },
  { key: "permite_personalizacion", label: "Logo y banner personalizados" },
  { key: "permite_reportes_basicos", label: "Reportes básicos de citas e ingresos" },
];

function calcularBeneficiosSiguientePlan(
  actual: PlanCatalogoRow,
  siguiente: PlanCatalogoRow
) {
  const beneficios = BENEFICIOS_PLAN.filter(
    (item) => siguiente[item.key] === true && actual[item.key] !== true
  ).map((item) => item.label);

  if (beneficios.length > 0) return beneficios.slice(0, 3);

  return ["Más capacidad en cada sección del panel"];
}

export async function construirLimiteRecursoInfo({
  supabase,
  negocioId,
  recurso,
  tituloRecurso,
  etiquetaUso,
  fechaCitas,
}: {
  supabase: SupabaseAdmin;
  negocioId: string;
  recurso: PlanLimitKey;
  tituloRecurso: string;
  etiquetaUso: string;
  fechaCitas?: string | null;
}): Promise<LimiteRecursoInfo> {
  const [snapshot, { data: planesData }] = await Promise.all([
    obtenerUsoPlanNegocio({ supabase, negocioId, fechaCitas }),
    supabase.from("planes_saas").select(COLUMNAS_PLAN).order("orden", { ascending: true }),
  ]);

  const recursoData = snapshot.resources.find((item) => item.key === recurso);
  const planes = (planesData ?? []) as unknown as PlanCatalogoRow[];
  const indiceActual = planes.findIndex((plan) => plan.clave === snapshot.planClave);
  const planActual = indiceActual >= 0 ? planes[indiceActual] : undefined;
  const siguientePlan = planActual ? planes[indiceActual + 1] : undefined;
  const columna = COLUMNA_LIMITE[recurso];

  return {
    recurso,
    tituloRecurso,
    etiquetaUso,
    alcanzado: Boolean(recursoData?.reached),
    usados: recursoData?.used ?? 0,
    limite: recursoData?.limit ?? null,
    planActualNombre: snapshot.planNombre,
    siguientePlan:
      siguientePlan && planActual
        ? {
            nombre: siguientePlan.nombre,
            destacado: siguientePlan.destacado,
            precioMensualGs: siguientePlan.precio_mensual_gs,
            precioAnualGs: siguientePlan.precio_anual_gs,
            ahorroAnualMeses: siguientePlan.ahorro_anual_meses,
            limiteRecurso: (siguientePlan[columna] as number | null) ?? null,
            beneficios: calcularBeneficiosSiguientePlan(planActual, siguientePlan),
          }
        : null,
  };
}
