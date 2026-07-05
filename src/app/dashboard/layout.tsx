import { DashboardMobileMenu } from "@/components/dashboard/dashboard-mobile-menu";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const access = await requireDashboardAccess();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-72">
        <DashboardSidebar
          userEmail={access.user.email ?? undefined}
          negocioNombre={access.negocio.nombre}
          negocioLogoUrl={access.negocio.logo_url ?? null}
          planClave={access.planClave}
          accessRole={access.rol}
          accessScope={access.scope}
          scopeLabel={
            access.scope === "global"
              ? "Todas las sucursales"
              : access.sucursalNombre ?? "Sucursal"
          }
        />
      </div>

      <DashboardMobileMenu
        userEmail={access.user.email ?? undefined}
        negocioNombre={access.negocio.nombre}
        negocioLogoUrl={access.negocio.logo_url ?? null}
        planClave={access.planClave}
        accessRole={access.rol}
        accessScope={access.scope}
        scopeLabel={
          access.scope === "global"
            ? "Todas las sucursales"
            : access.sucursalNombre ?? "Sucursal"
        }
      />

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}