import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { obtenerUsoPlanNegocio } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Props = {
  negocioId: string;
  puedeGestionarPlanes: boolean;
};

export async function DashboardPlanLimitBanner({
  negocioId,
  puedeGestionarPlanes,
}: Props) {
  const supabase = createServiceRoleClient();
  const snapshot = await obtenerUsoPlanNegocio({ supabase, negocioId });

  if (snapshot.exceeded.length === 0) return null;

  return (
    <section className="mb-5 overflow-hidden rounded-[1.35rem] border border-amber-500/25 bg-[linear-gradient(135deg,rgb(245_158_11/0.14),rgb(6_182_212/0.08))] p-4 shadow-sm ring-1 ring-amber-500/10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black">
              Tu negocio supera los limites del plan {snapshot.planNombre}
            </p>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Los datos existentes se conservan. Para crear mas recursos,
              subi de plan o desactiva registros hasta quedar dentro del limite.
              En citas, el contador se normaliza cuando cambia el mes.
            </p>
          </div>
        </div>

        {puedeGestionarPlanes ? (
          <Link
            href="/dashboard/planes"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            Ver planes
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {snapshot.exceeded.map((item) => (
          <div key={item.key} className="rounded-2xl border bg-background/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-muted-foreground">{item.label}</p>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-2 text-xl font-black tabular-nums">
              {item.used}
              <span className="text-sm text-muted-foreground"> / {item.limit}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
