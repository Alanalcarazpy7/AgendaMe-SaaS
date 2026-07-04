export type PremiumFeatureKey =
  | "reportes"
  | "exportar"
  | "recordatorios"
  | "sucursales";

export const PREMIUM_FEATURES: Record<
  PremiumFeatureKey,
  {
    label: string;
    href: string;
    requiredLevel: number;
    desde: string;
    description: string;
  }
> = {
  reportes: {
    label: "Reportes",
    href: "/dashboard/reportes",
    requiredLevel: 1,
    desde: "Plan Básico",
    description:
      "Ingresos estimados, citas por estado, servicios más reservados y métricas del negocio.",
  },
  exportar: {
    label: "Exportar CSV",
    href: "/dashboard/exportar",
    requiredLevel: 2,
    desde: "Plan Profesional",
    description:
      "Exportá datos de citas, clientes y reportes para analizarlos fuera de AgendaMe.",
  },
  recordatorios: {
    label: "Recordatorios",
    href: "/dashboard/recordatorios",
    requiredLevel: 2,
    desde: "Plan Profesional",
    description:
      "Prepará recordatorios para clientes y reducí ausencias en tus reservas.",
  },
  sucursales: {
    label: "Sucursales",
    href: "/dashboard/sucursales",
    requiredLevel: 3,
    desde: "Plan Empresarial",
    description:
      "Gestioná múltiples sucursales o ubicaciones desde una misma cuenta.",
  },
};

export function normalizarPlanClave(planClave?: string | null) {
  return String(planClave ?? "gratis")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function nivelPlan(planClave?: string | null) {
  const clave = normalizarPlanClave(planClave);

  if (["gratis", "free"].includes(clave)) return 0;
  if (["basico", "basic"].includes(clave)) return 1;
  if (["profesional", "professional"].includes(clave)) return 2;
  if (["empresarial", "enterprise"].includes(clave)) return 3;

  return 0;
}

export function tieneAccesoFeature(
  planClave: string | null | undefined,
  feature: PremiumFeatureKey
) {
  return nivelPlan(planClave) >= PREMIUM_FEATURES[feature].requiredLevel;
}