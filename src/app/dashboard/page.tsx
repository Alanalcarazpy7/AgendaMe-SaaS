import Link from "next/link";
import {
  BarChart3,
  BellRing,
  CalendarDays,
  ExternalLink,
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

function MetricCard({
  titulo,
  valor,
  descripcion,
  icon: Icon,
}: {
  titulo: string;
  valor: string;
  descripcion: string;
  icon: typeof CalendarDays;
}) {
  return (
    <div className="rounded-3xl border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="mt-2 text-3xl font-bold">{valor}</p>
        </div>

        <div className="rounded-2xl bg-muted p-3 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{descripcion}</p>
    </div>
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

  let clientesQuery = supabase
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

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {access.scope === "global"
                ? "Vista global del negocio"
                : "Vista de sucursal"}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {access.negocio.nombre}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              {access.scope === "global"
                ? "Todas las sucursales"
                : access.sucursalNombre}{" "}
              · Rol: {access.rol} · Plan: {access.planNombre}
            </p>
          </div>

          {access.puedeGestionarPlanes ? (
            <Link
              href="/dashboard/planes"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Gestionar plan
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          titulo="Citas de hoy"
          valor={String(citasHoyCount ?? 0)}
          descripcion="Pendientes, confirmadas y completadas."
          icon={CalendarDays}
        />

        <MetricCard
          titulo="Reservas pendientes"
          valor={String(pendientesCount ?? 0)}
          descripcion="Solicitudes que necesitan revisión."
          icon={BellRing}
        />

        <MetricCard
          titulo="Clientes visibles"
          valor={String(clientesCount ?? 0)}
          descripcion={
            access.scope === "global"
              ? "Clientes del negocio."
              : "Clientes vinculados a esta sucursal."
          }
          icon={Users}
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
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border bg-background p-5 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold">Próximas citas</h2>

          <div className="mt-4 space-y-3">
            {(proximas ?? []).length === 0 ? (
              <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                No hay próximas citas para esta vista.
              </p>
            ) : (
              (proximas ?? []).map((cita: any) => {
                const cliente = Array.isArray(cita.clientes)
                  ? cita.clientes[0]
                  : cita.clientes;

                const servicio = Array.isArray(cita.servicios)
                  ? cita.servicios[0]
                  : cita.servicios;

                return (
                  <div
                    key={cita.id}
                    className="rounded-2xl border bg-muted/20 p-4"
                  >
                    <p className="font-semibold">
                      {cita.fecha} · {String(cita.hora_inicio).slice(0, 5)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cliente?.nombre_completo ?? "Cliente"} ·{" "}
                      {servicio?.nombre ?? "Servicio"} · {cita.estado}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <h2 className="text-xl font-bold">Accesos rápidos</h2>

          <div className="mt-4 grid gap-2">
            {access.puedeGestionarCitas && (
              <Link
                href="/dashboard/citas"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Calendario
              </Link>
            )}

            {access.puedeGestionarClientes && (
              <Link
                href="/dashboard/clientes"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Clientes
              </Link>
            )}

            {access.puedeVerReportes && (
              <Link
                href="/dashboard/reportes"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Reportes
              </Link>
            )}

            {access.puedeVerTodo && (
              <Link
                href={`/reservar/${access.negocio.slug}`}
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Link público
                <ExternalLink className="ml-2 inline h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}