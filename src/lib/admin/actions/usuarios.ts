"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/admin/audit";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const sincronizarPerfilSchema = z.object({
  usuarioId: z.string().uuid(),
  email: z.string().email().optional().nullable(),
  nombre: z.string().max(200).optional().nullable(),
});

export type SincronizarPerfilResult =
  | { ok: true; auditWarning?: string }
  | { ok: false; error: string };

function nombreDesdeEmail(email?: string | null) {
  if (!email) return "Usuario";
  return email.split("@")[0] || "Usuario";
}

export async function sincronizarPerfilUsuarioAction(input: unknown): Promise<SincronizarPerfilResult> {
  const owner = await requirePlatformOwner();
  const parsed = sincronizarPerfilSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos invalidos." };

  const { usuarioId, email, nombre } = parsed.data;
  const admin = createServiceRoleClient();

  const { data: existente, error: existenteError } = await admin
    .from("perfiles_usuario")
    .select("id")
    .or(`id.eq.${usuarioId},usuario_id.eq.${usuarioId}`)
    .maybeSingle();

  if (existenteError) return { ok: false, error: existenteError.message };
  if (existente) return { ok: true };

  const nombreBase = (nombre ?? "").trim() || nombreDesdeEmail(email);
  const { error } = await admin.from("perfiles_usuario").insert({
    id: usuarioId,
    usuario_id: usuarioId,
    email: email ?? null,
    nombre: nombreBase,
    nombre_completo: nombreBase,
    rol_global: "usuario",
    tipo_cuenta: "negocio",
    tema: "sistema",
    idioma: "es",
    recibir_notificaciones: true,
  });

  if (error) return { ok: false, error: error.message };

  const auditado = await registrarAuditoria({
    usuarioId: owner.id,
    accion: "sincronizar_perfil_usuario",
    tablaAfectada: "perfiles_usuario",
    registroId: usuarioId,
    detalles: { usuario_id: usuarioId, email: email ?? null },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");

  return auditado
    ? { ok: true }
    : {
        ok: true,
        auditWarning:
          "El perfil se creo, pero no se pudo registrar auditoria. Revisalo manualmente si necesitas trazabilidad completa.",
      };
}
