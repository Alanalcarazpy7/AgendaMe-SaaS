"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Clock3,
  LineChart,
  Store,
} from "lucide-react";

export type RevenuePoint = {
  fecha: string;
  fechaLabel: string;
  ingresos: number;
  citas: number;
};

export type DemandPoint = {
  label: string;
  citas: number;
};

export type StatusPoint = {
  label: string;
  value: number;
};

export type BranchPoint = {
  label: string;
  citas: number;
  ingresos: number;
  noCompletadas: number;
};

type TooltipPayload = {
  color?: string;
  name?: string;
  value?: number | string;
  payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
};

const CHART_COLORS = {
  primary: "#2563eb",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  green: "#10b981",
  red: "#ef4444",
  slate: "#64748b",
};

const STATUS_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.cyan,
  CHART_COLORS.teal,
  CHART_COLORS.red,
  CHART_COLORS.slate,
];

const AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 11,
  fontWeight: 600,
};

const GRID_STROKE = "var(--border)";
const CURSOR_FILL = "color-mix(in srgb, var(--muted) 72%, transparent)";

function formatGs(valor: number) {
  return `Gs. ${valor.toLocaleString("es-PY")}`;
}

function compactGs(valor: number | string) {
  const numericValue = Number(valor);

  if (numericValue >= 1000000) return `Gs. ${Math.round(numericValue / 1000000)}M`;
  if (numericValue >= 1000) return `Gs. ${Math.round(numericValue / 1000)}k`;

  return `Gs. ${numericValue.toLocaleString("es-PY")}`;
}

function formatTooltipValue(name: string | undefined, value: number | string | undefined) {
  if (name?.toLowerCase().includes("ingreso")) {
    return formatGs(Number(value ?? 0));
  }

  return value;
}

