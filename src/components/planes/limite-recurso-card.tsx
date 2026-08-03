"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { LimiteRecursoInfo } from "@/lib/planes/limite-recurso";

export type { LimiteRecursoInfo };

function formatGsMonto(valor: number) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(valor);
}

export function LimiteRecursoContent({
  info,
  onCerrar,
}: {
  info: LimiteRecursoInfo;
  onCerrar: () => void;
}) {
  const siguiente = info.siguientePlan;

  return (
    <>
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgb(245_158_11/0.16),rgb(6_182_212/0.10))] px-6 pt-6 pb-5">
        <div
          className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#f59e0b,#fb923c,#06b6d4)]"
          aria-hidden="true"
        />

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 shadow-inner shadow-amber-500/10 dark:text-amber-300">
            <Lock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black tracking-wide text-amber-700/80 uppercase dark:text-amber-300/80">
              Plan actual · {info.planActualNombre}
            </p>
            <DialogTitle className="text-lg leading-tight font-black">
              Llegaste al límite de {info.tituloRecurso}
            </DialogTitle>
          </div>
        </div>
        <DialogDescription className="sr-only">
          Estás usando {info.usados} de {info.limite} {info.tituloRecurso} disponibles en tu plan.
        </DialogDescription>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>{info.etiquetaUso}</span>
            <span className="text-foreground tabular-nums">
              {info.usados}/{info.limite}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div className="h-full w-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#f97316)]" />
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-5">
        {siguiente ? (
          <>
            <div className="flex items-center justify-center gap-4 rounded-2xl border bg-muted/30 py-4">
              <div className="text-center">
                <p className="text-2xl font-black text-muted-foreground tabular-nums line-through decoration-2">
                  {info.limite}
                </p>
                <p className="text-[11px] font-bold text-muted-foreground">
                  {info.planActualNombre}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
              <div className="text-center">
                <p className="text-3xl font-black text-foreground tabular-nums">
                  {siguiente.limiteRecurso}
                </p>
                <p className="text-[11px] font-black text-primary">{siguiente.nombre}</p>
              </div>
            </div>

            {siguiente.destacado && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
                <Sparkles className="h-3 w-3" />
                El más elegido por otros negocios
              </span>
            )}

            <ul className="space-y-2">
              {siguiente.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex items-start gap-2 text-sm leading-5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border bg-card p-4">
              <p className="text-2xl font-black tabular-nums">
                {formatGsMonto(siguiente.precioMensualGs)}
                <span className="text-sm font-bold text-muted-foreground">/mes</span>
              </p>
              {siguiente.ahorroAnualMeses > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  o {formatGsMonto(siguiente.precioAnualGs)}/año · ahorrás{" "}
                  {siguiente.ahorroAnualMeses} {siguiente.ahorroAnualMeses === 1 ? "mes" : "meses"}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            Ya tenés el plan más alto disponible. Si necesitás más de {info.limite}{" "}
            {info.tituloRecurso}, escribinos y lo evaluamos.
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCerrar} className="rounded-lg">
            Ahora no
          </Button>
          <Button
            asChild
            className="rounded-lg bg-[linear-gradient(135deg,#f59e0b,#f97316)] text-white shadow-lg shadow-amber-500/25 hover:opacity-90"
          >
            <Link href="/dashboard/planes">
              {siguiente ? `Actualizar a ${siguiente.nombre}` : "Ver planes"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Tus datos actuales se mantienen intactos.
        </p>
      </div>
    </>
  );
}

export function LimiteRecursoTriggerButton({
  onClick,
  label = "Actualizar plan",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={
        className ??
        "rounded-lg border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
      }
    >
      <Lock className="h-4 w-4" />
      {label}
    </Button>
  );
}
