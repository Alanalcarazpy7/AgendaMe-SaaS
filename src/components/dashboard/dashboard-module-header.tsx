import type { ReactNode } from "react";

type DashboardModuleHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  aside?: ReactNode;
};

export function DashboardModuleHeader({
  eyebrow,
  title,
  description,
  icon,
  aside,
}: DashboardModuleHeaderProps) {
  return (
    <header className="border-b border-border/70 pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/10">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground text-pretty">
              {description}
            </p>
          </div>
        </div>

        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}
