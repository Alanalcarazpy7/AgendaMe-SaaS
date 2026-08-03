import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type MedioPagoPlataforma = {
  id: string;
  tipo: "transferencia" | "billetera" | "qr" | "otro";
  nombre: string;
  titular: string | null;
  banco: string | null;
  identificador_principal: string | null;
  identificador_secundario: string | null;
  alias_tipo: string | null;
  qr_url: string | null;
  logo_url: string | null;
  notas: string | null;
  activo: boolean;
  orden: number;
};

export async function obtenerMediosPago(): Promise<MedioPagoPlataforma[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("medios_pago_plataforma")
    .select(
      "id, tipo, nombre, titular, banco, identificador_principal, identificador_secundario, alias_tipo, qr_url, logo_url, notas, activo, orden"
    )
    .order("orden", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as MedioPagoPlataforma[];
}
