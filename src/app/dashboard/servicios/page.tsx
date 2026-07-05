import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { redirect } from "next/navigation";
import { ServiciosImagenesPanel } from "@/components/servicios/servicios-imagenes-panel";
import { createClient } from "@/lib/supabase/server";
import { ServiciosPanel } from "@/components/servicios/servicios-panel";
import type { ServicioItem } from "@/components/servicios/servicio-dialog";

export default async function ServiciosPage() {
  const access = await requireDashboardAccess();
  if (!access.puedeVerTodo) {
    redirect("/dashboard/sin-permiso");
  }

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

  const { data: serviciosData, error: serviciosError } = await supabase
    .from("servicios")
    .select(
      "id, nombre, descripcion, duracion_minutos, precio, color, estado, created_at"
    )
    .eq("negocio_id", membresia.negocio_id)
    .order("created_at", { ascending: false });

  if (serviciosError) {
    throw new Error(serviciosError.message);
  }

  const servicios = (serviciosData ?? []) as ServicioItem[];

  return (
    <>
      <ServiciosPanel servicios={servicios} />

      <div className="mt-6">
        <ServiciosImagenesPanel />
      </div>
    </>
  );
}