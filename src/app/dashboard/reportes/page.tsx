import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  Crown,
  DollarSign,
  FileDown,
  Scissors,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { nivelPlan, normalizarPlanClave } from "@/lib/planes/plan-access";

type Relacion<T> = T | T[] | null;

type CitaRaw = {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  precio: number | string | null;
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

type PlanRaw = {
  id: string;
  clave: string;
  nombre: string;
  precio_gs: number | string | null;
  permite_reportes_avanzados: boolean | null;
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

function mesInfo(offset = 0) {
  let year = Number(parteFechaAsuncion("year"));
  let month = Number(parteFechaAsuncion("month")) + offset;

  while (month <= 0) {
    month += 12;
    year -= 1;
  }

  while (month > 12) {
    month -= 12;
    year += 1;
  }

  let nextYear = year;
  let nextMonth = month + 1;

  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  return {
    year,
    month,
    desde: `${year}-${String(month).padStart(2, "0")}-01`,
    hasta: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
    label: `${String(month).padStart(2, "0")}/${year}`,
  };
}

function formatGs(valor: number) {
  return `Gs. ${valor.toLocaleString("es-PY")}`;
}

function precio(cita: CitaRaw) {
  return Number(cita.precio ?? 0);
}

function porcentajeCambio(actual: number, anterior: number) {
  if (anterior === 0 && actual === 0) return "0%";
  if (anterior === 0) return "+100%";
  const diff = ((actual - anterior) / anterior) * 100;
  return `${diff >= 0 ? "+" : ""}${Math.round(diff)}%`;
}

function sumarPorNombre(
  citas: CitaRaw[],
  obtenerNombre: (cita: CitaRaw) => string
) {
  const map = new Map<string, { nombre: string; cantidad: number; total: number }>();

  for (const cita of citas) {
    const nombre = obtenerNombre(cita);
    const actual = map.get(nombre) ?? { nombre, cantidad: 0, total: 0 };

    actual.cantidad += 1;
    actual.total += precio(cita);

    map.set(nombre, actual);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
    return b.total - a.total;
  });
}

function sumarPorHora(citas: CitaRaw[]) {
  const map = new Map<string, { nombre: string; cantidad: number; total: number }>();

  for (const cita of citas) {
    const hora = String(cita.hora_inicio ?? "").slice(0, 5);
    const actual = map.get(hora) ?? { nombre: hora || "Sin hora", cantidad: 0, total: 0 };

    actual.cantidad += 1;
    actual.total += precio(cita);

    map.set(hora, actual);
  }

  return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

function sumarPorDiaSemana(citas: CitaRaw[]) {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const map = new Map<string, { nombre: string; cantidad: number; total: number }>();

  for (const dia of dias) {
    map.set(dia, { nombre: dia, cantidad: 0, total: 0 });
  }

  for (const cita of citas) {
    const date = new Date(`${cita.fecha}T12:00:00`);
    const nombre = dias[date.getDay()] ?? "Sin día";
    const actual = map.get(nombre) ?? { nombre, cantidad: 0, total: 0 };

    actual.cantidad += 1;
    actual.total += precio(cita);

    map.set(nombre, actual);
  }

  return Array.from(map.values());
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
  icon: typeof DollarSign;
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

function Barra({
  label,
  value,
  max,
  right,
}: {
  label: string;
  value: number;
  max: number;
  right?: string;
}) {
  const width = max <= 0 ? 0 : Math.max(6, Math.round((value / max) * 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-medium">{label}</span>
        <span className="shrink-0 text-muted-foreground">{right ?? value}</span>
      </div>

      <div className="mt-2 h-3 rounded-full bg-muted">
        <div
          className="h-3 rounded-full bg-primary"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function RankingCard({
  titulo,
  items,
  modo = "cantidad",
}: {
  titulo: string;
  items: { nombre: string; cantidad: number; total: number }[];
  modo?: "cantidad" | "dinero";
}) {
  const max = Math.max(...items.map((item) => item.cantidad), 1);

  return (
    <div className="rounded-3xl border bg-background p-5 shadow-sm">
      <h2 className="text-xl font-bold">{titulo}</h2>

      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Todavía no hay datos suficientes.
          </p>
        ) : (
          items.slice(0, 7).map((item) => (
            <Barra
              key={item.nombre}
              label={item.nombre}
              value={item.cantidad}
              max={max}
              right={modo === "dinero" ? formatGs(item.total) : `${item.cantidad} citas`}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default async function ReportesPage() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = createServiceRoleClient();

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

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id, nombre")
    .eq("id", membresia.negocio_id)
    .maybeSingle();

  if (negocioError) throw new Error(negocioError.message);

  if (!negocio) {
    redirect("/onboarding/negocio");
  }

  const { data: suscripcionActual, error: suscripcionError } = await supabase
    .from("suscripciones")
    .select("plan_id")
    .eq("negocio_id", membresia.negocio_id)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (suscripcionError) throw new Error(suscripcionError.message);

  let plan: PlanRaw | null = null;

  if (suscripcionActual?.plan_id) {
    const { data: planData, error: planError } = await supabase
      .from("planes_saas")
      .select("id, clave, nombre, precio_gs, permite_reportes_avanzados")
      .eq("id", suscripcionActual.plan_id)
      .maybeSingle();

    if (planError) throw new Error(planError.message);

    plan = planData as PlanRaw | null;
  }

  const planClave = normalizarPlanClave(plan?.clave ?? "gratis");
  const nivelActual = nivelPlan(planClave);

  if (nivelActual < 1) {
    return (
      <PremiumFeaturePage
        titulo="Reportes disponibles desde Plan Básico"
        descripcion="Activá reportes para ver ingresos, citas por estado, servicios más reservados y métricas útiles para tomar decisiones."
        desde="Plan Básico"
        activo={false}
        estadoActivoTitulo=""
        estadoActivoDescripcion=""
      />
    );
  }

  const mesActual = mesInfo(0);
  const mesAnterior = mesInfo(-1);

  const { data: citasData, error: citasError } = await supabase
    .from("citas")
    .select(
      `
      id,
      fecha,
      hora_inicio,
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
    .gte("fecha", mesAnterior.desde)
    .lt("fecha", mesActual.hasta)
    .order("fecha", { ascending: true });

  if (citasError) throw new Error(citasError.message);

  const todas = (citasData ?? []) as CitaRaw[];

  const citasMes = todas.filter(
    (cita) => cita.fecha >= mesActual.desde && cita.fecha < mesActual.hasta
  );

  const citasAnterior = todas.filter(
    (cita) => cita.fecha >= mesAnterior.desde && cita.fecha < mesAnterior.hasta
  );

  const completadas = citasMes.filter((cita) => cita.estado === "completada");
  const confirmadas = citasMes.filter((cita) => cita.estado === "confirmada");
  const pendientes = citasMes.filter((cita) => cita.estado === "pendiente");
  const canceladas = citasMes.filter((cita) => cita.estado === "cancelada");
  const noAsistio = citasMes.filter((cita) => cita.estado === "no_asistio");

  const citasValidas = citasMes.filter((cita) =>
    ["confirmada", "completada", "no_asistio"].includes(cita.estado)
  );

  const ingresoReal = completadas.reduce((acc, cita) => acc + precio(cita), 0);
  const ingresoEstimado = confirmadas.reduce((acc, cita) => acc + precio(cita), 0);
  const perdidaNoAsistio = noAsistio.reduce((acc, cita) => acc + precio(cita), 0);

  const ingresoRealAnterior = citasAnterior
    .filter((cita) => cita.estado === "completada")
    .reduce((acc, cita) => acc + precio(cita), 0);

  const serviciosRanking = sumarPorNombre(
    citasValidas,
    (cita) => obtenerObjeto(cita.servicios)?.nombre ?? "Servicio"
  );

  const empleadosRanking = sumarPorNombre(
    citasValidas,
    (cita) => obtenerObjeto(cita.empleados)?.nombre ?? "Empleado"
  );

  const clientesRanking = sumarPorNombre(
    citasValidas,
    (cita) => obtenerObjeto(cita.clientes)?.nombre_completo ?? "Cliente"
  );

  const horasRanking = sumarPorHora(citasValidas);
  const diasRanking = sumarPorDiaSemana(citasValidas);

  const reportesAvanzados = nivelActual >= 2 || plan?.permite_reportes_avanzados === true;

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
              {negocio.nombre} · Mes {mesActual.label} · Plan {plan?.nombre ?? "Gratis"}
            </p>
          </div>

          {reportesAvanzados ? (
            <Link
              href="/dashboard/exportar"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar datos
            </Link>
          ) : (
            <Link
              href="/dashboard/planes"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-yellow-200 bg-yellow-50 px-4 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-100"
            >
              <Crown className="mr-2 h-4 w-4" />
              Avanzados en Profesional
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Ingresos reales"
          valor={formatGs(ingresoReal)}
          descripcion="Solo citas completadas."
          icon={DollarSign}
        />

        <MetricCard
          titulo="Ingresos estimados"
          valor={formatGs(ingresoEstimado)}
          descripcion="Citas confirmadas pendientes de atención."
          icon={TrendingUp}
        />

        <MetricCard
          titulo="Citas atendidas"
          valor={String(completadas.length)}
          descripcion="Citas marcadas como completadas."
          icon={CalendarDays}
        />

        <MetricCard
          titulo="No asistieron"
          valor={String(noAsistio.length)}
          descripcion={`Pérdida estimada: ${formatGs(perdidaNoAsistio)}.`}
          icon={AlertTriangle}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-3xl border bg-background p-5 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold">Citas por estado</h2>

          <div className="mt-4 space-y-4">
            {[
              { nombre: "Pendientes", cantidad: pendientes.length },
              { nombre: "Confirmadas", cantidad: confirmadas.length },
              { nombre: "Completadas", cantidad: completadas.length },
              { nombre: "Canceladas", cantidad: canceladas.length },
              { nombre: "No asistió", cantidad: noAsistio.length },
            ].map((item) => (
              <Barra
                key={item.nombre}
                label={item.nombre}
                value={item.cantidad}
                max={Math.max(citasMes.length, 1)}
                right={`${item.cantidad}`}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <RankingCard
            titulo="Servicios más reservados"
            items={serviciosRanking}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <RankingCard titulo="Rendimiento por empleado" items={empleadosRanking} />
        <RankingCard titulo="Clientes frecuentes" items={clientesRanking} />
      </section>

      {reportesAvanzados ? (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <MetricCard
              titulo="Crecimiento vs mes anterior"
              valor={porcentajeCambio(ingresoReal, ingresoRealAnterior)}
              descripcion={`Mes anterior: ${formatGs(ingresoRealAnterior)}.`}
              icon={TrendingUp}
            />

            <MetricCard
              titulo="Ticket promedio real"
              valor={formatGs(
                completadas.length > 0
                  ? Math.round(ingresoReal / completadas.length)
                  : 0
              )}
              descripcion="Promedio de ingresos por cita completada."
              icon={DollarSign}
            />

            <MetricCard
              titulo="Tasa de no asistencia"
              valor={`${citasValidas.length > 0 ? Math.round((noAsistio.length / citasValidas.length) * 100) : 0}%`}
              descripcion="Sirve para decidir si conviene enviar recordatorios."
              icon={UserCheck}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <RankingCard titulo="Horarios con más demanda" items={horasRanking} />
            <RankingCard titulo="Días con más movimiento" items={diasRanking} />
          </section>

          <section className="rounded-3xl border bg-background p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">Lectura rápida del mes</h2>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <Scissors className="h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Servicio fuerte</p>
                <p className="mt-1 font-bold">
                  {serviciosRanking[0]?.nombre ?? "Sin datos todavía"}
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Horario fuerte</p>
                <p className="mt-1 font-bold">
                  {horasRanking.sort((a, b) => b.cantidad - a.cantidad)[0]?.nombre ?? "Sin datos"}
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Cliente frecuente</p>
                <p className="mt-1 font-bold">
                  {clientesRanking[0]?.nombre ?? "Sin datos todavía"}
                </p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-yellow-200 bg-yellow-50/70 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-yellow-800">
                <Crown className="h-5 w-5" />
                <h2 className="text-xl font-bold">Reportes avanzados</h2>
              </div>

              <p className="mt-2 max-w-2xl text-sm text-yellow-800/80">
                En el Plan Profesional vas a ver crecimiento vs mes anterior,
                ticket promedio, horarios fuertes, días con más demanda y exportación CSV.
              </p>
            </div>

            <Link
              href="/dashboard/planes"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Mejorar plan
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}