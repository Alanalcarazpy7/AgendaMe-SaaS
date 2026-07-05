import { redirect } from "next/navigation";
import type { requireDashboardAccess } from "@/lib/dashboard/access-context";

export type DashboardAccess = Awaited<ReturnType<typeof requireDashboardAccess>>;

export function requirePermission(
  access: DashboardAccess,
  permiso: keyof Pick<
    DashboardAccess,
    | "puedeGestionarPlanes"
    | "puedeGestionarConfiguracion"
    | "puedeGestionarSucursales"
    | "puedeGestionarEmpleados"
    | "puedeGestionarClientes"
    | "puedeGestionarCitas"
    | "puedeVerReportes"
    | "puedeExportar"
    | "puedeUsarRecordatorios"
  >
) {
  if (!access[permiso]) {
    redirect("/dashboard/sin-permiso");
  }
}

export function applySucursalScope<T extends { eq: Function }>(
  query: T,
  access: DashboardAccess,
  column = "sucursal_id"
) {
  if (access.scope === "sucursal" && access.sucursalId) {
    return query.eq(column, access.sucursalId);
  }

  return query;
}