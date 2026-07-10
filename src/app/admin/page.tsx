import { Building2, Ban, Sparkles, CalendarCheck2, Wallet, TrendingUp, Users, Gauge } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { obtenerPagosAprobadosRecientes, contarPagosPendientes } from "@/lib/admin/queries/pagos";
import { obtenerInvitaciones } from "@/lib/admin/queries/invitaciones";
import { obtenerUsuariosPlataforma } from "@/lib/admin/queries/usuarios";
import { contarSolicitudesCambioPlanPendientes } from "@/lib/admin/queries/solicitudes";
import {
  calcularDistribucionPorPlan,
  calcularDistribucionSuscripciones,
  calcularIngresosPorMes,
  calcularKpis,
  calcularNegociosNuevosPorMes,
} from "@/lib/admin/kpis";
import { calcularAlertas } from "@/lib/admin/alertas";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { KpiCard } from "@/components/admin/kpi-card";
import { AlertasPanel } from "@/components/admin/alertas-panel";
import {
  DistribucionPlanChart,
  IngresosPorMesChart,
  NegociosNuevosChart,
  SuscripcionesEstadoChart,
} from "@/components/admin/charts/admin-charts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminHomePage() {
  // Re-verifica aunque el layout ya lo haga: esta página hace consultas
  // privilegiadas propias y no debe asumir el contexto del layout.
  await requirePlatformOwner();

  const [negocios, planes, pagosAprobados, pagosPendientes, invitaciones, usuarios, solicitudesPendientes] =
    await Promise.all([
      obtenerNegociosResumen(),
      obtenerPlanes(),
      obtenerPagosAprobadosRecientes(13),
      contarPagosPendientes(),
      obtenerInvitaciones(500),
      obtenerUsuariosPlataforma(),
      contarSolicitudesCambioPlanPendientes(),
    ]);

  const kpis = calcularKpis({ negocios, planes, pagosAprobados, pagosPendientes });
  const ingresosPorMes = calcularIngresosPorMes(pagosAprobados, 6);
  const negociosNuevosPorMes = calcularNegociosNuevosPorMes(negocios, 6);
  const distribucionPorPlan = calcularDistribucionPorPlan(negocios, planes);
  const distribucionSuscripciones = calcularDistribucionSuscripciones(kpis);
  const alertas = calcularAlertas({ negocios, invitaciones, usuarios, pagosPendientes, solicitudesPendientes });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Vista general</h1>
        <p className="text-sm text-muted-foreground">
          Estado de la plataforma AgendaMe en tiempo real. Montos en guaraníes, huso horario America/Asunción.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-label="Indicadores clave">
        <KpiCard label="Negocios totales" value={formatearNumero(kpis.negociosTotales)} icon={Building2} />
        <KpiCard label="Negocios activos" value={formatearNumero(kpis.negociosActivos)} icon={Building2} tone="success" />
        <KpiCard
          label="Negocios bloqueados"
          value={formatearNumero(kpis.negociosBloqueados)}
          icon={Ban}
          tone={kpis.negociosBloqueados > 0 ? "danger" : "default"}
        />
        <KpiCard label="Nuevos este mes" value={formatearNumero(kpis.negociosNuevosEsteMes)} icon={Sparkles} tone="success" />

        <KpiCard label="Suscripciones activas" value={formatearNumero(kpis.suscripcionesActivas)} icon={CalendarCheck2} tone="success" />
        <KpiCard
          label="Suscripciones vencidas"
          value={formatearNumero(kpis.suscripcionesVencidas)}
          icon={CalendarCheck2}
          tone={kpis.suscripcionesVencidas > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Vencen en 7 días"
          value={formatearNumero(kpis.suscripcionesPorVencer7)}
          icon={CalendarCheck2}
          tone={kpis.suscripcionesPorVencer7 > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Pagos pendientes"
          value={formatearNumero(kpis.pagosPendientes)}
          icon={Wallet}
          tone={kpis.pagosPendientes > 0 ? "warning" : "default"}
        />

        <KpiCard label="Negocios gratuitos" value={formatearNumero(kpis.negociosGratuitos)} icon={Users} />
        <KpiCard label="Negocios pagos" value={formatearNumero(kpis.negociosPagos)} icon={Users} tone="success" />
        <KpiCard
          label="Citas procesadas"
          value={formatearNumero(kpis.citasTotalesProcesadas)}
          icon={Gauge}
          hint={`${formatearNumero(kpis.citasEsteMes)} este mes`}
        />
        <KpiCard
          label="Cobrado este mes"
          value={formatearGuaranies(kpis.ingresoCobradoMesGs)}
          icon={TrendingUp}
          tone="success"
          hint="Pagos aprobados (real)"
        />

        <KpiCard
          label="Cobrado este año"
          value={formatearGuaranies(kpis.ingresoCobradoAnioGs)}
          icon={TrendingUp}
          tone="success"
          hint="Pagos aprobados (real)"
        />
        <KpiCard
          label="MRR estimado"
          value={formatearGuaranies(kpis.mrrEstimadoGs)}
          icon={TrendingUp}
          hint="Estimación: asume ciclo mensual"
        />
        <KpiCard
          label="ARR estimado"
          value={formatearGuaranies(kpis.arrEstimadoGs)}
          icon={TrendingUp}
          hint="MRR × 12 (estimación)"
        />
      </section>

      <AlertasPanel alertas={alertas} />

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Gráficos">
        <IngresosPorMesChart data={ingresosPorMes} />
        <NegociosNuevosChart data={negociosNuevosPorMes} />
        <DistribucionPlanChart data={distribucionPorPlan} />
        <SuscripcionesEstadoChart data={distribucionSuscripciones} />
      </section>
    </div>
  );
}
