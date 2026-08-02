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
import { Textarea } from "@/components/ui/textarea";
import { editarPlanAction } from "@/lib/admin/actions/planes";
import type { PlanAdminRow } from "@/lib/admin/queries/planes";

type Props = {
  plan: PlanAdminRow;
  negociosActivos: number;
};

const FLAG_OPTIONS = [
  ["permite_reportes_basicos", "Reportes básicos"],
  ["permite_reportes_avanzados", "Reportes avanzados"],
  ["permite_personalizacion", "Identidad visual"],
  ["permite_exportacion_csv", "Exportación XLSX / CSV"],
  ["permite_multiples_sucursales", "Múltiples sucursales"],
  ["permite_recordatorios_whatsapp", "Recordatorios por WhatsApp"],
  ["permite_soporte_prioritario", "Soporte prioritario"],
  ["permite_funcionalidades_a_medida", "Funcionalidades a medida"],
] as const;

type FlagKey = (typeof FLAG_OPTIONS)[number][0];

export function PlanEditarDialog({ plan, negociosActivos }: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(plan.nombre);
  const [descripcionCorta, setDescripcionCorta] = useState(plan.descripcion_corta ?? "");
  const [textoDestacado, setTextoDestacado] = useState(plan.texto_destacado ?? "");
  const [precioMensual, setPrecioMensual] = useState(String(plan.precio_mensual_gs ?? 0));
  const [precioAnual, setPrecioAnual] = useState(String(plan.precio_anual_gs ?? 0));
  const [ahorroAnualMeses, setAhorroAnualMeses] = useState(String(plan.ahorro_anual_meses ?? 0));
  const [limiteCitas, setLimiteCitas] = useState(plan.limite_citas_mensuales?.toString() ?? "");
  const [limiteEmpleados, setLimiteEmpleados] = useState(plan.limite_empleados?.toString() ?? "");
  const [limiteServicios, setLimiteServicios] = useState(plan.limite_servicios?.toString() ?? "");
  const [limiteClientes, setLimiteClientes] = useState(plan.limite_clientes?.toString() ?? "");
  const [limiteSucursales, setLimiteSucursales] = useState(plan.limite_sucursales?.toString() ?? "");
  const [visiblePublico, setVisiblePublico] = useState(plan.visible_publico);
  const [destacado, setDestacado] = useState(plan.destacado);
  const [features, setFeatures] = useState((plan.features ?? []).join("\n"));
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    permite_reportes_basicos: plan.permite_reportes_basicos,
    permite_reportes_avanzados: plan.permite_reportes_avanzados,
    permite_personalizacion: plan.permite_personalizacion,
    permite_exportacion_csv: plan.permite_exportacion_csv,
    permite_multiples_sucursales: plan.permite_multiples_sucursales,
    permite_recordatorios_whatsapp: plan.permite_recordatorios_whatsapp,
    permite_soporte_prioritario: plan.permite_soporte_prioritario,
    permite_funcionalidades_a_medida: plan.permite_funcionalidades_a_medida,
  });
  const [confirmado, setConfirmado] = useState(negociosActivos === 0);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await editarPlanAction({
        id: plan.id,
        nombre,
        descripcionCorta: descripcionCorta.trim() || null,
        textoDestacado: textoDestacado.trim() || null,
        precioMensualGs: Number(precioMensual),
        precioAnualGs: Number(precioAnual),
        ahorroAnualMeses: Number(ahorroAnualMeses),
        limiteCitasMensuales: limiteCitas === "" ? null : Number(limiteCitas),
        limiteEmpleados: limiteEmpleados === "" ? null : Number(limiteEmpleados),
        limiteServicios: limiteServicios === "" ? null : Number(limiteServicios),
        limiteClientes: limiteClientes === "" ? null : Number(limiteClientes),
        limiteSucursales: limiteSucursales === "" ? null : Number(limiteSucursales),
        visiblePublico,
        destacado,
        permiteReportesBasicos: flags.permite_reportes_basicos,
        permiteReportesAvanzados: flags.permite_reportes_avanzados,
        permitePersonalizacion: flags.permite_personalizacion,
        permiteExportacionCsv: flags.permite_exportacion_csv,
        permiteMultiplesSucursales: flags.permite_multiples_sucursales,
        permiteRecordatoriosWhatsapp: flags.permite_recordatorios_whatsapp,
        permiteSoportePrioritario: flags.permite_soporte_prioritario,
        permiteFuncionalidadesAMedida: flags.permite_funcionalidades_a_medida,
        features: features
          .split(/\r?\n/)
          .map((feature) => feature.trim())
          .filter(Boolean),
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
              Cambia el contenido, los precios, los límites y los permisos guardados en planes_saas.
              No borra el plan ni su historial.
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
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="plan-texto-destacado">Texto destacado</Label>
              <Input
                id="plan-texto-destacado"
                maxLength={120}
                value={textoDestacado}
                onChange={(e) => setTextoDestacado(e.target.value)}
                placeholder="Ej: Más elegido"
              />
              <p className="text-xs text-muted-foreground">
                Se muestra como una señal comercial breve encima del nombre del plan.
              </p>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="plan-descripcion">Descripción comercial</Label>
              <Textarea
                id="plan-descripcion"
                maxLength={300}
                rows={3}
                value={descripcionCorta}
                onChange={(e) => setDescripcionCorta(e.target.value)}
                placeholder="Explicá para qué tipo de negocio conviene este plan."
              />
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
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="plan-ahorro-anual">Meses bonificados en el pago anual</Label>
              <Input
                id="plan-ahorro-anual"
                type="number"
                min={0}
                max={12}
                value={ahorroAnualMeses}
                onChange={(e) => setAhorroAnualMeses(e.target.value)}
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

            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="plan-funciones-comunicadas">Funciones comunicadas</Label>
              <Textarea
                id="plan-funciones-comunicadas"
                rows={8}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Una funcionalidad por línea"
              />
              <p className="text-xs text-muted-foreground">
                Esta lista se publica igual en la web, el dashboard y el panel administrativo.
              </p>
            </div>

            <fieldset className="grid gap-2 rounded-lg border p-3 sm:col-span-2 sm:grid-cols-2">
              <legend className="px-1 text-sm font-semibold">Permisos funcionales</legend>
              {FLAG_OPTIONS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={flags[key]}
                    onChange={(event) =>
                      setFlags((current) => ({ ...current, [key]: event.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>

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
