"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Users2 } from "lucide-react";
import type {
  PuntoDistribucionPlan,
  PuntoIngresoMes,
  PuntoNegociosMes,
  PuntoSuscripciones,
} from "@/lib/admin/kpis";
import { formatearGuaranies } from "@/lib/admin/formatters/currency";

const CHART_COLORS = {
  primary: "#2563eb",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  green: "#10b981",
  red: "#ef4444",
  slate: "#64748b",
};

const PLAN_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.cyan,
  CHART_COLORS.teal,
  CHART_COLORS.green,
  CHART_COLORS.slate,
];
const SUS_COLORS = [CHART_COLORS.green, CHART_COLORS.red, CHART_COLORS.cyan];

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 700 };
const GRID_STROKE = "var(--border)";
const CURSOR_FILL = "color-mix(in srgb, var(--muted) 72%, transparent)";

function chartCard(extra = "") {
  return `ag-report-chart overflow-hidden rounded-[1.6rem] border border-border/75 bg-card/90 p-4 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgb(15_23_42/0.11)] dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5 ${extra}`;
}

function EmptyChart({ children }: { children: string }) {
  return (
    <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-[1.15rem] border border-dashed bg-muted/35 p-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function compactGs(valor: number | string) {
  const numero = Number(valor);
  if (numero >= 1_000_000) return `Gs. ${Math.round(numero / 1_000_000)}M`;
  if (numero >= 1_000) return `Gs. ${Math.round(numero / 1_000)}k`;
  return `Gs. ${numero.toLocaleString("es-PY")}`;
}

type TooltipPayload = { color?: string; name?: string; value?: number | string };
type ChartTooltipProps = { active?: boolean; payload?: TooltipPayload[]; label?: string | number };

function MoneyTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-40 rounded-2xl border border-border/80 bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
      <p className="mb-1 font-bold">{label}</p>
      <p className="text-lg font-bold text-primary">{formatearGuaranies(Number(payload[0]?.value ?? 0))}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-2xl border border-border/80 bg-popover/95 px-3 py-2 text-xs text-popover-foreground shadow-2xl shadow-slate-950/15 backdrop-blur-xl">
      <p className="mb-1 font-bold">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-bold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function IngresosPorMesChart({ data }: { data: PuntoIngresoMes[] }) {
  const hayDatos = data.some((d) => d.montoGs > 0);

  return (
    <section className={chartCard()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Ingresos cobrados por mes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pagos manuales aprobados. Es ingreso real, no estimado.</p>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      {!hayDatos ? (
        <EmptyChart>Todavia no hay pagos aprobados registrados.</EmptyChart>
      ) : (
        <div className="mt-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={compactGs} tick={AXIS_TICK} width={60} />
              <Tooltip content={<MoneyTooltip />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="montoGs" name="Ingresos" radius={[10, 10, 4, 4]} fill={CHART_COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function NegociosNuevosChart({ data }: { data: PuntoNegociosMes[] }) {
  const hayDatos = data.some((d) => d.cantidad > 0);

  return (
    <section className={chartCard()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Negocios nuevos por mes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Altas registradas segun fecha de creacion.</p>
        </div>
        <Users2 className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      {!hayDatos ? (
        <EmptyChart>Todavia no hay negocios registrados en este rango.</EmptyChart>
      ) : (
        <div className="mt-4 h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" vertical={false} />
              <XAxis dataKey="etiqueta" axisLine={false} tickLine={false} tick={AXIS_TICK} />
              <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={32} allowDecimals={false} />
              <Tooltip content={<CountTooltip />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="cantidad" name="Negocios nuevos" radius={[10, 10, 4, 4]} fill={CHART_COLORS.teal} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export function DistribucionPlanChart({ data }: { data: PuntoDistribucionPlan[] }) {
  const total = data.reduce((acc, d) => acc + d.cantidad, 0);

  return (
    <section className={chartCard()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Distribucion por plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">Negocios agrupados por el plan actual.</p>
        </div>
        <PieChartIcon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      {total === 0 ? (
        <EmptyChart>Todavia no hay negocios para agrupar por plan.</EmptyChart>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-[11rem_1fr] sm:items-center">
          <div className="relative h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="cantidad"
                  nameKey="nombre"
                  innerRadius={46}
                  outerRadius={72}
                  paddingAngle={3}
                  cornerRadius={10}
                  stroke="var(--card)"
                  strokeWidth={3}
                >
                  {data.map((item, index) => (
                    <Cell key={item.clave} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CountTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold">{total}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">negocios</span>
            </div>
          </div>

          <div className="grid gap-2">
            {data.map((item, index) => (
              <div
                key={item.clave}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
                  />
                  <span className="truncate font-semibold">{item.nombre}</span>
                </span>
                <span className="font-bold">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function SuscripcionesEstadoChart({ data }: { data: PuntoSuscripciones[] }) {
  const total = data.reduce((acc, d) => acc + d.cantidad, 0);

  return (
    <section className={chartCard()}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Suscripciones por estado</h2>
          <p className="mt-1 text-sm text-muted-foreground">Activas, vencidas y por vencer en los proximos 30 dias.</p>
        </div>
        <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      {total === 0 ? (
        <EmptyChart>Todavia no hay suscripciones para mostrar.</EmptyChart>
      ) : (
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} strokeDasharray="4 6" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} allowDecimals={false} />
              <YAxis type="category" dataKey="estado" axisLine={false} tickLine={false} tick={AXIS_TICK} width={110} />
              <Tooltip content={<CountTooltip />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="cantidad" name="Negocios" radius={[0, 10, 10, 0]}>
                {data.map((item, index) => (
                  <Cell key={item.estado} fill={SUS_COLORS[index % SUS_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
