import { redirect } from "next/navigation";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { Building2, UsersRound } from "lucide-react";
import { DashboardModuleHeader } from "@/components/dashboard/dashboard-module-header";
import { DashboardWorkspaceTabs } from "@/components/dashboard/dashboard-workspace-tabs";
import { SucursalUsuariosPanel } from "@/components/sucursales/sucursal-usuarios-panel";
import { SucursalesPanel } from "@/components/sucursales/sucursales-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { requirePermission } from "@/lib/dashboard/scope-helpers";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export default async function SucursalesPage() {
  const access = await requireDashboardAccess();

  if (nivelPlan(access.planClave) < 3) {
    return (
      <PremiumFeaturePage
        titulo="Sucursales"
        descripcion="Gestioná múltiples sucursales y usuarios con acceso limitado al dashboard."
        desde="Plan Empresarial"
        activo={false}
        estadoActivoTitulo=""
        estadoActivoDescripcion=""
      />
    );
  }

  requirePermission(access, "puedeGestionarSucursales");

  if (!access.puedeVerTodo) {
    redirect("/dashboard/sin-permiso");
  }

  const supabase = createServiceRoleClient();

  await supabase.rpc("obtener_o_crear_sucursal_principal", {
    p_negocio_id: access.negocio.id,
  });

  const [
    { data: sucursales, error: sucursalesError },
    { data: accesos, error: accesosError },
    { data: invitaciones, error: invitacionesError },
    { data: empleados, error: empleadosError },
  ] = await Promise.all([
    supabase
      .from("sucursales")
      .select("id, nombre, direccion, telefono, estado, es_principal, created_at")
      .eq("negocio_id", access.negocio.id)
      .order("es_principal", { ascending: false })
      .order("created_at", { ascending: true }),

    supabase
      .from("sucursal_usuarios")
      .select(
        `
        id,
        negocio_id,
        sucursal_id,
        usuario_id,
        empleado_id,
        nombre,
        email,
        rol,
        activo,
        created_at,
        sucursales (
          id,
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .eq("activo", true)
      .order("created_at", { ascending: false }),

    supabase
      .from("sucursal_invitaciones")
      .select(
        `
        id,
        negocio_id,
        sucursal_id,
        empleado_id,
        email,
        rol,
        estado,
        expires_at,
        created_at,
        sucursales (
          id,
          nombre
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false }),

    supabase
      .from("empleados")
      .select("id, nombre, sucursal_id, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),
  ]);

  if (sucursalesError) throw new Error(sucursalesError.message);
  if (accesosError) throw new Error(accesosError.message);
  if (invitacionesError) throw new Error(invitacionesError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  const sucursalesActivas = (sucursales ?? []).filter(
    (sucursal) => sucursal.estado !== "inactivo",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <DashboardModuleHeader
        eyebrow="Operación empresarial"
        title="Sucursales"
        description="Administrá las sedes del negocio y decidí quién puede entrar al dashboard de cada una. La sucursal principal permanece siempre protegida."
        icon={<Building2 className="size-5" />}
        aside={
          <div className="flex items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 shadow-sm">
            <UsersRound className="size-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Accesos activos</p>
              <p className="text-sm font-bold tabular-nums">
                {(accesos ?? []).length}
              </p>
            </div>
          </div>
        }
      />

      <DashboardWorkspaceTabs
        ariaLabel="Gestión de sucursales"
        tabs={[
          {
            id: "ubicaciones",
            label: "Ubicaciones",
            count: sucursalesActivas,
            description:
              "Creá nuevas sedes, actualizá sus datos o pausá una sucursal secundaria.",
            content: (
              <SucursalesPanel
                sucursales={sucursales ?? []}
                initialSucursales={sucursales ?? []}
              />
            ),
          },
          {
            id: "accesos",
            label: "Usuarios y accesos",
            count: (accesos ?? []).length + (invitaciones ?? []).length,
            description:
              "Invitá usuarios y limitá su acceso a una sucursal y un rol.",
            content: (
              <SucursalUsuariosPanel
                sucursales={sucursales ?? []}
                initialSucursales={sucursales ?? []}
                accesos={accesos ?? []}
                invitaciones={invitaciones ?? []}
                empleados={empleados ?? []}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
