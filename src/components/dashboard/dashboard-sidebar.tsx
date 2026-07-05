"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  Crown,
  FileDown,
  Home,
  MessageSquareText,
  Scissors,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { nivelPlan } from "@/lib/planes/plan-access";

type AccessRole =
  | "admin_global"
  | "gerente_sucursal"
  | "recepcionista_sucursal"
  | "empleado_sucursal";

type AccessScope = "global" | "sucursal";

type DashboardSidebarProps = {
  userEmail?: string;
  negocioNombre?: string;
  negocioLogoUrl?: string | null;
  planClave?: string | null;
  accessRole?: AccessRole;
  accessScope?: AccessScope;
  scopeLabel?: string;
};

type PremiumModalInfo = {
  label: string;
  desde: string;
  descripcion: string;
};

const menuItems = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: Home,
    roles: ["admin_global", "gerente_sucursal", "recepcionista_sucursal", "empleado_sucursal"],
  },
  {
    label: "Reservas",
    href: "/dashboard/reservas",
    icon: BellRing,
    roles: ["admin_global", "gerente_sucursal", "recepcionista_sucursal"],
  },
  {
    label: "Citas",
    href: "/dashboard/citas",
    icon: CalendarDays,
    roles: ["admin_global", "gerente_sucursal", "recepcionista_sucursal", "empleado_sucursal"],
  },
  {
    label: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart3,
    requiredLevel: 1,
    desde: "Plan Básico",
    descripcion: "Reportes de ingresos, citas por estado y servicios más reservados.",
    roles: ["admin_global", "gerente_sucursal"],
  },
  {
    label: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    roles: ["admin_global", "gerente_sucursal", "recepcionista_sucursal"],
  },
  {
    label: "Servicios",
    href: "/dashboard/servicios",
    icon: Scissors,
    roles: ["admin_global"],
  },
  {
    label: "Empleados",
    href: "/dashboard/empleados",
    icon: BriefcaseBusiness,
    roles: ["admin_global", "gerente_sucursal"],
  },
  {
    label: "Planes",
    href: "/dashboard/planes",
    icon: CreditCard,
    roles: ["admin_global"],
  },
  {
    label: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
    roles: ["admin_global"],
  },
];

const premiumItems = [
  {
    label: "Exportar CSV",
    href: "/dashboard/exportar",
    icon: FileDown,
    requiredLevel: 2,
    branchRequiredLevel: 3,
    desde: "Plan Profesional",
    descripcion: "Exportá datos de citas, clientes y reportes.",
    roles: ["admin_global", "gerente_sucursal"],
  },
  {
    label: "Recordatorios",
    href: "/dashboard/recordatorios",
    icon: MessageSquareText,
    requiredLevel: 2,
    branchRequiredLevel: 3,
    desde: "Plan Profesional",
    descripcion: "Enviá recordatorios a clientes antes de sus citas.",
    roles: ["admin_global", "gerente_sucursal", "recepcionista_sucursal"],
  },
  {
    label: "Sucursales",
    href: "/dashboard/sucursales",
    icon: Building2,
    requiredLevel: 3,
    desde: "Plan Empresarial",
    descripcion: "Gestioná múltiples ubicaciones o sucursales.",
    roles: ["admin_global"],
  },
];

export function DashboardSidebar({
  userEmail,
  negocioNombre,
  negocioLogoUrl,
  planClave,
  accessRole = "admin_global",
  accessScope = "global",
  scopeLabel = "Todas las sucursales",
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [premiumInfo, setPremiumInfo] = useState<PremiumModalInfo | null>(null);
  const nivelActual = nivelPlan(planClave);

  function puedeVerItem(item: any) {
    return item.roles.includes(accessRole);
  }

  function renderItem(item: any) {
    if (!puedeVerItem(item)) return null;

    const Icon = item.icon;

    const requiredLevel =
      accessScope === "sucursal" && item.branchRequiredLevel
        ? item.branchRequiredLevel
        : item.requiredLevel;

    const bloqueado =
      typeof requiredLevel === "number" && nivelActual < requiredLevel;

    const activo =
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);

    if (bloqueado) {
      return (
        <button
          key={item.href}
          type="button"
          onClick={() =>
            setPremiumInfo({
              label: item.label,
              desde: item.desde,
              descripcion: item.descripcion,
            })
          }
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-yellow-50 hover:text-yellow-800"
        >
          <span className="flex items-center">
            <Icon className="mr-3 h-4 w-4" />
            {item.label}
          </span>

          <Crown className="h-4 w-4 text-yellow-600" />
        </button>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          activo
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="mr-3 h-4 w-4" />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="flex h-full flex-col border-r bg-background">
      <div className="border-b p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          {negocioLogoUrl ? (
            <img
              src={negocioLogoUrl}
              alt={negocioNombre ?? "Negocio"}
              className="h-12 w-12 rounded-2xl border object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
              {(negocioNombre ?? "A").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-xl font-bold tracking-tight">
              {negocioNombre ?? "AgendaMe"}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {scopeLabel}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">{menuItems.map(renderItem)}</div>

        <div className="mt-5 border-t pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Premium
          </p>
          <div className="space-y-1">{premiumItems.map(renderItem)}</div>
        </div>
      </nav>

      <div className="border-t p-4">
        {userEmail && (
          <p className="mb-3 truncate text-xs text-muted-foreground">
            {userEmail}
          </p>
        )}

        <SignOutButton variant="ghost" className="w-full justify-start" />
      </div>

      {premiumInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <Crown className="h-6 w-6" />
              </div>

              <button
                type="button"
                onClick={() => setPremiumInfo(null)}
                className="rounded-xl border p-2 transition hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="mt-5 text-2xl font-bold">
              {premiumInfo.label} disponible desde {premiumInfo.desde}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {premiumInfo.descripcion}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard/planes"
                onClick={() => setPremiumInfo(null)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background"
              >
                Mejorar plan
              </Link>

              <button
                type="button"
                onClick={() => setPremiumInfo(null)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}