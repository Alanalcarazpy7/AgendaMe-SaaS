"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarRange,
  Check,
  CheckCircle2,
  Layers3,
  MessageCircle,
  Sparkles,
  Star,
  Store,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import type { PlanPeriodo, PlanPublico } from "@/lib/planes/planes-shared";
import {
  formatLimit,
  formatPlanPrice,
  generarFeaturesPlan,
  generarMensajeWhatsAppPlan,
  getAhorroAnualLabel,
  getAhorroAnualMontoLabel,
  getDescripcionPlan,
  getTextoDestacadoPlan,
} from "@/lib/planes/planes-shared";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";

type PlanPricingCardsProps = {
  planes: PlanPublico[];
};

function iconoPlan(clave: string) {
  if (clave === "gratis") return Zap;
  if (clave === "empresarial") return Store;
  return Layers3;
}

function capacidadesPlan(plan: PlanPublico) {
  return [
    {
      label: "Citas / mes",
      value: formatLimit(plan.limite_citas_mensuales, "cita", "citas"),
      icon: CalendarRange,
    },
    {
      label: "Empleados",
      value: formatLimit(plan.limite_empleados, "empleado", "empleados"),
      icon: UsersRound,
    },
    {
      label: "Servicios",
      value: formatLimit(plan.limite_servicios, "servicio", "servicios"),
      icon: BriefcaseBusiness,
    },
    {
      label: "Clientes",
      value: formatLimit(plan.limite_clientes, "cliente", "clientes"),
      icon: UserRound,
    },
  ];
}

export function PlanPricingCards({ planes }: PlanPricingCardsProps) {
  const [periodo, setPeriodo] = useState<PlanPeriodo>("mensual");

  if (planes.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No pudimos cargar los planes en este momento. Probá de nuevo más tarde.
      </p>
    );
  }

  const planReferencia =
    planes.find((plan) => plan.destacado) ??
    planes.find((plan) => Number(plan.precio_mensual_gs) > 0);
  const mesesBonificados = Number(planReferencia?.ahorro_anual_meses ?? 0);
  const mesesPagados = 12 - mesesBonificados;

  return (
    <div>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3">
        <div
          className="grid grid-cols-2 rounded-lg border bg-muted/55 p-1 shadow-inner"
          aria-label="Elegir forma de pago"
        >
          {(["mensual", "anual"] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              aria-pressed={periodo === opcion}
              onClick={() => setPeriodo(opcion)}
              className={`flex h-10 min-w-32 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold outline-none transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring/50 ${
                periodo === opcion
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opcion === "mensual" ? "Mensual" : "Anual"}
              {opcion === "anual" && mesesBonificados > 0 ? (
                <span className="rounded bg-chart-4/15 px-1.5 py-0.5 text-[10px] font-extrabold text-chart-4">
                  -{mesesBonificados} meses
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {mesesBonificados > 0 ? (
          <p className="flex items-center gap-1.5 text-center text-sm font-medium text-muted-foreground">
            <Sparkles className="size-3.5 shrink-0 text-chart-4" />
            En anual pagás {mesesPagados} meses y usás AgendaMe todo el año
          </p>
        ) : null}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {planes.map((plan) => {
          const Icon = iconoPlan(plan.clave);
          const esGratis = plan.clave === "gratis";
          const ahorroLabel = periodo === "anual" ? getAhorroAnualLabel(plan) : "";
          const ahorroMontoLabel =
            periodo === "anual" ? getAhorroAnualMontoLabel(plan) : "";

          return (
            <article
              key={plan.id}
              className={`relative flex h-full flex-col overflow-hidden rounded-lg border bg-card p-5 shadow-[0_14px_40px_rgb(15_23_42/0.08)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:shadow-[0_20px_52px_rgb(15_23_42/0.12)] dark:shadow-black/20 ${
                plan.destacado
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/80"
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  plan.destacado ? "bg-primary" : "bg-border"
                }`}
              />

              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex size-11 items-center justify-center rounded-lg ${
                    plan.destacado
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>

                {plan.destacado ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    <Star className="size-3 fill-current" />
                    Más elegido
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-xs font-bold uppercase text-primary">
                {getTextoDestacadoPlan(plan)}
              </p>
              <h3 className="mt-1 text-2xl font-bold">{plan.nombre}</h3>
              <p className="mt-2 min-h-20 text-sm leading-6 text-muted-foreground">
                {getDescripcionPlan(plan)}
              </p>

              <div className="mt-4 border-y py-4">
                <p className="text-3xl font-bold tracking-tight">
                  {formatPlanPrice(plan, periodo)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {esGratis ? "Sin tarjeta y sin vencimiento" : periodo === "anual" ? "por año" : "por mes"}
                </p>
                <div className="mt-2 min-h-5 text-xs font-semibold text-chart-4">
                  {ahorroLabel ? `${ahorroLabel} · ${ahorroMontoLabel}` : ""}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
                {capacidadesPlan(plan).map(({ label, value, icon: CapacityIcon }) => (
                  <div key={label} className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CapacityIcon className="size-3.5 text-primary" aria-hidden="true" />
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-bold">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex items-center gap-2 border-t pt-4 text-sm">
                <Store className="size-4 text-primary" aria-hidden="true" />
                <span className="font-semibold">
                  {formatLimit(plan.limite_sucursales, "sucursal", "sucursales")}
                </span>
              </div>

              <div className="mt-5 flex-1">
                <p className="text-sm font-bold">Qué incluye</p>
                <ul className="mt-3 space-y-2.5">
                  {generarFeaturesPlan(plan).map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm leading-5">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-chart-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {esGratis ? (
                  <Link
                    href="/auth/registro"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-card px-4 text-sm font-semibold outline-none transition-[background-color,color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <Check className="size-4" />
                    Comenzar gratis
                  </Link>
                ) : (
                  <a
                    href={buildWhatsappUrl(generarMensajeWhatsAppPlan(plan, periodo))}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--whatsapp)] px-4 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <MessageCircle className="size-4" />
                    Solicitar plan
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
