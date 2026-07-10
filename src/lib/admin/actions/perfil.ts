"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { editarPerfilPropietarioSchema } from "@/lib/admin/schemas/perfil";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * No hay RPC para esto (es una preferencia personal del propietario, no una
 * operación administrativa sobre la plataforma) — update directo con
 * service role, gateado por requirePlatformOwner(). No se audita: no es una
 * acción sensible sobre datos de negocios/clientes, es equivalente a "mi
 * cuenta" del lado tenant, que tampoco se audita.
 *
 * Prueba primero por `id` y, si no afectó ninguna fila, por `usuario_id`
 * (misma cautela por la inconsistencia de claves de perfiles_usuario
 * detectada en Fase 1).
 */
export async function editarPerfilPropietarioAction(input: unknown): Promise<ActionResult> {
  const owner = await requirePlatformOwner();
  const parsed = editarPerfilPropietarioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { nombre, avatarUrl, tema } = parsed.data;

  const admin = createServiceRoleClient();
  const cambios = {
    nombre,
    avatar_url: avatarUrl || null,
    tema,
    updated_at: new Date().toISOString(),
  };

  const porId = await admin.from("perfiles_usuario").update(cambios).eq("id", owner.id).select("id").maybeSingle();

  if (porId.error) return { ok: false, error: porId.error.message };

  if (!porId.data) {
    const porUsuarioId = await admin
      .from("perfiles_usuario")
      .update(cambios)
      .eq("usuario_id", owner.id)
      .select("id")
      .maybeSingle();

    if (porUsuarioId.error) return { ok: false, error: porUsuarioId.error.message };
    if (!porUsuarioId.data) return { ok: false, error: "No se encontró tu perfil en perfiles_usuario." };
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin");
  return { ok: true };
}
