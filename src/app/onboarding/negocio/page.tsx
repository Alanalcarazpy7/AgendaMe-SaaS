import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingNegocioForm } from "@/components/onboarding/onboarding-negocio-form";

type OnboardingNegocioPageProps = {
  searchParams?: Promise<{
    confirmado?: string;
  }>;
};

export default async function OnboardingNegocioPage({
  searchParams,
}: OnboardingNegocioPageProps) {
  const params = (await searchParams) ?? {};
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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_34%),linear-gradient(180deg,var(--background),var(--muted))] px-4 py-10">
      <OnboardingNegocioForm correoConfirmado={params.confirmado === "1"} />
    </main>
  );
}
