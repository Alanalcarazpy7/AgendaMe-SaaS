import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type PlanAdminRow = {
  id: string;
  clave: string;
  nombre: string;
  precio_mensual_gs: number | null;
  precio_anual_gs: number | null;
  precio_gs: number | null;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
  limite_sucursales: number | null;
  visible_publico: boolean;
  destacado: boolean;
  orden: number;
};

const SELECT_PLAN =
  "id, clave, nombre, precio_mensual_gs, precio_anual_gs, precio_gs, limite_citas_mensuales, limite_empleados, limite_servicios, limite_clientes, limite_sucursales, visible_publico, destacado, orden";

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
