"use client";

import { useState } from "react";
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
  Menu,
  Settings,
  Store,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

type Props = {
  userEmail?: string;
  userName?: string;
  negocioNombre: string;
  negocioLogoUrl?: string | null;
  planClave: string;
  accessRole: DashboardAccessRole;
  accessScope: DashboardAccessScope;
  scopeLabel: string;
};

function rolLabel(rol: DashboardAccessRole) {
  const labels: Record<DashboardAccessRole, string> = {
    admin_global: "Admin global",
    gerente_sucursal: "Gerente de sucursal",
    recepcionista_sucursal: "Recepcionista",
    empleado_sucursal: "Personal de sucursal",
  };

  return labels[rol] ?? rol;
}

function iniciales(nombre?: string, email?: string) {
  const base = (nombre || email || "Usuario").trim();

  const partes = base
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean);

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

export function DashboardMobileMenu({
  userEmail,
  userName,
  negocioNombre,
  negocioLogoUrl,
  planClave,
  accessRole,
  accessScope,
  scopeLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const nombreVisible = userName || userEmail?.split("@")[0] || "Usuario";

  const navItems = [
    {
      key: "inicio" as const,
      label: "Inicio",
      href: "/dashboard",
      icon: Home,
    },
    {
      key: "reservas" as const,
      label: "Reservas",
      href: "/dashboard/reservas",
      icon: CalendarClock,
    },
    {
      key: "citas" as const,
      label: "Citas",
      href: "/dashboard/citas",
      icon: CalendarCheck2,
    },
    {
      key: "clientes" as const,
      label: "Clientes",
      href: "/dashboard/clientes",
      icon: Users,
    },
    {
      key: "empleados" as const,
      label: "Empleados",
      href: "/dashboard/empleados",
      icon: BriefcaseBusiness,
    },
    {
      key: "servicios" as const,
      label: "Servicios",
      href: "/dashboard/servicios",
      icon: Store,
    },
    {
      key: "reportes" as const,
      label: "Reportes",
      href: "/dashboard/reportes",
      icon: BarChart3,
    },
    {
      key: "exportar" as const,
      label: "Exportar",
      href: "/dashboard/exportar",
      icon: Download,
    },
    {
      key: "recordatorios" as const,
      label: "Recordatorios",
      href: "/dashboard/recordatorios",
      icon: Bell,
    },
    {
      key: "sucursales" as const,
      label: "Sucursales",
      href: "/dashboard/sucursales",
      icon: Building2,
    },
    {
      key: "planes" as const,
      label: "Planes",
      href: "/dashboard/planes",
      icon: LayoutDashboard,
    },
    {
      key: "configuracion" as const,
      label: "Configuración",
      href: "/dashboard/configuracion",
      icon: Settings,
    },
  ].filter((item) => canSee(item.key, accessRole, accessScope, planClave));

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            {negocioLogoUrl ? (
              <img
                src={negocioLogoUrl}
                alt={negocioNombre}
                className="h-9 w-9 rounded-xl border object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-xs font-bold text-background">
                {iniciales(negocioNombre)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{negocioNombre}</p>
              <p className="truncate text-xs text-muted-foreground">{scopeLabel}</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          />

          <aside className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <p className="text-sm font-bold">Menú</p>
                <p className="text-xs text-muted-foreground">{negocioNombre}</p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b p-4">
              <Link
                href="/dashboard/mi-cuenta"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition hover:bg-muted ${
                  pathname === "/dashboard/mi-cuenta" ? "bg-muted" : "bg-background"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                  {iniciales(nombreVisible, userEmail)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{nombreVisible}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail ?? "Sin correo"}
                  </p>
                  <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {rolLabel(accessRole)}
                  </p>
                </div>

                <UserCircle2 className="h-5 w-5 text-muted-foreground" />
              </Link>

              <div className="mt-3 rounded-2xl bg-muted/40 p-3 text-xs">
                <p className="text-muted-foreground">Vista actual</p>
                <p className="mt-1 font-semibold">
                  {accessScope === "global" ? "Todas las sucursales" : scopeLabel}
                </p>
              </div>
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
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t p-4">
              <SignOutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}