import { redirect } from "next/navigation";
import { DashboardBusinessBlocked } from "@/components/dashboard/dashboard-business-blocked";
import { DashboardPlanLimitBanner } from "@/components/dashboard/dashboard-plan-limit-banner";
import { DashboardPlanRestricted } from "@/components/dashboard/dashboard-plan-restricted";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { resolveDashboardAccess } from "@/lib/dashboard/access-context";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const access = await resolveDashboardAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login");
    }

    if (access.reason === "platform_owner") {
      redirect("/admin");
    }

    if (access.reason === "plan_required" && access.planRequiredContext) {
      const restricted = access.planRequiredContext;
      const scopeLabel =
        restricted.scope === "global"
          ? "Todas las sucursales"
          : restricted.sucursalNombre ?? "Sucursal";

      return (
        <DashboardShell
          tema={restricted.user.tema}
          colorAcento={restricted.user.color_acento}
          userEmail={restricted.user.email ?? undefined}
          userName={restricted.user.nombre}
          userAvatarUrl={restricted.user.avatar_url}
          userCargo={restricted.user.cargo}
          userColor={restricted.user.color_acento}
          negocioNombre={restricted.negocio.nombre}
          negocioLogoUrl={restricted.negocio.logo_url ?? null}
          planClave={restricted.planClave}
          accessRole={restricted.rol}
          accessScope={restricted.scope}
          scopeLabel={scopeLabel}
        >
          <DashboardPlanRestricted context={restricted} />
        </DashboardShell>
      );
    }

    if (access.reason !== "inactive_business" || !access.blockedContext) {
      redirect(`/sin-acceso?motivo=${access.reason}`);
    }

    const blocked = access.blockedContext;
    const scopeLabel =
      blocked.scope === "global"
        ? "Todas las sucursales"
        : blocked.sucursalNombre ?? "Sucursal";

    return (
      <DashboardShell
        tema={blocked.user.tema}
        colorAcento={blocked.user.color_acento}
        userEmail={blocked.user.email ?? undefined}
        userName={blocked.user.nombre}
        userAvatarUrl={blocked.user.avatar_url}
        userCargo={blocked.user.cargo}
        userColor={blocked.user.color_acento}
        negocioNombre={blocked.negocio.nombre}
        negocioLogoUrl={blocked.negocio.logo_url ?? null}
        planClave={blocked.planClave}
        accessRole={blocked.rol}
        accessScope={blocked.scope}
        scopeLabel={scopeLabel}
      >
        <DashboardBusinessBlocked context={blocked} />
      </DashboardShell>
    );
  }

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
      {access.puedeVerTodo ? (
        <DashboardPlanLimitBanner
          negocioId={access.negocio.id}
          puedeGestionarPlanes={access.puedeGestionarPlanes}
        />
      ) : null}
      {children}
    </DashboardShell>
  );
}
