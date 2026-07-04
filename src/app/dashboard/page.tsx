import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  Scissors,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Relacion<T> = T | T[] | null;

type PlanRaw = {
  nombre: string;
  clave: string;
  precio_gs: number | string | null;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
};

type SuscripcionRaw = {
  estado: string;
  fecha_vencimiento: string | null;
  planes_saas: Relacion<PlanRaw>;
};

type CitaRaw = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  seguimiento_token: string | null;
  clientes: Relacion<{
    nombre_completo: string;
    telefono: string | null;
  }>;
  servicios: Relacion<{
    nombre: string;
  }>;
  empleados: Relacion<{
    nombre: string;
  }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function obtenerParteFechaAsuncion(tipo: Intl.DateTimeFormatPartTypes) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return parts.find((part) => part.type === tipo)?.value ?? "";
}

function hoyAsuncionIso() {
  const year = obtenerParteFechaAsuncion("year");
  const month = obtenerParteFechaAsuncion("month");
  const day = obtenerParteFechaAsuncion("day");

  return `${year}-${month}-${day}`;
}

function anioMesAsuncion() {
  return {
    anio: Number(obtenerParteFechaAsuncion("year")),
    mes: Number(obtenerParteFechaAsuncion("month")),
  };
}

function hora(valor: string) {
  return valor.slice(0, 5);
}

function fechaCorta(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}`;
}

function estadoLabel(estado: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    completada: "Completada",
    cancelada: "Cancelada",
    no_asistio: "No asistió",
  };

  return labels[estado] ?? estado;
}

function estadoClass(estado: string) {
  if (estado === "confirmada") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (estado === "pendiente") {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  if (estado === "cancelada") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (estado === "completada") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-orange-50 text-orange-700 border-orange-200";
}

function formatGs(valor: number | string | null) {
  const numero = Number(valor ?? 0);

  if (!numero) return "Gs. 0";

  return `Gs. ${numero.toLocaleString("es-PY")}`;
}

function porcentaje(uso: number, limite: number | null) {
  if (!limite) return 0;
  return Math.min(100, Math.round((uso / limite) * 100));
}

function disponibles(uso: number, limite: number | null) {
  if (!limite) return "Ilimitado";
  return Math.max(0, limite - uso).toString();
}

function MetricCard({
  titulo,
  uso,
  limite,
  descripcion,
  icon: Icon,
}: {
  titulo: string;
  uso: number;
  limite: number | null;
  descripcion: string;
  icon: typeof CalendarDays;
}) {
  const percent = porcentaje(uso, limite);
  const lleno = limite !== null && uso >= limite;

  return (
    <div className="rounded-3xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{titulo}</p>
          <p className="mt-2 text-3xl font-bold">
            {uso}
            <span className="text-muted-foreground"> / {limite ?? "∞"}</span>
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 ${
            lleno ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
          }`}
        >
          {lleno ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>

      <div className="mt-4 h-2 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${lleno ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{percent}% usado</span>
        <span>{disponibles(uso, limite)} disponibles</span>
      </div>
    </div>
  );
}

