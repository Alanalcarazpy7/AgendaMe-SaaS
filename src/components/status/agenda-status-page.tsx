import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  CalendarX2,
  Home,
  LockKeyhole,
  LogIn,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";

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
};

function actionClass(variant: StatusAction["variant"]) {
  if (variant === "secondary") {
    return "border border-border/80 bg-background/75 text-foreground hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground";
  }

  return "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:bg-primary/90";
}

function StatusIllustration({
  code,
  tone,
}: {
  code: AgendaStatusPageProps["code"];
  tone: AgendaStatusPageProps["tone"];
}) {
  const warm = tone === "amber";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[25rem]">
      <div className="absolute inset-3 rounded-[2.25rem] bg-white/12 shadow-2xl shadow-black/20 ring-1 ring-white/15 backdrop-blur-xl" />
      <div className="absolute inset-x-8 top-10 h-7 rounded-full bg-white/20" />
      <div className="absolute left-1/2 top-16 h-44 w-56 -translate-x-1/2 rounded-[2rem] border border-white/20 bg-white/92 p-4 text-slate-950 shadow-2xl shadow-black/20">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className={`h-9 rounded-xl ${
                index === 4
                  ? warm
                    ? "bg-amber-400"
                    : "bg-cyan-400"
                  : "bg-slate-100"
              }`}
            />
          ))}
        </div>

        <div className="absolute -right-6 -top-6 flex h-16 w-16 rotate-6 items-center justify-center rounded-2xl border border-slate-200 bg-white text-4xl font-black shadow-xl">
          ?
        </div>
      </div>

      <div className="absolute bottom-14 left-1/2 flex w-[18rem] -translate-x-1/2 items-center justify-between rounded-[1.75rem] border border-white/20 bg-slate-950/80 px-4 py-3 text-white shadow-2xl shadow-black/25">
        <div>
          <p className="text-xs font-semibold text-cyan-100/80">AgendaMe</p>
          <p className="mt-1 text-sm font-bold">
            {code === "404" ? "Turno no encontrado" : "Acceso en pausa"}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            warm ? "bg-amber-400 text-slate-950" : "bg-cyan-400 text-slate-950"
          }`}
        >
          {code === "404" ? (
            <CalendarX2 className="h-5 w-5" />
          ) : (
            <LockKeyhole className="h-5 w-5" />
          )}
        </div>
      </div>

      <div className="absolute right-7 top-28 h-10 w-10 rounded-full bg-white/25" />
      <div className="absolute bottom-28 left-7 h-5 w-5 rounded-full bg-white/35" />
      <div className="absolute left-10 top-28 h-2 w-16 rotate-[-18deg] rounded-full bg-white/25" />
      <div className="absolute bottom-11 right-10 h-2 w-20 rotate-[14deg] rounded-full bg-white/25" />
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
}: AgendaStatusPageProps) {
  const warm = tone === "amber";

  return (
    <main
      className={`relative isolate min-h-screen overflow-hidden ${
        warm
          ? "bg-[radial-gradient(circle_at_20%_18%,rgb(245_158_11/0.22),transparent_30%),radial-gradient(circle_at_86%_18%,rgb(34_211_238/0.18),transparent_28%),linear-gradient(180deg,var(--background),var(--muted))]"
          : "bg-[radial-gradient(circle_at_18%_18%,rgb(34_211_238/0.20),transparent_30%),radial-gradient(circle_at_86%_16%,rgb(59_130_246/0.14),transparent_28%),linear-gradient(180deg,var(--background),var(--muted))]"
      } px-4 py-8 sm:px-6 lg:px-8`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/90 shadow-[0_28px_90px_rgb(15_23_42/0.13)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/82 dark:shadow-black/30 dark:ring-white/5 lg:grid-cols-[1.03fr_0.97fr]">
          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
            <p className="inline-flex w-fit items-center gap-2 rounded-2xl border border-border/70 bg-muted/55 px-3 py-1.5 text-xs font-bold text-muted-foreground">
              {code === "404" ? (
                <Search className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              )}
              {eyebrow}
            </p>

            <div className="mt-8 flex items-end gap-4">
              <span className="text-7xl font-black leading-none tracking-tight text-foreground sm:text-8xl">
                {code}
              </span>
              <span
                className={`mb-3 hidden h-4 w-24 rounded-full sm:block ${
                  warm ? "bg-amber-400" : "bg-cyan-400"
                }`}
              />
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              {description}
            </p>

            <div className="mt-7 rounded-[1.5rem] border border-border/70 bg-background/65 p-4">
              <p className="text-sm font-semibold leading-6 text-foreground">
                {note}
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {actions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition ${actionClass(
                      action.variant
                    )}`}
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <aside
            className={`relative min-h-[27rem] overflow-hidden ${
              warm
                ? "bg-[radial-gradient(circle_at_28%_18%,rgb(251_191_36/0.42),transparent_32%),linear-gradient(145deg,#111827,#0f766e_56%,#111827)]"
                : "bg-[radial-gradient(circle_at_28%_18%,rgb(34_211_238/0.36),transparent_32%),linear-gradient(145deg,#07111f,#0f766e_56%,#0b1120)]"
            } p-6 text-white sm:p-8`}
          >
            <div className="absolute left-8 top-8 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-cyan-50 backdrop-blur-xl">
              AgendaMe
            </div>
            <StatusIllustration code={code} tone={tone} />
          </aside>
        </section>
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
