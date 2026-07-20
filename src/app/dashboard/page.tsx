import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  ExternalLink,
  Store,
  Users,
} from "lucide-react";
import { DashboardPlanUsageOverview } from "@/components/dashboard/dashboard-plan-usage-overview";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope } from "@/lib/dashboard/scope-helpers";
import { obtenerUsoPlanNegocio } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null | undefined;

type ProximaCita = {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  clientes?: Relacion<{ nombre_completo: string }>;
  servicios?: Relacion<{ nombre: string }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

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
    recepcionista_sucursal: "Recepcion",
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
  detalle,
  icon: Icon,
  active = false,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icon: typeof CalendarDays;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.35rem] border p-4 shadow-[0_12px_34px_rgb(15_23_42/0.06)] ring-1 ring-white/60 dark:ring-white/5 ${
        active
          ? "border-primary/25 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_70%,#0b1120))] text-white"
          : "border-border/80 bg-card/90 dark:bg-card/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${active ? "text-cyan-50/85" : "text-muted-foreground"}`}>
            {titulo}
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight tabular-nums">{valor}</p>
        </div>
        <div className={`rounded-2xl p-2.5 ${active ? "bg-white/15" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`mt-3 text-xs ${active ? "text-cyan-50/80" : "text-muted-foreground"}`}>
        {detalle}
      </p>
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex h-11 items-center justify-between rounded-2xl border border-border/80 bg-background/70 px-4 text-sm font-semibold transition-[background-color,color,border-color,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-accent hover:text-accent-foreground"
    >
      <span>{children}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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

  const clientesQuery =
    access.scope === "sucursal" && access.sucursalId
      ? supabase
      .from("cliente_sucursales")
      .select("cliente_id", { count: "exact", head: true })
      .eq("negocio_id", access.negocio.id)
      .eq("sucursal_id", access.sucursalId)
      : supabase
          .from("clientes")
          .select("id", { count: "exact", head: true })
          .eq("negocio_id", access.negocio.id)
          .eq("estado", "activo");

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

  const proximasCitas = (proximas ?? []) as ProximaCita[];
  const confirmadas = proximasCitas.filter((cita) => cita.estado === "confirmada").length;
  const pendientesVisibles = proximasCitas.filter((cita) => cita.estado === "pendiente").length;
  const dias = Array.from({ length: 7 }, (_, index) => {
    const fecha = sumarDias(hoy, index);
    const total = proximasCitas.filter((cita) => cita.fecha === fecha).length;

    return { fecha, total };
  });
  const maxDia = Math.max(...dias.map((dia) => dia.total), 1);
  const totalSemana = proximasCitas.length;
  const esPlanEmpresarial = access.planClave === "empresarial";
  const planUsage = access.puedeVerTodo
    ? await obtenerUsoPlanNegocio({
        supabase,
        negocioId: access.negocio.id,
      })
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">
            {access.scope === "global" ? "Vista global" : access.sucursalNombre} / {rolLabel(access.rol)}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {access.negocio.nombre}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {access.puedeGestionarCitas && (
            <Link
              href="/dashboard/citas"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Agenda
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          )}
          {access.puedeVerTodo && (
            <Link
              href={`/reservar/${access.negocio.slug}`}
              className="inline-flex h-11 items-center justify-center rounded-2xl border bg-background/70 px-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
            >
              Link publico
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Citas hoy"
          valor={String(citasHoyCount ?? 0)}
          detalle="Agenda del dia"
          icon={CalendarDays}
          active
        />
        <MetricCard
          titulo="Pendientes"
          valor={String(pendientesCount ?? 0)}
          detalle="Reservas por revisar"
          icon={BellRing}
        />
        <MetricCard
          titulo="Clientes"
          valor={String(clientesCount ?? 0)}
          detalle={access.scope === "global" ? "Activos del negocio" : "Visibles en sucursal"}
          icon={Users}
        />
        <MetricCard
          titulo="Sucursales"
          valor={String(sucursalesCount ?? 1)}
          detalle={access.scope === "global" ? "Activas" : "Sucursal asignada"}
          icon={Store}
        />
      </section>

      {planUsage ? (
        <DashboardPlanUsageOverview
          snapshot={planUsage}
          puedeGestionarPlanes={access.puedeGestionarPlanes}
          compact
        />
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
        <div className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_18px_55px_rgb(15_23_42/0.07)] ring-1 ring-white/60 dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Proximos 7 dias</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Actividad semanal</h2>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
            <div>
              <div className="flex h-52 items-end gap-2 rounded-[1.35rem] border bg-background/60 p-4 dark:bg-white/[0.03]">
                {dias.map((dia) => (
                  <div key={dia.fecha} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="flex h-36 w-full items-end rounded-2xl bg-muted/70 p-1">
                      <div
                        className="w-full rounded-xl bg-gradient-to-t from-primary to-cyan-400"
                        style={{ height: `${Math.max((dia.total / maxDia) * 100, dia.total > 0 ? 18 : 5)}%` }}
                        title={`${dia.total} citas`}
                      />
                    </div>
                    <span className="truncate text-[11px] font-semibold text-muted-foreground">
                      {diaCorto(dia.fecha)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="rounded-2xl border bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">Total semana</p>
                <p className="mt-1 text-3xl font-bold tabular-nums">{totalSemana}</p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">Confirmadas</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{confirmadas}</p>
              </div>
              <div className="rounded-2xl border bg-background/70 p-4">
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{pendientesVisibles}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="grid gap-5">
          <div className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_18px_55px_rgb(15_23_42/0.07)] ring-1 ring-white/60 dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Plan activo</p>
                <h2 className="mt-1 text-xl font-bold">{access.planNombre}</h2>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                {esPlanEmpresarial ? <CheckCircle2 className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {esPlanEmpresarial ? "Funciones avanzadas activas." : "Hay funciones premium disponibles."}
            </p>
            {access.puedeGestionarPlanes && (
              <Link
                href="/dashboard/planes"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl border bg-background/70 px-4 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground"
              >
                Ver plan
              </Link>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_18px_55px_rgb(15_23_42/0.07)] ring-1 ring-white/60 dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
            <p className="text-sm font-semibold text-muted-foreground">Accesos</p>
            <div className="mt-4 grid gap-2">
              {access.puedeGestionarCitas && <QuickLink href="/dashboard/citas">Calendario</QuickLink>}
              {access.puedeGestionarClientes && <QuickLink href="/dashboard/clientes">Clientes</QuickLink>}
              {access.puedeVerReportes && <QuickLink href="/dashboard/reportes">Reportes</QuickLink>}
              {access.puedeVerTodo && <QuickLink href={`/reservar/${access.negocio.slug}`}>Link publico</QuickLink>}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_18px_55px_rgb(15_23_42/0.07)] ring-1 ring-white/60 dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Agenda inmediata</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Proximas citas</h2>
          </div>
          <Activity className="h-5 w-5 text-primary" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="py-3 pr-4">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {proximasCitas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay proximas citas para esta vista.
                  </td>
                </tr>
              ) : (
                proximasCitas.map((cita) => {
                  const cliente = obtenerObjeto(cita.clientes);
                  const servicio = obtenerObjeto(cita.servicios);

                  return (
                    <tr key={cita.id} className="transition-colors hover:bg-muted/35">
                      <td className="py-3 pr-4">
                        <p className="font-semibold">{fechaCorta(cita.fecha)}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5 text-primary" />
                          {String(cita.hora_inicio).slice(0, 5)}
                        </p>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3">
                        <span className="block truncate font-medium">
                          {cliente?.nombre_completo ?? "Cliente"}
                        </span>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3 text-muted-foreground">
                        <span className="block truncate">{servicio?.nombre ?? "Servicio"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-xl bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                          {estadoLabel(cita.estado)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
