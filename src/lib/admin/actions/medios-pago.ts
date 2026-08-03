"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { registrarAuditoria } from "@/lib/admin/audit";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type GuardarMedioPagoResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const medioPagoSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(["transferencia", "billetera", "qr", "otro"]),
  nombre: z.string().trim().min(2, "Ingresá un nombre para este medio de pago."),
  titular: z.string().trim().optional(),
  banco: z.string().trim().optional(),
  identificadorPrincipal: z.string().trim().optional(),
  identificadorSecundario: z.string().trim().optional(),
  aliasTipo: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  activo: z.boolean(),
  orden: z.coerce.number().int().min(0).max(9999),
});

function limpiar(valor?: string) {
  const texto = valor?.trim();
  return texto ? texto : null;
}

function revalidarVistas() {
  revalidatePath("/admin/medios-pago");
  revalidatePath("/dashboard/planes");
}

export async function guardarMedioPagoAction(input: unknown): Promise<GuardarMedioPagoResult> {
  const owner = await requirePlatformOwner();
  const parsed = medioPagoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const datos = parsed.data;
  const admin = createServiceRoleClient();

  const payload = {
    tipo: datos.tipo,
    nombre: datos.nombre,
    titular: limpiar(datos.titular),
    banco: limpiar(datos.banco),
    identificador_principal: limpiar(datos.identificadorPrincipal),
    identificador_secundario: limpiar(datos.identificadorSecundario),
    alias_tipo: limpiar(datos.aliasTipo),
    notas: limpiar(datos.notas),
    activo: datos.activo,
    orden: datos.orden,
    updated_at: new Date().toISOString(),
  };

  if (datos.id) {
    const { error } = await admin
      .from("medios_pago_plataforma")
      .update(payload)
      .eq("id", datos.id);

    if (error) return { ok: false, error: error.message };

    await registrarAuditoria({
      usuarioId: owner.id,
      accion: "actualizar_medio_pago",
      tablaAfectada: "medios_pago_plataforma",
      registroId: datos.id,
      detalles: { nombre: datos.nombre, tipo: datos.tipo },
    });

    revalidarVistas();
    return { ok: true, id: datos.id };
  }

  const { data: creado, error } = await admin
    .from("medios_pago_plataforma")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await registrarAuditoria({
    usuarioId: owner.id,
    accion: "crear_medio_pago",
    tablaAfectada: "medios_pago_plataforma",
    registroId: creado.id,
    detalles: { nombre: datos.nombre, tipo: datos.tipo },
  });

  revalidarVistas();
  return { ok: true, id: creado.id };
}

export async function alternarActivoMedioPagoAction(
  id: string,
  activo: boolean
): Promise<ActionResult> {
  const owner = await requirePlatformOwner();

  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: "Medio de pago inválido." };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("medios_pago_plataforma")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await registrarAuditoria({
    usuarioId: owner.id,
    accion: activo ? "activar_medio_pago" : "desactivar_medio_pago",
    tablaAfectada: "medios_pago_plataforma",
    registroId: id,
  });

  revalidarVistas();
  return { ok: true };
}

export async function eliminarMedioPagoAction(id: string): Promise<ActionResult> {
  const owner = await requirePlatformOwner();

  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: "Medio de pago inválido." };
  }

  const admin = createServiceRoleClient();

  const { data: medio } = await admin
    .from("medios_pago_plataforma")
    .select("qr_url, logo_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("medios_pago_plataforma").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  const marker = "/storage/v1/object/public/medios-pago-plataforma/";
  const rutas = [medio?.qr_url, medio?.logo_url]
    .filter((url): url is string => Boolean(url))
    .map((url) => {
      const index = url.indexOf(marker);
      return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
    })
    .filter((path): path is string => Boolean(path));

  if (rutas.length > 0) {
    await admin.storage.from("medios-pago-plataforma").remove(rutas);
  }

  await registrarAuditoria({
    usuarioId: owner.id,
    accion: "eliminar_medio_pago",
    tablaAfectada: "medios_pago_plataforma",
    registroId: id,
  });

  revalidarVistas();
  return { ok: true };
}
