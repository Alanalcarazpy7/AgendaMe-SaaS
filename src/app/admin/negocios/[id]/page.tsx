import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
} from "@/lib/admin/queries/negocio-detalle";
import { Badge } from "@/components/ui/badge";
import { formatearFechaCorta, formatearFechaHora } from "@/lib/admin/formatters/date";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { NegocioBloqueoBoton } from "@/components/admin/negocios/negocio-bloqueo-boton";
import { NegocioCambiarPlanDialog } from "@/components/admin/negocios/negocio-cambiar-plan-dialog";
import { NegocioPagosPanel } from "@/components/admin/negocios/negocio-pagos-panel";
import { NegocioNotasPanel } from "@/components/admin/negocios/negocio-notas-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

function usoLimite(usado: number | null | undefined, limite: number | null | undefined, etiqueta: string) {
  const u = usado ?? 0;
  const sobreLimite = limite != null && u > limite;

  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className={`mt-1 text-lg font-semibold ${sobreLimite ? "text-destructive" : ""}`}>
        {formatearNumero(u)}
        {limite != null ? ` / ${formatearNumero(limite)}` : ""}
      </p>
    </div>
  );
}

export default async function NegocioDetallePage({ params }: PageProps) {
  await requirePlatformOwner();
  const { id } = await params;

  const negocioBase = await obtenerNegocioBase(id);
  if (!negocioBase) notFound();

  const [resumenLista, planes, historialSuscripciones, pagos, solicitudes, notas, auditoria, sucursalesCount] =
    await Promise.all([
      obtenerNegociosResumen(),
      obtenerPlanes(),
      obtenerHistorialSuscripciones(id),
      obtenerPagosNegocio(id),
      obtenerSolicitudesCambioPlan(id),
      obtenerNotasNegocio(id),
      obtenerAuditoriaNegocio(id),
      contarSucursales(id),
    ]);

  const resumen = resumenLista.find((n) => n.negocio_id === id) ?? null;
  const planActual = planes.find((p) => p.clave === resumen?.plan_clave) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/negocios"
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver a negocios
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{negocioBase.nombre}</h1>
              {negocioBase.estado === "activo" ? (
                <Badge variant="default">Activo</Badge>
              ) : (
                <Badge variant="destructive">Bloqueado</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {negocioBase.slug ? `/${negocioBase.slug}` : "Sin slug"} · Registrado el{" "}
              {formatearFechaCorta(negocioBase.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
            />
            <NegocioBloqueoBoton negocioId={id} bloqueado={negocioBase.estado === "bloqueado"} />
          </div>
        </div>

        {negocioBase.estado === "bloqueado" && negocioBase.motivo_bloqueo && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">Motivo del bloqueo</p>
            <p>{negocioBase.motivo_bloqueo}</p>
            {negocioBase.bloqueado_at && (
              <p className="mt-1 text-xs opacity-80">Desde {formatearFechaHora(negocioBase.bloqueado_at)}</p>
            )}
          </div>
        )}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border p-4 lg:col-span-1">
          <h2 className="text-base font-semibold">Datos del negocio</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Rubro</dt>
              <dd>{negocioBase.rubro ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate">{negocioBase.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Teléfono</dt>
              <dd>{negocioBase.telefono ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Dirección</dt>
              <dd className="truncate text-right">{negocioBase.direccion ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border p-4 lg:col-span-2">
          <h2 className="text-base font-semibold">Plan y suscripción</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Plan actual</p>
              <p className="mt-1 text-lg font-semibold">{resumen?.plan_nombre ?? "Sin plan"}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Suscripción</p>
              <p className="mt-1 text-lg font-semibold">{resumen?.suscripcion_estado ?? "—"}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Vencimiento</p>
              <p className="mt-1 text-lg font-semibold">{formatearFechaCorta(resumen?.fecha_vencimiento)}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Último pago</p>
              <p className="mt-1 text-lg font-semibold">{resumen?.ultimo_pago_estado ?? "—"}</p>
            </div>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-muted-foreground">Consumo de límites</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {usoLimite(resumen?.citas_usadas_mes_actual, resumen?.limite_citas_mensuales, "Citas / mes")}
            {usoLimite(resumen?.empleados_total, planActual?.limite_empleados, "Empleados")}
            {usoLimite(resumen?.servicios_total, planActual?.limite_servicios, "Servicios")}
            {usoLimite(resumen?.clientes_total, planActual?.limite_clientes, "Clientes")}
            {usoLimite(sucursalesCount, planActual?.limite_sucursales, "Sucursales")}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Historial de suscripciones</h2>
        {historialSuscripciones.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin historial de suscripciones.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {historialSuscripciones.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                <span className="font-medium">{s.planes_saas?.nombre ?? "Plan desconocido"}</span>
                <Badge variant={s.estado === "activa" ? "default" : "outline"}>{s.estado}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatearFechaCorta(s.fecha_inicio)} → {formatearFechaCorta(s.fecha_vencimiento)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border p-4">
        <NegocioPagosPanel
          negocioId={id}
          pagos={pagos}
          planes={planes.map((p) => ({ id: p.id, clave: p.clave, nombre: p.nombre }))}
        />
      </section>

      {solicitudes.length > 0 && (
        <section className="rounded-2xl border p-4">
          <h2 className="text-base font-semibold">Solicitudes de cambio de plan</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {solicitudes.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm">
                <Badge variant={s.estado === "pendiente" ? "secondary" : "outline"}>{s.estado}</Badge>
                <span className="text-xs text-muted-foreground">{s.mensaje ?? "Sin mensaje"}</span>
                <span className="text-xs text-muted-foreground">{formatearFechaCorta(s.created_at)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Usá &quot;Cambiar plan&quot; arriba para aplicar una solicitud.
          </p>
        </section>
      )}

      <section className="rounded-2xl border p-4">
        <NegocioNotasPanel negocioId={id} notas={notas} />
      </section>

      <section className="rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Auditoría relacionada</h2>
        {auditoria.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin acciones registradas todavía para este negocio.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5 text-xs">
            {auditoria.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="font-medium">{a.accion}</span>
                <span className="text-muted-foreground">{a.tabla_afectada}</span>
                <span className="text-muted-foreground">{formatearFechaHora(a.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Total pagado histórico: {formatearGuaranies(pagos.filter((p) => p.estado === "aprobado").reduce((acc, p) => acc + p.monto_gs, 0))}
      </p>
    </div>
  );
}
