"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatearFechaHora } from "@/lib/admin/formatters/date";
import type { AuditoriaConNegocioRow } from "@/lib/admin/queries/auditoria";

export function AuditoriaDetalleDialog({ registro }: { registro: AuditoriaConNegocioRow }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Detalle
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{registro.accion}</DialogTitle>
            <DialogDescription>{formatearFechaHora(registro.created_at)}</DialogDescription>
          </DialogHeader>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Negocio</dt>
              <dd>{registro.negocios?.nombre ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Tabla afectada</dt>
              <dd>{registro.tabla_afectada ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Registro</dt>
              <dd className="truncate">{registro.registro_id ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Origen</dt>
              <dd>{registro.origen ?? "—"}</dd>
            </div>
          </dl>

          {registro.detalles && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Detalles</p>
              <pre className="max-h-64 overflow-auto rounded-xl border bg-muted/40 p-3 text-xs">
                {JSON.stringify(registro.detalles, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
