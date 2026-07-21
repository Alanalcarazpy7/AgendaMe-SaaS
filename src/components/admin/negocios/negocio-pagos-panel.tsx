"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Clock3, Plus, ReceiptText, XCircle } from "lucide-react";
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
import { PagoComprobanteDialog } from "@/components/admin/pagos/pago-comprobante-dialog";
import { AdminEmptyState, AdminTableShell } from "@/components/admin/admin-ui";

type PlanOpcion = {
  id: string;
  clave: string;
  nombre: string;
  precio_mensual_gs: number | null;
  precio_anual_gs: number | null;
};

type Props = {
  negocioId: string;
  pagos: PagoNegocioRow[];
  planes: PlanOpcion[];
  /** Vencimiento de la suscripción activa hoy, para sugerir la fecha al aprobar un pago. */
  fechaVencimientoActual?: string | null;
};

const selectClass =
  "h-11 w-full rounded-2xl border border-border/80 bg-background/70 px-3 text-sm font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function badgeEstadoPago(estado: string) {
  if (estado === "aprobado") return <Badge>Aprobado</Badge>;
  if (estado === "rechazado") return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
}

function RegistrarPagoDialog({ negocioId, planes }: { negocioId: string; planes: PlanOpcion[] }) {
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState(planes[0]?.id ?? "");
  const [montoGs, setMontoGs] = useState("");
  const [metodo, setMetodo] = useState("transferencia");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFin, setPeriodoFin] = useState("");
  const [notasCliente, setNotasCliente] = useState("");
  const [pending, startTransition] = useTransition();

  const plan = planes.find((p) => p.id === planId);

  function aplicarPreset(tipo: "mensual" | "anual") {
    if (!plan) return;
    const inicio = new Date();
    const fin = tipo === "mensual" ? addMonths(inicio, 1) : addMonths(inicio, 12);
    const precio = tipo === "mensual" ? plan.precio_mensual_gs : plan.precio_anual_gs;
    setMontoGs(String(precio ?? 0));
    setPeriodoInicio(isoDate(inicio));
    setPeriodoFin(isoDate(fin));
  }

  function confirmar() {
    startTransition(async () => {
      const result = await registrarPagoAction({
        negocioId,
        planId,
        montoGs: Number(montoGs),
        metodo,
        periodoInicio: periodoInicio ? new Date(periodoInicio).toISOString() : null,
        periodoFin: periodoFin ? new Date(periodoFin).toISOString() : null,
        notasCliente: notasCliente || null,
      });
      if (result.ok) {
        toast.success("Pago registrado como pendiente", {
          description: "Ahora podes aprobarlo para renovar o extender la suscripcion.",
        });
        setOpen(false);
        setMontoGs("");
        setNotasCliente("");
      } else {
        toast.error("No se pudo registrar el pago", { description: result.error });
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" className="h-10 rounded-2xl" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Registrar pago
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.7rem] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Registrar pago manual</DialogTitle>
            <DialogDescription>
              Paso 1: registras el pago como pendiente. Paso 2: lo aprobas para mover el vencimiento de la suscripcion.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2 rounded-[1.25rem] border border-border/70 bg-muted/35 p-3 text-xs text-muted-foreground sm:grid-cols-3">
              <div className="rounded-2xl bg-background/70 p-3">
                <span className="font-black text-foreground">1. Registrar</span>
                <p className="mt-1">Crea el comprobante interno en estado pendiente.</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-3">
                <span className="font-black text-foreground">2. Aprobar</span>
                <p className="mt-1">Confirma el cobro y define el nuevo vencimiento.</p>
              </div>
              <div className="rounded-2xl bg-background/70 p-3">
                <span className="font-black text-foreground">3. Auditar</span>
                <p className="mt-1">Queda trazado en pagos y auditoria.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="registrar-plan">Plan asociado</Label>
                <select id="registrar-plan" className={selectClass} value={planId} onChange={(e) => setPlanId(e.target.value)}>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => aplicarPreset("mensual")}
                className="rounded-2xl border border-border/80 bg-background/70 p-3 text-left transition hover:bg-muted"
              >
                <span className="text-sm font-black">Mensual</span>
                <span className="mt-1 block text-xs text-muted-foreground">{formatearGuaranies(plan?.precio_mensual_gs ?? 0)}</span>
              </button>
              <button
                type="button"
                onClick={() => aplicarPreset("anual")}
                className="rounded-2xl border border-border/80 bg-background/70 p-3 text-left transition hover:bg-muted"
              >
                <span className="text-sm font-black">Anual</span>
                <span className="mt-1 block text-xs text-muted-foreground">{formatearGuaranies(plan?.precio_anual_gs ?? 0)}</span>
              </button>

              <div className="grid gap-1.5">
                <Label htmlFor="registrar-monto">Monto cobrado (Gs.)</Label>
                <Input
                  id="registrar-monto"
                  type="number"
                  min={1}
                  value={montoGs}
                  onChange={(e) => setMontoGs(e.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="registrar-metodo">Metodo</Label>
                <select id="registrar-metodo" className={selectClass} value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="billetera">Billetera</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="registrar-periodo-inicio">Periodo desde</Label>
                <Input
                  id="registrar-periodo-inicio"
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="registrar-periodo-fin">Periodo hasta</Label>
                <Input
                  id="registrar-periodo-fin"
                  type="date"
                  value={periodoFin}
                  onChange={(e) => setPeriodoFin(e.target.value)}
                  className="h-11 rounded-2xl"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="registrar-notas">Notas internas o referencia</Label>
                <Textarea
                  id="registrar-notas"
                  value={notasCliente}
                  onChange={(e) => setNotasCliente(e.target.value)}
                  className="min-h-24 rounded-2xl"
                  placeholder="Ej: transferencia Banco X, comprobante recibido por WhatsApp..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={pending || !montoGs || !planId}>
              {pending ? "Guardando..." : "Registrar pendiente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function NegocioPagosPanel({ negocioId, pagos, planes, fechaVencimientoActual }: Props) {
  const resumen = useMemo(() => {
    const aprobados = pagos.filter((p) => p.estado === "aprobado");
    return {
      total: pagos.length,
      pendientes: pagos.filter((p) => p.estado === "pendiente").length,
      aprobados: aprobados.length,
      rechazados: pagos.filter((p) => p.estado === "rechazado").length,
      cobrado: aprobados.reduce((acc, p) => acc + p.monto_gs, 0),
    };
  }, [pagos]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-base font-black">Pagos y renovaciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registrar no activa nada todavia. Aprobar es la accion que extiende o renueva la suscripcion.
          </p>
        </div>
        <RegistrarPagoDialog negocioId={negocioId} planes={planes} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border bg-background/60 p-3">
          <ReceiptText className="mb-2 h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">Registros</p>
          <p className="text-xl font-black">{resumen.total}</p>
        </div>
        <div className="rounded-2xl border bg-background/60 p-3">
          <Clock3 className="mb-2 h-4 w-4 text-amber-500" />
          <p className="text-xs text-muted-foreground">Pendientes</p>
          <p className="text-xl font-black">{resumen.pendientes}</p>
        </div>
        <div className="rounded-2xl border bg-background/60 p-3">
          <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-500" />
          <p className="text-xs text-muted-foreground">Aprobados</p>
          <p className="text-xl font-black">{resumen.aprobados}</p>
        </div>
        <div className="rounded-2xl border bg-background/60 p-3">
          <XCircle className="mb-2 h-4 w-4 text-destructive" />
          <p className="text-xs text-muted-foreground">Rechazados</p>
          <p className="text-xl font-black">{resumen.rechazados}</p>
        </div>
        <div className="rounded-2xl border bg-background/60 p-3">
          <CalendarDays className="mb-2 h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground">Cobrado</p>
          <p className="text-xl font-black">{formatearGuaranies(resumen.cobrado)}</p>
        </div>
      </div>

      {pagos.length === 0 ? (
        <AdminEmptyState
          title="Sin pagos registrados"
          description="Cuando el negocio pague por transferencia, efectivo u otro metodo manual, registralo aca y luego aproba el pago."
        />
      ) : (
        <AdminTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Comprobante</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((pago) => (
                <TableRow key={pago.id} className="hover:bg-muted/35">
                  <TableCell className="text-xs">{formatearFechaCorta(pago.fecha_pago ?? pago.created_at)}</TableCell>
                  <TableCell className="text-xs font-bold">{formatearGuaranies(pago.monto_gs)}</TableCell>
                  <TableCell className="text-xs">{pago.metodo ?? "-"}</TableCell>
                  <TableCell className="text-xs">
                    {pago.periodo_inicio || pago.periodo_fin
                      ? `${formatearFechaCorta(pago.periodo_inicio)} - ${formatearFechaCorta(pago.periodo_fin)}`
                      : "-"}
                  </TableCell>
                  <TableCell>{badgeEstadoPago(pago.estado)}</TableCell>
                  <TableCell className="text-xs">
                    <PagoComprobanteDialog pagoId={pago.id} comprobanteUrl={pago.comprobante_url} />
                  </TableCell>
                  <TableCell className="text-right">
                    {pago.estado === "pendiente" ? (
                      <div className="flex justify-end gap-2">
                        <AprobarPagoDialog
                          pago={{
                            id: pago.id,
                            negocioId,
                            fechaPago: pago.fecha_pago,
                            periodoFin: pago.periodo_fin,
                            cicloFacturacion: pago.ciclo_facturacion,
                            fechaVencimientoActual,
                          }}
                        />
                        <RechazarPagoDialog pago={{ id: pago.id, negocioId }} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {pago.estado === "aprobado" ? formatearFechaCorta(pago.aprobado_at) : formatearFechaCorta(pago.rechazado_at)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableShell>
      )}
    </div>
  );
}
