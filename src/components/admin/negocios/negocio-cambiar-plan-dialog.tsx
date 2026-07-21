"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
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
import { cambiarPlanNegocioAction } from "@/lib/admin/actions/negocios";

type PlanOpcion = {
  clave: string;
  nombre: string;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
  limite_sucursales: number | null;
};

type UsoActual = {
  citas: number | null;
  empleados: number | null;
  servicios: number | null;
  clientes: number | null;
  sucursales: number | null;
};

type Props = {
  negocioId: string;
  planActualClave: string | null;
  planes: PlanOpcion[];
  uso: UsoActual;
  sucursalesInactivas?: number;
};

const selectClass =
  "h-9 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

const RECURSOS: { key: keyof UsoActual; label: string; limiteKey: keyof PlanOpcion }[] = [
  { key: "citas", label: "Citas/mes", limiteKey: "limite_citas_mensuales" },
  { key: "empleados", label: "Empleados", limiteKey: "limite_empleados" },
  { key: "servicios", label: "Servicios", limiteKey: "limite_servicios" },
  { key: "clientes", label: "Clientes", limiteKey: "limite_clientes" },
  { key: "sucursales", label: "Sucursales activas", limiteKey: "limite_sucursales" },
];

export function NegocioCambiarPlanDialog({
  negocioId,
  planActualClave,
  planes,
  uso,
  sucursalesInactivas = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [planClave, setPlanClave] = useState(planActualClave ?? "");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [notas, setNotas] = useState("");
  const [confirmadoExceso, setConfirmadoExceso] = useState(false);
  const [pending, startTransition] = useTransition();

  const planSeleccionado = planes.find((p) => p.clave === planClave);

  // Compara TODOS los límites (citas, empleados, servicios, clientes,
  // sucursales) contra el uso actual del negocio antes de permitir
  // confirmar — no solo citas. No borra datos: solo advierte.
  const excesos = useMemo(() => {
    if (!planSeleccionado) return [];

    return RECURSOS.filter(({ key, limiteKey }) => {
      const limite = planSeleccionado[limiteKey] as number | null;
      const usado = uso[key];
      return limite != null && usado != null && usado > limite;
    }).map(({ key, label, limiteKey }) => ({
      label,
      usado: uso[key] as number,
      limite: planSeleccionado[limiteKey] as number,
    }));
  }, [planSeleccionado, uso]);

  const hayExcesos = excesos.length > 0;
  const puedeConfirmar = Boolean(planClave) && (!hayExcesos || confirmadoExceso);

  function confirmar() {
    startTransition(async () => {
      const result = await cambiarPlanNegocioAction({
        negocioId,
        planClave,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null,
        notas: notas || null,
      });
      if (result.ok) {
        toast.success("Plan actualizado.");
        setOpen(false);
        setConfirmadoExceso(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
        Cambiar plan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar plan del negocio</DialogTitle>
            <DialogDescription>
              Actualiza la suscripción activa vía admin_cambiar_plan_negocio(). Queda registrado en auditoría.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="plan-clave">Plan</Label>
              <select
                id="plan-clave"
                className={selectClass}
                value={planClave}
                onChange={(e) => {
                  setPlanClave(e.target.value);
                  setConfirmadoExceso(false);
                }}
              >
                <option value="" disabled>
                  Seleccioná un plan
                </option>
                {planes.map((p) => (
                  <option key={p.clave} value={p.clave}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            {hayExcesos && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <p className="font-medium">
                  Este negocio supera {excesos.length === 1 ? "el siguiente límite" : "los siguientes límites"} del
                  plan seleccionado. No se eliminan datos, pero quedará sobre el límite:
                </p>
                <ul className="mt-1.5 list-inside list-disc">
                  {excesos.map((e) => (
                    <li key={e.label}>
                      {e.label}: usa {e.usado}, el plan permite {e.limite}
                    </li>
                  ))}
                </ul>
                <label className="mt-2 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={confirmadoExceso}
                    onChange={(ev) => setConfirmadoExceso(ev.target.checked)}
                    className="mt-0.5"
                  />
                  <span>Confirmo que quiero aplicar este cambio de todas formas.</span>
                </label>
              </div>
            )}

            {sucursalesInactivas > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-medium">
                  Este negocio tiene {sucursalesInactivas} sucursal{sucursalesInactivas === 1 ? "" : "es"} inactiva{sucursalesInactivas === 1 ? "" : "s"} conservada{sucursalesInactivas === 1 ? "" : "s"}.
                </p>
                <p className="mt-1">
                  No cuentan para los limites del plan seleccionado. Si el negocio vuelve a Empresarial, puede reactivarlas desde Sucursales.
                </p>
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="fecha-vencimiento">Nuevo vencimiento (opcional)</Label>
              <Input
                id="fecha-vencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="notas-plan">Notas (opcional)</Label>
              <Textarea id="notas-plan" value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={pending || !puedeConfirmar}>
              {pending ? "Guardando..." : "Confirmar cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
