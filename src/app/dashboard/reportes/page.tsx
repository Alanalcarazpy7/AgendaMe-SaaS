import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Crown,
  DollarSign,
  Lock,
  Scissors,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type Relacion<T> = T | T[] | null;

type PlanRaw = {
  nombre: string;
  clave: string;
  precio_gs: number | string | null;
  permite_reportes_avanzados: boolean | null;
};

type SuscripcionRaw = {
  estado: string;
  planes_saas: Relacion<PlanRaw>;
};

type CitaReporteRaw = {
  id: string;
  fecha: string;
  estado: string;
  precio: number | string;
  clientes: Relacion<{
    nombre_completo: string;
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

function parteFechaAsuncion(tipo: Intl.DateTimeFormatPartTypes) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return parts.find((part) => part.type === tipo)?.value ?? "";
}

function mesActualAsuncion() {
  const year = parteFechaAsuncion("year");
  const month = parteFechaAsuncion("month");

  return {
    desde: `${year}-${month}-01`,
    hasta:
      Number(month) === 12
        ? `${Number(year) + 1}-01-01`
        : `${year}-${String(Number(month) + 1).padStart(2, "0")}-01`,
    label: `${month}/${year}`,
  };
}

function formatGs(valor: number) {
  return `Gs. ${valor.toLocaleString("es-PY")}`;
}

function sumarPorNombre(
  citas: CitaReporteRaw[],
  obtenerNombre: (cita: CitaReporteRaw) => string
) {
  const map = new Map<string, { nombre: string; cantidad: number; total: number }>();

  for (const cita of citas) {
    const nombre = obtenerNombre(cita);
    const actual = map.get(nombre) ?? {
      nombre,
      cantidad: 0,
      total: 0,
    };

    actual.cantidad += 1;
    actual.total += Number(cita.precio ?? 0);

    map.set(nombre, actual);
  }

  return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad);
}

