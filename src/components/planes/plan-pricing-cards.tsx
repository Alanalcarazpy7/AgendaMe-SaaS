"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Layers3, MessageCircle, Sparkles, Star, Zap } from "lucide-react";
import type { PlanPeriodo, PlanPublico } from "@/lib/planes/planes-shared";
import {
  formatPlanPrice,
  generarFeaturesPlan,
  generarMensajeWhatsAppPlan,
  getAhorroAnualLabel,
  getAhorroAnualMontoLabel,
} from "@/lib/planes/planes-shared";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";

type PlanPricingCardsProps = {
  planes: PlanPublico[];
};

function iconoPlan(clave: string) {
  if (clave === "gratis") return Zap;
  if (clave === "empresarial") return Star;
  return Layers3;
}

export function PlanPricingCards({ planes }: PlanPricingCardsProps) {
  const [periodo, setPeriodo] = useState<PlanPeriodo>("mensual");

  if (planes.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No pudimos cargar los planes en este momento. Proba de nuevo mas tarde.
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
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="inline-flex items-center gap-1 rounded-full border bg-card p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setPeriodo("mensual")}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ease-[var(--ease-out)] ${
              periodo === "mensual"
                ? "bg-[linear-gradient(135deg,var(--primary),var(--ring))] text-white shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mensual
          </button>

          <button
            type="button"
            onClick={() => setPeriodo("anual")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ease-[var(--ease-out)] ${
              periodo === "anual"
                ? "bg-[linear-gradient(135deg,var(--primary),var(--ring))] text-white shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Anual
            {mesesBonificados > 0 && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold transition-colors duration-300 ${
                  periodo === "anual" ? "bg-white/20 text-white" : "bg-chart-4/15 text-chart-4"
                }`}
              >
                -{mesesBonificados} {mesesBonificados === 1 ? "mes" : "meses"}
              </span>
            )}
          </button>
        </div>

        {mesesBonificados > 0 && (
          <p className="flex items-center gap-1.5 text-center text-sm font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-chart-4" />
            Con el plan anual pagas {mesesPagados} meses y usas los 12
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-4">
        {planes.map((plan) => {
          const Icon = iconoPlan(plan.clave);
          const esGratis = plan.clave === "gratis";
          const ahorroLabel = periodo === "anual" ? getAhorroAnualLabel(plan) : "";
          const ahorroMontoLabel =
            periodo === "anual" ? getAhorroAnualMontoLabel(plan) : "";

          return (
            <article
              key={plan.id}
              className={`group relative flex h-full flex-col rounded-[1.75rem] border p-6 transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:scale-[1.02] ${
                plan.destacado
                  ? "border-transparent bg-[linear-gradient(160deg,color-mix(in_srgb,var(--primary)_10%,var(--card)),var(--card)_55%)] shadow-2xl shadow-primary/15 ring-2 ring-primary/40"
                  : "bg-card shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 hover:shadow-xl hover:shadow-primary/10"
              }`}
            >
              {plan.destacado && (
                <div
                  className="pointer-events-none absolute inset-0 -z-10 rounded-[1.75rem] opacity-60 blur-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, transparent), color-mix(in srgb, var(--ring) 30%, transparent))",
                  }}
                />
              )}

              {plan.destacado && (
                <div className="ag-animate-badge absolute right-5 top-0 inline-flex -translate-y-1/2 items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/40">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Mas popular
                </div>
              )}

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  plan.destacado ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-2xl font-bold">{plan.nombre}</h3>

              <div className="mt-5 flex items-baseline gap-1.5">
                <p className="text-4xl font-bold tracking-tight">{formatPlanPrice(plan, periodo)}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {esGratis ? "Gratis para siempre" : periodo === "anual" ? "/ ano" : "/ mes"}
              </p>

              <div className="mt-1.5 h-6">
                {ahorroLabel && (
                  <span className="ag-animate-badge inline-flex items-center gap-1 rounded-full bg-chart-4/15 px-2.5 py-1 text-xs font-bold text-chart-4">
                    <Sparkles className="h-3 w-3" />
                    {ahorroLabel} · {ahorroMontoLabel}
                  </span>
                )}
              </div>

              <div className="mt-5 h-px w-full bg-border" />

              <div className="mt-5 flex-1 space-y-3">
                {generarFeaturesPlan(plan).map((feature) => (
                  <div key={feature} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-chart-4" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                {esGratis ? (
                  <Link
                    href="/auth/registro"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border bg-card px-4 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground"
                  >
                    Comenzar gratis
                  </Link>
                ) : (
                  <a
                    href={buildWhatsappUrl(generarMensajeWhatsAppPlan(plan, periodo))}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-4 text-sm font-semibold text-white shadow-sm shadow-[var(--whatsapp)]/30 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]"
                  >
                    <MessageCircle className="h-4 w-4" />
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
