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
  Download,
  Home,
  LayoutDashboard,
  Settings,
  Store,
  UserCircle2,
  Users,
} from "lucide-react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

type Props = {
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
  item:
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
    | "configuracion",
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

  const navItems = [
    { key: "inicio" as const, label: "Inicio", href: "/dashboard", icon: Home },
    { key: "reservas" as const, label: "Reservas", href: "/dashboard/reservas", icon: CalendarClock },
    { key: "citas" as const, label: "Citas", href: "/dashboard/citas", icon: CalendarCheck2 },
    { key: "clientes" as const, label: "Clientes", href: "/dashboard/clientes", icon: Users },
    { key: "empleados" as const, label: "Empleados", href: "/dashboard/empleados", icon: BriefcaseBusiness },
    { key: "servicios" as const, label: "Servicios", href: "/dashboard/servicios", icon: Store },
    { key: "reportes" as const, label: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
    { key: "exportar" as const, label: "Exportar", href: "/dashboard/exportar", icon: Download },
    { key: "recordatorios" as const, label: "Recordatorios", href: "/dashboard/recordatorios", icon: Bell },
    { key: "sucursales" as const, label: "Sucursales", href: "/dashboard/sucursales", icon: Building2 },
    { key: "planes" as const, label: "Planes", href: "/dashboard/planes", icon: LayoutDashboard },
    { key: "configuracion" as const, label: "Configuración", href: "/dashboard/configuracion", icon: Settings },
  ].filter((item) => canSee(item.key, accessRole, accessScope, planClave));

  return (
    <aside className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[18px_0_60px_rgb(15_23_42/0.08)] dark:shadow-[18px_0_70px_rgb(0_0_0/0.32)]">
      <div className="border-b border-sidebar-border p-5">
        <Link
          href="/dashboard"
          className="mb-5 inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          aria-label="Ir al inicio de AgendaMe"
        >
          <AgendaMeLogo size="md" />
        </Link>
        <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar">
          {negocioLogoUrl ? (
            <img
              src={negocioLogoUrl}
              alt={negocioNombre}
              className="h-10 w-10 rounded-2xl border border-sidebar-border object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20">
              {iniciales(negocioNombre)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{negocioNombre}</p>
            <p className="truncate text-xs text-muted-foreground">
              {accessScope === "global" ? "Todas las sucursales" : scopeLabel}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium outline-none transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/25"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/dashboard/mi-cuenta"
          className={`mb-3 flex items-center gap-3 rounded-2xl border border-sidebar-border p-2.5 outline-none transition-[background-color,box-shadow,color] duration-200 ease-[var(--ease-out)] hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar ${
            pathname === "/dashboard/mi-cuenta" ? "bg-sidebar-accent shadow-sm" : "bg-sidebar"
          }`}
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={nombreVisible}
              className="h-9 w-9 rounded-full border object-cover"
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: userColor ?? "var(--sidebar-primary)" }}
            >
              {iniciales(nombreVisible, userEmail)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{nombreVisible}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {rolLabel(accessRole)} · Mi cuenta
            </p>
          </div>

          <UserCircle2 className="h-4 w-4 text-muted-foreground" />
        </Link>

        <SignOutButton />
      </div>
    </aside>
  );
}


