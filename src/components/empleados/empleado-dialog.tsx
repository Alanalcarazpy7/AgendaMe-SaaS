"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Check, Clock, Lock, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LimiteRecursoContent } from "@/components/planes/limite-recurso-card";
import type { LimiteRecursoInfo } from "@/lib/planes/limite-recurso";

export type ServicioParaEmpleado = {
  id: string;
  nombre: string;
  estado: "activo" | "inactivo";
};

export type HorarioEmpleadoItem = {
  dia_semana: number;
  activo: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export type EmpleadoItem = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  color_calendario: string | null;
  estado: "activo" | "inactivo";
  created_at: string;
  servicios_ids: string[];
  horarios: HorarioEmpleadoItem[];
};

type EmpleadoDialogProps = {
  empleado?: EmpleadoItem;
  servicios: ServicioParaEmpleado[];
  variant: "crear" | "editar";
  limiteInfo?: LimiteRecursoInfo;
};

const coloresRapidos = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#111827",
];

const diasSemana = [
  { dia: 0, nombre: "Domingo" },
  { dia: 1, nombre: "Lunes" },
  { dia: 2, nombre: "Martes" },
  { dia: 3, nombre: "Miércoles" },
  { dia: 4, nombre: "Jueves" },
  { dia: 5, nombre: "Viernes" },
  { dia: 6, nombre: "Sábado" },
];

function horaInput(valor: string | null) {
  if (!valor) return "";
  return valor.slice(0, 5);
}

function crearHorariosDefault(): HorarioEmpleadoItem[] {
  return diasSemana.map((dia) => {
    const esDiaLaboral = dia.dia >= 1 && dia.dia <= 5;

    return {
      dia_semana: dia.dia,
      activo: esDiaLaboral,
      hora_inicio: esDiaLaboral ? "09:00" : null,
      hora_fin: esDiaLaboral ? "18:00" : null,
    };
  });
}

function normalizarHorariosIniciales(horarios?: HorarioEmpleadoItem[]) {
  if (!horarios || horarios.length === 0) {
    return crearHorariosDefault();
  }

  return diasSemana.map((dia) => {
    const encontrado = horarios.find((item) => item.dia_semana === dia.dia);

    if (!encontrado) {
      return {
        dia_semana: dia.dia,
        activo: false,
        hora_inicio: null,
        hora_fin: null,
      };
    }

    return {
      dia_semana: dia.dia,
      activo: encontrado.activo,
      hora_inicio: horaInput(encontrado.hora_inicio),
      hora_fin: horaInput(encontrado.hora_fin),
    };
  });
}

