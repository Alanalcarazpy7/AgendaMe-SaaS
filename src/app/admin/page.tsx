import {
  Ban,
  Building2,
  CalendarCheck2,
  Gauge,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { obtenerPagosAprobadosRecientes, contarPagosPendientes, obtenerTodosPagos } from "@/lib/admin/queries/pagos";
import { obtenerInvitaciones } from "@/lib/admin/queries/invitaciones";
import { obtenerUsuariosPlataforma } from "@/lib/admin/queries/usuarios";
import {
  contarSolicitudesCambioPlanPendientes,
  obtenerSolicitudesCambioPlanPendientesDetalle,
} from "@/lib/admin/queries/solicitudes";
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
import { AdminMetricPill, AdminPageHeader } from "@/components/admin/admin-ui";
import {
  DistribucionPlanChart,
  IngresosPorMesChart,
  NegociosNuevosChart,
  SuscripcionesEstadoChart,
} from "@/components/admin/charts/admin-charts";
import { OperacionesPanel } from "@/components/admin/operaciones-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminHomePage() {
  await requirePlatformOwner();

  const [
    negocios,
    planes,
    pagosAprobados,
    pagosPendientes,
    pagosRecientes,
    invitaciones,
    usuarios,
    solicitudesPendientes,
    solicitudesPendientesDetalle,
  ] =
    await Promise.all([
      obtenerNegociosResumen(),
      obtenerPlanes(),
      obtenerPagosAprobadosRecientes(13),
      contarPagosPendientes(),
      obtenerTodosPagos(80),
      obtenerInvitaciones(500),
      obtenerUsuariosPlataforma(),
      contarSolicitudesCambioPlanPendientes(),
      obtenerSolicitudesCambioPlanPendientesDetalle(12),
    ]);

  const kpis = calcularKpis({ negocios, planes, pagosAprobados, pagosPendientes });
  const ingresosPorMes = calcularIngresosPorMes(pagosAprobados, 6);
  const negociosNuevosPorMes = calcularNegociosNuevosPorMes(negocios, 6);
  const distribucionPorPlan = calcularDistribucionPorPlan(negocios, planes);
  const distribucionSuscripciones = calcularDistribucionSuscripciones(kpis);
  const alertas = calcularAlertas({ negocios, invitaciones, usuarios, pagosPendientes, solicitudesPendientes });
  const pagosPendientesDetalle = pagosRecientes.filter((p) => p.estado === "pendiente").slice(0, 12);
  const renovacionesUrgentes = negocios
    .filter((n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 7)
    .sort((a, b) => (a.dias_para_vencer ?? 99) - (b.dias_para_vencer ?? 99))
    .slice(0, 8);
  const vencidas = negocios
    .filter((n) => n.suscripcion_estado === "vencida" || (typeof n.dias_para_vencer === "number" && n.dias_para_vencer < 0))
    .sort((a, b) => (a.dias_para_vencer ?? 0) - (b.dias_para_vencer ?? 0))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Operacion privada"
        title="Vista general"
        description="Estado comercial y operativo de AgendaMe. Montos en guaranies, con datos vivos del panel."
        metrics={
          <>
            <AdminMetricPill
              label="Negocios activos"
              value={formatearNumero(kpis.negociosActivos)}
              icon={Building2}
              tone="success"
            />
            <AdminMetricPill
              label="Pagos pendientes"
              value={formatearNumero(kpis.pagosPendientes)}
              icon={Wallet}
              tone={kpis.pagosPendientes > 0 ? "warning" : "default"}
            />
            <AdminMetricPill
              label="Cobrado este mes"
              value={formatearGuaranies(kpis.ingresoCobradoMesGs)}
              icon={TrendingUp}
              tone="success"
            />
            <AdminMetricPill
              label="Citas procesadas"
              value={formatearNumero(kpis.citasTotalesProcesadas)}
              icon={Gauge}
            />
          </>
        }
      />

      <OperacionesPanel
        pagosPendientes={pagosPendientesDetalle}
        solicitudesPendientes={solicitudesPendientesDetalle}
        renovacionesUrgentes={renovacionesUrgentes}
        vencidas={vencidas}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores clave">
        <KpiCard label="Negocios totales" value={formatearNumero(kpis.negociosTotales)} icon={Building2} />
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
          label="Vencen en 7 dias"
          value={formatearNumero(kpis.suscripcionesPorVencer7)}
          icon={CalendarCheck2}
          tone={kpis.suscripcionesPorVencer7 > 0 ? "warning" : "default"}
        />
        <KpiCard label="Negocios gratuitos" value={formatearNumero(kpis.negociosGratuitos)} icon={Users} />
        <KpiCard label="Negocios pagos" value={formatearNumero(kpis.negociosPagos)} icon={Users} tone="success" />
        <KpiCard
          label="Citas este mes"
          value={formatearNumero(kpis.citasEsteMes)}
          icon={Gauge}
          hint={`${formatearNumero(kpis.citasTotalesProcesadas)} historicas`}
        />
        <KpiCard
          label="Cobrado este anio"
          value={formatearGuaranies(kpis.ingresoCobradoAnioGs)}
          icon={TrendingUp}
          tone="success"
          hint="Pagos aprobados"
        />
        <KpiCard
          label="MRR estimado"
          value={formatearGuaranies(kpis.mrrEstimadoGs)}
          icon={TrendingUp}
          hint="Asume ciclo mensual"
        />
        <KpiCard
          label="ARR estimado"
          value={formatearGuaranies(kpis.arrEstimadoGs)}
          icon={TrendingUp}
          hint="MRR x 12"
        />
      </section>

      <AlertasPanel alertas={alertas} />

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Graficos">
        <IngresosPorMesChart data={ingresosPorMes} />
        <NegociosNuevosChart data={negociosNuevosPorMes} />
        <DistribucionPlanChart data={distribucionPorPlan} />
        <SuscripcionesEstadoChart data={distribucionSuscripciones} />
      </section>
    </div>
  );
}
