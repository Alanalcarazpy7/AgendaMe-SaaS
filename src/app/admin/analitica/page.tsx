import Link from "next/link";
import { Activity, Gauge, PiggyBank, TrendingUp } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { obtenerPagosAprobadosRecientes } from "@/lib/admin/queries/pagos";
import {
  calcularDistribucionPorPlan,
  calcularIngresosPorMes,
  calcularNegociosNuevosPorMes,
} from "@/lib/admin/kpis";
import { formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import {
  DistribucionPlanChart,
  IngresosPorMesChart,
  NegociosNuevosChart,
} from "@/components/admin/charts/admin-charts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<{ meses?: string }>;
};

export default async function AdminAnaliticaPage({ searchParams }: PageProps) {
  await requirePlatformOwner();
  const params = (await searchParams) ?? {};
  const meses = [6, 12, 24].includes(Number(params.meses)) ? Number(params.meses) : 6;

  const [negocios, planes, pagosAprobados] = await Promise.all([
    obtenerNegociosResumen(),
    obtenerPlanes(),
    obtenerPagosAprobadosRecientes(meses + 1),
  ]);

  const ingresosPorMes = calcularIngresosPorMes(pagosAprobados, meses);
  const negociosNuevosPorMes = calcularNegociosNuevosPorMes(negocios, meses);
  const distribucionPorPlan = calcularDistribucionPorPlan(negocios, planes);

  const sinActividad = negocios.filter((n) => n.estado === "activo" && (n.citas_mes_actual ?? 0) === 0);
  const cercaDelLimite = negocios.filter(
    (n) =>
      typeof n.limite_citas_mensuales === "number" &&
      n.limite_citas_mensuales > 0 &&
      (n.citas_usadas_mes_actual ?? 0) / n.limite_citas_mensuales >= 0.8
  );
  const gratis = negocios.filter((n) => n.plan_clave === "gratis").length;
  const pagos = negocios.length - gratis;
  const porcentajePago = negocios.length > 0 ? Math.round((pagos / negocios.length) * 100) : 0;

  const topPorUso = [...negocios]
    .filter((n) => typeof n.limite_citas_mensuales === "number" && n.limite_citas_mensuales > 0)
    .sort(
      (a, b) =>
        (b.citas_usadas_mes_actual ?? 0) / (b.limite_citas_mensuales ?? 1) -
        (a.citas_usadas_mes_actual ?? 0) / (a.limite_citas_mensuales ?? 1)
    )
    .slice(0, 10);

  const pagosAprobadosTotal = pagosAprobados.length;
  const hayHistorialSuficiente = pagosAprobadosTotal >= 10;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analítica</h1>
          <p className="text-sm text-muted-foreground">Crecimiento, ingresos, uso y retención de la plataforma.</p>
        </div>
        <nav className="flex gap-2" aria-label="Rango de meses">
          {[6, 12, 24].map((m) => (
            <Link
              key={m}
              href={`/admin/analitica?meses=${m}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                meses === m ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {m} meses
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Sin actividad este mes"
          value={formatearNumero(sinActividad.length)}
          icon={Activity}
          tone={sinActividad.length > 0 ? "warning" : "default"}
          hint="Negocios activos con 0 citas este mes"
        />
        <KpiCard
          label="Cerca del límite (≥80%)"
          value={formatearNumero(cercaDelLimite.length)}
          icon={Gauge}
          tone={cercaDelLimite.length > 0 ? "warning" : "default"}
        />
        <KpiCard label="% en plan pago" value={`${porcentajePago}%`} icon={PiggyBank} tone="success" />
        <KpiCard label="Pagos aprobados (histórico consultado)" value={formatearNumero(pagosAprobadosTotal)} icon={TrendingUp} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <IngresosPorMesChart data={ingresosPorMes} />
        <NegociosNuevosChart data={negociosNuevosPorMes} />
        <DistribucionPlanChart data={distribucionPorPlan} />

        <div className="ag-report-chart rounded-[1.5rem] border border-border/80 bg-card/90 p-4 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5">
          <h2 className="text-base font-bold tracking-tight">Top 10 por uso del límite</h2>
          <p className="mt-1 text-sm text-muted-foreground">Negocios más cerca de necesitar un upgrade.</p>
          {topPorUso.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No hay negocios con límite de citas configurado.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {topPorUso.map((n) => {
                const porcentaje = Math.round(((n.citas_usadas_mes_actual ?? 0) / (n.limite_citas_mensuales ?? 1)) * 100);
                return (
                  <li key={n.negocio_id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/admin/negocios/${n.negocio_id}`} className="truncate hover:underline">
                      {n.nombre}
                    </Link>
                    <span className={porcentaje >= 100 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                      {porcentaje}%
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Retención</h2>
        {hayHistorialSuficiente ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {formatearNumero(pagosAprobadosTotal)} pagos aprobados en el rango consultado. El cálculo de churn y
            conversión detallado requiere seguimiento histórico por negocio (fecha de baja vs. fecha de alta) que
            todavía no está modelado en una vista dedicada — se registra en `auditoria` a partir de esta versión del
            panel, así que en unos meses habrá historial suficiente para un cálculo confiable.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay historial suficiente ({formatearNumero(pagosAprobadosTotal)} pagos aprobados en el rango
            consultado) para calcular churn, conversión o retención de forma confiable. Esta sección se activa
            automáticamente cuando haya más datos — no se muestran cifras estimadas para evitar inducir a error.
          </p>
        )}
      </section>
    </div>
  );
}