export function EmpleadoDialog({
  empleado,
  servicios,
  variant,
  limiteInfo,
}: EmpleadoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const esEditar = variant === "editar";
  const limiteAlcanzado = !esEditar && Boolean(limiteInfo?.alcanzado);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<HorarioEmpleadoItem[]>(crearHorariosDefault);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviciosActivos = useMemo(() => {
    return servicios.filter((servicio) => servicio.estado === "activo");
  }, [servicios]);

  useEffect(() => {
    if (!open) return;

    // Reset the form from the employee selected by the parent on every opening.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNombre(empleado?.nombre ?? "");
    setEmail(empleado?.email ?? "");
    setTelefono(empleado?.telefono ?? "");
    setColor(empleado?.color_calendario ?? "#2563eb");
    const idsActivos = new Set(
      servicios.filter((servicio) => servicio.estado === "activo").map((servicio) => servicio.id)
    );
    setServiciosSeleccionados(
      (empleado?.servicios_ids ?? []).filter((servicioId) => idsActivos.has(servicioId))
    );
    setHorarios(normalizarHorariosIniciales(empleado?.horarios));
    setError(null);
  }, [open, empleado, servicios]);

  function toggleServicio(servicioId: string) {
    setServiciosSeleccionados((actual) => {
      if (actual.includes(servicioId)) {
        return actual.filter((id) => id !== servicioId);
      }

      return [...actual, servicioId];
    });
  }

  function actualizarHorario(
    diaSemana: number,
    campo: "activo" | "hora_inicio" | "hora_fin",
    valor: boolean | string
  ) {
    setHorarios((actual) =>
      actual.map((horario) => {
        if (horario.dia_semana !== diaSemana) {
          return horario;
        }

        if (campo === "activo") {
          const activo = Boolean(valor);

          return {
            ...horario,
            activo,
            hora_inicio: activo ? horario.hora_inicio ?? "09:00" : null,
            hora_fin: activo ? horario.hora_fin ?? "18:00" : null,
          };
        }

        return {
          ...horario,
          [campo]: String(valor),
        };
      })
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (serviciosActivos.length === 0) {
      const message = "Primero creá al menos un servicio activo para poder agregar empleados.";
      setError(message);
      toast.error("Falta un servicio activo", { description: message });
      return;
    }

    if (serviciosSeleccionados.length === 0) {
      const message = "Seleccioná al menos un servicio que realizará este empleado.";
      setError(message);
      toast.error("Seleccioná un servicio", { description: message });
      return;
    }

    const horarioInvalido = horarios.find(
      (horario) =>
        horario.activo &&
        horario.hora_inicio &&
        horario.hora_fin &&
        horario.hora_inicio >= horario.hora_fin
    );

    if (horarioInvalido) {
      const dia = diasSemana.find((item) => item.dia === horarioInvalido.dia_semana)?.nombre;
      const message = `En ${dia ?? "un día"}, la hora de salida debe ser posterior a la entrada.`;
      setError(message);
      toast.error("Revisá los horarios", { description: message });
      return;
    }

    setLoading(true);

    try {
      const url = esEditar
        ? `/api/dashboard/empleados/${empleado?.id}`
        : "/api/dashboard/empleados";

      const method = esEditar ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          color,
          serviciosIds: serviciosSeleccionados,
          servicio_ids: serviciosSeleccionados,
          servicios_ids: serviciosSeleccionados,
          horarios,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo guardar el empleado.";
        setError(message);
        toast.error("No se pudo guardar el empleado", { description: message });
        return;
      }

      setOpen(false);
      toast.success(esEditar ? "Empleado actualizado" : "Empleado creado");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado.");
      toast.error("No se pudo guardar el empleado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {esEditar ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-2xl"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      ) : limiteAlcanzado ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="rounded-2xl border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
        >
          <Lock className="h-4 w-4" />
          Actualizar plan
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="rounded-2xl">
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        {limiteAlcanzado && limiteInfo ? (
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
            <LimiteRecursoContent info={limiteInfo} onCerrar={() => setOpen(false)} />
          </DialogContent>
        ) : (
        <DialogContent className="h-[min(92dvh,780px)] max-h-[92dvh] max-w-6xl gap-0 overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-4 pr-16 sm:px-6">
            <DialogTitle className="text-lg font-bold">
              {esEditar ? "Editar empleado" : "Nuevo empleado"}
            </DialogTitle>
            <DialogDescription>
              {esEditar
                ? "Actualizá los datos, servicios y horarios del empleado."
                : "Definí qué servicios realiza y cuándo está disponible para recibir citas."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto]">
            <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
              <div className="grid gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div className="space-y-5">
                  <section className="space-y-3 border-b border-border/70 pb-5">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={nombre}
                        onChange={(event) => setNombre(event.target.value)}
                        placeholder="Nombre del profesional"
                        className="h-10 rounded-lg"
                        required
                      />
                    </div>

                    <div className="grid gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="profesional@negocio.com"
                          className="h-10 rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                        <Input
                          id="telefono"
                          value={telefono}
                          onChange={(event) => setTelefono(event.target.value)}
                          placeholder="09XX XXX XXX"
                          className="h-10 rounded-lg"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3 border-b border-border/70 pb-5">
                    <Label>Color en la agenda</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {coloresRapidos.map((colorItem) => {
                        const activo = colorItem.toLowerCase() === color.toLowerCase();

                        return (
                          <button
                            key={colorItem}
                            type="button"
                            onClick={() => setColor(colorItem)}
                            className={`flex size-8 items-center justify-center rounded-full border transition-[transform,box-shadow] active:scale-95 ${
                              activo ? "ring-2 ring-ring ring-offset-2 ring-offset-popover" : "hover:shadow-md"
                            }`}
                            style={{ backgroundColor: colorItem }}
                            aria-label={`Elegir color ${colorItem}`}
                            aria-pressed={activo}
                          >
                            {activo && <Check className="size-4 text-white" />}
                          </button>
                        );
                      })}

                      <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-medium">
                        <span className="size-4 rounded-full border" style={{ backgroundColor: color }} />
                        Personalizado
                        <Input
                          type="color"
                          value={color}
                          onChange={(event) => setColor(event.target.value)}
                          className="sr-only"
                          aria-label="Elegir color personalizado"
                        />
                      </label>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="flex items-center gap-2">
                        <BriefcaseBusiness className="size-4 text-primary" />
                        Servicios que realiza
                        <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-xs font-medium text-muted-foreground">
                        {serviciosSeleccionados.length} seleccionado{serviciosSeleccionados.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {serviciosActivos.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
                        Primero creá un servicio activo en el módulo Servicios.
                      </div>
                    ) : (
                      <div
                        className={`grid max-h-40 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 ${
                          serviciosSeleccionados.length === 0 ? "rounded-lg ring-1 ring-destructive/35" : ""
                        }`}
                        role="group"
                        aria-label="Servicios obligatorios del empleado"
                      >
                        {serviciosActivos.map((servicio) => {
                          const seleccionado = serviciosSeleccionados.includes(servicio.id);

                          return (
                            <button
                              key={servicio.id}
                              type="button"
                              onClick={() => toggleServicio(servicio.id)}
                              aria-pressed={seleccionado}
                              className={`min-h-10 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-[background-color,border-color,color,transform] active:scale-[0.98] ${
                                seleccionado
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/80 hover:bg-muted"
                              }`}
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate">{servicio.nombre}</span>
                                {seleccionado && <Check className="size-4 shrink-0" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {serviciosActivos.length > 0 && serviciosSeleccionados.length === 0 ? (
                      <p className="text-xs font-medium text-destructive">Elegí al menos un servicio.</p>
                    ) : null}
                  </section>
                </div>

                <section className="min-w-0 space-y-3 md:border-l md:border-border/70 md:pl-6">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      Horarios de trabajo
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Activá los días disponibles y definí entrada y salida.
                    </p>
                  </div>

                  <div className="grid gap-2 min-[1180px]:grid-cols-2">
                    {diasSemana.map((dia) => {
                      const horario = horarios.find((item) => item.dia_semana === dia.dia);
                      if (!horario) return null;

                      return (
                        <article key={dia.dia} className="min-w-0 rounded-lg border border-border/80 bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{dia.nombre}</p>
                              <p className="text-xs text-muted-foreground">
                                {horario.activo ? "Disponible" : "Sin atención"}
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={horario.activo}
                              aria-label={`${horario.activo ? "Desactivar" : "Activar"} ${dia.nombre}`}
                              onClick={() => actualizarHorario(dia.dia, "activo", !horario.activo)}
                              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                                horario.activo ? "bg-primary" : "bg-muted-foreground/25"
                              }`}
                            >
                              <span
                                className={`absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform ${
                                  horario.activo ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {horario.activo ? (
                            <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
                              <label className="min-w-0 space-y-1">
                                <span className="text-[11px] font-medium text-muted-foreground">Entrada</span>
                                <Input
                                  type="time"
                                  value={horaInput(horario.hora_inicio)}
                                  onChange={(event) => actualizarHorario(dia.dia, "hora_inicio", event.target.value)}
                                  aria-label={`${dia.nombre}, hora de entrada`}
                                  className="h-10 min-w-0 rounded-lg bg-background px-2 text-[13px] font-semibold tabular-nums [color-scheme:light] sm:text-sm dark:[color-scheme:dark]"
                                  required
                                />
                              </label>
                              <label className="min-w-0 space-y-1">
                                <span className="text-[11px] font-medium text-muted-foreground">Salida</span>
                                <Input
                                  type="time"
                                  value={horaInput(horario.hora_fin)}
                                  onChange={(event) => actualizarHorario(dia.dia, "hora_fin", event.target.value)}
                                  aria-label={`${dia.nombre}, hora de salida`}
                                  className="h-10 min-w-0 rounded-lg bg-background px-2 text-[13px] font-semibold tabular-nums [color-scheme:light] sm:text-sm dark:[color-scheme:dark]"
                                  required
                                />
                              </label>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            <div className="border-t border-border/70 bg-popover px-4 py-3 sm:px-6">
              {error ? (
                <Alert variant="destructive" className="mb-3 py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded-2xl"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={loading || serviciosActivos.length === 0 || serviciosSeleccionados.length === 0}
                  className="rounded-2xl"
                >
                  {loading
                    ? "Guardando..."
                    : esEditar
                      ? "Guardar cambios"
                      : "Crear empleado"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
        )}
      </Dialog>
    </>
  );
}
