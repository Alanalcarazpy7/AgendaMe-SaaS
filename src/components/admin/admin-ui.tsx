import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  metrics?: React.ReactNode;
};

type AdminPanelProps = React.ComponentProps<"section"> & {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  surface?: "default" | "muted" | "dark";
};

type AdminMetricPillProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
};

type AdminTableShellProps = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

const toneClass: Record<NonNullable<AdminMetricPillProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary ring-primary/15",
  success: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300",
  danger: "bg-destructive/10 text-destructive ring-destructive/15",
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  metrics,
}: AdminPageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.65rem] bg-card p-4 shadow-[0_16px_50px_rgb(15_23_42/0.07)] ring-1 ring-border/75 dark:bg-slate-950/70 dark:shadow-black/20 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-emerald-400" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="inline-flex rounded-xl bg-muted/65 px-3 py-1.5 text-xs font-black text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {metrics ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics}</div> : null}
    </section>
  );
}

export function AdminPanel({
  title,
  description,
  action,
  surface = "default",
  className,
  children,
  ...props
}: AdminPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.45rem] bg-card shadow-[0_12px_36px_rgb(15_23_42/0.06)] ring-1 ring-border/75 dark:bg-slate-950/70 dark:shadow-black/20",
        surface === "dark"
          ? "bg-slate-950 text-white dark:bg-slate-950"
          : surface === "muted"
            ? "bg-muted/45"
            : "bg-card/90 dark:bg-card/80",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-base font-bold tracking-tight">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={title || description || action ? "p-4" : undefined}>{children}</div>
    </section>
  );
}

export function AdminMetricPill({
  label,
  value,
  icon: Icon,
  tone = "default",
}: AdminMetricPillProps) {
  return (
    <div className="rounded-[1.15rem] bg-background/70 p-3 ring-1 ring-border/65">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("rounded-xl p-2 ring-1", toneClass[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-black tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-[1.4rem] border border-dashed border-border/80 bg-muted/35 p-6 text-center">
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function AdminTableShell({ children, footer, className }: AdminTableShellProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="overflow-hidden rounded-[1.35rem] bg-card shadow-[0_12px_36px_rgb(15_23_42/0.06)] ring-1 ring-border/75 dark:bg-slate-950/70">
        <div className="overflow-x-auto">{children}</div>
      </div>
      {footer ? (
        <div className="rounded-[1.25rem] border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AdminTabLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-bold transition",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "border-border/80 bg-card/70 text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </a>
  );
}
