"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { revocarInvitacionSchema } from "@/lib/admin/schemas/invitaciones";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * admin_revocar_invitacion() (aplicada, ver supabase/patches/2026-07-admin-rpc-transaccionales.sql)
 * hace el update de sucursal_invitaciones Y el insert en auditoria en la
 * misma transacción. Solo revoca invitaciones que sigan "pendiente" (la
 * propia función valida eso y lanza error si no hay fila para actualizar).
 */
export async function revocarInvitacionAction(input: unknown): Promise<ActionResult> {
  await requirePlatformOwner();
  const parsed = revocarInvitacionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_revocar_invitacion", {
    p_invitacion_id: parsed.data.invitacionId,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/invitaciones");
  return { ok: true };
}
