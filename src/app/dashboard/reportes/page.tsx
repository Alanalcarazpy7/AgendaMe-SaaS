import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Crown,
  Filter,
  type LucideIcon,
  ReceiptText,
  RotateCcw,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import {
  BranchComparisonChart,
  DemandProfileChart,
  RevenueTrendRechart,
  StatusDonutRechart,
} from "@/components/reportes/reportes-charts";
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

type MoneyItem = { label: string; value: number; amount: number };

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function formatGs(valor: number) {
  return `Gs. ${valor.toLocaleString("es-PY")}`;
}

function formatPercent(valor: number) {
  return `${valor}%`;
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

function fechaCorta(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Asuncion",
  });
}

function diaSemana(fecha: string) {
  return new Date(`${fecha}T12:00:00Z`).toLocaleDateString("es-PY", {
    weekday: "short",
    timeZone: "America/Asuncion",
  });
}

function fechasEntre(desde: string, hasta: string, maxDias = 45) {
  const inicio = new Date(`${desde}T12:00:00Z`);
  const fin = new Date(`${hasta}T12:00:00Z`);
  const fechas: string[] = [];

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return fechas;

  for (let cursor = inicio, index = 0; cursor <= fin && index < maxDias; index += 1) {
    fechas.push(
      `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${String(cursor.getUTCDate()).padStart(2, "0")}`
    );
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return fechas;
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

function topMoney(counts: Record<string, number>, amounts: Record<string, number>, limit = 6) {
  return Object.keys({ ...counts, ...amounts })
    .map((label) => ({
      label,
      value: counts[label] ?? 0,
      amount: amounts[label] ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount || b.value - a.value)
    .slice(0, limit);
}

function porcentaje(parte: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

function bloqueHorario(hora: string) {
  const hour = Number(String(hora).slice(0, 2));

  if (hour < 11) return "Mañana";
  if (hour < 14) return "Mediodía";
  if (hour < 18) return "Tarde";
  return "Noche";
}

function cardBase(extra = "") {
  return `rounded-[1.5rem] border border-border/80 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5 ${extra}`;
}

function EmptyBox({ children }: { children: string }) {
  return (
    <p className="rounded-[1.15rem] border border-dashed bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </p>
  );
}

function MetricTile({
  title,
  value,
  hint,
  icon: Icon,
  help,
  tone = "primary",
}: {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  help: string;
  tone?: "primary" | "cyan" | "teal" | "green" | "slate" | "red";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    slate: "bg-slate-900/10 text-slate-800 dark:bg-white/10 dark:text-slate-100",
    red: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <article className={`${cardBase("p-4")} min-h-32 transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-primary/25`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
        </div>

        <div
          className={`group/help relative rounded-2xl p-2.5 outline-none ${toneClass}`}
          tabIndex={0}
          aria-label={help}
        >
          <Icon className="h-4 w-4" />
          <div className="pointer-events-none absolute bottom-11 right-0 z-20 w-64 origin-bottom-right scale-95 rounded-2xl border border-border/80 bg-popover/95 px-3 py-2 text-left text-xs font-medium leading-5 text-popover-foreground opacity-0 shadow-2xl shadow-slate-950/15 ring-1 ring-white/10 backdrop-blur-xl transition-[opacity,transform] duration-150 ease-[var(--ease-out)] group-hover/help:scale-100 group-hover/help:opacity-100 group-focus-visible/help:scale-100 group-focus-visible/help:opacity-100">
            {help}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{hint}</p>
    </article>
  );
}

function ServiceCards({ items }: { items: MoneyItem[] }) {
  const max = Math.max(...items.map((item) => item.amount), 1);

  return (
    <section className={cardBase("p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Servicios clave</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Cruza volumen con ingreso estimado.
          </p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-primary" />
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyBox>Todavía no hay servicios con ingresos.</EmptyBox>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <article key={item.label} className="rounded-[1.15rem] border bg-background/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.value} reservas</p>
                </div>
                <span className="rounded-xl bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                  #{index + 1}
                </span>
              </div>
              <p className="mt-3 text-lg font-bold">{formatGs(item.amount)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                  style={{ width: `${Math.max((item.amount / max) * 100, 6)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ClientGrid({ items }: { items: MoneyItem[] }) {
  return (
    <section className={cardBase("p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Clientes que conviene cuidar</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Frecuencia e ingreso estimado para fidelización.
          </p>
        </div>
        <Users className="h-5 w-5 text-primary" />
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyBox>Todavía no hay clientes recurrentes.</EmptyBox>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl border bg-background/60 p-3">
              <p className="truncate text-sm font-bold">{item.label}</p>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{item.value} reservas</span>
                <span className="font-bold text-foreground">{formatGs(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmployeeTable({ items }: { items: MoneyItem[] }) {
  return (
    <section className={cardBase("p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Equipo</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Citas e ingreso estimado por empleado.
          </p>
        </div>
        <UserRoundCheck className="h-5 w-5 text-primary" />
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyBox>Todavía no hay empleados con citas.</EmptyBox>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[1.15rem] border">
          <div className="grid grid-cols-[minmax(0,1fr)_4rem_7rem] bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
            <span>Empleado</span>
            <span className="text-right">Citas</span>
            <span className="text-right">Ingreso</span>
          </div>
          {items.map((item) => (
            <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_4rem_7rem] border-t px-3 py-3 text-sm">
              <span className="truncate font-semibold">{item.label}</span>
              <span className="text-right font-bold">{item.value}</span>
              <span className="text-right font-bold">{formatGs(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EnterpriseOnlyNotice() {
  return (
    <section className={cardBase("p-4")}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Crown className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Reportes por sucursal</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            La comparación entre sucursales se activa solamente en el plan Empresarial.
          </p>
        </div>
      </div>
    </section>
  );
}

function InsightCard({
  title,
  description,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: "primary" | "green" | "red" | "cyan";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    red: "bg-destructive/10 text-destructive",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
  }[tone];

  return (
    <article className="rounded-[1.15rem] border bg-background/60 p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{description}</p>
    </article>
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

  const esPlanEmpresarial = nivelPlan(access.planClave) >= 3;
  const esAdminEmpresarial = access.scope === "global" && esPlanEmpresarial;

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
  const tasaCancelacion = porcentaje(canceladas, totalCitas);
  const tasaResolucion = porcentaje(completadas + confirmadas, totalCitas);
  const citasSinCompletar = pendientes + canceladas + noAsistio;

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
  const ingresosPorServicio: Record<string, number> = {};
  const porEmpleado: Record<string, number> = {};
  const ingresosPorEmpleado: Record<string, number> = {};
  const porCliente: Record<string, number> = {};
  const ingresosPorCliente: Record<string, number> = {};
  const porHorario: Record<string, number> = {};
  const porDiaSemana: Record<string, number> = {};
  const porBloque: Record<string, number> = {};
  const ingresosPorDia: Record<string, number> = {};
  const citasPorDia: Record<string, number> = {};
  const ingresosPorSucursal: Record<string, number> = {};
  const citasPorSucursal: Record<string, number> = {};
  const noAsistioPorSucursal: Record<string, number> = {};
  const canceladasPorSucursal: Record<string, number> = {};

  for (const cita of citas) {
    const servicio = obtenerObjeto(cita.servicios);
    const empleado = obtenerObjeto(cita.empleados);
    const cliente = obtenerObjeto(cita.clientes);
    const sucursal = obtenerObjeto(cita.sucursales);
    const monto = precioCita(cita);
    const servicioLabel = servicio?.nombre ?? "Sin servicio";
    const empleadoLabel = empleado?.nombre ?? "Sin empleado";
    const clienteLabel = cliente?.nombre_completo ?? "Sin cliente";
    const sucursalLabel = sucursal?.nombre ?? "Sin sucursal";
    const day = diaSemana(cita.fecha);
    const block = bloqueHorario(cita.hora_inicio);

    sumarUno(porEstado, estadoLabel(cita.estado));
    sumarUno(porServicio, servicioLabel);
    sumarUno(porEmpleado, empleadoLabel);
    sumarUno(porCliente, clienteLabel);
    sumarUno(porHorario, String(cita.hora_inicio).slice(0, 5));
    sumarUno(porDiaSemana, day);
    sumarUno(porBloque, `${day}|${block}`);
    sumarUno(citasPorDia, cita.fecha);

    if (estadoCuentaIngreso(cita.estado)) {
      sumarMonto(ingresosPorDia, cita.fecha, monto);
      sumarMonto(ingresosPorServicio, servicioLabel, monto);
      sumarMonto(ingresosPorEmpleado, empleadoLabel, monto);
      sumarMonto(ingresosPorCliente, clienteLabel, monto);
      sumarMonto(ingresosPorSucursal, sucursalLabel, monto);
    }

    if (sucursal) {
      sumarUno(citasPorSucursal, sucursalLabel);

      if (cita.estado === "no_asistio") sumarUno(noAsistioPorSucursal, sucursalLabel);
      if (cita.estado === "cancelada") sumarUno(canceladasPorSucursal, sucursalLabel);
    }
  }

  const fechasGrafico = fechasEntre(desde, hasta);
  const serieIngresos = fechasGrafico.map((fecha) => ({
    fecha,
    fechaLabel: fechaCorta(fecha),
    ingresos: ingresosPorDia[fecha] ?? 0,
    citas: citasPorDia[fecha] ?? 0,
  }));

  const dias = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  const bloques = ["Mañana", "Mediodía", "Tarde", "Noche"];
  const demandaPorBloque = bloques.map((label) => ({
    label,
    citas: dias.reduce((acc, day) => acc + (porBloque[`${day}|${label}`] ?? 0), 0),
  }));
  const demandaPorDia = dias.map((label) => ({
    label,
    citas: porDiaSemana[label] ?? 0,
  }));

  const comparativoSucursal = Object.keys(citasPorSucursal)
    .map((nombre) => ({
      label: nombre,
      citas: citasPorSucursal[nombre] ?? 0,
      ingresos: ingresosPorSucursal[nombre] ?? 0,
      noCompletadas:
        (noAsistioPorSucursal[nombre] ?? 0) + (canceladasPorSucursal[nombre] ?? 0),
    }))
    .sort((a, b) => b.ingresos - a.ingresos);
  const topServicio = top(porServicio, 1)[0];
  const topServicioIngreso = top(ingresosPorServicio, 1)[0];
  const topHorario = top(porHorario, 1)[0];
  const topCliente = top(porCliente, 1)[0];
  const topDia = top(porDiaSemana, 1)[0];
  const serviciosClave = topMoney(porServicio, ingresosPorServicio, 4);
  const clientesClave = topMoney(porCliente, ingresosPorCliente, 6);
  const equipo = topMoney(porEmpleado, ingresosPorEmpleado, 6);
  const estadoItems = top(porEstado, 5);

  return (
    <div className="space-y-4">
      <section className={cardBase("overflow-hidden")}>
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="relative p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-teal-500" />

            <p className="inline-flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              {access.scope === "global"
                ? "Reporte global del negocio"
                : `Reporte de ${access.sucursalNombre}`}
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance">
              Reportes accionables
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Menos listas largas y más señales: demanda, servicios, clientes, equipo e ingresos.
            </p>

            <form className="mt-5 grid gap-3 md:grid-cols-4" action="/dashboard/reportes">
              <div>
                <label className="text-sm font-semibold">Desde</label>
                <input
                  type="date"
                  name="desde"
                  defaultValue={desde}
                  className="mt-2 h-10 w-full rounded-2xl border border-border/80 bg-background/70 px-3 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Hasta</label>
                <input
                  type="date"
                  name="hasta"
                  defaultValue={hasta}
                  className="mt-2 h-10 w-full rounded-2xl border border-border/80 bg-background/70 px-3 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>

              {esAdminEmpresarial && (
                <div>
                  <label className="text-sm font-semibold">Sucursal</label>
                  <select
                    name="sucursalId"
                    defaultValue={sucursalIdParam}
                    className="mt-2 h-10 w-full rounded-2xl border border-border/80 bg-background/70 px-3 text-sm outline-none transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out)] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 outline-none transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar
                </button>

                <Link
                  href="/dashboard/reportes"
                  className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Limpiar
                </Link>
              </div>
            </form>
          </div>

          <aside className="border-t border-border/70 bg-muted/30 p-4 xl:border-l xl:border-t-0">
            <div className="rounded-[1.35rem] border border-cyan-300/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] p-4 text-white shadow-xl shadow-cyan-950/20">
              <p className="text-sm font-semibold text-cyan-50/90">Lectura del período</p>
              <p className="mt-3 text-4xl font-bold tracking-tight">{totalCitas}</p>
              <p className="mt-1 text-sm text-cyan-50/90">citas registradas</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-cyan-50/80">Resolución</p>
                  <p className="mt-1 text-xl font-bold">{formatPercent(tasaResolucion)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-cyan-50/80">No asistencia</p>
                  <p className="mt-1 text-xl font-bold">{formatPercent(tasaNoAsistencia)}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={cardBase("p-4")}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Lectura rápida</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Señales accionables del período filtrado.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InsightCard
            title={pendientes > 0 ? "Confirmaciones pendientes" : "Agenda sin pendientes"}
            description={
              pendientes > 0
                ? `Hay ${pendientes} citas pendientes. Conviene confirmarlas para reducir incertidumbre.`
                : "No hay citas pendientes en esta vista."
            }
            icon={CalendarClock}
            tone={pendientes > 0 ? "red" : "green"}
          />
          <InsightCard
            title={topHorario ? `Mayor demanda a las ${topHorario.label}` : "Sin hora pico"}
            description={
              topHorario
                ? "Usá ese horario para planificar personal, duración de turnos o cupos adicionales."
                : "Todavía no hay suficientes citas para detectar una hora pico."
            }
            icon={Clock3}
          />
          <InsightCard
            title={topServicioIngreso ? `${topServicioIngreso.label} factura más` : "Sin servicio líder"}
            description={
              topServicioIngreso
                ? `${formatGs(topServicioIngreso.value)} de ingreso estimado. Revisá disponibilidad y precio.`
                : "Aún no hay ingresos suficientes para comparar servicios."
            }
            icon={CircleDollarSign}
            tone="cyan"
          />
          <InsightCard
            title={tasaCancelacion > 0 ? "Revisar cancelaciones" : "Sin señales de cancelación"}
            description={
              tasaCancelacion > 0
                ? `La tasa de cancelación es ${tasaCancelacion}%. Revisá recordatorios o confirmaciones.`
                : "No hay cancelaciones en el período filtrado."
            }
            icon={AlertTriangle}
            tone={tasaCancelacion > 0 ? "red" : "green"}
          />
        </div>

        <div className="mt-4 rounded-[1.15rem] border bg-muted/35 p-4 text-sm leading-7 text-muted-foreground">
          <p>
            Se registraron <strong className="text-foreground">{totalCitas}</strong> citas.
            Ingreso real:{" "}
            <strong className="text-foreground">{formatGs(ingresosReales)}</strong>.
            Ingreso estimado:{" "}
            <strong className="text-foreground">{formatGs(ingresosEstimados)}</strong>.
          </p>
          <p>
            No asistencia:{" "}
            <strong className="text-foreground">{formatPercent(tasaNoAsistencia)}</strong>
            {" "}· pérdida estimada:{" "}
            <strong className="text-foreground">{formatGs(perdidaNoAsistencia)}</strong>.
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          title="Ingresos reales"
          value={formatGs(ingresosReales)}
          hint="Citas completadas."
          icon={CircleDollarSign}
          help="Suma solo las citas marcadas como completadas. Sirve para estimar el dinero que realmente se concretó en el período."
          tone="green"
        />
        <MetricTile
          title="Ingresos estimados"
          value={formatGs(ingresosEstimados)}
          hint="Confirmadas, completadas y no asistió."
          icon={TrendingUp}
          help="Incluye citas confirmadas, completadas y no asistidas. Ayuda a ver el potencial de facturación, aunque no todo esté cobrado."
          tone="cyan"
        />
        <MetricTile
          title="Ticket promedio"
          value={formatGs(ticketPromedio)}
          hint="Promedio por cita completada."
          icon={ReceiptText}
          help="Promedio de ingreso por cada cita completada. Útil para saber cuánto deja normalmente una atención real."
          tone="primary"
        />
        <MetricTile
          title="Citas sin completar"
          value={String(citasSinCompletar)}
          hint="Pendientes, canceladas y no asistidas."
          icon={AlertTriangle}
          help="Cuenta las citas pendientes, canceladas y no asistidas. Si sube mucho, conviene revisar recordatorios, confirmaciones o disponibilidad."
          tone={citasSinCompletar > 0 ? "red" : "slate"}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          title="Hora pico"
          value={topHorario?.label ?? "Sin datos"}
          hint={topHorario ? `${topHorario.value} citas en ese horario.` : "Aún no hay concentración."}
          icon={Clock3}
          help="Horario con más reservas dentro del período. Sirve para reforzar personal, cupos o duración de turnos."
        />
        <MetricTile
          title="Día fuerte"
          value={topDia?.label ?? "Sin datos"}
          hint={topDia ? `${topDia.value} citas registradas.` : "Aún no hay demanda por día."}
          icon={CalendarDays}
          help="Día de la semana con mayor cantidad de citas. Ayuda a planificar promociones, horarios y capacidad operativa."
          tone="teal"
        />
        <MetricTile
          title="Cliente frecuente"
          value={topCliente?.label ?? "Sin datos"}
          hint={topCliente ? `${topCliente.value} reservas.` : "Aún no hay clientes recurrentes."}
          icon={UserRoundCheck}
          help="Cliente que más volvió a reservar en el período. Buen punto de partida para fidelización o beneficios."
          tone="cyan"
        />
        <MetricTile
          title="Servicio líder"
          value={topServicio?.label ?? "Sin datos"}
          hint={topServicio ? `${topServicio.value} reservas.` : "Aún no hay servicios destacados."}
          icon={CheckCircle2}
          help="Servicio con mayor cantidad de reservas. Indica qué oferta atrae más demanda y conviene cuidar en agenda."
          tone="green"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <RevenueTrendRechart data={serieIngresos} total={ingresosEstimados} />
        <DemandProfileChart blocks={demandaPorBloque} days={demandaPorDia} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <StatusDonutRechart data={estadoItems} total={totalCitas} />
        <ServiceCards items={serviciosClave} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ClientGrid items={clientesClave} />
        <EmployeeTable items={equipo} />
      </section>

      {esPlanEmpresarial && access.puedeVerReportesGlobales ? (
        <BranchComparisonChart data={comparativoSucursal} />
      ) : !esPlanEmpresarial && access.puedeGestionarPlanes ? (
        <EnterpriseOnlyNotice />
      ) : null}


    </div>
  );
}
