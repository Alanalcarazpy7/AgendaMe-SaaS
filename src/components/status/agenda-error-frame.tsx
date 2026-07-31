import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { AgendaMeLogo } from "@/components/brand/agendame-logo";

export function AgendaErrorBackdrop({ warning = false }: { warning?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0 opacity-45 dark:opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 88%)",
        }}
      />

      <div className="absolute left-1/2 top-[46%] h-[30rem] w-[70rem] max-w-[96vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-primary/10 dark:border-primary/15" />
      <div
        className={`absolute left-1/2 top-[46%] h-[21rem] w-[52rem] max-w-[84vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border ${
          warning
            ? "border-amber-500/15 dark:border-amber-300/15"
            : "border-cyan-500/12 dark:border-cyan-300/15"
        }`}
      />

      <div className="absolute left-[4%] top-[25%] hidden w-44 lg:block">
        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/55">
          <span>08:00</span>
          <span>12:30</span>
          <span>18:00</span>
        </div>
        <div className="relative mt-2 h-px bg-border/70">
          <span className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-primary/55" />
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-500/55" />
          <span
            className={`absolute -top-1 right-0 h-2 w-2 rounded-full ${
              warning ? "bg-amber-500/65" : "bg-emerald-500/55"
            }`}
          />
        </div>
      </div>

      <div className="absolute bottom-[16%] right-[5%] hidden grid-cols-3 gap-2 opacity-55 lg:grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className={`h-8 w-12 rounded-lg border ${
              index === 4
                ? warning
                  ? "border-amber-500/25 bg-amber-500/10"
                  : "border-cyan-500/25 bg-cyan-500/10"
                : "border-border/65 bg-card/50"
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(to_right,transparent,color-mix(in_srgb,var(--primary)_45%,transparent),transparent)]" />
    </div>
  );
}

export function AgendaErrorHeader({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/65 sm:h-16">
      <Link
        href="/"
        className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        aria-label="Ir al inicio de AgendaMe"
      >
        <AgendaMeLogo size="md" />
      </Link>

      <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </span>
    </header>
  );
}

export function AgendaErrorFooter() {
  return (
    <footer className="flex h-9 shrink-0 items-center justify-center border-t border-border/65 text-center text-[11px] text-muted-foreground [@media(max-height:620px)]:hidden sm:h-10 sm:text-xs">
      AgendaMe - Reservas y citas, siempre a mano
    </footer>
  );
}
