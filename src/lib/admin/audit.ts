import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type RegistrarAuditoriaArgs = {
  usuarioId: string;
  negocioId?: string | null;
  accion: string;
  tablaAfectada: string;
  registroId?: string | null;
  detalles?: Record<string, unknown> | null;
  origen?: string;
};

/**
 * Inserta una fila en `auditoria`. No lanza: esta inserción ocurre DESPUÉS
 * de que la mutación real ya se aplicó (RPC o update directo), en una
 * llamada de red separada — no es atómico con la mutación. Revertir la
 * mutación acá sería peor (una acción "a medias" contra datos reales), así
 * que en vez de lanzar, devuelve `false` para que el llamador decida cómo
 * avisar (nunca ocultarlo). Ver docs/admin-owner-panel-progress.md, Fase de
 * auditoría de producción, para la propuesta de solución transaccional real
 * vía RPC (pendiente de aplicar, requiere autorización).
 */
export async function registrarAuditoria(args: RegistrarAuditoriaArgs): Promise<boolean> {
  const admin = createServiceRoleClient();

  const { error } = await admin.from("auditoria").insert({
    usuario_id: args.usuarioId,
    negocio_id: args.negocioId ?? null,
    accion: args.accion,
    tabla_afectada: args.tablaAfectada,
    registro_id: args.registroId ?? null,
    detalles: args.detalles ?? null,
    origen: args.origen ?? "admin_panel",
  });

  if (error) {
    console.error("[admin] No se pudo registrar auditoría:", error.message);
    return false;
  }

  return true;
}
