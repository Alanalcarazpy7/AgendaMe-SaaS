"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bloquearNegocioAction, desbloquearNegocioAction } from "@/lib/admin/actions/negocios";

type Props = {
  negocioId: string;
  bloqueado: boolean;
};

export function NegocioBloqueoBoton({ negocioId, bloqueado }: Props) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmar() {
    if (bloqueado) {
      startTransition(async () => {
        const result = await desbloquearNegocioAction({ negocioId });
        if (result.ok) {
          toast.success("Negocio desbloqueado.");
          if (result.auditWarning) toast.warning(result.auditWarning);
          setOpen(false);
        } else {
          toast.error(result.error);
        }
      });
      return;
    }

    startTransition(async () => {
      const result = await bloquearNegocioAction({ negocioId, motivo });
      if (result.ok) {
        toast.success("Negocio bloqueado.");
        if (result.auditWarning) toast.warning(result.auditWarning);
        setOpen(false);
        setMotivo("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={bloqueado ? "outline" : "destructive"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {bloqueado ? (
          <LockOpen className="mr-2 h-4 w-4" aria-hidden="true" />
        ) : (
          <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {bloqueado ? "Desbloquear negocio" : "Bloquear negocio"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{bloqueado ? "Desbloquear negocio" : "Bloquear negocio"}</DialogTitle>
            <DialogDescription>
              {bloqueado
                ? "El negocio volverá a operar con normalidad."
                : "El negocio dejará de poder operar. No se eliminan datos. Esta acción queda registrada en auditoría."}
            </DialogDescription>
          </DialogHeader>

          {!bloqueado && (
            <div className="grid gap-1.5">
              <Label htmlFor="motivo-bloqueo">Motivo</Label>
              <Textarea
                id="motivo-bloqueo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: pago vencido hace más de 30 días"
                minLength={3}
                required
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={bloqueado ? "default" : "destructive"}
              onClick={confirmar}
              disabled={pending || (!bloqueado && motivo.trim().length < 3)}
            >
              {pending ? "Guardando..." : bloqueado ? "Desbloquear" : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
