import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type InvitacionRow = {
  id: string;
  negocio_id: string;
  sucursal_id: string;
  email: string;
  rol: string;
  estado: string;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
  negocios: { nombre: string } | null;
  sucursales: { nombre: string } | null;
};

/** Nunca selecciona token_hash: el panel no debe poder ver ni exponer tokens de invitación. */
export async function obtenerInvitaciones(limite = 500): Promise<InvitacionRow[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("sucursal_invitaciones")
    .select(
      "id, negocio_id, sucursal_id, email, rol, estado, expires_at, accepted_at, created_at, negocios(nombre), sucursales(nombre)"
    )
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    throw new Error(`No se pudieron obtener las invitaciones: ${error.message}`);
  }

  return (data ?? []) as unknown as InvitacionRow[];
}

export function estadoEfectivoInvitacion(inv: Pick<InvitacionRow, "estado" | "expires_at">): string {
  if (inv.estado === "pendiente" && inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) {
    return "expirada";
  }
  return inv.estado;
}
