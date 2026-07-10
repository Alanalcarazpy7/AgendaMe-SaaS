"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/admin/audit";
import {
  agregarNotaSchema,
  aprobarPagoSchema,
  bloquearNegocioSchema,
  cambiarPlanSchema,
  desbloquearNegocioSchema,
  rechazarPagoSchema,
  registrarPagoSchema,
} from "@/lib/admin/schemas/negocios";

const AUDIT_WARNING =
  "La acción se aplicó correctamente, pero no se pudo registrar en auditoría. Anotalo manualmente y revisá los logs del servidor.";

export type ActionResult = { ok: true; auditWarning?: string } | { ok: false; error: string };

function revalidarNegocio(negocioId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/negocios");
  revalidatePath(`/admin/negocios/${negocioId}`);
  revalidatePath("/admin/suscripciones");
  revalidatePath("/admin/renovaciones");
  revalidatePath("/admin/pagos");
}

/**
 * admin_cambiar_plan_negocio(), admin_bloquear_negocio(), admin_desbloquear_negocio(),
 * admin_aprobar_pago_manual() y admin_rechazar_pago_manual() ya validan
 * es_super_admin() internamente contra el JWT de la request (confirmado en
 * Fase 1: con la service role key también rechazan con 403, igual que a un
 * anónimo). Por eso se llaman con el cliente de sesión, no con el service role.
 * requirePlatformOwner() se vuelve a ejecutar acá aunque el layout ya lo haga:
 * nunca se confía en que la llamada viene desde /admin.
 *
 * IMPORTANTE (auditoría de producción, ver progress.md): la mutación (RPC o
 * update directo) y el registro en `auditoria` son DOS llamadas de red
 * separadas, no una transacción atómica. Si `registrarAuditoria()` falla
 * después de que la mutación ya se aplicó, la acción NO se revierte (sería
 * peor: dejar el dato real a medio aplicar) — en cambio, se devuelve
 * `ok: true` con `auditWarning` para que la UI avise explícitamente en vez
 * de fallar en silencio. La solución real (transacción única en DB) requiere
 * una RPC nueva — ver propuesta en supabase/patches/ (no aplicada).
 */

export async function cambiarPlanNegocioAction(input: unknown): Promise<ActionResult> {
  const owner = await requirePlatformOwner();
  const parsed = cambiarPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { negocioId, planClave, fechaVencimiento, notas } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_cambiar_plan_negocio", {
    p_negocio_id: negocioId,
    p_plan_clave: planClave,
    p_fecha_vencimiento: fechaVencimiento ?? null,
    p_notas: notas ?? null,
  });

  if (error) return { ok: false, error: error.message };

  const auditado = await registrarAuditoria({
    usuarioId: owner.id,
    negocioId,
    accion: "cambiar_plan",
    tablaAfectada: "suscripciones",
    detalles: { planClave, fechaVencimiento: fechaVencimiento ?? null, notas: notas ?? null },
  });

  revalidarNegocio(negocioId);
  return auditado ? { ok: true } : { ok: true, auditWarning: AUDIT_WARNING };
}

export async function bloquearNegocioAction(input: unknown): Promise<ActionResult> {
  const owner = await requirePlatformOwner();
  const parsed = bloquearNegocioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Indicá un motivo (mínimo 3 caracteres)." };
  const { negocioId, motivo } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_bloquear_negocio", {
    p_negocio_id: negocioId,
    p_motivo: motivo,
  });

  if (error) return { ok: false, error: error.message };

  const auditado = await registrarAuditoria({
    usuarioId: owner.id,
    negocioId,
    accion: "bloquear_negocio",
    tablaAfectada: "negocios",
    registroId: negocioId,
    detalles: { motivo },
  });

  revalidarNegocio(negocioId);
  return auditado ? { ok: true } : { ok: true, auditWarning: AUDIT_WARNING };
}

