import { ClientesPanel } from "@/components/clientes/clientes-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { requirePermission } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

type ClienteRaw = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  estado: string;
  created_at: string;
  updated_at?: string | null;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

export default async function ClientesPage() {
  const access = await requireDashboardAccess();
  requirePermission(access, "puedeGestionarClientes");

  const supabase = createServiceRoleClient();

  let clientes: ClienteRaw[] = [];

  if (access.scope === "sucursal" && access.sucursalId) {
    const { data, error } = await supabase
      .from("cliente_sucursales")
      .select(
        `
        clientes (
          id,
          nombre_completo,
          telefono,
          email,
          estado,
          created_at,
          updated_at
        )
      `
      )
      .eq("negocio_id", access.negocio.id)
      .eq("sucursal_id", access.sucursalId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    clientes = (data ?? [])
      .map((row: any) => obtenerObjeto(row.clientes))
      .filter(Boolean) as ClienteRaw[];
  } else {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nombre_completo, telefono, email, estado, created_at, updated_at")
      .eq("negocio_id", access.negocio.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    clientes = (data ?? []) as ClienteRaw[];
  }

  const clientesCompatibles = clientes.map((cliente) => ({
    ...cliente,
    estado: cliente.estado === "inactivo" ? "inactivo" as const : "activo" as const,
    documento: null,
    notas_internas: null,
    notas: null,
  }));

  return <ClientesPanel clientes={clientesCompatibles} />;
}