import Link from "next/link";
import { AlertTriangle, Building2, Clock, LogIn } from "lucide-react";
import type { InactiveBranchDashboardContext } from "@/lib/dashboard/access-context";

type Props = {
  context: InactiveBranchDashboardContext;
};

function rolLabel(rol: InactiveBranchDashboardContext["rol"]) {
  const labels: Record<InactiveBranchDashboardContext["rol"], string> = {
    admin_global: "Admin del negocio",
    gerente_sucursal: "Gerente de sucursal",
    recepcionista_sucursal: "Recepcion",
    empleado_sucursal: "Personal de sucursal",
  };

  return labels[rol] ?? rol;
}

export function DashboardBranchInactive({ context }: Props) {
  return (
    <section className="rounded-[1.75rem] border border-amber-500/25 bg-card p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Sucursal inactiva
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">
            Tu acceso esta pausado porque la sucursal esta inactiva
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Estas entrando al dashboard correcto, pero tu usuario pertenece a una
            sucursal que ahora figura como inactiva. Las herramientas quedan
            bloqueadas hasta que el responsable del negocio reactive esa sucursal.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.2rem] border bg-background/70 p-4">
              <Building2 className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-black">Sucursal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {context.sucursalNombre ?? "Sucursal asignada"}
              </p>
            </div>

            <div className="rounded-[1.2rem] border bg-background/70 p-4">
              <LogIn className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-black">Rol</p>
              <p className="mt-1 text-sm text-muted-foreground">{rolLabel(context.rol)}</p>
            </div>

            <div className="rounded-[1.2rem] border bg-background/70 p-4">
              <Clock className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-black">Estado</p>
              <p className="mt-1 text-sm text-muted-foreground">Acceso en pausa</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-amber-900 dark:text-amber-100">
            <p className="font-black">No se borra nada</p>
            <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
              Las citas, empleados, clientes e historial siguen guardados. Cuando
              la sucursal vuelva a estar activa, este acceso deberia funcionar
              normalmente.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              Reintentar acceso
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-2xl border bg-background px-5 text-sm font-black transition hover:bg-muted"
            >
              Cambiar cuenta
            </Link>
          </div>
        </div>

        <aside className="rounded-[1.4rem] border bg-background/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
            Que debe pasar
          </p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>El responsable del negocio debe reactivar la sucursal.</p>
            <p>Si el negocio bajo de plan, primero debe regularizar el plan o mantener solo la sucursal principal activa.</p>
            <p>Tu usuario no necesita crear otra cuenta.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
