import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  CalendarClock,
  CreditCard,
  FileClock,
  Gauge,
  Lightbulb,
  MapPin,
  NotebookText,
  ReceiptText,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import {
  obtenerNegocioBase,
  obtenerHistorialSuscripciones,
  obtenerPagosNegocio,
  obtenerSolicitudesCambioPlan,
  obtenerNotasNegocio,
  obtenerAuditoriaNegocio,
  contarSucursales,
  contarSucursalesInactivas,
} from "@/lib/admin/queries/negocio-detalle";
import { Badge } from "@/components/ui/badge";
import { formatearFechaCorta, formatearFechaHora } from "@/lib/admin/formatters/date";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { NegocioBloqueoBoton } from "@/components/admin/negocios/negocio-bloqueo-boton";
import { NegocioCambiarPlanDialog } from "@/components/admin/negocios/negocio-cambiar-plan-dialog";
import { NegocioPagosPanel } from "@/components/admin/negocios/negocio-pagos-panel";
import { NegocioNotasPanel } from "@/components/admin/negocios/negocio-notas-panel";
import {
  AprobarSolicitudPlanDialog,
  RechazarSolicitudPlanDialog,
} from "@/components/admin/negocios/solicitud-plan-acciones";
import { AdminMetricPill, AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

function estadoBadge(estado: string | null | undefined) {
  if (estado === "activa" || estado === "activo" || estado === "aprobado") return <Badge>{estado}</Badge>;
  if (estado === "bloqueado" || estado === "vencida" || estado === "rechazado") {
    return <Badge variant="destructive">{estado}</Badge>;
  }
  if (estado === "pendiente") return <Badge variant="secondary">{estado}</Badge>;
  return <Badge variant="outline">{estado ?? "Sin dato"}</Badge>;
}

function usoLimite(usado: number | null | undefined, limite: number | null | undefined, etiqueta: string) {
  const u = usado ?? 0;
  const tieneLimite = limite != null;
  const porcentaje = tieneLimite && limite > 0 ? Math.min(100, Math.round((u / limite) * 100)) : 0;
  const sobreLimite = tieneLimite && u > limite;

  return (
    <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{etiqueta}</p>
        {sobreLimite ? <Badge variant="destructive">Sobre limite</Badge> : null}
      </div>
      <p className={`mt-2 text-xl font-black tabular-nums ${sobreLimite ? "text-destructive" : ""}`}>
        {formatearNumero(u)}
        {tieneLimite ? ` / ${formatearNumero(limite)}` : " / sin limite"}
      </p>
      {tieneLimite ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <span
            className={`block h-full rounded-full ${sobreLimite ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default async function NegocioDetallePage({ params }: PageProps) {
  await requirePlatformOwner();
  const { id } = await params;

  const negocioBase = await obtenerNegocioBase(id);
  if (!negocioBase) notFound();

  const [
    resumenLista,
    planes,
    historialSuscripciones,
    pagos,
    solicitudes,
    notas,
    auditoria,
    sucursalesCount,
    sucursalesInactivasCount,
  ] =
    await Promise.all([
      obtenerNegociosResumen(),
      obtenerPlanes(),
      obtenerHistorialSuscripciones(id),
      obtenerPagosNegocio(id),
      obtenerSolicitudesCambioPlan(id),
      obtenerNotasNegocio(id),
      obtenerAuditoriaNegocio(id),
      contarSucursales(id),
      contarSucursalesInactivas(id),
    ]);

  const resumen = resumenLista.find((n) => n.negocio_id === id) ?? null;
  const planActual = planes.find((p) => p.clave === resumen?.plan_clave) ?? null;
  const totalPagado = pagos.filter((p) => p.estado === "aprobado").reduce((acc, p) => acc + p.monto_gs, 0);
  const pagosPendientes = pagos.filter((p) => p.estado === "pendiente").length;
  const solicitudesPendientes = solicitudes.filter((s) => s.estado === "pendiente").length;
  const consumos = [
    [resumen?.citas_usadas_mes_actual, resumen?.limite_citas_mensuales],
    [resumen?.empleados_total, planActual?.limite_empleados],
    [resumen?.servicios_total, planActual?.limite_servicios],
    [resumen?.clientes_total, planActual?.limite_clientes],
    [sucursalesCount, planActual?.limite_sucursales],
  ] as const;
  const mayorUso = consumos.reduce((max, [usado, limite]) => {
    if (typeof usado !== "number" || typeof limite !== "number" || limite <= 0) return max;
    return Math.max(max, Math.round((usado / limite) * 100));
  }, 0);
  const accionesRecomendadas = [
    pagosPendientes > 0
      ? {
          title: "Revisar pagos pendientes",
          detail: `${pagosPendientes} pago${pagosPendientes === 1 ? "" : "s"} esperando aprobacion o rechazo.`,
          tone: "warning",
          icon: ReceiptText,
        }
      : null,
    solicitudesPendientes > 0
      ? {
          title: "Responder solicitud de plan",
          detail: `${solicitudesPendientes} solicitud${solicitudesPendientes === 1 ? "" : "es"} pendiente${solicitudesPendientes === 1 ? "" : "s"}.`,
          tone: "warning",
          icon: Lightbulb,
        }
      : null,
    typeof resumen?.dias_para_vencer === "number" && resumen.dias_para_vencer < 0
      ? {
          title: "Suscripcion vencida",
          detail: `Vencio hace ${Math.abs(resumen.dias_para_vencer)} dia${Math.abs(resumen.dias_para_vencer) === 1 ? "" : "s"}.`,
          tone: "danger",
          icon: ShieldAlert,
        }
      : null,
    typeof resumen?.dias_para_vencer === "number" && resumen.dias_para_vencer >= 0 && resumen.dias_para_vencer <= 7
      ? {
          title: "Renovacion cercana",
          detail: `Quedan ${resumen.dias_para_vencer} dia${resumen.dias_para_vencer === 1 ? "" : "s"} para el vencimiento.`,
          tone: "warning",
          icon: CalendarClock,
        }
      : null,
    mayorUso >= 80
      ? {
          title: "Consumo alto del plan",
          detail: `El recurso mas usado esta al ${mayorUso}%. Puede ser oportunidad de upgrade.`,
          tone: "success",
          icon: TrendingUp,
        }
      : null,
    !resumen?.fecha_vencimiento
      ? {
          title: "Definir vencimiento",
          detail: "El negocio no tiene fecha de vencimiento visible en el ciclo actual.",
          tone: "default",
          icon: CalendarClock,
        }
      : null,
  ].filter(Boolean) as {
    title: string;
    detail: string;
    tone: "default" | "success" | "warning" | "danger";
    icon: typeof Lightbulb;
  }[];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/negocios"
        className="inline-flex w-fit items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-3 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Volver a negocios
      </Link>

      <AdminPageHeader
        eyebrow={negocioBase.slug ? `/${negocioBase.slug}` : "Sin slug"}
        title={negocioBase.nombre}
        description={`Registrado el ${formatearFechaCorta(negocioBase.created_at)}. ${negocioBase.email ?? "Sin email cargado"}`}
        actions={
          <>
            <NegocioCambiarPlanDialog
              negocioId={id}
              planActualClave={resumen?.plan_clave ?? null}
              planes={planes.map((p) => ({
                clave: p.clave,
                nombre: p.nombre,
                limite_citas_mensuales: p.limite_citas_mensuales,
                limite_empleados: p.limite_empleados,
                limite_servicios: p.limite_servicios,
                limite_clientes: p.limite_clientes,
                limite_sucursales: p.limite_sucursales,
              }))}
              uso={{
                citas: resumen?.citas_usadas_mes_actual ?? null,
                empleados: resumen?.empleados_total ?? null,
                servicios: resumen?.servicios_total ?? null,
                clientes: resumen?.clientes_total ?? null,
                sucursales: sucursalesCount,
              }}
              sucursalesInactivas={sucursalesInactivasCount}
            />
            <NegocioBloqueoBoton negocioId={id} bloqueado={negocioBase.estado === "bloqueado"} />
          </>
        }
        metrics={
          <>
            <AdminMetricPill label="Estado" value={negocioBase.estado} icon={negocioBase.estado === "bloqueado" ? Ban : BriefcaseBusiness} tone={negocioBase.estado === "bloqueado" ? "danger" : "success"} />
            <AdminMetricPill label="Plan actual" value={resumen?.plan_nombre ?? "Sin plan"} icon={Gauge} />
            <AdminMetricPill label="Total pagado" value={formatearGuaranies(totalPagado)} icon={CreditCard} tone="success" />
            <AdminMetricPill label="Pagos pendientes" value={formatearNumero(pagosPendientes)} icon={FileClock} tone={pagosPendientes > 0 ? "warning" : "default"} />
          </>
        }
      />

      {negocioBase.estado === "bloqueado" && negocioBase.motivo_bloqueo ? (
        <div className="rounded-[1.4rem] border border-destructive/35 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-black">Motivo del bloqueo</p>
              <p className="mt-1">{negocioBase.motivo_bloqueo}</p>
              {negocioBase.bloqueado_at ? (
                <p className="mt-1 text-xs opacity-80">Desde {formatearFechaHora(negocioBase.bloqueado_at)}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <AdminPanel
        title="Centro de decision"
        description="Lo que conviene revisar primero para no perder tiempo buscando entre pagos, planes e historial."
      >
        {accionesRecomendadas.length === 0 ? (
          <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-200">
            No hay acciones urgentes para este negocio. Pagos, vencimiento y consumo se ven estables.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {accionesRecomendadas.map((accion) => {
              const Icon = accion.icon;
              const toneClass =
                accion.tone === "danger"
                  ? "border-destructive/25 bg-destructive/10 text-destructive"
                  : accion.tone === "warning"
                    ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : accion.tone === "success"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-primary/20 bg-primary/10 text-primary";
              return (
                <div key={accion.title} className={`rounded-[1.25rem] border p-4 ${toneClass}`}>
                  <Icon className="mb-3 h-5 w-5" aria-hidden="true" />
                  <p className="font-black">{accion.title}</p>
                  <p className="mt-1 text-sm leading-6 opacity-85">{accion.detail}</p>
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>

      <section className="grid gap-4 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)]">
        <AdminPanel title="Datos del negocio" description="Informacion base para soporte y gestion comercial.">
          <dl className="grid gap-2 text-sm">
            {[
              ["Rubro", negocioBase.rubro ?? "-"],
              ["Email", negocioBase.email ?? "-"],
              ["Telefono", negocioBase.telefono ?? "-"],
              ["Direccion", negocioBase.direccion ?? "-"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 p-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0 truncate text-right font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </AdminPanel>

        <AdminPanel
          title="Plan, suscripcion y consumo"
          description="Vista rapida para decidir cambio de plan, renovacion o bloqueo."
          action={estadoBadge(resumen?.suscripcion_estado)}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Plan actual</p>
              <p className="mt-2 truncate text-xl font-black">{resumen?.plan_nombre ?? "Sin plan"}</p>
            </div>
            <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Vencimiento</p>
              <p className="mt-2 text-xl font-black">{formatearFechaCorta(resumen?.fecha_vencimiento)}</p>
            </div>
            <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Ultimo pago</p>
              <p className="mt-2 text-xl font-black">{resumen?.ultimo_pago_estado ?? "-"}</p>
            </div>
            <div className="rounded-[1.15rem] border border-border/70 bg-background/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Sucursales activas</p>
              <p className="mt-2 text-xl font-black">{formatearNumero(sucursalesCount)}</p>
              {sucursalesInactivasCount > 0 ? (
                <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {formatearNumero(sucursalesInactivasCount)} inactiva{sucursalesInactivasCount === 1 ? "" : "s"} conservada{sucursalesInactivasCount === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {usoLimite(resumen?.citas_usadas_mes_actual, resumen?.limite_citas_mensuales, "Citas / mes")}
            {usoLimite(resumen?.empleados_total, planActual?.limite_empleados, "Empleados")}
            {usoLimite(resumen?.servicios_total, planActual?.limite_servicios, "Servicios")}
            {usoLimite(resumen?.clientes_total, planActual?.limite_clientes, "Clientes")}
            {usoLimite(sucursalesCount, planActual?.limite_sucursales, "Sucursales activas")}
          </div>
        </AdminPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <AdminPanel title="Historial de suscripciones" description="Cambios de plan y ciclos registrados.">
          {historialSuscripciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin historial de suscripciones.</p>
          ) : (
            <ul className="grid gap-2">
              {historialSuscripciones.map((s) => (
                <li key={s.id} className="grid gap-2 rounded-2xl border border-border/70 bg-background/60 p-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <span className="font-bold">{s.planes_saas?.nombre ?? "Plan desconocido"}</span>
                  {estadoBadge(s.estado)}
                  <span className="text-xs text-muted-foreground">
                    {formatearFechaCorta(s.fecha_inicio)} - {formatearFechaCorta(s.fecha_vencimiento)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="Solicitudes de plan" description="Pedidos del negocio que pueden requerir accion manual.">
          {solicitudes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes pendientes o historicas.</p>
          ) : (
            <ul className="grid gap-2">
              {solicitudes.map((s) => (
                (() => {
                  const planActualSolicitud = planes.find((p) => p.id === s.plan_actual_id)?.nombre ?? "sin plan registrado";
                  const planSolicitado = planes.find((p) => p.id === s.plan_solicitado_id)?.nombre ?? "plan solicitado no identificado";
                  return (
                    <li key={s.id} className="rounded-2xl border border-border/70 bg-background/60 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        {estadoBadge(s.estado)}
                        <span className="text-xs text-muted-foreground">{formatearFechaCorta(s.created_at)}</span>
                      </div>
                      <p className="mt-3 font-black">
                        {planActualSolicitud} <span className="text-muted-foreground">a</span> {planSolicitado}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Origen: solicitud enviada desde el dashboard del negocio.
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">{s.mensaje ?? "Sin mensaje del negocio."}</p>
                      {s.estado === "pendiente" ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <AprobarSolicitudPlanDialog solicitudId={s.id} negocioId={id} negocioNombre={negocioBase.nombre} />
                          <RechazarSolicitudPlanDialog solicitudId={s.id} negocioId={id} negocioNombre={negocioBase.nombre} />
                        </div>
                      ) : null}
                    </li>
                  );
                })()
              ))}
            </ul>
          )}
        </AdminPanel>
      </section>

      <AdminPanel title="Pagos del negocio" description="Registro manual, aprobacion y rechazo de pagos asociados.">
        <NegocioPagosPanel
          negocioId={id}
          pagos={pagos}
          planes={planes.map((p) => ({
            id: p.id,
            clave: p.clave,
            nombre: p.nombre,
            precio_mensual_gs: p.precio_mensual_gs,
            precio_anual_gs: p.precio_anual_gs,
          }))}
          fechaVencimientoActual={resumen?.fecha_vencimiento}
        />
      </AdminPanel>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <AdminPanel title="Notas internas" description="Contexto operativo visible solo dentro del panel.">
          <NegocioNotasPanel negocioId={id} notas={notas} />
        </AdminPanel>

        <AdminPanel
          title="Auditoria relacionada"
          description="Ultimas acciones registradas para este negocio."
          action={<NotebookText className="h-5 w-5 text-primary" aria-hidden="true" />}
        >
          {auditoria.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin acciones registradas todavia para este negocio.</p>
          ) : (
            <ul className="grid max-h-[420px] gap-2 overflow-y-auto pr-1 text-xs">
              {auditoria.map((a) => (
                <li key={a.id} className="grid gap-1 rounded-2xl border border-border/70 bg-background/60 p-3 sm:grid-cols-[1fr_auto]">
                  <span className="font-bold">{a.accion}</span>
                  <span className="text-muted-foreground">{formatearFechaHora(a.created_at)}</span>
                  <span className="text-muted-foreground sm:col-span-2">{a.tabla_afectada}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>
      </section>

      <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
        <p className="rounded-2xl border bg-card/70 p-3">
          <CalendarClock className="mb-2 h-4 w-4 text-primary" aria-hidden="true" />
          Fechas y vencimientos dependen del ciclo de suscripcion actual.
        </p>
        <p className="rounded-2xl border bg-card/70 p-3">
          <CreditCard className="mb-2 h-4 w-4 text-primary" aria-hidden="true" />
          Total pagado historico: {formatearGuaranies(totalPagado)}.
        </p>
        <p className="rounded-2xl border bg-card/70 p-3">
          <MapPin className="mb-2 h-4 w-4 text-primary" aria-hidden="true" />
          Sucursales activas: {formatearNumero(sucursalesCount)}.
          {sucursalesInactivasCount > 0
            ? ` Inactivas conservadas: ${formatearNumero(sucursalesInactivasCount)}.`
            : ""}
        </p>
      </div>
    </div>
  );
}
