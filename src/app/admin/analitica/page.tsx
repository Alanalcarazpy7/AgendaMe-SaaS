import Link from "next/link";
import { Activity, AlertTriangle, Gauge, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { obtenerPagosAprobadosRecientes } from "@/lib/admin/queries/pagos";
import {
  calcularDistribucionPorPlan,
  calcularIngresosPorMes,
  calcularNegociosNuevosPorMes,
} from "@/lib/admin/kpis";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import { AdminMetricPill, AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";
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
  const planPorClave = new Map(planes.map((p) => [p.clave, p]));
  const mrrEstimado = negocios.reduce((acc, n) => {
    if (n.suscripcion_estado !== "activa" || !n.plan_clave || n.plan_clave === "gratis") return acc;
    return acc + (planPorClave.get(n.plan_clave)?.precio_mensual_gs ?? n.precio_gs ?? 0);
  }, 0);
  const arrEstimado = mrrEstimado * 12;
  const arpu = pagos > 0 ? Math.round(mrrEstimado / pagos) : 0;
  const vencidas = negocios.filter(
    (n) => n.suscripcion_estado === "vencida" || (typeof n.dias_para_vencer === "number" && n.dias_para_vencer < 0)
  ).length;
  const churnRiesgo = pagos > 0 ? Math.round((vencidas / pagos) * 100) : 0;

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
      <AdminPageHeader
        eyebrow="Decisiones de plataforma"
        title="Analitica"
        description="Crecimiento, ingresos, adopcion de planes y senales de upgrade. Los graficos usan datos reales consultados del panel."
        actions={
          <nav className="flex flex-wrap gap-2" aria-label="Rango de meses">
            {[6, 12, 24].map((m) => (
              <Link
                key={m}
                href={`/admin/analitica?meses=${m}`}
                className={`inline-flex h-9 items-center rounded-2xl border px-3 text-xs font-bold transition ${
                  meses === m
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border/80 bg-background/70 hover:bg-muted"
                }`}
              >
                {m} meses
              </Link>
            ))}
          </nav>
        }
        metrics={
          <>
            <AdminMetricPill
              label="Sin actividad"
              value={formatearNumero(sinActividad.length)}
              icon={Activity}
              tone={sinActividad.length > 0 ? "warning" : "default"}
            />
            <AdminMetricPill
              label="Cerca del limite"
              value={formatearNumero(cercaDelLimite.length)}
              icon={Gauge}
              tone={cercaDelLimite.length > 0 ? "warning" : "default"}
            />
            <AdminMetricPill label="En plan pago" value={`${porcentajePago}%`} icon={PiggyBank} tone="success" />
            <AdminMetricPill label="Pagos consultados" value={formatearNumero(pagosAprobadosTotal)} icon={TrendingUp} />
          </>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="MRR estimado"
          value={formatearGuaranies(mrrEstimado)}
          icon={Wallet}
          tone="success"
          help="Ingreso mensual recurrente estimado: suma de los precios mensuales de negocios con suscripcion activa y plan pago. Sirve para ver cuanto deberia facturar el SaaS cada mes."
        />
        <KpiCard
          label="ARR estimado"
          value={formatearGuaranies(arrEstimado)}
          icon={TrendingUp}
          tone="success"
          help="Ingreso anual recurrente estimado: MRR multiplicado por 12. Es una vista rapida del tamano anual del negocio si se mantiene la base actual."
        />
        <KpiCard
          label="ARPU estimado"
          value={formatearGuaranies(arpu)}
          icon={PiggyBank}
          help="Ingreso promedio por negocio pago: MRR dividido por cantidad de negocios en plan pago. Ayuda a entender si crecen los planes altos o solo volumen."
        />
        <KpiCard
          label="Riesgo churn"
          value={`${churnRiesgo}%`}
          icon={AlertTriangle}
          tone={churnRiesgo > 0 ? "danger" : "default"}
          hint="Vencidas sobre negocios pagos"
          help="Porcentaje de negocios pagos vencidos frente al total de negocios pagos. No es churn definitivo, pero marca riesgo de perdida si no se recuperan."
        />
        <KpiCard
          label="Negocios sin actividad"
          value={formatearNumero(sinActividad.length)}
          icon={Activity}
          tone={sinActividad.length > 0 ? "warning" : "default"}
          hint="Activos con 0 citas este mes"
          help="Negocios activos que no registraron citas durante el mes actual. Sirve para detectar cuentas que necesitan ayuda, onboarding o seguimiento."
        />
        <KpiCard
          label="Upgrade probable"
          value={formatearNumero(cercaDelLimite.length)}
          icon={Gauge}
          tone={cercaDelLimite.length > 0 ? "warning" : "default"}
          hint="Uso de citas igual o mayor a 80%"
          help="Negocios que ya consumieron al menos el 80% de su limite mensual de citas. Son candidatos naturales para conversar sobre un plan superior."
        />
        <KpiCard
          label="Conversion a pago"
          value={`${porcentajePago}%`}
          icon={PiggyBank}
          tone="success"
          help="Porcentaje de negocios que no estan en plan gratis. Sirve para medir que tan bien convierte el producto de prueba/gratis a planes pagos."
        />
        <KpiCard
          label="Pagos aprobados"
          value={formatearNumero(pagosAprobadosTotal)}
          icon={TrendingUp}
          help="Cantidad de pagos aprobados dentro del rango seleccionado. Es la base usada para graficos de ingresos reales recientes."
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <IngresosPorMesChart data={ingresosPorMes} />
        <NegociosNuevosChart data={negociosNuevosPorMes} />
        <DistribucionPlanChart data={distribucionPorPlan} />

        <AdminPanel
          title="Top 10 por uso del limite"
          description="Negocios que estan mas cerca de necesitar upgrade o revision comercial."
          className="min-h-[320px]"
        >
          {topPorUso.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay negocios con limite de citas configurado.</p>
          ) : (
            <ul className="grid gap-2">
              {topPorUso.map((n) => {
                const porcentaje = Math.round(((n.citas_usadas_mes_actual ?? 0) / (n.limite_citas_mensuales ?? 1)) * 100);
                return (
                  <li
                    key={n.negocio_id}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3 text-sm"
                  >
                    <Link href={`/admin/negocios/${n.negocio_id}`} className="min-w-0 truncate font-bold hover:text-primary">
                      {n.nombre}
                    </Link>
                    <span className={porcentaje >= 100 ? "font-black text-destructive" : "font-black text-primary"}>
                      {porcentaje}%
                    </span>
                    <div className="col-span-2 h-2 overflow-hidden rounded-full bg-muted">
                      <span
                        className={`block h-full rounded-full ${porcentaje >= 100 ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminPanel>
      </section>

      <AdminPanel
        title="Retencion y calidad del dato"
        description="Lectura operacional para no tomar decisiones con datos incompletos."
      >
        {hayHistorialSuficiente ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Hay {formatearNumero(pagosAprobadosTotal)} pagos aprobados en el rango. Para churn y retencion exacta conviene
            cruzar fecha de alta, baja y cambios de plan desde auditoria durante varios ciclos.
          </p>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Todavia no hay historial suficiente ({formatearNumero(pagosAprobadosTotal)} pagos aprobados en el rango) para
            calcular churn, conversion o retencion de forma confiable. El panel evita mostrar estimaciones debiles.
          </p>
        )}
      </AdminPanel>
    </div>
  );
}
