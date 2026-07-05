import { MiCuentaForm } from "@/components/dashboard/mi-cuenta-form";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MiCuentaPage() {
  const access = await requireDashboardAccess();
  const supabase = createServiceRoleClient();

  const { data: perfilExistente, error } = await supabase
    .from("perfiles_usuario")
    .select(
      `
      usuario_id,
      nombre,
      telefono,
      cargo,
      avatar_url,
      tema,
      color_acento,
      idioma,
      recibir_notificaciones,
      created_at,
      updated_at
    `
    )
    .eq("usuario_id", access.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const perfil =
    perfilExistente ??
    {
      usuario_id: access.user.id,
      nombre: access.user.nombre,
      telefono: access.user.telefono,
      cargo: access.user.cargo,
      avatar_url: access.user.avatar_url,
      tema: access.user.tema,
      color_acento: access.user.color_acento ?? "#2563eb",
      idioma: "es",
      recibir_notificaciones: access.user.recibir_notificaciones,
      created_at: null,
      updated_at: null,
    };

  return (
    <MiCuentaForm
      perfil={perfil}
      contexto={{
        negocioNombre: access.negocio.nombre,
        planClave: access.planClave,
        rol: access.rol,
        scope: access.scope,
        sucursalNombre: access.sucursalNombre,
        email: access.user.email,
      }}
    />
  );
}