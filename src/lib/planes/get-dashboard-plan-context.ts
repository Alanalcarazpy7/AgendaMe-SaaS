import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function getDashboardPlanContext() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = createServiceRoleClient();

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError || !membresia) {
    redirect("/onboarding/negocio");
  }

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id, nombre")
    .eq("id", membresia.negocio_id)
    .maybeSingle();

  if (negocioError) {
    throw new Error(negocioError.message);
  }

  if (!negocio) {
    redirect("/onboarding/negocio");
  }

  const { data: suscripcionActual, error: suscripcionError } = await supabase
    .from("suscripciones")
    .select("plan_id")
    .eq("negocio_id", membresia.negocio_id)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (suscripcionError) {
    throw new Error(suscripcionError.message);
  }

  let planClave = "gratis";
  let planNombre = "Gratis";

  if (suscripcionActual?.plan_id) {
    const { data: plan, error: planError } = await supabase
      .from("planes_saas")
      .select("clave, nombre")
      .eq("id", suscripcionActual.plan_id)
      .maybeSingle();

    if (planError) {
      throw new Error(planError.message);
    }

    planClave = plan?.clave ?? "gratis";
    planNombre = plan?.nombre ?? "Gratis";
  }

  return {
    user,
    negocio,
    planClave,
    planNombre,
  };
}