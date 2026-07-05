import { redirect } from "next/navigation";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";

export async function getDashboardPlanContext() {
  const access = await requireDashboardAccess();

  if (!access.puedeVerTodo) {
    redirect("/sin-acceso?motivo=no_access");
  }

  return {
    user: access.user,
    negocio: access.negocio,
    planClave: access.planClave,
    planNombre: access.planNombre,
    planNivel: access.planNivel,
    access,
  };
}