function CitaCompacta({ cita }: { cita: CitaRaw }) {
  const cliente = obtenerObjeto(cita.clientes);
  const servicio = obtenerObjeto(cita.servicios);
  const empleado = obtenerObjeto(cita.empleados);

  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {cliente?.nombre_completo ?? "Cliente"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {servicio?.nombre ?? "Servicio"}
            {empleado?.nombre ? ` · ${empleado.nombre}` : ""}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${estadoClass(
            cita.estado
          )}`}
        >
          {estadoLabel(cita.estado)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          {fechaCorta(cita.fecha)} · {hora(cita.hora_inicio)}
        </p>

        <Link
          href={`/dashboard/citas?fecha=${cita.fecha}&hora=${hora(
            cita.hora_inicio
          )}&cita=${cita.id}`}
          className="rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted"
        >
          Ver
        </Link>
      </div>

      {cliente?.telefono && (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {cliente.telefono}
        </p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id, rol, activo")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError || !membresia) {
    redirect("/onboarding/negocio");
  }

  const hoy = hoyAsuncionIso();
  const { anio, mes } = anioMesAsuncion();

  const [
    { data: negocio, error: negocioError },
    { data: suscripcionData, error: suscripcionError },
    { count: clientesCount, error: clientesError },
    { count: empleadosCount, error: empleadosError },
    { count: serviciosCount, error: serviciosError },
    { data: usoMensual, error: usoError },
    { data: reservasPendientes, error: pendientesError },
    { data: citasHoy, error: citasHoyError },
    { data: proximasCitas, error: proximasError },
  ] = await Promise.all([
    supabase
      .from("negocios")
      .select("id, nombre, slug, estado")
      .eq("id", membresia.negocio_id)
      .maybeSingle(),

    supabase
      .from("suscripciones")
      .select(
        `
        estado,
        fecha_vencimiento,
        planes_saas (
          nombre,
          clave,
          precio_gs,
          limite_citas_mensuales,
          limite_empleados,
          limite_servicios,
          limite_clientes
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo"),

    supabase
      .from("empleados")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo"),

    supabase
      .from("servicios")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo"),

    supabase
      .from("uso_plan_mensual")
      .select("citas_creadas")
      .eq("negocio_id", membresia.negocio_id)
      .eq("anio", anio)
      .eq("mes", mes)
      .maybeSingle(),

    supabase
      .from("citas")
      .select(
        `
        id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        seguimiento_token,
        clientes (
          nombre_completo,
          telefono
        ),
        servicios (
          nombre
        ),
        empleados (
          nombre
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "pendiente")
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(6),

    supabase
      .from("citas")
      .select(
        `
        id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        seguimiento_token,
        clientes (
          nombre_completo,
          telefono
        ),
        servicios (
          nombre
        ),
        empleados (
          nombre
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("fecha", hoy)
      .in("estado", ["pendiente", "confirmada"])
      .order("hora_inicio", { ascending: true })
      .limit(6),

    supabase
      .from("citas")
      .select(
        `
        id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        seguimiento_token,
        clientes (
          nombre_completo,
          telefono
        ),
        servicios (
          nombre
        ),
        empleados (
          nombre
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .gt("fecha", hoy)
      .in("estado", ["pendiente", "confirmada"])
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true })
      .limit(4),
  ]);

  if (negocioError) throw new Error(negocioError.message);
  if (suscripcionError) throw new Error(suscripcionError.message);
  if (clientesError) throw new Error(clientesError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);
  if (usoError) throw new Error(usoError.message);
  if (pendientesError) throw new Error(pendientesError.message);
  if (citasHoyError) throw new Error(citasHoyError.message);
  if (proximasError) throw new Error(proximasError.message);

  if (!negocio) {
    redirect("/onboarding/negocio");
  }

  const suscripcion = suscripcionData as SuscripcionRaw | null;
  const plan = obtenerObjeto(suscripcion?.planes_saas ?? null);

  const citasUsadas = Number(usoMensual?.citas_creadas ?? 0);
  const clientesUsados = clientesCount ?? 0;
  const empleadosUsados = empleadosCount ?? 0;
  const serviciosUsados = serviciosCount ?? 0;

  const pendientes = (reservasPendientes ?? []) as CitaRaw[];
  const hoyItems = (citasHoy ?? []) as CitaRaw[];
  const proximasItems = (proximasCitas ?? []) as CitaRaw[];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Panel del negocio</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {negocio.nombre}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rol: {membresia.rol} · Estado: {negocio.estado}
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/30 px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan actual
            </p>
            <p className="mt-1 text-lg font-bold">
              {plan?.nombre ?? "Sin plan"}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatGs(plan?.precio_gs ?? 0)} / mes
            </p>
          </div>

          <Link
            href={`/reservar/${negocio.slug}`}
            target="_blank"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Ver link público
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Citas del mes"
          uso={citasUsadas}
          limite={plan?.limite_citas_mensuales ?? null}
          descripcion="Confirmadas, completadas y no asistió."
          icon={CalendarDays}
        />

        <MetricCard
          titulo="Clientes"
          uso={clientesUsados}
          limite={plan?.limite_clientes ?? null}
          descripcion="Clientes activos incluidos en tu plan."
          icon={Users}
        />

        <MetricCard
          titulo="Empleados"
          uso={empleadosUsados}
          limite={plan?.limite_empleados ?? null}
          descripcion="Empleados activos incluidos en tu plan."
          icon={BriefcaseBusiness}
        />

        <MetricCard
          titulo="Servicios"
          uso={serviciosUsados}
          limite={plan?.limite_servicios ?? null}
          descripcion="Servicios activos incluidos en tu plan."
          icon={Scissors}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Agenda de hoy
              </p>
              <h2 className="text-2xl font-bold">Citas para hoy</h2>
            </div>

            <Link
              href={`/dashboard/citas?fecha=${hoy}`}
              className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition hover:bg-muted"
            >
              Ver calendario
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {hoyItems.length === 0 ? (
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2">
                No tenés citas pendientes o confirmadas para hoy.
              </div>
            ) : (
              hoyItems.map((cita) => <CitaCompacta key={cita.id} cita={cita} />)
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-yellow-200 bg-yellow-50/60 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-yellow-700" />
                  <p className="text-sm font-medium text-yellow-800">
                    Reservas pendientes
                  </p>
                </div>

                <h2 className="mt-1 text-2xl font-bold">
                  {pendientes.length > 0
                    ? `${pendientes.length} por revisar`
                    : "Sin pendientes"}
                </h2>
              </div>

              <Link
                href="/dashboard/reservas"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-foreground px-3 text-sm font-semibold text-background"
              >
                Ver
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {pendientes.length === 0 ? (
                <div className="rounded-2xl border bg-background/70 p-4 text-sm text-muted-foreground">
                  No hay reservas pendientes.
                </div>
              ) : (
                pendientes
                  .slice(0, 3)
                  .map((cita) => <CitaCompacta key={cita.id} cita={cita} />)
              )}
            </div>
          </div>

          <div className="rounded-3xl border bg-background p-5 shadow-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Accesos rápidos
              </p>
              <h2 className="text-2xl font-bold">Gestión del negocio</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Entrá rápido a las áreas principales de tu agenda.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/clientes"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Clientes
              </Link>
              <Link
                href="/dashboard/servicios"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Servicios
              </Link>
              <Link
                href="/dashboard/empleados"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Empleados
              </Link>
              <Link
                href="/dashboard/citas"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Calendario
              </Link>
              <Link
                href="/dashboard/reportes"
                className="rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                Reportes
              </Link>
            </div>

            <div className="mt-3">
              <Link
                href="/dashboard/configuracion"
                className="flex rounded-xl border px-3 py-3 text-center text-sm font-medium transition hover:bg-muted"
              >
                <span className="w-full">Configuración</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Próximas citas
            </p>
            <h2 className="text-2xl font-bold">Después de hoy</h2>
          </div>

          <Link
            href="/dashboard/citas"
            className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition hover:bg-muted"
          >
            Ver calendario
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {proximasItems.length === 0 ? (
            <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-4">
              No hay próximas citas confirmadas o pendientes.
            </div>
          ) : (
            proximasItems.map((cita) => (
              <CitaCompacta key={cita.id} cita={cita} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}