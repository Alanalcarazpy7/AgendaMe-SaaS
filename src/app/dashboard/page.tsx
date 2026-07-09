import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function parteFechaAsuncion(tipo: Intl.DateTimeFormatPartTypes) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return parts.find((part) => part.type === tipo)?.value ?? "";
}

function hoyAsuncion() {
  return `${parteFechaAsuncion("year")}-${parteFechaAsuncion("month")}-${parteFechaAsuncion("day")}`;
}

function sumarDias(fecha: string, dias: number) {
  const date = new Date(`${fecha}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dias);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function fechaCorta(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Asuncion",
  });
}

function diaCorto(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-PY", {
    weekday: "short",
    timeZone: "America/Asuncion",
  });
}

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    admin_global: "Admin global",
    gerente_sucursal: "Gerente",
    recepcionista_sucursal: "Recepción",
    empleado_sucursal: "Personal",
  };

  return labels[rol] ?? rol;
}

function estadoLabel(estado: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    completada: "Completada",
  };

  return labels[estado] ?? estado;
}

function MetricCard({
  titulo,
  valor,
  descripcion,
  icon: Icon,
  tone = "primary",
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  icon: typeof CalendarDays;
  tone?: "primary" | "cyan" | "teal" | "navy";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    navy: "bg-slate-900/10 text-slate-800 dark:bg-white/10 dark:text-slate-100",
  }[tone];

  return (
    <div className="group rounded-[1.65rem] border border-border/80 bg-card/90 p-5 shadow-[0_18px_55px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_70px_rgb(15_23_42/0.11)] dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">{valor}</p>
        </div>

        <div className={`rounded-2xl p-3 ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">{descripcion}</p>
    </div>
  );
}

function QuickLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-4 py-3 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent hover:text-accent-foreground hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white/5"
    >
      <span>{children}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

