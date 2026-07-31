import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Home,
  Info,
  LockKeyhole,
  LogIn,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";

import {
  AgendaErrorBackdrop,
  AgendaErrorFooter,
  AgendaErrorHeader,
} from "@/components/status/agenda-error-frame";

type StatusAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
};

type AgendaStatusPageProps = {
  code: "404" | "403";
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  tone?: "blue" | "amber";
  actions: StatusAction[];
  embedded?: boolean;
};

function actionClass(variant: StatusAction["variant"]) {
  if (variant === "secondary") {
    return "border-border/80 bg-card/85 text-foreground hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent hover:shadow-md";
  }

  return "border-primary/35 bg-primary text-primary-foreground shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg";
}

function ForbiddenScene({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative order-1 mx-auto w-full max-w-2xl lg:max-w-none ${
        compact
          ? "h-[clamp(7rem,23dvh,14rem)] lg:h-[min(48dvh,29rem)]"
          : "h-[clamp(8.5rem,29dvh,19rem)] lg:h-[min(64dvh,35rem)]"
      }`}
    >
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none text-[9rem] font-black leading-none text-amber-500/[0.075] sm:text-[13rem] lg:text-[20rem] dark:text-amber-300/[0.055]"
        aria-hidden="true"
      >
        403
      </span>

      <div
        className="absolute bottom-[11%] left-[6%] right-[4%] -z-10 hidden h-3 rotate-[-2deg] rounded-lg border border-border/40 shadow-sm sm:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #06b6d4 0 12px, #f8fafc 12px 24px, #0f172a 24px 36px)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto h-full w-full max-w-[36rem]">
        <Image
          src="/status/forbidden-agendame-3d.png"
          alt="Control de acceso de AgendaMe protegiendo citas, clientes y horarios"
          fill
          priority
          sizes="(max-width: 640px) 272px, (max-width: 1024px) 336px, 576px"
          className="object-contain drop-shadow-[0_26px_38px_rgb(15_23_42/0.18)] dark:drop-shadow-[0_28px_42px_rgb(6_182_212/0.10)]"
        />
      </div>

      <span
        className="ag-animate-float-delayed absolute left-[2%] top-[16%] hidden rounded-lg border border-border/70 bg-card/85 px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm backdrop-blur-md sm:block"
        aria-hidden="true"
      >
        Clientes
      </span>
      <span
        className="ag-animate-float absolute bottom-[18%] right-[1%] hidden rounded-lg border border-amber-500/20 bg-card/85 px-3 py-2 text-xs font-bold text-amber-700 shadow-sm backdrop-blur-md dark:text-amber-300 sm:block"
        aria-hidden="true"
      >
        Acceso protegido
      </span>
      <span
        className="absolute right-[10%] top-[11%] hidden h-9 w-9 rotate-6 items-center justify-center rounded-lg border border-primary/20 bg-card/85 text-primary shadow-sm lg:flex"
        aria-hidden="true"
      >
        <LockKeyhole className="h-4 w-4" />
      </span>
    </div>
  );
}

export function AgendaStatusPage({
  code,
  eyebrow,
  title,
  description,
  note,
  tone = "blue",
  actions,
  embedded = false,
}: AgendaStatusPageProps) {
  const warning = tone === "amber" || code === "403";

  return (
    <main
      className={`relative isolate min-h-0 overflow-hidden bg-background text-foreground ${
        embedded
          ? "mt-4 h-[calc(100dvh-17rem)] rounded-lg border border-border/70 shadow-sm lg:h-[calc(100dvh-12rem)]"
          : "h-[100dvh]"
      }`}
    >
      <AgendaErrorBackdrop warning={warning} />

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        {embedded ? null : <AgendaErrorHeader icon={ShieldAlert} label="Acceso controlado" />}

        <section className="grid min-h-0 flex-1 items-center gap-1 py-2 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:py-4">
          <ForbiddenScene compact={embedded} />

          <div className="order-2 mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              {eyebrow}
            </p>

            <h1 className="mt-2 text-2xl font-black leading-[1.08] sm:text-3xl lg:mt-4 lg:text-5xl [@media(max-height:620px)]:text-xl">
              {title}
            </h1>
            <p
              className={`mx-auto mt-2 max-w-lg text-sm leading-5 text-muted-foreground lg:mx-0 lg:mt-3 lg:text-base lg:leading-7 [@media(max-height:560px)]:hidden ${
                embedded ? "hidden sm:block" : ""
              }`}
            >
              {description}
            </p>

            <div className="mx-auto mt-3 flex max-w-lg items-start gap-2 rounded-lg border border-border/75 bg-card/80 px-3 py-2.5 text-left shadow-sm backdrop-blur-md lg:mx-0 lg:mt-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/8 text-primary">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold leading-5 text-foreground sm:text-sm">{note}</p>
            </div>

            <nav
              aria-label="Opciones para continuar"
              className="mt-3 grid w-full grid-cols-2 gap-2 lg:mt-5"
            >
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                const spansRow = actions.length === 3 && index === 0;

                return (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={`inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border px-3 text-center text-xs font-bold shadow-sm outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 focus-visible:ring-3 focus-visible:ring-ring/35 sm:text-sm ${
                      spansRow ? "col-span-2" : ""
                    } ${actionClass(action.variant)}`}
                  >
                    <ActionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{action.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </section>

        {embedded ? null : <AgendaErrorFooter />}
      </div>
    </main>
  );
}

export const statusActions = {
  home: { href: "/", label: "Volver al inicio", icon: Home, variant: "secondary" as const },
  login: { href: "/login", label: "Cambiar cuenta", icon: LogIn, variant: "secondary" as const },
  retry: { href: "/auth/redirect", label: "Reintentar acceso", icon: RotateCcw },
  dashboard: { href: "/dashboard", label: "Volver al panel", icon: ArrowLeft },
};