function chartCard(extra = "") {
  return `ag-report-chart rounded-[1.5rem] border border-border/80 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5 ${extra}`;
}

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-[1.15rem] border border-dashed bg-muted/35 p-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function BasicTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-40 rounded-2xl border border-border/80 bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
      <p className="mb-2 font-bold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={`${item.name}-${item.color}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color ?? CHART_COLORS.primary }}
              />
              {item.name}
            </span>
            <span className="font-bold">{formatTooltipValue(item.name, item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const firstPayload = payload[0]?.payload ?? {};
  const citas = Number(firstPayload.citas ?? 0);

  return (
    <div className="min-w-44 rounded-2xl border border-border/80 bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
      <p className="font-bold">{label}</p>
      <p className="mt-2 text-lg font-bold text-primary">
        {formatGs(Number(payload[0]?.value ?? 0))}
      </p>
      <p className="mt-1 text-muted-foreground">{citas} citas registradas</p>
    </div>
  );
}

export function RevenueTrendRechart({
  data,
  total,
}: {
  data: RevenuePoint[];
  total: number;
}) {
  const peak = [...data].sort((a, b) => b.ingresos - a.ingresos)[0];
  const activeDays = data.filter((item) => item.ingresos > 0).length;

  return (
    <section className={chartCard("overflow-hidden")}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Ingresos por día</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Tendencia con tooltip real para ver fecha, monto y citas.
              </p>
            </div>
            <LineChart className="h-5 w-5 text-primary" />
          </div>

          {data.length === 0 ? (
            <EmptyChart>Todavía no hay ingresos para graficar.</EmptyChart>
          ) : (
            <div className="mt-4 h-[245px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="agendaRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.34} />
                      <stop offset="60%" stopColor={CHART_COLORS.cyan} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
                  <XAxis
                    dataKey="fechaLabel"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={22}
                    tick={AXIS_TICK}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={64}
                    tickFormatter={compactGs}
                    tick={AXIS_TICK}
                  />
                  <Tooltip cursor={{ stroke: CHART_COLORS.primary, strokeDasharray: "4 4" }} content={<MoneyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    name="Ingresos"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={3}
                    fill="url(#agendaRevenueFill)"
                    dot={{ r: 3, fill: CHART_COLORS.primary, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: CHART_COLORS.cyan, stroke: "white", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <aside className="border-t border-border/70 bg-muted/25 p-4 lg:border-l lg:border-t-0">
          <p className="text-sm font-bold">Resumen de ingreso</p>
          <div className="mt-4 grid gap-2">
            <div className="rounded-2xl border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Total estimado</p>
              <p className="mt-1 text-lg font-bold">{formatGs(total)}</p>
            </div>
            <div className="rounded-2xl border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Pico</p>
              <p className="mt-1 text-sm font-bold">
                {peak?.ingresos ? `${peak.fechaLabel} · ${formatGs(peak.ingresos)}` : "Sin pico"}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Días con ingreso</p>
              <p className="mt-1 text-lg font-bold">{activeDays}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function DemandProfileChart({
  blocks,
  days,
}: {
  blocks: DemandPoint[];
  days: DemandPoint[];
}) {
  const hasData = [...blocks, ...days].some((item) => item.citas > 0);

  return (
    <section className={chartCard("p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Perfil de demanda</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Bloques y días donde conviene ajustar agenda y personal.
          </p>
        </div>
        <Clock3 className="h-5 w-5 text-primary" />
      </div>

      {!hasData ? (
        <EmptyChart>Todavía no hay demanda suficiente para comparar.</EmptyChart>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="h-[215px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blocks} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <Tooltip content={<BasicTooltip />} cursor={{ fill: CURSOR_FILL }} />
                <Bar dataKey="citas" name="Citas" radius={[12, 12, 5, 5]} fill={CHART_COLORS.cyan} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[215px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} />
                <Tooltip content={<BasicTooltip />} cursor={{ fill: CURSOR_FILL }} />
                <Bar dataKey="citas" name="Citas" radius={[12, 12, 5, 5]} fill={CHART_COLORS.teal} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

export function StatusDonutRechart({
  data,
  total,
}: {
  data: StatusPoint[];
  total: number;
}) {
  return (
    <section className={chartCard("p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Estado de agenda</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Distribución de citas por estado operativo.
          </p>
        </div>
        <BarChart3 className="h-5 w-5 text-primary" />
      </div>

      {data.length === 0 ? (
        <EmptyChart>Todavía no hay citas.</EmptyChart>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-[11rem_1fr] sm:items-center">
          <div className="relative h-[175px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={74}
                  paddingAngle={3}
                  cornerRadius={10}
                  stroke="var(--card)"
                  strokeWidth={3}
                >
                  {data.map((item, index) => (
                    <Cell key={item.label} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<BasicTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">citas</span>
            </div>
          </div>

          <div className="grid gap-2">
            {data.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
                  />
                  <span className="truncate font-semibold">{item.label}</span>
                </span>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function BranchComparisonChart({ data }: { data: BranchPoint[] }) {
  return (
    <section className={chartCard("p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Comparación por sucursal</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Exclusivo del plan Empresarial: ingresos, volumen y citas sin completar.
          </p>
        </div>
        <Store className="h-5 w-5 text-primary" />
      </div>

      {data.length === 0 ? (
        <EmptyChart>No hay datos de sucursales en este período.</EmptyChart>
      ) : (
        <div className="mt-4 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis yAxisId="money" axisLine={false} tickLine={false} tickFormatter={compactGs} tick={AXIS_TICK} />
              <YAxis yAxisId="count" orientation="right" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <Tooltip content={<BasicTooltip />} cursor={{ fill: CURSOR_FILL }} />
              <Bar yAxisId="money" dataKey="ingresos" name="Ingresos" radius={[12, 12, 5, 5]} fill={CHART_COLORS.primary} />
              <Bar yAxisId="count" dataKey="citas" name="Citas" radius={[12, 12, 5, 5]} fill={CHART_COLORS.cyan} />
              <Bar yAxisId="count" dataKey="noCompletadas" name="Sin completar" radius={[12, 12, 5, 5]} fill={CHART_COLORS.red} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
