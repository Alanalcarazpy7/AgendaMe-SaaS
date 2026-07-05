import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingNegocioForm } from "@/components/onboarding/onboarding-negocio-form";

export default async function OnboardingNegocioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: negocios } = await supabase
    .from("negocio_usuarios")
    .select("id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (negocios && negocios.length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <OnboardingNegocioForm />
    </main>
  );
}
