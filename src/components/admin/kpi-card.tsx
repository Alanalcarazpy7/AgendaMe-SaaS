import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  help?: string;
  tone?: "default" | "warning" | "danger" | "success";
};

const TONE_CLASSES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary ring-primary/15 border-primary/70",
  success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 border-emerald-500/70 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-700 ring-amber-500/15 border-amber-500/70 dark:text-amber-300",
  danger: "bg-destructive/10 text-destructive ring-destructive/15 border-destructive/70",
};

export function KpiCard({ label, value, icon: Icon, hint, help, tone = "default" }: KpiCardProps) {
  return (
    <article className="group relative min-h-36 overflow-hidden rounded-[1.25rem] bg-card p-4 shadow-[0_10px_30px_rgb(15_23_42/0.06)] ring-1 ring-border/75 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgb(15_23_42/0.10)] dark:bg-slate-950/70 dark:shadow-black/20">
      <div className={cn("absolute inset-x-0 top-0 h-1 border-t", TONE_CLASSES[tone])} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-5 text-muted-foreground">{label}</p>
        <span
          className={cn("group/help relative rounded-xl p-2 ring-1", TONE_CLASSES[tone])}
          tabIndex={help ? 0 : -1}
          aria-label={help ? `Ayuda: ${label}` : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {help ? (
            <span className="pointer-events-none absolute right-0 top-10 z-20 w-64 translate-y-1 rounded-2xl border border-border/80 bg-popover p-3 text-left text-xs font-semibold leading-5 text-popover-foreground opacity-0 shadow-2xl shadow-slate-950/15 ring-1 ring-foreground/5 transition duration-150 group-hover/help:translate-y-0 group-hover/help:opacity-100 group-focus/help:translate-y-0 group-focus/help:opacity-100 dark:shadow-black/40">
              {help}
            </span>
          ) : null}
        </span>
      </div>
      <p className="mt-6 text-3xl font-black tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </article>
  );
}
