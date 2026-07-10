"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AgendaMeIcon } from "@/components/brand/agendame-logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { DashboardPreferencesApplier } from "@/components/dashboard/dashboard-preferences-applier";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/nav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";

type AdminShellProps = {
  children: React.ReactNode;
  ownerEmail: string | null;
  tema?: "sistema" | "claro" | "oscuro";
  colorAcento?: string | null;
};

function esRutaActiva(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Navegación del panel">
      {ADMIN_NAV_ITEMS.map((item) => {
        const activo = esRutaActiva(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              activo
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, ownerEmail, tema = "sistema", colorAcento }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashboardPreferencesApplier tema={tema} colorAcento={colorAcento} />
      <Toaster richColors position="top-right" />

      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
          <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
            <AgendaMeIcon className="h-7 w-7" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">AgendaMe</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Panel del propietario</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <NavLinks pathname={pathname} />
          </div>

          <div className="border-t border-sidebar-border p-3">
            <p
              className="mb-2 truncate text-xs text-sidebar-foreground/60"
              title={ownerEmail ?? undefined}
            >
              {ownerEmail ?? "Propietario"}
            </p>
            <SignOutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <AgendaMeIcon className="h-6 w-6 shrink-0" />
              <span className="truncate text-sm font-semibold">Panel del propietario</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Abrir navegación"
                className="shrink-0 rounded-md border border-border p-2"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {ADMIN_NAV_ITEMS.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    data-variant={esRutaActiva(pathname, item.href) ? undefined : "default"}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
