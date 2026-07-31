"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { House, LayoutDashboard, SearchX } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  AgendaErrorBackdrop,
  AgendaErrorFooter,
  AgendaErrorHeader,
} from "@/components/status/agenda-error-frame";

type NavigationAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
};

function getNavigationActions(pathname: string): NavigationAction[] {
  if (pathname.startsWith("/admin")) {
    return [
      {
        href: "/admin",
        label: "Volver al panel admin",
        icon: LayoutDashboard,
        primary: true,
      },
      {
        href: "/",
        label: "Ir al inicio",
        icon: House,
      },
    ];
  }

  if (pathname.startsWith("/dashboard")) {
    return [
      {
        href: "/dashboard",
        label: "Volver al dashboard",
        icon: LayoutDashboard,
        primary: true,
      },
      {
        href: "/",
        label: "Ir al inicio",
        icon: House,
      },
    ];
  }

  return [
    {
      href: "/",
      label: "Volver al inicio",
      icon: House,
      primary: true,
    },
    {
      href: "/dashboard",
      label: "Abrir mi dashboard",
      icon: LayoutDashboard,
    },
  ];
}

function NavigationCard({ action }: { action: NavigationAction }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className={`group inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-bold shadow-sm outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/35 ${
        action.primary
          ? "border-primary/35 bg-primary text-primary-foreground shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
          : "border-border/80 bg-card/85 text-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent hover:shadow-md"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105" aria-hidden="true" />
      <span>{action.label}</span>
    </Link>
  );
}

function NotFoundScene() {
  return (
    <div className="relative mx-auto h-[clamp(10rem,34dvh,23rem)] w-full max-w-5xl [@media(max-height:560px)]:h-[8.5rem]">
      <span
        className="pointer-events-none absolute left-1/2 top-[44%] z-0 -translate-x-1/2 -translate-y-1/2 select-none bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_45%,var(--foreground)),color-mix(in_srgb,var(--ring)_12%,transparent))] bg-clip-text text-[9rem] font-black leading-none text-transparent opacity-30 sm:text-[13rem] lg:text-[18rem] dark:opacity-[0.22]"
        aria-hidden="true"
      >
        404
      </span>

      <div className="absolute left-[10%] right-[10%] top-[58%] z-0 hidden h-px bg-border/70 sm:block">
        {Array.from({ length: 7 }).map((_, index) => (
          <span
            key={index}
            className="absolute -top-1 h-2 w-2 rounded-full border border-primary/30 bg-background"
            style={{ left: `${index * 16.66}%` }}
          />
        ))}
      </div>

      <div className="ag-animate-float absolute bottom-[-2%] left-1/2 z-10 h-[68%] w-[68%] max-w-[22rem] -translate-x-1/2 sm:h-[72%] sm:w-[72%] lg:max-w-[25rem]">
        <Image
          src="/status/not-found-agendame-3d.png"
          alt="Calendario de AgendaMe buscando una fecha que se salió de la agenda"
          fill
          priority
          sizes="(max-width: 640px) 224px, (max-width: 1024px) 320px, 400px"
          className="object-contain drop-shadow-[0_24px_34px_rgb(15_23_42/0.16)] dark:drop-shadow-[0_26px_38px_rgb(6_182_212/0.10)]"
        />
      </div>

      <span
        className="ag-animate-float-delayed absolute left-[12%] top-[34%] z-20 hidden rounded-lg border border-border/70 bg-card/85 px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm backdrop-blur-md sm:block"
        aria-hidden="true"
      >
        09:00
      </span>
      <span
        className="ag-animate-float absolute bottom-[15%] right-[12%] z-20 hidden rounded-lg border border-cyan-500/20 bg-card/85 px-3 py-2 text-xs font-bold text-cyan-700 shadow-sm backdrop-blur-md dark:text-cyan-300 sm:block"
        aria-hidden="true"
      >
        18:30
      </span>
      <span
        className="absolute right-[24%] top-[25%] z-20 hidden h-8 w-8 rotate-6 items-center justify-center rounded-lg border border-primary/20 bg-card/80 text-sm font-black text-primary shadow-sm lg:flex"
        aria-hidden="true"
      >
        ?
      </span>
    </div>
  );
}

export function AgendaNotFound() {
  const pathname = usePathname() ?? "/";
  const actions = getNavigationActions(pathname);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

  return (
    <main className="fixed inset-0 z-[100] isolate h-[100dvh] min-h-0 overflow-hidden bg-background text-foreground">
      <AgendaErrorBackdrop />

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <AgendaErrorHeader icon={SearchX} label="Ruta no encontrada" />

        <section className="flex min-h-0 flex-1 flex-col items-center justify-center py-2 text-center sm:py-3">
          <NotFoundScene />

          <div className="mx-auto w-full max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" aria-hidden="true" />
              Error 404
            </p>

            <h1 className="mt-2 text-2xl font-black leading-[1.08] sm:text-3xl lg:mt-3 lg:text-4xl [@media(max-height:620px)]:text-xl">
              Esta página no estaba en la agenda
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-muted-foreground lg:text-base lg:leading-7 [@media(max-height:560px)]:hidden">
              El enlace cambió, ya no existe o te llevó a una ruta que no está disponible.
              Podés retomar tu camino desde acá.
            </p>

            <nav
              aria-label="Opciones para continuar"
              className="mt-3 flex w-full flex-col items-center justify-center gap-2 sm:flex-row lg:mt-4"
            >
              {actions.map((action) => (
                <NavigationCard key={action.href} action={action} />
              ))}
            </nav>
          </div>
        </section>

        <AgendaErrorFooter />
      </div>
    </main>
  );
}
