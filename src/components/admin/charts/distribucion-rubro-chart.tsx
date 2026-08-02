import { BriefcaseBusiness } from "lucide-react";
import type { PuntoDistribucionRubro } from "@/lib/admin/kpis";

export function DistribucionRubroChart({
  data,
}: {
  data: PuntoDistribucionRubro[];
}) {
  const total = data.reduce((acc, item) => acc + item.cantidad, 0);
  const mayorCantidad = Math.max(...data.map((item) => item.cantidad), 1);

  return (
    <section className="ag-report-chart overflow-hidden rounded-[1.6rem] border border-border/75 bg-card/90 p-4 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">Negocios por rubro</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Actividades declaradas por los negocios durante el registro.
          </p>
        </div>
        <BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      {total === 0 ? (
        <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-[1.15rem] border border-dashed bg-muted/35 p-4 text-center text-sm text-muted-foreground">
          Todavía no hay negocios para agrupar por rubro.
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {data.map((item) => {
            const porcentajeVisual = Math.max(
              5,
              Math.round((item.cantidad / mayorCantidad) * 100),
            );

            return (
              <div key={item.clave} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-semibold">{item.nombre}</span>
                  <span className="shrink-0 font-bold tabular-nums">
                    {item.cantidad}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${item.nombre}: ${item.cantidad} negocios`}
                >
                  <span
                    className="block h-full rounded-full bg-cyan-500"
                    style={{ width: `${porcentajeVisual}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="border-t border-border/70 pt-3 text-xs text-muted-foreground">
            Total clasificado: <strong className="text-foreground">{total}</strong>
          </p>
        </div>
      )}
    </section>
  );
}
