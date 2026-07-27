"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { DashboardMobileBottomNav } from "@/components/dashboard/dashboard-mobile-bottom-nav";
import { DashboardMobileMenu } from "@/components/dashboard/dashboard-mobile-menu";
import { DashboardPreferencesApplier } from "@/components/dashboard/dashboard-preferences-applier";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardUserContextCard } from "@/components/dashboard/dashboard-user-context-card";
import { SidebarTour } from "@/components/dashboard/sidebar-tour";

type DashboardShellProps = {
  children: ReactNode;
  tema?: string | null;
  colorAcento?: string | null;
  userEmail?: string;
  userName: string;
  userAvatarUrl?: string | null;
  userCargo?: string | null;
  userColor?: string | null;
  negocioId: string;
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  planClave: string;
  accessRole: DashboardAccessRole;
  accessScope: DashboardAccessScope;
  scopeLabel: string;
  tourHabilitado?: boolean;
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
  negocioId,
  negocioNombre,
  negocioLogoUrl,
  planClave,
  accessRole,
  accessScope,
  scopeLabel,
  tourHabilitado = false,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [collapsedAntesDelTour, setCollapsedAntesDelTour] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCollapsed(window.localStorage.getItem("agendame-sidebar") === "compact");
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!tourHabilitado) return;

    const frame = window.requestAnimationFrame(() => {
      const visto = window.localStorage.getItem(`agendame-tour-visto-${negocioId}`);

      if (!visto) {
        abrirTour();
      }
    });

    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourHabilitado, negocioId]);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("agendame-sidebar", next ? "compact" : "expanded");
      return next;
    });
  }

  function abrirTour() {
    const esEscritorio = window.matchMedia("(min-width: 1024px)").matches;

    if (esEscritorio) {
      setCollapsedAntesDelTour(collapsed);
      setCollapsed(false);
    }

    setTourOpen(true);
  }

  function cerrarTour() {
    window.localStorage.setItem(`agendame-tour-visto-${negocioId}`, "1");
    setCollapsed(collapsedAntesDelTour);
    setMobileMenuOpen(false);

    setTourOpen(false);
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

      <div
        data-testid="dashboard-sidebar-frame"
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-[var(--dashboard-sidebar-width)] lg:p-3 lg:pr-0 lg:transition-[width] lg:duration-300 lg:ease-[var(--ease-out)]"
      >
        <DashboardSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleSidebar}
          onOpenTour={tourHabilitado ? abrirTour : undefined}
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

      {tourHabilitado && (
        <SidebarTour
          open={tourOpen}
          onClose={cerrarTour}
          onSetDrawerOpen={setMobileMenuOpen}
          negocioNombre={negocioNombre}
          accessRole={accessRole}
          accessScope={accessScope}
          planClave={planClave}
        />
      )}

      <DashboardMobileMenu
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onOpenTour={tourHabilitado ? abrirTour : undefined}
        sinAnimacion={tourOpen}
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

      <DashboardMobileBottomNav
        accessRole={accessRole}
        accessScope={accessScope}
        planClave={planClave}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      <main className="relative z-10 lg:pl-[var(--dashboard-sidebar-width)] lg:transition-[padding] lg:duration-300 lg:ease-[var(--ease-out)]">
        <div
          data-testid="dashboard-main-content"
          className="mx-auto w-full max-w-[1540px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7 lg:pb-7"
        >
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
