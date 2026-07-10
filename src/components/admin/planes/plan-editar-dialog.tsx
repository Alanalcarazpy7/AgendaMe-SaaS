"use client";

import { useState, useTransition } from "react";
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
import { editarPlanAction } from "@/lib/admin/actions/planes";
import type { PlanAdminRow } from "@/lib/admin/queries/planes";

type Props = {
  plan: PlanAdminRow;
  negociosActivos: number;
};

export function PlanEditarDialog({ plan, negociosActivos }: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(plan.nombre);
  const [precioMensual, setPrecioMensual] = useState(String(plan.precio_mensual_gs ?? 0));
  const [precioAnual, setPrecioAnual] = useState(String(plan.precio_anual_gs ?? 0));
  const [limiteCitas, setLimiteCitas] = useState(plan.limite_citas_mensuales?.toString() ?? "");
  const [limiteEmpleados, setLimiteEmpleados] = useState(plan.limite_empleados?.toString() ?? "");
  const [limiteServicios, setLimiteServicios] = useState(plan.limite_servicios?.toString() ?? "");
  const [limiteClientes, setLimiteClientes] = useState(plan.limite_clientes?.toString() ?? "");
  const [limiteSucursales, setLimiteSucursales] = useState(plan.limite_sucursales?.toString() ?? "");
  const [visiblePublico, setVisiblePublico] = useState(plan.visible_publico);
  const [destacado, setDestacado] = useState(plan.destacado);
  const [confirmado, setConfirmado] = useState(negociosActivos === 0);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await editarPlanAction({
        id: plan.id,
        nombre,
        precioMensualGs: Number(precioMensual),
        precioAnualGs: Number(precioAnual),
        limiteCitasMensuales: limiteCitas === "" ? null : Number(limiteCitas),
        limiteEmpleados: limiteEmpleados === "" ? null : Number(limiteEmpleados),
        limiteServicios: limiteServicios === "" ? null : Number(limiteServicios),
        limiteClientes: limiteClientes === "" ? null : Number(limiteClientes),
        limiteSucursales: limiteSucursales === "" ? null : Number(limiteSucursales),
        visiblePublico,
        destacado,
      });
      if (result.ok) {
        toast.success("Plan actualizado.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar plan — {plan.nombre}</DialogTitle>
            <DialogDescription>
              Cambia precios y límites en planes_saas. No borra el plan ni su historial.
            </DialogDescription>
          </DialogHeader>

          {negociosActivos > 0 && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Este plan tiene <strong>{negociosActivos}</strong> negocio{negociosActivos === 1 ? "" : "s"} activo
                {negociosActivos === 1 ? "" : "s"} suscripto{negociosActivos === 1 ? "" : "s"}. Confirmo que quiero
                aplicar este cambio de todas formas (no se eliminan datos ni se cancelan suscripciones).
              </span>
            </label>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="plan-nombre">Nombre</Label>
              <Input id="plan-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-precio-mensual">Precio mensual (Gs.)</Label>
              <Input
                id="plan-precio-mensual"
                type="number"
                min={0}
                value={precioMensual}
                onChange={(e) => setPrecioMensual(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-precio-anual">Precio anual (Gs.)</Label>
              <Input
                id="plan-precio-anual"
                type="number"
                min={0}
                value={precioAnual}
                onChange={(e) => setPrecioAnual(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-limite-citas">Límite citas/mes</Label>
              <Input
                id="plan-limite-citas"
                type="number"
                min={0}
                placeholder="Sin límite"
                value={limiteCitas}
                onChange={(e) => setLimiteCitas(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-limite-empleados">Límite empleados</Label>
              <Input
                id="plan-limite-empleados"
                type="number"
                min={0}
                placeholder="Sin límite"
                value={limiteEmpleados}
                onChange={(e) => setLimiteEmpleados(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-limite-servicios">Límite servicios</Label>
              <Input
                id="plan-limite-servicios"
                type="number"
                min={0}
                placeholder="Sin límite"
                value={limiteServicios}
                onChange={(e) => setLimiteServicios(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-limite-clientes">Límite clientes</Label>
              <Input
                id="plan-limite-clientes"
                type="number"
                min={0}
                placeholder="Sin límite"
                value={limiteClientes}
                onChange={(e) => setLimiteClientes(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="plan-limite-sucursales">Límite sucursales</Label>
              <Input
                id="plan-limite-sucursales"
                type="number"
                min={0}
                placeholder="Sin límite"
                value={limiteSucursales}
                onChange={(e) => setLimiteSucursales(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={visiblePublico}
                onChange={(e) => setVisiblePublico(e.target.checked)}
              />
              Visible en la web pública (landing, /planes)
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={destacado} onChange={(e) => setDestacado(e.target.checked)} />
              Destacar como plan recomendado
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={pending || !confirmado || !nombre.trim()}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
