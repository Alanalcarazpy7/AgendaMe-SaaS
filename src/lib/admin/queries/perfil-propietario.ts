import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type PerfilPropietario = {
  nombre: string | null;
  avatarUrl: string | null;
  tema: "sistema" | "claro" | "oscuro";
  colorAcento: string | null;
  email: string | null;
};

/**
 * Igual que requirePlatformOwner() / obtenerUsuariosPlataforma(): busca por
 * `id` primero y hace fallback a `usuario_id` por la inconsistencia de
 * claves detectada en Fase 1.
 */
export async function obtenerPerfilPropietario(ownerId: string, ownerEmail: string | null): Promise<PerfilPropietario> {
  const admin = createServiceRoleClient();

  const porId = await admin
    .from("perfiles_usuario")
    .select("nombre, nombre_completo, avatar_url, tema, color_acento")
    .eq("id", ownerId)
    .maybeSingle();

  const fila =
    porId.data ??
    (
      await admin
        .from("perfiles_usuario")
        .select("nombre, nombre_completo, avatar_url, tema, color_acento")
        .eq("usuario_id", ownerId)
        .maybeSingle()
    ).data;

  const temaValido = fila?.tema === "claro" || fila?.tema === "oscuro" ? fila.tema : "sistema";

  return {
    nombre: fila?.nombre ?? fila?.nombre_completo ?? null,
    avatarUrl: fila?.avatar_url ?? null,
    tema: temaValido,
    colorAcento: fila?.color_acento ?? null,
    email: ownerEmail,
  };
}