export async function desbloquearNegocioAction(input: unknown): Promise<ActionResult> {
  const owner = await requirePlatformOwner();
  const parsed = desbloquearNegocioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { negocioId } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_desbloquear_negocio", {
    p_negocio_id: negocioId,
  });

  if (error) return { ok: false, error: error.message };

  const auditado = await registrarAuditoria({
    usuarioId: owner.id,
    negocioId,
    accion: "desbloquear_negocio",
    tablaAfectada: "negocios",
    registroId: negocioId,
  });

  revalidarNegocio(negocioId);
  return auditado ? { ok: true } : { ok: true, auditWarning: AUDIT_WARNING };
}

export async function aprobarPagoAction(input: unknown): Promise<ActionResult> {
  const owner = await requirePlatformOwner();
  const parsed = aprobarPagoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { pagoId, negocioId, fechaVencimiento, notas } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_aprobar_pago_manual", {
    p_pago_id: pagoId,
    p_fecha_vencimiento: fechaVencimiento,
    p_notas: notas ?? null,
  });

  if (error) return { ok: false, error: error.message };

  const auditado = await registrarAuditoria({
    usuarioId: owner.id,
    negocioId,
    accion: "aprobar_pago",
    tablaAfectada: "pagos_manuales",
    registroId: pagoId,
    detalles: { fechaVencimiento, notas: notas ?? null },
  });

  revalidarNegocio(negocioId);
  return auditado ? { ok: true } : { ok: true, auditWarning: AUDIT_WARNING };
}

export async function rechazarPagoAction(input: unknown): Promise<ActionResult> {
  const owner = await requirePlatformOwner();
  const parsed = rechazarPagoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { pagoId, negocioId, notas } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_rechazar_pago_manual", {
    p_pago_id: pagoId,
    p_notas: notas ?? null,
  });

  if (error) return { ok: false, error: error.message };

  const auditado = await registrarAuditoria({
    usuarioId: owner.id,
    negocioId,
    accion: "rechazar_pago",
    tablaAfectada: "pagos_manuales",
    registroId: pagoId,
    detalles: { notas: notas ?? null },
  });

  revalidarNegocio(negocioId);
  return auditado ? { ok: true } : { ok: true, auditWarning: AUDIT_WARNING };
}

/**
 * admin_agregar_nota_negocio() (aplicada, ver supabase/patches/2026-07-admin-rpc-transaccionales.sql)
 * hace el insert en notas_admin_negocio Y el insert en auditoria dentro de
 * la misma transacción de Postgres — ya no hace falta llamar
 * registrarAuditoria() por separado ni puede quedar sin auditar.
 */
export async function agregarNotaAction(input: unknown): Promise<ActionResult> {
  await requirePlatformOwner();
  const parsed = agregarNotaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "La nota no puede estar vacía." };
  const { negocioId, nota } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_agregar_nota_negocio", {
    p_negocio_id: negocioId,
    p_nota: nota,
  });

  if (error) return { ok: false, error: error.message };

  revalidarNegocio(negocioId);
  return { ok: true };
}

/**
 * admin_registrar_pago_manual() (aplicada) reemplaza el insert directo +
 * registrarAuditoria() de dos pasos: ahora todo ocurre en una transacción.
 * Sigue creando el pago en estado "pendiente" — la aprobación real (que
 * mueve la fecha de vencimiento) sigue a cargo de aprobarPagoAction() /
 * admin_aprobar_pago_manual().
 */
export async function registrarPagoAction(input: unknown): Promise<ActionResult> {
  await requirePlatformOwner();
  const parsed = registrarPagoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };
  const { negocioId, suscripcionId, planId, montoGs, metodo, periodoInicio, periodoFin, notasCliente } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_registrar_pago_manual", {
    p_negocio_id: negocioId,
    p_suscripcion_id: suscripcionId ?? null,
    p_plan_id: planId,
    p_monto_gs: montoGs,
    p_metodo: metodo,
    p_periodo_inicio: periodoInicio ?? null,
    p_periodo_fin: periodoFin ?? null,
    p_notas_cliente: notasCliente ?? null,
  });

  if (error) return { ok: false, error: error.message };

  revalidarNegocio(negocioId);
  return { ok: true };
}
