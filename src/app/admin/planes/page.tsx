import { requirePlatformOwner } from "@/lib/admin/guard";
import { obtenerPlanes } from "@/lib/admin/queries/planes";
import { obtenerNegociosResumen } from "@/lib/admin/queries/negocios-resumen";
import { Badge } from "@/components/ui/badge";
import { formatearGuaranies, formatearNumero } from "@/lib/admin/formatters/currency";
import { PlanEditarDialog } from "@/components/admin/planes/plan-editar-dialog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPlanesPage() {
  await requirePlatformOwner();

  const [planes, negocios] = await Promise.all([obtenerPlanes(), obtenerNegociosResumen()]);

  const activosPorClave = new Map<string, number>();
  for (const n of negocios) {
    if (n.suscripcion_estado !== "activa" || !n.plan_clave) continue;
    activosPorClave.set(n.plan_clave, (activosPorClave.get(n.plan_clave) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Planes</h1>
        <p className="text-sm text-muted-foreground">
          Precios y límites comerciales. Los cambios se reflejan también en la web pública (/planes).
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {planes.map((plan) => {
          const negociosActivos = activosPorClave.get(plan.clave) ?? 0;
          return (
            <div key={plan.id} className="flex flex-col gap-3 rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{plan.nombre}</h2>
                  <p className="text-xs text-muted-foreground">{plan.clave}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {plan.destacado && <Badge variant="default">Destacado</Badge>}
                  {plan.visible_publico ? (
                    <Badge variant="outline">Público</Badge>
                  ) : (
                    <Badge variant="secondary">Oculto</Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-2xl font-bold">{formatearGuaranies(plan.precio_mensual_gs)}</p>
                <p className="text-xs text-muted-foreground">por mes · {formatearGuaranies(plan.precio_anual_gs)}/año</p>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-muted-foreground">Citas/mes</dt>
                <dd className="text-right">{plan.limite_citas_mensuales ?? "Sin límite"}</dd>
                <dt className="text-muted-foreground">Empleados</dt>
                <dd className="text-right">{plan.limite_empleados ?? "Sin límite"}</dd>
                <dt className="text-muted-foreground">Servicios</dt>
                <dd className="text-right">{plan.limite_servicios ?? "Sin límite"}</dd>
                <dt className="text-muted-foreground">Clientes</dt>
                <dd className="text-right">{plan.limite_clientes ?? "Sin límite"}</dd>
                <dt className="text-muted-foreground">Sucursales</dt>
                <dd className="text-right">{plan.limite_sucursales ?? "Sin límite"}</dd>
              </dl>

              <p className="text-xs text-muted-foreground">
                {formatearNumero(negociosActivos)} negocio{negociosActivos === 1 ? "" : "s"} activo
                {negociosActivos === 1 ? "" : "s"} en este plan
              </p>

              <PlanEditarDialog plan={plan} negociosActivos={negociosActivos} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
