import { redirect } from "next/navigation";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
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

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Plan Empresarial</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Sucursales y accesos
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Gestioná las ubicaciones del negocio y creá invitaciones para usuarios
          con acceso limitado al dashboard de cada sucursal.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
            <p className="font-bold">Sucursales</p>
            <p className="mt-1 text-muted-foreground">
              Creá y administrá las ubicaciones del negocio.
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4 text-sm">
            <p className="font-bold">Usuarios con acceso</p>
            <p className="mt-1 text-muted-foreground">
              Reciben un link, crean su contraseña y entran al dashboard de su sucursal.
            </p>
          </div>
        </div>
      </section>

      <SucursalesPanel
        sucursales={sucursales ?? []}
        initialSucursales={sucursales ?? []}
      />

      <SucursalUsuariosPanel
        sucursales={sucursales ?? []}
        initialSucursales={sucursales ?? []}
        accesos={accesos ?? []}
        invitaciones={invitaciones ?? []}
        empleados={empleados ?? []}
      />
    </div>
  );
}
