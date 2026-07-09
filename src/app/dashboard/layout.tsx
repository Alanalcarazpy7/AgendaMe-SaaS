import { DashboardShell } from "@/components/dashboard/dashboard-shell";
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
    <DashboardShell
      tema={access.user.tema}
      colorAcento={access.user.color_acento}
      userEmail={access.user.email ?? undefined}
      userName={access.user.nombre}
      userAvatarUrl={access.user.avatar_url}
      userCargo={access.user.cargo}
      userColor={access.user.color_acento}
      negocioNombre={access.negocio.nombre}
      negocioLogoUrl={access.negocio.logo_url ?? null}
      planClave={access.planClave}
      accessRole={access.rol}
      accessScope={access.scope}
      scopeLabel={scopeLabel}
    >
      {children}
    </DashboardShell>
  );
}
