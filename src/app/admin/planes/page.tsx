import { BadgeCheck, Eye, EyeOff, Layers3, Pencil, Users2 } from "lucide-react";
import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { Badge } from "@/components/ui/badge";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { PlanEditarDialog } from "@/components/admin/planes/plan-editar-dialog";
import { AdminMetricPill, AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function limite(valor: number | null) {
  return valor == null ? "Sin limite" : formatearNumero(valor);
}

export default async function AdminPlanesPage() {
  await requirePlatformOwner();

  const [planes, negocios] = await Promise.all([obtenerPlanes(), obtenerNegociosResumen()]);

  const activosPorClave = new Map<string, number>();
  for (const n of negocios) {
    if (n.suscripcion_estado !== "activa" || !n.plan_clave) continue;
    activosPorClave.set(n.plan_clave, (activosPorClave.get(n.plan_clave) ?? 0) + 1);
  }

  const visibles = planes.filter((plan) => plan.visible_publico).length;
  const destacados = planes.filter((plan) => plan.destacado).length;
  const negociosConPlanActivo = [...activosPorClave.values()].reduce((acc, value) => acc + value, 0);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Producto y monetizacion"
        title="Planes"
        description="Edita precios, limites y visibilidad comercial. Cada cambio conserva historial y no elimina datos de los negocios."
        metrics={
          <>
            <AdminMetricPill label="Planes creados" value={formatearNumero(planes.length)} icon={Layers3} />
            <AdminMetricPill label="Visibles en web" value={formatearNumero(visibles)} icon={Eye} tone="success" />
            <AdminMetricPill label="Destacados" value={formatearNumero(destacados)} icon={BadgeCheck} />
            <AdminMetricPill label="Negocios activos" value={formatearNumero(negociosConPlanActivo)} icon={Users2} />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {planes.map((plan) => {
          const negociosActivos = activosPorClave.get(plan.clave) ?? 0;
          return (
            <article
              key={plan.id}
              className="group relative overflow-hidden rounded-[1.6rem] border border-border/75 bg-card/90 p-4 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_64px_rgb(15_23_42/0.12)] dark:bg-card/80 dark:ring-white/5"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-teal-400 opacity-80" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{plan.clave}</p>
                  <h2 className="mt-1 truncate text-xl font-black tracking-tight">{plan.nombre}</h2>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {plan.destacado ? <Badge>Destacado</Badge> : null}
                  {plan.visible_publico ? (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Publico
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Oculto
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-border/70 bg-background/60 p-3">
                <p className="text-2xl font-black tracking-tight">{formatearGuaranies(plan.precio_mensual_gs)}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  Mensual. Anual: {formatearGuaranies(plan.precio_anual_gs)}
                </p>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Citas/mes", limite(plan.limite_citas_mensuales)],
                  ["Empleados", limite(plan.limite_empleados)],
                  ["Servicios", limite(plan.limite_servicios)],
                  ["Clientes", limite(plan.limite_clientes)],
                  ["Sucursales", limite(plan.limite_sucursales)],
                  ["Activos", formatearNumero(negociosActivos)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-border/65 bg-muted/35 p-3">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 truncate font-bold">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  {negociosActivos === 0
                    ? "Sin negocios activos en este plan."
                    : `${formatearNumero(negociosActivos)} negocio${negociosActivos === 1 ? "" : "s"} activo${negociosActivos === 1 ? "" : "s"}.`}
                </p>
                <PlanEditarDialog plan={plan} negociosActivos={negociosActivos} />
              </div>
            </article>
          );
        })}
      </section>

      <AdminPanel
        title="Antes de cambiar limites"
        description="Si bajas limites por debajo del uso actual, los datos existentes se conservan. El negocio puede quedar sobre el limite y deberias revisarlo desde su detalle."
        action={<Pencil className="h-5 w-5 text-primary" aria-hidden="true" />}
      >
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <p className="rounded-2xl border bg-background/60 p-3">Usa el detalle del negocio para ver consumo real antes de moverlo de plan.</p>
          <p className="rounded-2xl border bg-background/60 p-3">Los cambios de precio no alteran pagos historicos ya aprobados.</p>
          <p className="rounded-2xl border bg-background/60 p-3">La visibilidad controla la web publica, no el acceso de negocios existentes.</p>
        </div>
      </AdminPanel>
    </div>
  );
}
