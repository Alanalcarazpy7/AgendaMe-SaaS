import Link from "next/link";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { obtenerVencimientoPlanDashboard } from "@/lib/planes/plan-vencimiento";

type Props = {
  negocioId: string;
};

const ESTILOS = {
  amarillo: {
    seccion: "border-amber-500/30 bg-[linear-gradient(135deg,rgb(245_158_11/0.16),rgb(6_182_212/0.06))] ring-amber-500/10",
    icono: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  rojo: {
    seccion: "border-destructive/35 bg-[linear-gradient(135deg,rgb(239_68_68/0.18),rgb(6_182_212/0.05))] ring-destructive/10",
    icono: "bg-destructive/15 text-destructive",
  },
} as const;

/**
 * Aviso de vencimiento de plan, visible en todo el dashboard solo para
 * admin_global (quien gestiona pagos). Umbrales pedidos explícitamente:
 * mensual amarillo 12-5 días, rojo 4 días o menos; anual amarillo último mes
 * (<=30 días), rojo últimas 2 semanas (<=14 días). Ver
 * `src/lib/planes/plan-vencimiento.ts` para el detalle y la limitación
 * conocida sobre cómo se determina el ciclo real del negocio.
 */
export async function DashboardVencimientoBanner({ negocioId }: Props) {
  const vencimiento = await obtenerVencimientoPlanDashboard(negocioId);

  if (!vencimiento || !vencimiento.severidad) return null;

  const estilo = ESTILOS[vencimiento.severidad];
  const vencido = vencimiento.diasParaVencer < 0;
  const venceHoy = vencimiento.diasParaVencer === 0;
  const Icono = vencimiento.severidad === "rojo" ? AlertTriangle : CalendarClock;

  const fechaLegible = new Intl.DateTimeFormat("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Asuncion",
  }).format(new Date(vencimiento.fechaVencimiento));

  const mensaje = vencido
    ? `Tu plan venció hace ${Math.abs(vencimiento.diasParaVencer)} día${Math.abs(vencimiento.diasParaVencer) === 1 ? "" : "s"} (${fechaLegible}).`
    : venceHoy
      ? `Tu plan vence hoy (${fechaLegible}).`
      : `Tu plan vence en ${vencimiento.diasParaVencer} día${vencimiento.diasParaVencer === 1 ? "" : "s"} (${fechaLegible}).`;

  return (
    <section className={`mb-5 overflow-hidden rounded-[1.35rem] border p-4 shadow-sm ring-1 ${estilo.seccion}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${estilo.icono}`}>
            <Icono className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black">{mensaje}</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Registrá tu pago para renovar y evitar interrupciones en el servicio.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/planes"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          Renovar plan
        </Link>
      </div>
    </section>
  );
}
