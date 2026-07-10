"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { editarPlanSchema } from "@/lib/admin/schemas/planes";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * admin_editar_plan() (aplicada, ver supabase/patches/2026-07-admin-rpc-transaccionales.sql)
 * hace el update de planes_saas Y el insert en auditoria (con el estado
 * anterior y nuevo) dentro de la misma transacción. Reemplaza el patrón
 * anterior de SELECT + UPDATE + registrarAuditoria() en tres pasos
 * separados con el service role. No borra planes (el prompt maestro pide
 * preferir ocultar vía visible_publico).
 */
export async function editarPlanAction(input: unknown): Promise<ActionResult> {
  await requirePlatformOwner();
  const parsed = editarPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos. Revisá los precios y límites." };
  const data = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_editar_plan", {
    p_plan_id: data.id,
    p_nombre: data.nombre,
    p_descripcion_corta: data.descripcionCorta ?? null,
    p_texto_destacado: data.textoDestacado ?? null,
    p_precio_mensual_gs: data.precioMensualGs,
    p_precio_anual_gs: data.precioAnualGs,
    p_limite_citas_mensuales: data.limiteCitasMensuales ?? null,
    p_limite_empleados: data.limiteEmpleados ?? null,
    p_limite_servicios: data.limiteServicios ?? null,
    p_limite_clientes: data.limiteClientes ?? null,
    p_limite_sucursales: data.limiteSucursales ?? null,
    p_visible_publico: data.visiblePublico,
    p_destacado: data.destacado,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/planes");
  revalidatePath("/admin");
  revalidatePath("/planes");
  return { ok: true };
}
