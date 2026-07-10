import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function contarSolicitudesCambioPlanPendientes(): Promise<number> {
  const admin = createServiceRoleClient();

  const { count, error } = await admin
    .from("solicitudes_cambio_plan")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente");

  if (error) {
    throw new Error(`No se pudo contar las solicitudes de cambio de plan: ${error.message}`);
  }

  return count ?? 0;
}
