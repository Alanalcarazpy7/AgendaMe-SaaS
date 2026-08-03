import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { construirLimiteRecursoInfo } from "@/lib/planes/limite-recurso";
import { ServiciosPanel } from "@/components/servicios/servicios-panel";
import type { ServicioItem } from "@/components/servicios/servicio-dialog";

export default async function ServiciosPage() {
  const access = await requireDashboardAccess();
  if (!access.puedeVerTodo) {
    redirect("/dashboard/sin-permiso");
  }

  const supabase = createServiceRoleClient();

  const [{ data: serviciosData, error: serviciosError }, limiteServicios] = await Promise.all([
    supabase
      .from("servicios")
      .select(
        "id, nombre, descripcion, duracion_minutos, precio, color, estado, imagen_url, created_at"
      )
      .eq("negocio_id", access.negocio.id)
      .order("created_at", { ascending: false }),
    construirLimiteRecursoInfo({
      supabase,
      negocioId: access.negocio.id,
      recurso: "servicios",
      tituloRecurso: "servicios",
      etiquetaUso: "Servicios activos",
    }),
  ]);

  if (serviciosError) {
    throw new Error(serviciosError.message);
  }

  const servicios = (serviciosData ?? []) as ServicioItem[];

  return <ServiciosPanel servicios={servicios} limiteServicios={limiteServicios} />;
}
