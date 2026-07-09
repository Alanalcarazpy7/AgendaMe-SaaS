"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Home,
  LayoutDashboard,
  Settings,
  Sparkles,
  Store,
  UserCircle2,
  Users,
} from "lucide-react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { AgendaMeIcon, AgendaMeLogo } from "@/components/brand/agendame-logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

type Props = {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  userEmail?: string;
  userName?: string;
  userAvatarUrl?: string | null;
  userColor?: string | null;
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  planClave: string;
  accessRole: DashboardAccessRole;
  accessScope: DashboardAccessScope;
  scopeLabel: string;
};

type NavKey =
  | "inicio"
  | "reservas"
  | "citas"
  | "clientes"
  | "empleados"
  | "servicios"
  | "reportes"
  | "exportar"
  | "recordatorios"
  | "sucursales"
  | "planes"
  | "configuracion";

function rolLabel(rol: DashboardAccessRole) {
  const labels: Record<DashboardAccessRole, string> = {
    admin_global: "Admin",
    gerente_sucursal: "Gerente",
    recepcionista_sucursal: "Recepción",
    empleado_sucursal: "Personal",
  };

  return labels[rol] ?? rol;
}

function iniciales(nombre?: string, email?: string) {
  const base = (nombre || email || "Usuario").trim();
  const partes = base.replace(/@.*/, "").split(/\s+/).filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

function canSee(
  item: NavKey,
  rol: DashboardAccessRole,
  scope: DashboardAccessScope,
  planClave: string
) {
  const global = scope === "global";
  const empresarial = planClave === "empresarial";
  const profesional = planClave === "profesional" || empresarial;
  const basico = planClave === "basico" || profesional;

  if (item === "inicio") return true;

  if (global) {
    if (item === "reportes") return basico;
    if (item === "exportar") return profesional;
    if (item === "recordatorios") return profesional;
    if (item === "sucursales") return empresarial;
    return true;
  }

  if (rol === "gerente_sucursal") {
    return [
      "inicio",
      "reservas",
      "citas",
      "clientes",
      "empleados",
      "reportes",
      "exportar",
      "recordatorios",
    ].includes(item);
  }

  if (rol === "recepcionista_sucursal") {
    return ["inicio", "reservas", "citas", "clientes", "recordatorios"].includes(item);
  }

  if (rol === "empleado_sucursal") {
    return ["inicio", "citas"].includes(item);
  }

  return false;
}

export function DashboardSidebar({
  collapsed = false,
  onToggleCollapsed,
  userEmail,
  userName,
  userAvatarUrl,
  userColor,
  negocioNombre,
  negocioLogoUrl,
  planClave,
  accessRole,
  accessScope,
  scopeLabel,
}: Props) {
  const pathname = usePathname();
  const nombreVisible = userName || userEmail?.split("@")[0] || "Usuario";
  const compactLabel = collapsed ? "Expandir menú" : "Colapsar menú";

  const navItems = [
    { key: "inicio" as const, label: "Inicio", href: "/dashboard", icon: Home, group: "Agenda" },
    { key: "reservas" as const, label: "Reservas", href: "/dashboard/reservas", icon: CalendarClock, group: "Agenda" },
    { key: "citas" as const, label: "Citas", href: "/dashboard/citas", icon: CalendarCheck2, group: "Agenda" },
    { key: "clientes" as const, label: "Clientes", href: "/dashboard/clientes", icon: Users, group: "Gestión" },
    { key: "empleados" as const, label: "Empleados", href: "/dashboard/empleados", icon: BriefcaseBusiness, group: "Gestión" },
    { key: "servicios" as const, label: "Servicios", href: "/dashboard/servicios", icon: Store, group: "Gestión" },
    { key: "reportes" as const, label: "Reportes", href: "/dashboard/reportes", icon: BarChart3, group: "Crecimiento" },
    { key: "exportar" as const, label: "Exportar", href: "/dashboard/exportar", icon: Download, group: "Crecimiento" },
    { key: "recordatorios" as const, label: "Recordatorios", href: "/dashboard/recordatorios", icon: Bell, group: "Crecimiento" },
    { key: "sucursales" as const, label: "Sucursales", href: "/dashboard/sucursales", icon: Building2, group: "Sistema" },
    { key: "planes" as const, label: "Planes", href: "/dashboard/planes", icon: LayoutDashboard, group: "Sistema" },
    { key: "configuracion" as const, label: "Configuración", href: "/dashboard/configuracion", icon: Settings, group: "Sistema" },
  ].filter((item) => canSee(item.key, accessRole, accessScope, planClave));

  const grouped = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    acc[item.group] = acc[item.group] ?? [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const showUpgrade = planClave !== "empresarial";

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground shadow-[22px_0_70px_rgb(15_23_42/0.10)] ring-1 ring-white/60 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 dark:bg-sidebar/90 dark:shadow-[20px_0_70px_rgb(0_0_0/0.38)] dark:ring-white/5">
      <div className="relative border-b border-sidebar-border/70 p-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="inline-flex min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            aria-label="Ir al inicio de AgendaMe"
          >
            {collapsed ? <AgendaMeIcon size="sm" /> : <AgendaMeLogo size="sm" />}
          </Link>

          <button
            type="button"
            onClick={onToggleCollapsed}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sidebar-border/80 bg-sidebar-accent/60 text-sidebar-foreground outline-none transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            aria-label={compactLabel}
            title={compactLabel}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <Link
          href="/dashboard"
          title={negocioNombre}
          className={`mt-5 flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 p-2.5 shadow-sm outline-none transition-[background-color,box-shadow] duration-200 ease-[var(--ease-out)] hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {negocioLogoUrl ? (
            <img
              src={negocioLogoUrl}
              alt={negocioNombre}
              className="h-10 w-10 rounded-2xl border border-sidebar-border object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20">
              {iniciales(negocioNombre)}
            </div>
          )}

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{negocioNombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {accessScope === "global" ? "Todas las sucursales" : scopeLabel}
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                {group}
              </p>
            )}

            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={`group relative flex min-h-11 items-center rounded-2xl text-sm font-medium outline-none transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
                      collapsed ? "justify-center px-0" : "gap-3 px-3"
                    } ${
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                        : "text-muted-foreground hover:-translate-y-0.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    {active && !collapsed && (
                      <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-sidebar-primary-foreground/85" />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border/70 p-3">
        <Link
          href="/dashboard/planes"
          title={showUpgrade ? "Actualizar plan" : "Plan activo"}
          className={`mb-3 block overflow-hidden rounded-2xl border outline-none transition-[box-shadow,transform,border-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
            showUpgrade
              ? "border-cyan-300/50 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_94%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] text-white shadow-xl shadow-cyan-950/20"
              : "border-sidebar-border bg-sidebar-accent/50"
          } ${collapsed ? "p-2.5" : "p-4"}`}
        >
          {collapsed ? (
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${showUpgrade ? "bg-white/15" : "bg-sidebar"}`}>
              <Crown className={`h-4 w-4 ${showUpgrade ? "text-white" : "text-primary"}`} />
            </div>
          ) : (
            <div className="relative">
              {showUpgrade && (
                <Sparkles className="absolute right-0 top-0 h-5 w-5 text-cyan-100" />
              )}
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${showUpgrade ? "bg-white/15 text-white" : "bg-sidebar text-primary"}`}>
                <Crown className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold">
                {showUpgrade ? "Mejorá tu plan" : "Plan empresarial"}
              </p>
              <p className={`mt-1 text-xs ${showUpgrade ? "text-cyan-50/90" : "text-muted-foreground"}`}>
                {showUpgrade
                  ? "Más citas, reportes y herramientas para crecer."
                  : "Funciones avanzadas activas para tu negocio."}
              </p>
            </div>
          )}
        </Link>

        <Link
          href="/dashboard/mi-cuenta"
          title="Mi cuenta"
          className={`mb-3 flex items-center rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/40 outline-none transition-[background-color,box-shadow,color] duration-200 ease-[var(--ease-out)] hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
            collapsed ? "justify-center p-2" : "gap-3 p-2.5"
          } ${pathname === "/dashboard/mi-cuenta" ? "bg-sidebar-accent shadow-sm" : ""}`}
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={nombreVisible}
              className="h-9 w-9 rounded-2xl border object-cover"
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white"
              style={{ backgroundColor: userColor ?? "var(--sidebar-primary)" }}
            >
              {iniciales(nombreVisible, userEmail)}
            </div>
          )}

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{nombreVisible}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {rolLabel(accessRole)} · Mi cuenta
                </p>
              </div>

              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </Link>

        <SignOutButton compact={collapsed} />
      </div>
    </aside>
  );
}
