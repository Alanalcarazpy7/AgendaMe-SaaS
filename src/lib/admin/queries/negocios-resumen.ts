import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NegocioResumenRow } from "@/lib/admin/types/negocio";

/**
 * admin_obtener_negocios_resumen() valida es_super_admin() internamente
 * usando el JWT de la sesión (auth.uid()). Por eso se llama con el cliente
 * atado a la sesión del usuario (cookies), NO con el service role: el
 * service role no tiene un usuario asociado y la función lo rechaza igual
 * que a un visitante anónimo (verificado en Fase 1).
 */
export async function obtenerNegociosResumen(): Promise<NegocioResumenRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_obtener_negocios_resumen");

  if (error) {
    throw new Error(`No se pudo obtener el resumen de negocios: ${error.message}`);
  }

  return (data ?? []) as NegocioResumenRow[];
}
