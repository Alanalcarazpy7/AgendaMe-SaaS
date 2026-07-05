import Link from "next/link";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

type PageProps = {
  searchParams?: Promise<{
    desde?: string;
    hasta?: string;
    sucursalId?: string;
  }>;
};

type CitaReporte = {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  precio: number | string | null;
  sucursal_id: string | null;
  servicios: Relacion<{
    nombre: string;
    precio: number | string | null;
  }>;
  empleados: Relacion<{
    nombre: string;
  }>;
  clientes: Relacion<{
    nombre_completo: string;
  }>;
  sucursales: Relacion<{
    id: string;
    nombre: string;
  }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function formatGs(valor: number) {
  return `Gs. ${valor.toLocaleString("es-PY")}`;
}

function fechaHoyAsuncion() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return {
    hoy: `${year}-${month}-${day}`,
    inicioMes: `${year}-${month}-01`,
  };
}

function precioCita(cita: CitaReporte) {
  const servicio = obtenerObjeto(cita.servicios);
  const precioCitaValor = Number(cita.precio ?? 0);
  const precioServicioValor = Number(servicio?.precio ?? 0);

  return precioCitaValor > 0 ? precioCitaValor : precioServicioValor;
}

function estadoCuentaIngreso(estado: string) {
  return ["confirmada", "completada", "no_asistio"].includes(estado);
}

function sumarUno(obj: Record<string, number>, key: string) {
  obj[key] = (obj[key] ?? 0) + 1;
}

function sumarMonto(obj: Record<string, number>, key: string, monto: number) {
  obj[key] = (obj[key] ?? 0) + monto;
}

