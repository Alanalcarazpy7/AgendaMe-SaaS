"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, TrendingDown, TrendingUp, TriangleAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { aprobarPagoAction, rechazarPagoAction } from "@/lib/admin/actions/negocios";
import { calcularVencimientoSugerido } from "@/lib/admin/formatters/date";
import { formatearGuaranies } from "@/lib/admin/formatters/currency";
import type { ContextoPago } from "@/lib/admin/pagos-contexto";

export type PagoRef = {
  id: string;
  negocioId: string;
  negocioNombre?: string;
  planId?: string | null;
  fechaPago?: string | null;
  periodoFin?: string | null;
  cicloFacturacion?: string | null;
  /** Vencimiento de la suscripción activa del negocio ANTES de aprobar este pago. */
  fechaVencimientoActual?: string | null;
  montoGs?: number;
  contexto?: ContextoPago;
};

const RELACION_INFO: Record<
  ContextoPago["relacion"],
  { label: string; className: string; icon: typeof ArrowRight }
> = {
  renovacion: {
    label: "Renovación del mismo plan",
    className: "border-primary/25 bg-primary/10 text-primary",
    icon: ArrowRight,
  },
  upgrade: {
    label: "Mejora de plan",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: TrendingUp,
  },
  downgrade: {
    label: "Baja de plan",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: TrendingDown,
  },
  desconocido: {
    label: "No se pudo comparar con el plan actual",
    className: "border-border/70 bg-muted/40 text-muted-foreground",
    icon: TriangleAlert,
  },
};

export function ResumenPago({ pago }: { pago: PagoRef }) {
  const contexto = pago.contexto;
  if (!contexto) return null;

  const relacionInfo = RELACION_INFO[contexto.relacion];
  const RelacionIcon = relacionInfo.icon;

  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3.5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold">{contexto.planActualNombre ?? "Sin plan"}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-black text-primary">{contexto.planPagadoNombre ?? "Plan desconocido"}</span>
      </div>

      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${relacionInfo.className}`}
      >
        <RelacionIcon className="h-3.5 w-3.5" />
        {relacionInfo.label}
      </span>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-border/60 bg-background/70 p-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground">Ciclo</p>
          <p className="font-bold">{contexto.cicloLabel}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 p-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground">Envió</p>
          <p className="font-bold">{formatearGuaranies(pago.montoGs ?? 0)}</p>
        </div>
      </div>

      {contexto.montoEsperadoGs !== null && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold ${
            contexto.montoCoincide
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/25 bg-destructive/10 text-destructive"
          }`}
        >
          {contexto.montoCoincide ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <TriangleAlert className="h-4 w-4 shrink-0" />
          )}
          {contexto.montoCoincide
            ? `Coincide con el precio del plan (${formatearGuaranies(contexto.montoEsperadoGs)}).`
            : `No coincide con el precio del plan: se esperaban ${formatearGuaranies(contexto.montoEsperadoGs)}.`}
        </div>
      )}
    </div>
  );
}

export function AprobarPagoDialog({ pago }: { pago: PagoRef }) {
  const [open, setOpen] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(() =>
    calcularVencimientoSugerido({
      fechaPago: pago.fechaPago,
      periodoFin: pago.periodoFin,
      fechaVencimientoActual: pago.fechaVencimientoActual,
      cicloFacturacion: pago.cicloFacturacion,
    })
  );
  const [notas, setNotas] = useState("");
  const [pending, startTransition] = useTransition();
  const cicloValido = pago.cicloFacturacion === "mensual" || pago.cicloFacturacion === "anual";
  const sugerenciaAutomatica = Boolean(
    pago.periodoFin || ((pago.fechaVencimientoActual || pago.fechaPago) && cicloValido)
  );

  function confirmar() {
    startTransition(async () => {
      const result = await aprobarPagoAction({
        pagoId: pago.id,
        negocioId: pago.negocioId,
        fechaVencimiento: new Date(fechaVencimiento).toISOString(),
        notas: notas || null,
      });
      if (result.ok) {
        toast.success("Pago aprobado correctamente", {
          description: "La suscripcion se actualizo con el nuevo vencimiento.",
        });
        setOpen(false);
      } else {
        toast.error("No se pudo aprobar el pago", { description: result.error });
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setOpen(true)}>
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        Aprobar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Aprobar pago{pago.negocioNombre ? ` - ${pago.negocioNombre}` : ""}</DialogTitle>
            <DialogDescription>
              Confirma el pago y extiende la suscripcion hasta la fecha indicada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <ResumenPago pago={pago} />

            <div className="grid gap-1.5">
              <Label htmlFor={`venc-${pago.id}`}>Nuevo vencimiento</Label>
              <Input
                id={`venc-${pago.id}`}
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="h-11 rounded-2xl"
              />
              <p className="text-xs text-muted-foreground">
                {sugerenciaAutomatica
                  ? "Sugerida a partir del vencimiento actual de la suscripción (no de la fecha en que se subió el comprobante). Podés cambiarla si pagó por adelantado o si el vencimiento anterior ya pasó hace tiempo."
                  : "No hay ciclo informado para este pago: ajustá la fecha manualmente si corresponde."}
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`notas-${pago.id}`}>Notas internas (opcional)</Label>
              <Textarea id={`notas-${pago.id}`} value={notas} onChange={(e) => setNotas(e.target.value)} className="rounded-2xl" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={pending}>
              {pending ? "Guardando..." : "Aprobar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RechazarPagoDialog({ pago }: { pago: PagoRef }) {
  const [open, setOpen] = useState(false);
  const [notas, setNotas] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await rechazarPagoAction({ pagoId: pago.id, negocioId: pago.negocioId, notas: notas || null });
      if (result.ok) {
        toast.success("Pago rechazado", {
          description: "El registro queda marcado como rechazado y se conserva el historial.",
        });
        setOpen(false);
      } else {
        toast.error("No se pudo rechazar el pago", { description: result.error });
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setOpen(true)}>
        <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" aria-hidden="true" />
        Rechazar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Rechazar pago{pago.negocioNombre ? ` - ${pago.negocioNombre}` : ""}</DialogTitle>
            <DialogDescription>
              Marca este pago como rechazado sin borrar el comprobante. El motivo queda visible para el negocio y puede
              volver a subir el comprobante correcto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={`rechazo-notas-${pago.id}`}>Motivo visible para el negocio</Label>
            <Textarea
              id={`rechazo-notas-${pago.id}`}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: la captura no muestra el monto completo, falta numero de operacion o el pago corresponde a otro plan."
              className="rounded-2xl"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmar} disabled={pending}>
              {pending ? "Guardando..." : "Rechazar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
