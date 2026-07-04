import { redirect } from "next/navigation";
import { DashboardMobileMenu } from "@/components/dashboard/dashboard-mobile-menu";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

type Relacion<T> = T | T[] | null;

type PlanLayoutRaw = {
  clave: string;
};

type SuscripcionLayoutRaw = {
  planes_saas: Relacion<PlanLayoutRaw>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
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

  const [{ data: negocio }, { data: suscripcionData }] = await Promise.all([
    supabase
      .from("negocios")
      .select("nombre, logo_url")
      .eq("id", membresia.negocio_id)
      .maybeSingle(),

    supabase
      .from("suscripciones")
      .select(
        `
        planes_saas (
          clave
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const suscripcion = suscripcionData as SuscripcionLayoutRaw | null;
  const plan = obtenerObjeto(suscripcion?.planes_saas ?? null);
  const planClave = plan?.clave ?? "gratis";

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-72">
        <DashboardSidebar
          userEmail={user.email ?? undefined}
          negocioNombre={negocio?.nombre ?? "AgendaMe"}
          negocioLogoUrl={negocio?.logo_url ?? null}
          planClave={planClave}
        />
      </div>

      <DashboardMobileMenu
        userEmail={user.email ?? undefined}
        negocioNombre={negocio?.nombre ?? "AgendaMe"}
        negocioLogoUrl={negocio?.logo_url ?? null}
        planClave={planClave}
      />

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}