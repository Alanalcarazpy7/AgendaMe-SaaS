"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, UserCircle2, X } from "lucide-react";
import type {
  DashboardAccessRole,
  DashboardAccessScope,
} from "@/lib/dashboard/access-context";
import { AgendaMeIcon, AgendaMeLogo } from "@/components/brand/agendame-logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { getVisibleNavItems } from "@/components/dashboard/dashboard-sidebar";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenTour?: () => void;
  sinAnimacion?: boolean;
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

export function DashboardMobileMenu({
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
  open,
  onOpenChange,
  onOpenTour,
  sinAnimacion = false,
}: Props) {
  const pathname = usePathname();

  const nombreVisible = userName || userEmail?.split("@")[0] || "Usuario";
  const navItems = getVisibleNavItems(accessRole, accessScope, planClave);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/92 shadow-sm shadow-slate-950/5 backdrop-blur-xl lg:hidden dark:shadow-black/20">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-card shadow-sm">
              <AgendaMeIcon size="sm" />
            </span>

            {negocioLogoUrl ? (
              <Image
                  src={negocioLogoUrl}
                  alt={negocioNombre}
                  width={36}
                  height={36}
                  unoptimized
                  className="hidden h-9 w-9 rounded-xl border object-cover sm:block"
                />
            ) : (
              <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground sm:flex">
                {iniciales(negocioNombre)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{negocioNombre}</p>
              <p className="truncate text-xs text-muted-foreground">{scopeLabel}</p>
            </div>
          </Link>

          <Link
            href="/dashboard/mi-cuenta"
            aria-label="Mi cuenta"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-card shadow-sm outline-none transition-[background-color,box-shadow,color] duration-200 ease-[var(--ease-out)] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <UserAvatar
              src={userAvatarUrl}
              alt={nombreVisible}
              size={40}
              color={userColor}
              iniciales={iniciales(nombreVisible, userEmail)}
              imgClassName="h-full w-full object-cover"
              fallbackClassName="flex h-full w-full items-center justify-center text-xs font-bold text-white"
            />
          </Link>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="ag-dashboard-overlay absolute inset-0"
            style={sinAnimacion ? { transition: "none" } : undefined}
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar menú"
          />

          <aside
            className="ag-dashboard-drawer absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col border-l bg-background shadow-2xl shadow-slate-950/25 dark:shadow-black/50"
            style={sinAnimacion ? { transition: "none" } : undefined}
          >
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <AgendaMeLogo size="sm" />
                <p className="mt-2 text-xs text-muted-foreground">{negocioNombre}</p>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-card outline-none transition-[background-color,box-shadow,color] duration-200 ease-[var(--ease-out)] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b p-4">
              <Link
                href="/dashboard/mi-cuenta"
                onClick={() => onOpenChange(false)}
                className={`flex items-center gap-3 rounded-2xl border p-3 outline-none transition-[background-color,box-shadow,color] duration-200 ease-[var(--ease-out)] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  pathname === "/dashboard/mi-cuenta" ? "bg-accent shadow-sm" : "bg-card"
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
                    data-tour-id={`drawer-${item.key}`}
                    onClick={() => onOpenChange(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium outline-none transition-[background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-2 border-t p-4">
              {onOpenTour && (
                <button
                  type="button"
                  onClick={onOpenTour}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-card text-sm font-semibold shadow-sm outline-none transition-[background-color,box-shadow,color] duration-200 ease-[var(--ease-out)] hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Compass className="h-4 w-4" />
                  Ver recorrido
                </button>
              )}
              <SignOutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}


