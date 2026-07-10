import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, MessageCircle, RefreshCcw } from "lucide-react";
import type { PagoConNegocioRow } from "@/lib/admin/queries/pagos";
import type { NegocioResumenRow } from "@/lib/admin/types/negocio";
import type { SolicitudCambioPlanPendienteRow } from "@/lib/admin/queries/solicitudes";
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearGuaranies } from "@/lib/admin/formatters/currency";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";
import { AprobarPagoDialog, RechazarPagoDialog } from "@/components/admin/pagos/pago-acciones";
import { PagoComprobanteDialog } from "@/components/admin/pagos/pago-comprobante-dialog";
import {
  AprobarSolicitudPlanDialog,
  RechazarSolicitudPlanDialog,
} from "@/components/admin/negocios/solicitud-plan-acciones";

type Props = {
  pagosPendientes: PagoConNegocioRow[];
  solicitudesPendientes: SolicitudCambioPlanPendienteRow[];
  renovacionesUrgentes: NegocioResumenRow[];
  vencidas: NegocioResumenRow[];
};

function whatsappHref(numero: string | null | undefined, mensaje: string) {
  if (!numero) return null;
  return buildWhatsappUrl(mensaje, numero);
}

export function OperacionesPanel({ pagosPendientes, solicitudesPendientes, renovacionesUrgentes, vencidas }: Props) {
  const totalPendiente = pagosPendientes.length + solicitudesPendientes.length + renovacionesUrgentes.length + vencidas.length;

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
      <div className="overflow-hidden rounded-[1.65rem] bg-card shadow-[0_18px_60px_rgb(15_23_42/0.08)] ring-1 ring-border/75 dark:bg-slate-950/70 dark:shadow-black/20">
        <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Centro de operaciones</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Bandeja de acciones</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lo urgente primero: pagos, cambios de plan y renovaciones sin abrir negocio por negocio.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-right">
            <p className="text-2xl font-black tabular-nums">{totalPendiente}</p>
            <p className="text-xs font-semibold text-muted-foreground">acciones</p>
          </div>
        </div>

        {totalPendiente === 0 ? (
          <div className="grid min-h-[240px] place-items-center p-8 text-center">
            <div>
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="mt-3 text-lg font-black">Todo al dia</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                No hay pagos, solicitudes ni renovaciones urgentes esperando accion.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid divide-y divide-border/70">
            {pagosPendientes.slice(0, 6).map((pago) => (
              <article key={pago.id} className="grid gap-3 p-4 transition hover:bg-muted/30 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-xl bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-700 dark:text-amber-300">
                      Pago pendiente
                    </span>
                    <span className="text-xs text-muted-foreground">{formatearFechaCorta(pago.created_at)}</span>
                  </div>
                  <p className="mt-2 truncate text-base font-black">{pago.negocios?.nombre ?? "Negocio sin nombre"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatearGuaranies(pago.monto_gs)} / {pago.planes_saas?.nombre ?? "Sin plan"} / {pago.metodo ?? "sin metodo"}
                  </p>
                </div>
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  <PagoComprobanteDialog pagoId={pago.id} comprobanteUrl={pago.comprobante_url} />
                  <AprobarPagoDialog pago={{ id: pago.id, negocioId: pago.negocio_id, negocioNombre: pago.negocios?.nombre }} />
                  <RechazarPagoDialog pago={{ id: pago.id, negocioId: pago.negocio_id, negocioNombre: pago.negocios?.nombre }} />
                  <Link
                    href={`/admin/negocios/${pago.negocio_id}`}
                    className="inline-flex h-8 items-center rounded-xl border px-3 text-xs font-bold hover:bg-muted"
                  >
                    Ver
                  </Link>
                </div>
              </article>
            ))}

            {solicitudesPendientes.slice(0, 6).map((solicitud) => {
              const numero = solicitud.telefono_contacto ?? solicitud.negocios?.telefono;
              const whatsapp = whatsappHref(
                numero,
                `Hola ${solicitud.negocios?.nombre ?? ""}, soy de AgendaMe. Vimos tu solicitud para cambiar al plan ${solicitud.plan_solicitado?.nombre ?? "solicitado"}. Te escribo para coordinar la activacion.`
              );
              return (
                <article key={solicitud.id} className="grid gap-3 p-4 transition hover:bg-muted/30 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                        Solicitud del negocio
                      </span>
                      <span className="text-xs text-muted-foreground">{formatearFechaCorta(solicitud.created_at)}</span>
                    </div>
                    <p className="mt-2 truncate text-base font-black">{solicitud.negocios?.nombre ?? "Negocio sin nombre"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quiere pasar de {solicitud.plan_actual?.nombre ?? "sin plan registrado"} a{" "}
                      <strong className="font-black text-foreground">
                        {solicitud.plan_solicitado?.nombre ?? "plan solicitado no identificado"}
                      </strong>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Origen: dashboard del negocio, no cambio directo del superadmin.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    {whatsapp ? (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                      >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : null}
                    <AprobarSolicitudPlanDialog
                      solicitudId={solicitud.id}
                      negocioId={solicitud.negocio_id}
                      negocioNombre={solicitud.negocios?.nombre ?? undefined}
                    />
                    <RechazarSolicitudPlanDialog
                      solicitudId={solicitud.id}
                      negocioId={solicitud.negocio_id}
                      negocioNombre={solicitud.negocios?.nombre ?? undefined}
                    />
                    <Link
                      href={`/admin/negocios/${solicitud.negocio_id}`}
                      className="inline-flex h-9 items-center rounded-xl border px-3 text-xs font-bold hover:bg-muted"
                    >
                      Ver
                    </Link>
                  </div>
                </article>
              );
            })}

            {[...vencidas.slice(0, 4), ...renovacionesUrgentes.slice(0, 4)].map((negocio) => {
              const vencida = typeof negocio.dias_para_vencer === "number" && negocio.dias_para_vencer < 0;
              const whatsapp = whatsappHref(
                negocio.telefono,
                `Hola ${negocio.nombre}, soy de AgendaMe. Tu plan ${negocio.plan_nombre ?? ""} ${vencida ? "figura vencido" : "esta por vencer"}. Te escribo para ayudarte con la renovacion.`
              );
              return (
                <article key={`${negocio.negocio_id}-${vencida ? "vencida" : "renovar"}`} className="grid gap-3 p-4 transition hover:bg-muted/30 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-xl px-2.5 py-1 text-xs font-black ${vencida ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                        {vencida ? "Vencida" : "Renovacion cercana"}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatearFechaCorta(negocio.fecha_vencimiento)}</span>
                    </div>
                    <p className="mt-2 truncate text-base font-black">{negocio.nombre}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {vencida
                        ? `Vencio hace ${Math.abs(negocio.dias_para_vencer ?? 0)} dias`
                        : `Quedan ${negocio.dias_para_vencer ?? "-"} dias`}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                    {whatsapp ? (
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
                      >
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : null}
                    <Link
                      href={`/admin/negocios/${negocio.negocio_id}`}
                      className="inline-flex h-9 items-center rounded-xl border px-3 text-xs font-bold hover:bg-muted"
                    >
                      Gestionar
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <aside className="grid gap-4">
        <div className="rounded-[1.65rem] bg-card p-4 shadow-[0_18px_60px_rgb(15_23_42/0.08)] ring-1 ring-border/75 dark:bg-slate-950/70 dark:shadow-black/20">
          <p className="text-sm font-black">Resumen operativo</p>
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="h-4 w-4 text-amber-500" />
                Pagos
              </span>
              <strong>{pagosPendientes.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCcw className="h-4 w-4 text-primary" />
                Planes
              </span>
              <strong>{solicitudesPendientes.length}</strong>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-background/70 p-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Vencidas
              </span>
              <strong>{vencidas.length}</strong>
            </div>
          </div>
        </div>

        <Link
          href="/admin/pagos?estado=pendiente"
          className="group rounded-[1.65rem] bg-primary p-5 text-primary-foreground shadow-[0_18px_60px_rgb(37_99_235/0.22)] transition hover:-translate-y-0.5"
        >
          <p className="text-sm font-black">Abrir cola de pagos</p>
          <p className="mt-2 text-sm opacity-80">Filtra pagos pendientes, sube comprobantes y aprueba cobros.</p>
          <span className="mt-5 inline-flex items-center text-xs font-black">
            Ir a pagos
            <ArrowUpRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>
      </aside>
    </section>
  );
}
