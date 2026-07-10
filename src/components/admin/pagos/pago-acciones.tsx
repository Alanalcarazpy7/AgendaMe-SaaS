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
        toast.success("Pago aprobado.");
        if (result.auditWarning) toast.warning(result.auditWarning);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-chart-4" aria-hidden="true" />
        Aprobar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar pago{pago.negocioNombre ? ` — ${pago.negocioNombre}` : ""}</DialogTitle>
            <DialogDescription>
              Extiende la suscripción hasta la fecha indicada vía admin_aprobar_pago_manual().
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
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`notas-${pago.id}`}>Notas (opcional)</Label>
              <Textarea id={`notas-${pago.id}`} value={notas} onChange={(e) => setNotas(e.target.value)} />
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
        toast.success("Pago rechazado.");
        if (result.auditWarning) toast.warning(result.auditWarning);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" aria-hidden="true" />
        Rechazar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pago{pago.negocioNombre ? ` — ${pago.negocioNombre}` : ""}</DialogTitle>
            <DialogDescription>Esta acción queda registrada en auditoría.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={`rechazo-notas-${pago.id}`}>Motivo (opcional)</Label>
            <Textarea id={`rechazo-notas-${pago.id}`} value={notas} onChange={(e) => setNotas(e.target.value)} />
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
