import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type PlatformOwner = {
  id: string;
  email: string | null;
};

type PlatformOwnerFailReason =
  | "unauthenticated"
  | "not_configured"
  | "not_owner"
  | "not_super_admin";

type PlatformOwnerResult =
  | { ok: true; owner: PlatformOwner }
  | { ok: false; reason: PlatformOwnerFailReason };

async function fetchRolGlobal(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string
): Promise<string | null> {
  const porId = await admin
    .from("perfiles_usuario")
    .select("rol_global")
    .eq("id", userId)
    .maybeSingle();

  if (porId.data?.rol_global) {
    return porId.data.rol_global as string;
  }

  const porUsuarioId = await admin
    .from("perfiles_usuario")
    .select("rol_global")
    .eq("usuario_id", userId)
    .maybeSingle();

  return (porUsuarioId.data?.rol_global as string | undefined) ?? null;
}

/**
 * Resuelve si el usuario autenticado actual es el propietario de la plataforma.
 * Nunca lanza: siempre devuelve un resultado explícito ok/false para que el
 * llamador decida cómo fallar (redirect, notFound, 401 JSON, etc).
 *
 * Requiere AMBAS condiciones:
 * 1. auth.users.id === ADMIN_OWNER_USER_ID (env var solo de servidor)
 * 2. perfiles_usuario.rol_global === "super_admin" para ese mismo usuario
 */
export async function getPlatformOwnerOrNull(): Promise<PlatformOwnerResult> {
  // Se chequea la sesión ANTES que la configuración: un visitante sin
  // cookie de sesión siempre debe recibir "unauthenticated" (→ 401 / login),
  // sin importar si ADMIN_OWNER_USER_ID está seteada o no. Si se chequeara
  // la env var primero, cualquier request sin sesión recibiría el mismo
  // "not_configured" (→ 403) que un usuario autenticado no autorizado,
  // ocultando la distinción real entre "no autenticado" y "autenticado pero
  // sin permiso".
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const ownerId = process.env.ADMIN_OWNER_USER_ID;

  if (!ownerId) {
    return { ok: false, reason: "not_configured" };
  }

  if (user.id !== ownerId) {
    return { ok: false, reason: "not_owner" };
  }

  const admin = createServiceRoleClient();
  const rolGlobal = await fetchRolGlobal(admin, user.id);

  if (rolGlobal !== "super_admin") {
    return { ok: false, reason: "not_super_admin" };
  }

  return {
    ok: true,
    owner: { id: user.id, email: user.email ?? null },
  };
}

/**
 * Guard central para Server Components (layout, páginas) y Server Actions
 * del panel /admin. Falla cerrado: cualquier duda termina en redirect/notFound,
 * nunca en acceso concedido.
 */
export async function requirePlatformOwner(): Promise<PlatformOwner> {
  const result = await getPlatformOwnerOrNull();

  if (result.ok) {
    return result.owner;
  }

  if (result.reason === "unauthenticated") {
    redirect("/login?next=/admin");
  }

  // not_configured | not_owner | not_super_admin: nunca revelar el motivo
  // exacto a un visitante no autorizado. notFound() evita filtrar que /admin
  // existe como panel restringido para quien no es el propietario.
  notFound();
}
