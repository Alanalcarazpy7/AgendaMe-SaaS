import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Crown,
  Store,
  Users,
} from "lucide-react";
import type {
  PlanLimitKey,
  PlanLimitResource,
  PlanLimitSnapshot,
} from "@/lib/planes/plan-limits";

type Props = {
  snapshot: PlanLimitSnapshot;
  puedeGestionarPlanes?: boolean;
  compact?: boolean;
};

const ICONS: Record<PlanLimitKey, typeof CalendarDays> = {
  citas: CalendarDays,
  empleados: Users,
  servicios: Crown,
  clientes: Users,
  sucursales: Store,
};

function porcentaje(item: PlanLimitResource) {
  if (item.limit === null || item.limit <= 0) return 0;
  return Math.min(100, Math.round((item.used / item.limit) * 100));
}

function estado(item: PlanLimitResource) {
  const percent = porcentaje(item);

  if (item.overLimit) {
    return {
      label: "Sobre limite",
      className: "bg-destructive/10 text-destructive",
      barClassName: "bg-destructive",
      icon: AlertTriangle,
    };
  }

  if (item.reached) {
    return {
      label: "Limite alcanzado",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      barClassName: "bg-amber-500",
      icon: AlertTriangle,
    };
  }

  if (percent >= 80) {
    return {
      label: "Cerca del limite",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      barClassName: "bg-amber-500",
      icon: AlertTriangle,
    };
  }

  return {
    label: "Disponible",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    barClassName: "bg-primary",
    icon: CheckCircle2,
  };
}

function limiteTexto(item: PlanLimitResource) {
  if (item.limit === null) return "Sin limite definido";

  return `${item.used} / ${item.limit}`;
}

function disponibleTexto(item: PlanLimitResource) {
  if (item.limit === null) return "Sin limite";
  if (item.overLimit) return `${item.used - item.limit} sobre el limite`;
  return `${item.remaining ?? 0} disponibles`;
}

export function DashboardPlanUsageOverview({
  snapshot,
  puedeGestionarPlanes = false,
  compact = false,
}: Props) {
  return (
    <section className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_18px_55px_rgb(15_23_42/0.07)] ring-1 ring-white/60 dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
            <Crown className="h-3.5 w-3.5" />
            Plan {snapshot.planNombre}
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight">Uso del plan</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Estos son los limites actuales del negocio. Los datos existentes se
            conservan al bajar de plan, pero para crear mas recursos debe haber
            cupo disponible.
          </p>
        </div>

        {puedeGestionarPlanes ? (
          <Link
            href="/dashboard/planes"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border bg-background/70 px-4 text-sm font-black transition hover:bg-accent hover:text-accent-foreground"
          >
            Ver plan
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "md:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-2 2xl:grid-cols-5"}`}>
        {snapshot.resources.map((item) => {
          const Icon = ICONS[item.key];
          const status = estado(item);
          const StatusIcon = status.icon;
          const percent = porcentaje(item);

          return (
            <article key={item.key} className="rounded-[1.2rem] border bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-black ${status.className}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {status.label}
                </span>
              </div>

              <p className="mt-4 text-sm font-black">{item.label}</p>
              <p className="mt-2 text-2xl font-black tabular-nums">
                {limiteTexto(item)}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {disponibleTexto(item)}
              </p>

              {item.limit !== null ? (
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${status.barClassName}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                    {percent}% usado
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
