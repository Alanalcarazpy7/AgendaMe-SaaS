import { DashboardMobileMenu } from "@/components/dashboard/dashboard-mobile-menu";
import { DashboardPreferencesApplier } from "@/components/dashboard/dashboard-preferences-applier";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardUserContextCard } from "@/components/dashboard/dashboard-user-context-card";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const access = await requireDashboardAccess();

  const scopeLabel =
    access.scope === "global"
      ? "Todas las sucursales"
      : access.sucursalNombre ?? "Sucursal";

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardPreferencesApplier
        tema={access.user.tema}
        colorAcento={access.user.color_acento}
      />

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-72">
        <DashboardSidebar
          userEmail={access.user.email ?? undefined}
          userName={access.user.nombre}
          userAvatarUrl={access.user.avatar_url}
          userColor={access.user.color_acento}
          negocioNombre={access.negocio.nombre}
          negocioLogoUrl={access.negocio.logo_url ?? null}
          planClave={access.planClave}
          accessRole={access.rol}
          accessScope={access.scope}
          scopeLabel={scopeLabel}
        />
      </div>

      <DashboardMobileMenu
        userEmail={access.user.email ?? undefined}
        userName={access.user.nombre}
        userAvatarUrl={access.user.avatar_url}
        userColor={access.user.color_acento}
        negocioNombre={access.negocio.nombre}
        negocioLogoUrl={access.negocio.logo_url ?? null}
        planClave={access.planClave}
        accessRole={access.rol}
        accessScope={access.scope}
        scopeLabel={scopeLabel}
      />

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <DashboardUserContextCard
            userName={access.user.nombre}
            userEmail={access.user.email}
            userAvatarUrl={access.user.avatar_url}
            userCargo={access.user.cargo}
            userColor={access.user.color_acento}
            negocioNombre={access.negocio.nombre}
            planClave={access.planClave}
            accessRole={access.rol}
            accessScope={access.scope}
            scopeLabel={scopeLabel}
          />

          {children}
        </div>
      </main>
    </div>
  );
}