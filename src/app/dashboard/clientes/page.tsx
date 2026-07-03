import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientesPanel } from "@/components/clientes/clientes-panel";
import type { ClienteItem } from "@/components/clientes/cliente-dialog";

export default async function ClientesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membresias, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (membresiaError) {
    throw new Error(membresiaError.message);
  }

  const membresia = membresias?.[0];

  if (!membresia) {
    redirect("/onboarding/negocio");
  }

  const { data: clientesData, error: clientesError } = await supabase
    .from("clientes")
    .select(
      "id, nombre_completo, telefono, email, documento, notas_internas, estado, created_at"
    )
    .eq("negocio_id", membresia.negocio_id)
    .order("created_at", { ascending: false });

  if (clientesError) {
    throw new Error(clientesError.message);
  }

  const clientes = (clientesData ?? []) as ClienteItem[];

  return <ClientesPanel clientes={clientes} />;
}