function top(obj: Record<string, number>, limit = 8) {
  return Object.entries(obj)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border bg-background p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function BarList({
  title,
  items,
  empty,
  money = false,
}: {
  title: string;
  items: { label: string; value: number }[];
  empty: string;
  money?: boolean;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-3xl border bg-background p-5 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>

      <div className="mt-4 space-y-4">
        {items.length === 0 ? (
          <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            {empty}
          </p>
        ) : (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className="font-bold">
                  {money ? formatGs(item.value) : item.value}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function LineChart({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  const width = 700;
  const height = 220;
  const padding = 24;
  const max = Math.max(...items.map((item) => item.value), 1);

  const points = items.map((item, index) => {
    const x =
      items.length <= 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (items.length - 1);

    const y =
      height -
      padding -
      (item.value / max) * (height - padding * 2);

    return { x, y, ...item };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="rounded-3xl border bg-background p-5 shadow-sm">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Evolución de ingresos estimados por día.
      </p>

      {items.length === 0 ? (
        <p className="mt-4 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          Todavía no hay ingresos para graficar.
        </p>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-[240px] min-w-[680px] rounded-2xl border bg-muted/20"
            >
              <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={height - padding}
                stroke="currentColor"
                strokeOpacity="0.15"
              />
              <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={height - padding}
                stroke="currentColor"
                strokeOpacity="0.15"
              />

              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                points={polyline}
              />

              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="5" fill="currentColor" />
                  <text
                    x={point.x}
                    y={height - 6}
                    textAnchor="middle"
                    fontSize="11"
                    fill="currentColor"
                    opacity="0.65"
                  >
                    {point.label.slice(5)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {items.slice(-4).map((item) => (
              <div key={item.label} className="rounded-2xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-bold">{formatGs(item.value)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const access = await requireDashboardAccess();

  if (nivelPlan(access.planClave) < 1) {
    return (
      <PremiumFeaturePage
        titulo="Reportes"
        descripcion="Visualizá métricas importantes de tu negocio: citas, ingresos, servicios más reservados y rendimiento general."
        desde="Plan Básico"
        activo={false}
        estadoActivoTitulo=""
        estadoActivoDescripcion=""
      />
    );
  }

  requirePermission(access, "puedeVerReportes");

  const params = (await searchParams) ?? {};
  const fechasDefault = fechaHoyAsuncion();

  const desde = params.desde || fechasDefault.inicioMes;
  const hasta = params.hasta || fechasDefault.hoy;
  const sucursalIdParam = params.sucursalId || "todas";

  const supabase = createServiceRoleClient();

  const esAdminEmpresarial =
    access.scope === "global" && nivelPlan(access.planClave) >= 3;

  const { data: sucursales } = esAdminEmpresarial
    ? await supabase
        .from("sucursales")
        .select("id, nombre, estado")
        .eq("negocio_id", access.negocio.id)
        .eq("estado", "activo")
        .order("created_at", { ascending: true })
    : { data: [] };

  let citasQuery = supabase
    .from("citas")
    .select(
      `
      id,
      fecha,
      hora_inicio,
      estado,
      precio,
      sucursal_id,
      servicios (
        nombre,
        precio
      ),
      empleados (
        nombre
      ),
      clientes (
        nombre_completo
      ),
      sucursales (
        id,
        nombre
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true });

  citasQuery = applySucursalScope(citasQuery, access);

  if (
    esAdminEmpresarial &&
    sucursalIdParam !== "todas" &&
    sucursalIdParam.trim() !== ""
  ) {
    citasQuery = citasQuery.eq("sucursal_id", sucursalIdParam);
  }

  const { data, error } = await citasQuery;

  if (error) throw new Error(error.message);

  const citas = (data ?? []) as CitaReporte[];

  const totalCitas = citas.length;
  const pendientes = citas.filter((cita) => cita.estado === "pendiente").length;
  const confirmadas = citas.filter((cita) => cita.estado === "confirmada").length;
  const completadas = citas.filter((cita) => cita.estado === "completada").length;
  const canceladas = citas.filter((cita) => cita.estado === "cancelada").length;
  const noAsistio = citas.filter((cita) => cita.estado === "no_asistio").length;

  const citasAtendidas = completadas + noAsistio;
  const tasaNoAsistencia =
    citasAtendidas > 0 ? Math.round((noAsistio / citasAtendidas) * 100) : 0;

  const ingresosEstimados = citas
    .filter((cita) => estadoCuentaIngreso(cita.estado))
    .reduce((acc, cita) => acc + precioCita(cita), 0);

  const ingresosReales = citas
    .filter((cita) => cita.estado === "completada")
    .reduce((acc, cita) => acc + precioCita(cita), 0);

  const perdidaNoAsistencia = citas
    .filter((cita) => cita.estado === "no_asistio")
    .reduce((acc, cita) => acc + precioCita(cita), 0);

  const ticketPromedio =
    completadas > 0 ? Math.round(ingresosReales / completadas) : 0;

  const porEstado: Record<string, number> = {};
  const porServicio: Record<string, number> = {};
  const porEmpleado: Record<string, number> = {};
  const porCliente: Record<string, number> = {};
  const porHorario: Record<string, number> = {};
  const ingresosPorDia: Record<string, number> = {};
  const ingresosPorSucursal: Record<string, number> = {};
  const citasPorSucursal: Record<string, number> = {};

  for (const cita of citas) {
    const servicio = obtenerObjeto(cita.servicios);
    const empleado = obtenerObjeto(cita.empleados);
    const cliente = obtenerObjeto(cita.clientes);
    const sucursal = obtenerObjeto(cita.sucursales);
    const monto = precioCita(cita);

    sumarUno(porEstado, cita.estado);
    sumarUno(porServicio, servicio?.nombre ?? "Sin servicio");
    sumarUno(porEmpleado, empleado?.nombre ?? "Sin empleado");
    sumarUno(porCliente, cliente?.nombre_completo ?? "Sin cliente");
    sumarUno(porHorario, String(cita.hora_inicio).slice(0, 5));

    if (estadoCuentaIngreso(cita.estado)) {
      sumarMonto(ingresosPorDia, cita.fecha, monto);
    }

    if (sucursal) {
      sumarUno(citasPorSucursal, sucursal.nombre);

      if (estadoCuentaIngreso(cita.estado)) {
        sumarMonto(ingresosPorSucursal, sucursal.nombre, monto);
      }
    }
  }

  const serieIngresos = Object.entries(ingresosPorDia)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const comparativoSucursal = Object.keys(citasPorSucursal)
    .map((nombre) => ({
      label: nombre,
      citas: citasPorSucursal[nombre] ?? 0,
      ingresos: ingresosPorSucursal[nombre] ?? 0,
    }))
    .sort((a, b) => b.ingresos - a.ingresos);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          {access.scope === "global"
            ? "Reporte global"
            : `Reporte de ${access.sucursalNombre}`}
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">Reportes</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Métricas desde {desde} hasta {hasta}.{" "}
          {access.scope === "global"
            ? "Vista del negocio."
            : "Solo incluye la sucursal asignada."}
        </p>

        <form className="mt-5 grid gap-3 md:grid-cols-4" action="/dashboard/reportes">
          <div>
            <label className="text-sm font-medium">Desde</label>
            <input
              type="date"
              name="desde"
              defaultValue={desde}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Hasta</label>
            <input
              type="date"
              name="hasta"
              defaultValue={hasta}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            />
          </div>

          {esAdminEmpresarial && (
            <div>
              <label className="text-sm font-medium">Sucursal</label>
              <select
                name="sucursalId"
                defaultValue={sucursalIdParam}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              >
                <option value="todas">Todas las sucursales</option>
                {(sucursales ?? []).map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="h-11 rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Filtrar
            </button>

            <Link
              href="/dashboard/reportes"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted"
            >
              Limpiar
            </Link>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Ingresos reales"
          value={formatGs(ingresosReales)}
          description="Suma de citas completadas."
        />

        <MetricCard
          title="Ingresos estimados"
          value={formatGs(ingresosEstimados)}
          description="Confirmadas, completadas y no asistió."
        />

        <MetricCard
          title="Citas"
          value={String(totalCitas)}
          description="Citas registradas en esta vista."
        />

        <MetricCard
          title="Ticket promedio"
          value={formatGs(ticketPromedio)}
          description="Promedio por cita completada."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Pendientes"
          value={String(pendientes)}
          description="Esperando confirmación."
        />

        <MetricCard
          title="Confirmadas"
          value={String(confirmadas)}
          description="Citas confirmadas."
        />

        <MetricCard
          title="Completadas"
          value={String(completadas)}
          description="Atenciones finalizadas."
        />

        <MetricCard
          title="Canceladas"
          value={String(canceladas)}
          description="Citas canceladas."
        />
      </section>

      <LineChart title="Ingresos por día" items={serieIngresos} />

      {access.puedeVerReportesGlobales && comparativoSucursal.length > 0 && (
        <section className="rounded-3xl border bg-background p-5 shadow-sm">
          <h2 className="text-xl font-bold">Comparación por sucursal</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {comparativoSucursal.map((item) => (
              <div key={item.label} className="rounded-2xl border bg-muted/20 p-4">
                <p className="font-bold">{item.label}</p>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-background p-3">
                    <p className="text-muted-foreground">Citas</p>
                    <p className="mt-1 text-xl font-bold">{item.citas}</p>
                  </div>

                  <div className="rounded-xl bg-background p-3">
                    <p className="text-muted-foreground">Ingresos estimados</p>
                    <p className="mt-1 text-xl font-bold">
                      {formatGs(item.ingresos)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <BarList
          title="Citas por estado"
          items={top(porEstado)}
          empty="Todavía no hay citas."
        />

        <BarList
          title="Servicios más reservados"
          items={top(porServicio)}
          empty="Todavía no hay servicios reservados."
        />

        <BarList
          title="Rendimiento por empleado"
          items={top(porEmpleado)}
          empty="Todavía no hay empleados con citas."
        />

        <BarList
          title="Clientes frecuentes"
          items={top(porCliente)}
          empty="Todavía no hay clientes frecuentes."
        />

        <BarList
          title="Horarios con más demanda"
          items={top(porHorario)}
          empty="Todavía no hay horarios con actividad."
        />

        <BarList
          title="Ingresos por día"
          items={top(ingresosPorDia)}
          empty="Todavía no hay ingresos."
          money
        />
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <h2 className="text-xl font-bold">Lectura rápida</h2>

        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>
            Se registraron <strong className="text-foreground">{totalCitas}</strong>{" "}
            citas en el período seleccionado.
          </p>

          <p>
            El ingreso real por citas completadas es{" "}
            <strong className="text-foreground">{formatGs(ingresosReales)}</strong>.
          </p>

          <p>
            El ingreso estimado total es{" "}
            <strong className="text-foreground">{formatGs(ingresosEstimados)}</strong>.
          </p>

          <p>
            La tasa de no asistencia es{" "}
            <strong className="text-foreground">{tasaNoAsistencia}%</strong>.
          </p>

          <p>
            La pérdida estimada por no asistencia es{" "}
            <strong className="text-foreground">{formatGs(perdidaNoAsistencia)}</strong>.
          </p>
        </div>
      </section>
    </div>
  );
}