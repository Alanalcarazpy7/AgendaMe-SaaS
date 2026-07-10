"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { formatearFechaCorta } from "@/lib/admin/formatters/date";
import { formatearGuaranies } from "@/lib/admin/formatters/currency";
import type { PagoNegocioRow } from "@/lib/admin/queries/negocio-detalle";
import { registrarPagoAction } from "@/lib/admin/actions/negocios";
import { AprobarPagoDialog, RechazarPagoDialog } from "@/components/admin/pagos/pago-acciones";

type PlanOpcion = { id: string; clave: string; nombre: string };

type Props = {
  negocioId: string;
  pagos: PagoNegocioRow[];
  planes: PlanOpcion[];
};

const selectClass =
  "h-9 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function badgeEstadoPago(estado: string) {
  if (estado === "aprobado") return <Badge variant="default">Aprobado</Badge>;
  if (estado === "rechazado") return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
}

function RegistrarPagoDialog({ negocioId, planes }: { negocioId: string; planes: PlanOpcion[] }) {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState(planes[0]?.id ?? "");
  const [montoGs, setMontoGs] = useState("");
  const [metodo, setMetodo] = useState("transferencia");
  const [notasCliente, setNotasCliente] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await registrarPagoAction({
        negocioId,
        planId,
        montoGs: Number(montoGs),
        metodo,
        notasCliente: notasCliente || null,
      });
      if (result.ok) {
        toast.success("Pago registrado como pendiente.");
        if (result.auditWarning) toast.warning(result.auditWarning);
        setOpen(false);
        setMontoGs("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Registrar pago
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Se guarda como pendiente. Usá &quot;Aprobar&quot; después para extender la suscripción.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="registrar-plan">Plan asociado</Label>
              <select
                id="registrar-plan"
                className={selectClass}
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="registrar-monto">Monto (Gs.)</Label>
              <Input
                id="registrar-monto"
                type="number"
                min={1}
                value={montoGs}
                onChange={(e) => setMontoGs(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="registrar-metodo">Método</Label>
              <Input id="registrar-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="registrar-notas">Notas (opcional)</Label>
              <Textarea
                id="registrar-notas"
                value={notasCliente}
                onChange={(e) => setNotasCliente(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={pending || !montoGs || !planId}>
              {pending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NegocioPagosPanel({ negocioId, pagos, planes }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Pagos</h2>
        <RegistrarPagoDialog negocioId={negocioId} planes={planes} />
      </div>

      {pagos.length === 0 ? (
        <div className="flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed text-sm text-muted-foreground">
          Todavía no hay pagos registrados para este negocio.
        </div>
      ) : (
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell className="text-xs">
                    {formatearFechaCorta(pago.fecha_pago ?? pago.created_at)}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{formatearGuaranies(pago.monto_gs)}</TableCell>
                  <TableCell className="text-xs">{pago.metodo ?? "—"}</TableCell>
                  <TableCell>{badgeEstadoPago(pago.estado)}</TableCell>
                  <TableCell className="text-xs">
                    {pago.comprobante_url ? (
                      <a
                        href={pago.comprobante_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Ver
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {pago.estado === "pendiente" ? (
                      <div className="flex justify-end gap-2">
                        <AprobarPagoDialog pago={{ id: pago.id, negocioId }} />
                        <RechazarPagoDialog pago={{ id: pago.id, negocioId }} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {pago.estado === "aprobado"
                          ? formatearFechaCorta(pago.aprobado_at)
                          : formatearFechaCorta(pago.rechazado_at)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
