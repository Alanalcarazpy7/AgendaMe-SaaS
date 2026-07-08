"use client";

import { useState } from "react";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanLimitModal } from "@/components/plan/plan-limit-modal";

type LimitType = "citas" | "empleados" | "servicios" | "clientes";

type DashboardUsageCardProps = {
  title: string;
  description: string;
  used: number;
  limit: number | null;
  planName: string;
  limitType: LimitType;
};

export function DashboardUsageCard({
  title,
  description,
  used,
  limit,
  planName,
  limitType,
}: DashboardUsageCardProps) {
  const [open, setOpen] = useState(false);

  const hasLimit = typeof limit === "number" && limit > 0;
  const reached = hasLimit && used >= limit;
  const nearLimit = hasLimit && !reached && used / limit >= 0.8;
  const percent = hasLimit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <>
      <div className="rounded-3xl border bg-card p-6 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            <div className="mt-4 flex items-end gap-2">
              <p className="text-4xl font-bold">
                {used}
                {hasLimit && <span className="text-muted-foreground"> / {limit}</span>}
              </p>

              {!hasLimit && (
                <span className="mb-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                  Sin límite definido
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>

          {(reached || nearLimit) && (
            <div
              className={`rounded-2xl p-3 ${
                reached ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          )}
        </div>

        {hasLimit && (
          <div className="mt-5">
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-out)] ${
                  reached ? "bg-destructive" : nearLimit ? "bg-primary" : "bg-chart-4"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{percent}% usado</span>
              <span>{Math.max(limit - used, 0)} disponibles</span>
            </div>
          </div>
        )}

        {hasLimit && (reached || nearLimit) && (
          <div className="mt-5 rounded-2xl border bg-muted/50 p-4 shadow-sm">
            <p className={`text-sm font-medium ${reached ? "text-destructive" : "text-primary"}`} >
              {reached ? "Llegaste al límite de tu plan." : "Estás cerca de llegar al límite."}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Podés mejorar tu plan para seguir creciendo sin interrupciones.
            </p>

            <Button type="button" size="sm" className="mt-3" onClick={() => setOpen(true)}>
              Mejorar plan
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {hasLimit && (
        <PlanLimitModal
          open={open}
          onOpenChange={setOpen}
          planName={planName}
          limitType={limitType}
          used={used}
          limit={limit}
        />
      )}
    </>
  );
}
