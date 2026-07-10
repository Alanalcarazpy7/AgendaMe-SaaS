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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  aprobarSolicitudCambioPlanAction,
  rechazarSolicitudCambioPlanAction,
} from "@/lib/admin/actions/negocios";

type Props = {
  solicitudId: string;
  negocioId: string;
  negocioNombre?: string;
};

export function AprobarSolicitudPlanDialog({ solicitudId, negocioId, negocioNombre }: Props) {
  const [open, setOpen] = useState(false);
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await aprobarSolicitudCambioPlanAction({
        solicitudId,
        negocioId,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null,
        notas: notas || null,
      });

      if (result.ok) {
        toast.success("Solicitud aprobada", {
          description: "El plan del negocio fue actualizado y la solicitud quedo respondida.",
        });
        if (result.auditWarning) toast.warning("Auditoria incompleta", { description: result.auditWarning });
        setOpen(false);
      } else {
        toast.error("No se pudo aprobar la solicitud", { description: result.error });
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" className="h-9 rounded-xl" onClick={() => setOpen(true)}>
        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Aprobar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Aprobar cambio de plan{negocioNombre ? ` - ${negocioNombre}` : ""}</DialogTitle>
            <DialogDescription>
              Aplica el plan solicitado al negocio y marca esta solicitud como aprobada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`sol-venc-${solicitudId}`}>Nuevo vencimiento (opcional)</Label>
              <Input
                id={`sol-venc-${solicitudId}`}
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`sol-notas-${solicitudId}`}>Nota interna</Label>
              <Textarea
                id={`sol-notas-${solicitudId}`}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="rounded-2xl"
                placeholder="Ej: cambio aprobado luego de confirmar pago."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={pending}>
              {pending ? "Aplicando..." : "Aprobar cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RechazarSolicitudPlanDialog({ solicitudId, negocioId, negocioNombre }: Props) {
  const [open, setOpen] = useState(false);
  const [notas, setNotas] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await rechazarSolicitudCambioPlanAction({
        solicitudId,
        negocioId,
        notas: notas || null,
      });

      if (result.ok) {
        toast.success("Solicitud rechazada", {
          description: "La solicitud quedo respondida y no se cambio el plan.",
        });
        if (result.auditWarning) toast.warning("Auditoria incompleta", { description: result.auditWarning });
        setOpen(false);
      } else {
        toast.error("No se pudo rechazar la solicitud", { description: result.error });
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="h-9 rounded-xl" onClick={() => setOpen(true)}>
        <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" aria-hidden="true" />
        Rechazar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud{negocioNombre ? ` - ${negocioNombre}` : ""}</DialogTitle>
            <DialogDescription>Marca la solicitud como rechazada sin modificar el plan actual.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={`sol-rechazo-${solicitudId}`}>Motivo o nota interna</Label>
            <Textarea
              id={`sol-rechazo-${solicitudId}`}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="rounded-2xl"
              placeholder="Ej: se contacto al negocio, queda pendiente de pago."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmar} disabled={pending}>
              {pending ? "Guardando..." : "Rechazar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