export default async function DashboardPage() {
  const access = await requireDashboardAccess();
  const supabase = createServiceRoleClient();

  const hoy = hoyAsuncion();
  const hasta = sumarDias(hoy, 7);

  let citasHoyQuery = supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("negocio_id", access.negocio.id)
    .eq("fecha", hoy)
    .in("estado", ["pendiente", "confirmada", "completada"]);

  citasHoyQuery = applySucursalScope(citasHoyQuery, access);

  let pendientesQuery = supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("negocio_id", access.negocio.id)
    .eq("estado", "pendiente");

  pendientesQuery = applySucursalScope(pendientesQuery, access);

  let proximasQuery = supabase
    .from("citas")
    .select(
      `
      id,
      fecha,
      hora_inicio,
      estado,
      clientes (
        nombre_completo
      ),
      servicios (
        nombre
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .gte("fecha", hoy)
    .lte("fecha", hasta)
    .in("estado", ["pendiente", "confirmada"])
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true })
    .limit(6);

  proximasQuery = applySucursalScope(proximasQuery, access);

  let clientesQuery: any = supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("negocio_id", access.negocio.id)
    .eq("estado", "activo");

  if (access.scope === "sucursal" && access.sucursalId) {
    clientesQuery = supabase
      .from("cliente_sucursales")
      .select("cliente_id", { count: "exact", head: true })
      .eq("negocio_id", access.negocio.id)
      .eq("sucursal_id", access.sucursalId);
  }

  const [
    { count: citasHoyCount },
    { count: pendientesCount },
    { count: clientesCount },
    { data: proximas },
    { count: sucursalesCount },
  ] = await Promise.all([
    citasHoyQuery,
    pendientesQuery,
    clientesQuery,
    proximasQuery,
    access.puedeVerTodo
      ? supabase
          .from("sucursales")
          .select("id", { count: "exact", head: true })
          .eq("negocio_id", access.negocio.id)
          .eq("estado", "activo")
      : Promise.resolve({ count: 1 } as { count: number }),
  ]);

  const proximasCitas = proximas ?? [];
  const confirmadas = proximasCitas.filter((cita: any) => cita.estado === "confirmada").length;
  const pendientesVisibles = proximasCitas.filter((cita: any) => cita.estado === "pendiente").length;
  const dias = Array.from({ length: 7 }, (_, index) => {
    const fecha = sumarDias(hoy, index);
    const total = proximasCitas.filter((cita: any) => cita.fecha === fecha).length;

    return { fecha, total };
  });
  const maxDia = Math.max(...dias.map((dia) => dia.total), 1);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 shadow-[0_24px_80px_rgb(15_23_42/0.09)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/30 dark:ring-white/5">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="relative p-6 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-teal-500" />

            <p className="inline-flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              {access.scope === "global" ? "Vista global del negocio" : "Vista de sucursal"}
            </p>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {access.negocio.nombre}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {access.scope === "global" ? "Todas las sucursales" : access.sucursalNombre} ·{" "}
              {rolLabel(access.rol)} · Plan {access.planNombre}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {access.puedeGestionarCitas && (
                <Link
                  href="/dashboard/citas"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 outline-none transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Ver agenda
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              )}

              {access.puedeVerTodo && (
                <Link
                  href={`/reservar/${access.negocio.slug}`}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border bg-background/60 px-4 text-sm font-semibold shadow-sm outline-none transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white/5"
                >
                  Link público
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <aside className="border-t border-border/70 bg-muted/30 p-5 lg:border-l lg:border-t-0 dark:bg-white/[0.03]">
            <div className="rounded-[1.5rem] border border-cyan-300/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] p-5 text-white shadow-xl shadow-cyan-950/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-50">
                  Plan {access.planClave}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">Desbloqueá más control</h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/90">
                Reportes, exportación y herramientas avanzadas según el plan activo.
              </p>

              {access.puedeGestionarPlanes && (
                <Link
                  href="/dashboard/planes"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-bold text-slate-950 outline-none transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Gestionar plan
                </Link>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Citas de hoy"
          valor={String(citasHoyCount ?? 0)}
          descripcion="Pendientes, confirmadas y completadas."
          icon={CalendarDays}
          tone="primary"
        />

        <MetricCard
          titulo="Reservas pendientes"
          valor={String(pendientesCount ?? 0)}
          descripcion="Solicitudes que necesitan revisión."
          icon={BellRing}
          tone="cyan"
        />

        <MetricCard
          titulo="Clientes visibles"
          valor={String(clientesCount ?? 0)}
          descripcion={
            access.scope === "global"
              ? "Clientes activos del negocio."
              : "Clientes vinculados a esta sucursal."
          }
          icon={Users}
          tone="teal"
        />

        <MetricCard
          titulo="Sucursales"
          valor={String(sucursalesCount ?? 1)}
          descripcion={
            access.scope === "global"
              ? "Sucursales activas."
              : "Tu sucursal asignada."
          }
          icon={Store}
          tone="navy"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
        <div className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_20px_65px_rgb(15_23_42/0.08)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Próximos 7 días</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Próximas citas</h2>
            </div>

            <div className="flex gap-2 text-xs">
              <span className="rounded-2xl border bg-muted/50 px-3 py-1.5 text-muted-foreground">
                {confirmadas} confirmadas
              </span>
              <span className="rounded-2xl border bg-muted/50 px-3 py-1.5 text-muted-foreground">
                {pendientesVisibles} pendientes
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="space-y-3">
              {proximasCitas.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed bg-muted/40 p-5 text-sm text-muted-foreground">
                  No hay próximas citas para esta vista. Cuando entren reservas, van a aparecer acá con fecha, cliente y servicio.
                </div>
              ) : (
                proximasCitas.map((cita: any) => {
                  const cliente = Array.isArray(cita.clientes)
                    ? cita.clientes[0]
                    : cita.clientes;

                  const servicio = Array.isArray(cita.servicios)
                    ? cita.servicios[0]
                    : cita.servicios;

                  return (
                    <div
                      key={cita.id}
                      className="group grid gap-3 rounded-[1.35rem] border border-border/70 bg-background/60 p-4 shadow-sm transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-background/80 dark:bg-white/[0.04] sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {fechaCorta(cita.fecha)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 font-bold">
                          <Clock3 className="h-4 w-4 text-primary" />
                          {String(cita.hora_inicio).slice(0, 5)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {cliente?.nombre_completo ?? "Cliente"}
                        </p>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {servicio?.nombre ?? "Servicio"}
                        </p>
                      </div>

                      <span className="w-fit rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        {estadoLabel(cita.estado)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="rounded-[1.35rem] border bg-muted/30 p-4 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Actividad visible</p>
                  <p className="text-xs text-muted-foreground">Según las próximas citas cargadas.</p>
                </div>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-5 flex h-44 items-end gap-2">
                {dias.map((dia) => (
                  <div key={dia.fecha} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end rounded-full bg-background/80 p-1 shadow-inner dark:bg-black/20">
                      <div
                        className="w-full rounded-full bg-gradient-to-t from-primary to-cyan-400 transition-[height] duration-300 ease-[var(--ease-out)]"
                        style={{ height: `${Math.max((dia.total / maxDia) * 100, dia.total > 0 ? 18 : 7)}%` }}
                        title={`${dia.total} citas`}
                      />
                    </div>
                    <span className="truncate text-[11px] font-medium text-muted-foreground">
                      {diaCorto(dia.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_20px_65px_rgb(15_23_42/0.08)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
          <p className="text-sm font-medium text-muted-foreground">Siguientes acciones</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Accesos rápidos</h2>

          <div className="mt-5 grid gap-2">
            {access.puedeGestionarCitas && (
              <QuickLink href="/dashboard/citas">Calendario</QuickLink>
            )}

            {access.puedeGestionarClientes && (
              <QuickLink href="/dashboard/clientes">Clientes</QuickLink>
            )}

            {access.puedeVerReportes && (
              <QuickLink href="/dashboard/reportes">Reportes</QuickLink>
            )}

            {access.puedeVerTodo && (
              <QuickLink href={`/reservar/${access.negocio.slug}`}>Link público</QuickLink>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
