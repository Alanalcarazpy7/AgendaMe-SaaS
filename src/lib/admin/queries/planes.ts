import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PlanPublico } from "@/lib/planes/planes-shared";

export type PlanAdminRow = PlanPublico & {
  precio_gs: number | null;
  visible_publico: boolean;
};

const SELECT_PLAN =
  "id, clave, nombre, descripcion_corta, texto_destacado, precio_mensual_gs, precio_anual_gs, precio_gs, ahorro_anual_meses, limite_citas_mensuales, limite_empleados, limite_servicios, limite_clientes, limite_sucursales, visible_publico, destacado, permite_reportes_basicos, permite_reportes_avanzados, permite_personalizacion, permite_exportacion_csv, permite_multiples_sucursales, permite_recordatorios_whatsapp, permite_soporte_prioritario, permite_funcionalidades_a_medida, features, orden";

export async function obtenerPlanes(): Promise<PlanAdminRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("planes_saas")
    .select(SELECT_PLAN)
    .order("orden", { ascending: true });

  if (error) {
    throw new Error(`No se pudieron obtener los planes: ${error.message}`);
  }

  return (data ?? []) as PlanAdminRow[];
}
