import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarDays, Crown, Store, Users } from "lucide-react";
import type { PlanRequiredDashboardContext } from "@/lib/dashboard/access-context";

type Props = {
  context: PlanRequiredDashboardContext;
};

function rolLabel(rol: PlanRequiredDashboardContext["rol"]) {
  const labels: Record<PlanRequiredDashboardContext["rol"], string> = {
    admin_global: "Admin del negocio",
    gerente_sucursal: "Gerente de sucursal",
    recepcionista_sucursal: "Recepcion",
    empleado_sucursal: "Personal de sucursal",
  };

  return labels[rol] ?? rol;
}

export function DashboardPlanRestricted({ context }: Props) {
  const puedeGestionarPlan = context.rol === "admin_global";

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border bg-card shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-primary to-amber-400" />

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="p-5 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
            <Crown className="h-4 w-4" />
            Plan actual: {context.planNombre}
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-balance sm:text-4xl">
            Este acceso necesita el plan {context.requiredPlanNombre}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tu usuario pertenece a una sucursal. El negocio bajo de plan y la
            gestion por sucursales queda pausada, pero los datos existentes no
            se eliminan.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.2rem] border bg-background/70 p-4">
              <Store className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-black">Sucursal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {context.sucursalNombre ?? "Sucursal asignada"}
              </p>
            </div>
            <div className="rounded-[1.2rem] border bg-background/70 p-4">
              <Users className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-black">Rol</p>
              <p className="mt-1 text-sm text-muted-foreground">{rolLabel(context.rol)}</p>
            </div>
            <div className="rounded-[1.2rem] border bg-background/70 p-4">
              <CalendarDays className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-black">Datos</p>
              <p className="mt-1 text-sm text-muted-foreground">Historial conservado</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.35rem] border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-900 dark:text-amber-100">
            <p className="flex items-center gap-2 font-black">
              <AlertTriangle className="h-4 w-4" />
              No se borra nada por bajar de plan
            </p>
            <p className="mt-2 text-amber-900/80 dark:text-amber-100/80">
              Las sucursales, empleados, clientes y citas siguen guardados. Para
              volver a usar accesos por sucursal, el responsable del negocio debe
              activar el plan {context.requiredPlanNombre}.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {puedeGestionarPlan ? (
              <Link
                href="/dashboard/planes"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                Revisar plan
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-2xl border bg-background px-5 text-sm font-black transition hover:bg-muted"
            >
              Cambiar cuenta
            </Link>
          </div>
        </div>

        <aside className="border-t bg-[linear-gradient(145deg,var(--muted),var(--background))] p-5 lg:border-l lg:border-t-0">
          <div className="rounded-[1.4rem] border bg-background/75 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
              Que pasa ahora
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>El negocio puede seguir operando desde el acceso principal.</p>
              <p>Los usuarios de sucursal quedan pausados mientras el plan no habilite sucursales.</p>
              <p>Cuando el negocio vuelva a Empresarial, estos accesos pueden volver a usarse.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
