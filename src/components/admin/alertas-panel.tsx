import Link from "next/link";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import type { AlertaOperativa } from "@/lib/admin/alertas";

const ICONOS = {
  info: Info,
  warning: AlertTriangle,
  danger: OctagonAlert,
} as const;

const ESTILOS = {
  info: "border-border bg-muted/30 text-foreground",
  warning: "border-amber-500/40 bg-amber-500/10 text-foreground",
  danger: "border-destructive/40 bg-destructive/10 text-foreground",
} as const;

const ICONO_COLOR = {
  info: "text-muted-foreground",
  warning: "text-chart-2",
  danger: "text-destructive",
} as const;

export function AlertasPanel({ alertas }: { alertas: AlertaOperativa[] }) {
  if (alertas.length === 0) {
    return (
      <section className="rounded-[1.5rem] border border-dashed border-border/80 bg-card/65 p-5 text-sm text-muted-foreground">
        Sin alertas operativas por el momento. Todo esta tranquilo.
      </section>
    );
  }

  return (
    <section aria-label="Alertas operativas" className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-bold tracking-tight">Alertas operativas</h2>
        <p className="text-sm text-muted-foreground">Puntos que conviene revisar antes de que se acumulen.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {alertas.map((alerta) => {
          const Icono = ICONOS[alerta.severidad];
          return (
            <Link
              key={alerta.id}
              href={alerta.href}
              className={`flex items-start gap-3 rounded-[1.25rem] border p-4 text-sm shadow-sm transition-[filter,transform] hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:brightness-110 ${ESTILOS[alerta.severidad]}`}
            >
              <span className="rounded-2xl bg-background/75 p-2 ring-1 ring-border/70">
                <Icono className={`h-4 w-4 shrink-0 ${ICONO_COLOR[alerta.severidad]}`} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold">{alerta.titulo}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{alerta.detalle}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
