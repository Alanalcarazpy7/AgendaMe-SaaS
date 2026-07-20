"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
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

type PagoRef = { id: string; negocioId: string; negocioNombre?: string };

export function AprobarPagoDialog({ pago }: { pago: PagoRef }) {
  const [open, setOpen] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [notas, setNotas] = useState("");
  const [pending, startTransition] = useTransition();

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
            <div className="grid gap-1.5">
              <Label htmlFor={`venc-${pago.id}`}>Nuevo vencimiento</Label>
              <Input
                id={`venc-${pago.id}`}
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="h-11 rounded-2xl"
              />
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