function ReporteCard({
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

function MiniRanking({
  titulo,
  items,
  valorTipo = "cantidad",
}: {
  titulo: string;
  items: { nombre: string; cantidad: number; total: number }[];
  valorTipo?: "cantidad" | "dinero";
}) {
  const max = Math.max(...items.map((item) => item.cantidad), 1);

  return (
    <div className="rounded-3xl border bg-background p-5 shadow-sm">
      <h2 className="text-xl font-bold">{titulo}</h2>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Todavía no hay datos suficientes.
          </p>
        ) : (
          items.slice(0, 5).map((item) => (
            <div key={item.nombre}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.nombre}</span>
                <span className="text-muted-foreground">
                  {valorTipo === "dinero"
                    ? formatGs(item.total)
                    : `${item.cantidad} citas`}
                </span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.round((item.cantidad / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function UpgradeReportes({ negocioNombre }: { negocioNombre: string }) {
  const numero = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "";
  const mensaje = encodeURIComponent(
    `Hola, quiero activar reportes para mi negocio ${negocioNombre}.`
  );

  const href = numero
    ? `https://wa.me/${numero.replace(/\D/g, "")}?text=${mensaje}`
    : "/dashboard";

  return (
    <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-100 text-yellow-700">
        <Crown className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Reportes disponibles desde el Plan Básico
      </h1>

      <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
        Analizá cuántas citas tuvo tu negocio, cuáles servicios se reservan más,
        ingresos estimados, clientes frecuentes y rendimiento general.
      </p>

      <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-muted/30 p-4">
          <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Gráficos de citas</p>
        </div>

        <div className="rounded-2xl border bg-muted/30 p-4">
          <DollarSign className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Ingresos estimados</p>
        </div>

        <div className="rounded-2xl border bg-muted/30 p-4">
          <TrendingUp className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Servicios más pedidos</p>
        </div>
      </div>

      <a
        href={href}
        target={numero ? "_blank" : undefined}
        rel={numero ? "noreferrer" : undefined}
        className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Solicitar mejora de plan
      </a>
    </section>
  );
}

export default async function ReportesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError || !membresia) {
    redirect("/onboarding/negocio");
  }

  const { desde, hasta, label } = mesActualAsuncion();

  const [
    { data: negocio, error: negocioError },
    { data: suscripcionData, error: suscripcionError },
    { data: citasData, error: citasError },
  ] = await Promise.all([
    supabase
      .from("negocios")
      .select("id, nombre")
      .eq("id", membresia.negocio_id)
      .maybeSingle(),

    supabase
      .from("suscripciones")
      .select(
        `
        estado,
        planes_saas (
          nombre,
          clave,
          precio_gs,
          permite_reportes_avanzados
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("citas")
      .select(
        `
        id,
        fecha,
        estado,
        precio,
        clientes (
          nombre_completo
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
      .gte("fecha", desde)
      .lt("fecha", hasta),
  ]);

  if (negocioError) throw new Error(negocioError.message);
  if (suscripcionError) throw new Error(suscripcionError.message);
  if (citasError) throw new Error(citasError.message);

  if (!negocio) {
    redirect("/onboarding/negocio");
  }

  const suscripcion = suscripcionData as SuscripcionRaw | null;
  const plan = obtenerObjeto(suscripcion?.planes_saas ?? null);

  const planClave = String(plan?.clave ?? "gratis").toLowerCase();
  const reportesBasicosDisponibles = !["gratis", "free"].includes(planClave);
  const reportesAvanzadosDisponibles =
    plan?.permite_reportes_avanzados === true ||
    ["profesional", "professional", "empresarial", "enterprise"].includes(planClave);

  if (!reportesBasicosDisponibles) {
    return <UpgradeReportes negocioNombre={negocio.nombre} />;
  }

  const citas = (citasData ?? []) as CitaReporteRaw[];

  const completadas = citas.filter((cita) => cita.estado === "completada");
  const confirmadas = citas.filter((cita) => cita.estado === "confirmada");
  const pendientes = citas.filter((cita) => cita.estado === "pendiente");
  const canceladas = citas.filter((cita) => cita.estado === "cancelada");
  const noAsistio = citas.filter((cita) => cita.estado === "no_asistio");

  const ingresoReal = completadas.reduce(
    (acc, cita) => acc + Number(cita.precio ?? 0),
    0
  );

  const ingresoEstimado = confirmadas.reduce(
    (acc, cita) => acc + Number(cita.precio ?? 0),
    0
  );

  const perdidaNoAsistio = noAsistio.reduce(
    (acc, cita) => acc + Number(cita.precio ?? 0),
    0
  );

  const serviciosRanking = sumarPorNombre(
    citas.filter((cita) =>
      ["confirmada", "completada", "no_asistio"].includes(cita.estado)
    ),
    (cita) => obtenerObjeto(cita.servicios)?.nombre ?? "Servicio"
  );

  const empleadosRanking = sumarPorNombre(
    citas.filter((cita) =>
      ["confirmada", "completada", "no_asistio"].includes(cita.estado)
    ),
    (cita) => obtenerObjeto(cita.empleados)?.nombre ?? "Empleado"
  );

  const clientesRanking = sumarPorNombre(
    citas.filter((cita) =>
      ["confirmada", "completada", "no_asistio"].includes(cita.estado)
    ),
    (cita) => obtenerObjeto(cita.clientes)?.nombre_completo ?? "Cliente"
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Reportes del negocio</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Resumen mensual
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mes actual: {label} · Plan: {plan?.nombre ?? "Sin plan"}
            </p>
          </div>

          {!reportesAvanzadosDisponibles && (
            <div className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-700">
              <Crown className="mr-2 h-4 w-4" />
              Reportes avanzados en plan superior
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReporteCard
          titulo="Ingresos reales"
          valor={formatGs(ingresoReal)}
          descripcion="Solo citas marcadas como completadas."
          icon={DollarSign}
        />

        <ReporteCard
          titulo="Ingresos estimados"
          valor={formatGs(ingresoEstimado)}
          descripcion="Citas confirmadas todavía no completadas."
          icon={TrendingUp}
        />

        <ReporteCard
          titulo="Citas atendidas"
          valor={String(completadas.length)}
          descripcion="Citas completadas durante este mes."
          icon={CalendarDays}
        />

        <ReporteCard
          titulo="No asistieron"
          valor={String(noAsistio.length)}
          descripcion={`Pérdida estimada: ${formatGs(perdidaNoAsistio)}.`}
          icon={Users}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl border bg-background p-5 shadow-sm md:col-span-2">
          <h2 className="text-xl font-bold">Citas por estado</h2>

          <div className="mt-4 grid gap-3">
            {[
              ["Pendientes", pendientes.length],
              ["Confirmadas", confirmadas.length],
              ["Completadas", completadas.length],
              ["Canceladas", canceladas.length],
              ["No asistió", noAsistio.length],
            ].map(([label, valor]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3"
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-lg font-bold">{valor}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <MiniRanking
            titulo="Servicios más reservados"
            items={serviciosRanking}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MiniRanking titulo="Rendimiento por empleado" items={empleadosRanking} />

        <MiniRanking titulo="Clientes frecuentes" items={clientesRanking} />
      </section>

      {!reportesAvanzadosDisponibles && (
        <section className="rounded-3xl border border-yellow-200 bg-yellow-50/60 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-yellow-800">
                <Lock className="h-5 w-5" />
                <h2 className="text-xl font-bold">Reportes avanzados</h2>
              </div>

              <p className="mt-2 max-w-2xl text-sm text-yellow-800/80">
                Comparación por meses, horarios de mayor demanda, exportación
                CSV y análisis avanzado estarán disponibles en planes superiores.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Mejorar plan
            </Link>
          </div>
        </section>
      )}

      {reportesAvanzadosDisponibles && (
        <section className="rounded-3xl border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <h2 className="text-xl font-bold">Reportes avanzados activos</h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            Próximo paso: gráficos comparativos por mes, exportación CSV,
            horarios con mayor demanda y análisis de crecimiento.
          </p>
        </section>
      )}
    </div>
  );
}