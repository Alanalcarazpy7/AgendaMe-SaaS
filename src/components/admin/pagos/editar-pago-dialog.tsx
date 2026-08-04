"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
import { editarPagoPendienteAction } from "@/lib/admin/actions/negocios";
import { formatearGuaranies } from "@/lib/admin/formatters/currency";
import type { PagoRef } from "@/components/admin/pagos/pago-acciones";

export type PlanParaEdicionPago = {
  id: string;
  clave: string;
  nombre: string;
  precio_mensual_gs: number | null;
  precio_anual_gs: number | null;
};

type Props = {
  pago: PagoRef;
  planes: PlanParaEdicionPago[];
};

export function EditarPagoDialog({ pago, planes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState(pago.planId ?? planes[0]?.id ?? "");
  const [ciclo, setCiclo] = useState<"mensual" | "anual">(
    pago.cicloFacturacion === "anual" ? "anual" : "mensual"
  );
  const [monto, setMonto] = useState(String(pago.montoGs ?? ""));
  const [pending, startTransition] = useTransition();

  const planSeleccionado = planes.find((p) => p.id === planId) ?? null;
  const montoSugerido = planSeleccionado
    ? ciclo === "anual"
      ? Number(planSeleccionado.precio_anual_gs ?? 0)
      : Number(planSeleccionado.precio_mensual_gs ?? 0)
    : 0;

  function abrir() {
    setPlanId(pago.planId ?? planes[0]?.id ?? "");
    setCiclo(pago.cicloFacturacion === "anual" ? "anual" : "mensual");
    setMonto(String(pago.montoGs ?? ""));
    setOpen(true);
  }

  function guardar() {
    if (!planId) {
      toast.error("Elegí un plan");
      return;
    }
    const montoNumerico = Number(monto);
    if (!montoNumerico || montoNumerico <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }

    startTransition(async () => {
      const result = await editarPagoPendienteAction({
        pagoId: pago.id,
        negocioId: pago.negocioId,
        planId,
        cicloFacturacion: ciclo,
        montoGs: montoNumerico,
      });

      if (!result.ok) {
        toast.error("No se pudo corregir el pago", { description: result.error });
        return;
      }

      toast.success("Pago corregido", {
        description: "Se actualizó el plan, ciclo y/o monto de este comprobante.",
      });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={abrir}>
        <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Corregir
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.6rem]">
          <DialogHeader>
            <DialogTitle>Corregir pago{pago.negocioNombre ? ` - ${pago.negocioNombre}` : ""}</DialogTitle>
            <DialogDescription>
              Usá esto si el negocio subió el comprobante con el plan o el ciclo equivocado. Cambiá lo que
              corresponda antes de aprobar; no afecta el archivo del comprobante.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={`editar-plan-${pago.id}`}>Plan correcto</Label>
              <select
                id={`editar-plan-${pago.id}`}
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="h-11 rounded-2xl border border-input bg-background px-3 text-sm font-semibold outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {planes.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label>Ciclo correcto</Label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
                {(["mensual", "anual"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCiclo(item)}
                    className={`h-9 rounded-xl text-sm font-black transition ${
                      ciclo === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item === "mensual" ? "Mensual" : "Anual"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`editar-monto-${pago.id}`}>Monto correcto</Label>
                {montoSugerido > 0 ? (
                  <button
                    type="button"
                    onClick={() => setMonto(String(montoSugerido))}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Usar {formatearGuaranies(montoSugerido)}
                  </button>
                ) : null}
              </div>
              <Input
                id={`editar-monto-${pago.id}`}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                inputMode="numeric"
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardar} disabled={pending}>
              {pending ? "Guardando..." : "Guardar corrección"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
