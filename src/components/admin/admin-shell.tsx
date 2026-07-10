"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
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
    <nav className="flex flex-col gap-1" aria-label="Navegacion del panel">
      {ADMIN_NAV_ITEMS.map((item) => {
        const activo = esRutaActiva(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
              activo
                ? "bg-white text-slate-950 shadow-lg shadow-black/15 dark:bg-white/10 dark:text-white"
                : "text-white/68 hover:-translate-y-0.5 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {activo ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  ownerEmail,
  tema = "sistema",
  colorAcento,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_12%_0%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_28%),linear-gradient(180deg,color-mix(in_srgb,var(--muted)_72%,var(--background)),var(--background))] text-foreground">
      <DashboardPreferencesApplier tema={tema} colorAcento={colorAcento} />
      <Toaster richColors closeButton position="top-right" />

      <div className="flex min-h-dvh">
        <aside className="hidden w-[16.5rem] shrink-0 p-4 md:block">
          <div className="sticky top-4 flex h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[1.6rem] bg-slate-950 text-white shadow-[0_24px_70px_rgb(15_23_42/0.26)] ring-1 ring-white/10">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-black/20">
                <AgendaMeIcon className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-black tracking-tight">AgendaMe</p>
                <p className="truncate text-xs text-white/55">Control privado</p>
              </div>
            </div>

            <div className="mx-3 mt-3 flex h-10 items-center gap-2 rounded-[1rem] border border-white/10 bg-white/8 px-3 text-white/55">
              <Search className="h-4 w-4" />
              <span className="text-xs font-semibold">Buscar modulo</span>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks pathname={pathname} />
            </div>

            <div className="m-3 rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgb(34_211_238/0.22),transparent_42%),rgb(255_255_255/0.06)] p-3">
              <p className="text-xs font-bold text-white">Operaciones al dia</p>
              <p className="mt-1 text-xs leading-5 text-white/60">
                Revisa pagos, planes y negocios sin salir del panel.
              </p>
            </div>

            <div className="border-t border-white/10 p-3">
              <p className="mb-2 truncate text-xs text-white/55" title={ownerEmail ?? undefined}>
                {ownerEmail ?? "Propietario"}
              </p>
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/70 bg-card/90 px-4 py-3 shadow-sm backdrop-blur-xl md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <AgendaMeIcon className="h-6 w-6 shrink-0" />
              <span className="truncate text-sm font-bold">AgendaMe admin</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notificaciones"
                className="rounded-2xl border border-border/80 bg-background/70 p-2 text-muted-foreground"
              >
                <Bell className="h-4 w-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Abrir navegacion"
                  className="shrink-0 rounded-2xl border border-border/80 bg-background/70 p-2"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                  {ADMIN_NAV_ITEMS.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      data-variant={esRutaActiva(pathname, item.href) ? undefined : "default"}
                      className="rounded-xl"
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 xl:p-7">
            <div className="mx-auto w-full max-w-[1540px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
