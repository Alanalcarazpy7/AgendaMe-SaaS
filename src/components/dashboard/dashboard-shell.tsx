"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { DashboardMobileMenu } from "@/components/dashboard/dashboard-mobile-menu";
import { DashboardPreferencesApplier } from "@/components/dashboard/dashboard-preferences-applier";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardUserContextCard } from "@/components/dashboard/dashboard-user-context-card";

type DashboardShellProps = {
  children: ReactNode;
  tema?: string | null;
  colorAcento?: string | null;
  userEmail?: string;
  userName: string;
  userAvatarUrl?: string | null;
  userCargo?: string | null;
  userColor?: string | null;
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  planClave: string;
  accessRole: DashboardAccessRole;
  accessScope: DashboardAccessScope;
  scopeLabel: string;
};

export function DashboardShell({
  children,
  tema,
  colorAcento,
  userEmail,
  userName,
  userAvatarUrl,
  userCargo,
  userColor,
  negocioNombre,
  negocioLogoUrl,
  planClave,
  accessRole,
  accessScope,
  scopeLabel,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("agendame-sidebar") === "compact");
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("agendame-sidebar", next ? "compact" : "expanded");
      return next;
    });
  }

  const shellStyle = {
    "--dashboard-sidebar-width": collapsed ? "5.75rem" : "18rem",
  } as CSSProperties;

  return (
    <div
      style={shellStyle}
      className="relative isolate min-h-screen overflow-x-hidden bg-background text-foreground transition-[padding] duration-300 ease-[var(--ease-out)]"
    >
      <DashboardPreferencesApplier tema={tema} colorAcento={colorAcento} />

      <div className="pointer-events-none fixed inset-0 z-0 ag-private-bg" />

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-[var(--dashboard-sidebar-width)] lg:p-3 lg:pr-0 lg:transition-[width] lg:duration-300 lg:ease-[var(--ease-out)]">
        <DashboardSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleSidebar}
          userEmail={userEmail}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
          userColor={userColor}
          negocioNombre={negocioNombre}
          negocioLogoUrl={negocioLogoUrl}
          planClave={planClave}
          accessRole={accessRole}
          accessScope={accessScope}
          scopeLabel={scopeLabel}
        />
      </div>

      <DashboardMobileMenu
        userEmail={userEmail}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
        userColor={userColor}
        negocioNombre={negocioNombre}
        negocioLogoUrl={negocioLogoUrl}
        planClave={planClave}
        accessRole={accessRole}
        accessScope={accessScope}
        scopeLabel={scopeLabel}
      />

      <main className="relative z-10 lg:pl-[var(--dashboard-sidebar-width)] lg:transition-[padding] lg:duration-300 lg:ease-[var(--ease-out)]">
        <div className="mx-auto w-full max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <DashboardUserContextCard
            userName={userName}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
            userCargo={userCargo}
            userColor={userColor}
            negocioNombre={negocioNombre}
            planClave={planClave}
            accessRole={accessRole}
            accessScope={accessScope}
            scopeLabel={scopeLabel}
          />

          {children}
        </div>
      </main>
    </div>
  );
}
