import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingNegocioForm } from "@/components/onboarding/onboarding-negocio-form";
import {
  RUBROS_NEGOCIO_INICIALES,
  type RubroNegocio,
} from "@/lib/negocios/rubros";

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

  const { data: rubrosCatalogo } = await supabase
    .from("rubros_negocio")
    .select("id, clave, nombre, descripcion, icono, orden")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const rubros =
    rubrosCatalogo && rubrosCatalogo.length > 0
      ? (rubrosCatalogo as RubroNegocio[])
      : RUBROS_NEGOCIO_INICIALES;

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-background lg:h-[100dvh] lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--border) 35%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl items-center px-4 py-5 sm:px-6 lg:h-full lg:min-h-0 lg:py-6">
        <div className="w-full">
          <OnboardingNegocioForm
            correoConfirmado={params.confirmado === "1"}
            rubros={rubros}
          />
        </div>
      </div>
    </main>
  );
}
