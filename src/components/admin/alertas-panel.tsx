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
      <section className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
        Sin alertas operativas por el momento.
      </section>
    );
  }

  return (
    <section aria-label="Alertas operativas" className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">Alertas</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {alertas.map((alerta) => {
          const Icono = ICONOS[alerta.severidad];
          return (
            <Link
              key={alerta.id}
              href={alerta.href}
              className={`flex items-start gap-3 rounded-xl border p-3 text-sm transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:brightness-110 ${ESTILOS[alerta.severidad]}`}
            >
              <Icono className={`mt-0.5 h-4 w-4 shrink-0 ${ICONO_COLOR[alerta.severidad]}`} aria-hidden="true" />
              <span>
                <span className="block font-medium">{alerta.titulo}</span>
                <span className="block text-xs text-muted-foreground">{alerta.detalle}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
