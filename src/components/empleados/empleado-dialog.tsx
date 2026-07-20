"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Pencil, Plus } from "lucide-react";
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
}: EmpleadoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<HorarioEmpleadoItem[]>(crearHorariosDefault);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEditar = variant === "editar";

  const serviciosActivos = useMemo(() => {
    return servicios.filter((servicio) => servicio.estado === "activo");
  }, [servicios]);

  useEffect(() => {
    if (!open) return;

    setNombre(empleado?.nombre ?? "");
    setEmail(empleado?.email ?? "");
    setTelefono(empleado?.telefono ?? "");
    setColor(empleado?.color_calendario ?? "#2563eb");
    setServiciosSeleccionados(empleado?.servicios_ids ?? []);
    setHorarios(normalizarHorariosIniciales(empleado?.horarios));
    setError(null);
  }, [open, empleado]);

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

    setLoading(true);
    setError(null);

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
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="rounded-2xl">
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {esEditar ? "Editar empleado" : "Nuevo empleado"}
            </DialogTitle>
            <DialogDescription>
              {esEditar
                ? "Actualizá los datos, servicios y horarios del empleado."
                : "Cargá una persona que atenderá citas o realizará servicios."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej: Nombre del profesional o colaborador"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Color en la agenda</Label>

              <div className="flex flex-wrap items-center gap-3">
                {coloresRapidos.map((colorItem) => {
                  const activo = colorItem.toLowerCase() === color.toLowerCase();

                  return (
                    <button
                      key={colorItem}
                      type="button"
                      onClick={() => setColor(colorItem)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition hover:scale-105"
                      style={{ backgroundColor: colorItem }}
                      aria-label={`Elegir color ${colorItem}`}
                    >
                      {activo && <Check className="h-4 w-4 text-white" />}
                    </button>
                  );
                })}

                <div className="flex items-center gap-2 rounded-full border px-3 py-2">
                  <span
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <Input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-muted-foreground">
                    Personalizado
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Servicios que realiza</Label>

              {serviciosActivos.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Primero cargá al menos un servicio activo en el módulo Servicios.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {serviciosActivos.map((servicio) => {
                    const seleccionado = serviciosSeleccionados.includes(servicio.id);

                    return (
                      <button
                        key={servicio.id}
                        type="button"
                        onClick={() => toggleServicio(servicio.id)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                          seleccionado
                            ? "border-primary bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          {servicio.nombre}
                          {seleccionado && <Check className="h-4 w-4" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horarios de trabajo
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Estos horarios se usarán para calcular disponibilidad de citas y, más adelante, reportes de trabajo.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border">
                <div className="divide-y">
                  {diasSemana.map((dia) => {
                    const horario = horarios.find((item) => item.dia_semana === dia.dia);

                    if (!horario) return null;

                    return (
                      <div
                        key={dia.dia}
                        className="grid gap-4 p-4 md:grid-cols-[170px_1fr]"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              actualizarHorario(dia.dia, "activo", !horario.activo)
                            }
                            className={`relative h-6 w-11 rounded-full transition ${
                              horario.activo ? "bg-primary" : "bg-muted"
                            }`}
                            aria-label={`Activar ${dia.nombre}`}
                          >
                            <span
                              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                                horario.activo ? "left-6" : "left-1"
                              }`}
                            />
                          </button>

                          <div>
                            <p className="font-medium">{dia.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {horario.activo ? "Trabaja" : "No trabaja"}
                            </p>
                          </div>
                        </div>

                        {horario.activo ? (
                          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                            <Input
                              type="time"
                              value={horaInput(horario.hora_inicio)}
                              onChange={(event) =>
                                actualizarHorario(
                                  dia.dia,
                                  "hora_inicio",
                                  event.target.value
                                )
                              }
                              required
                            />

                            <span className="text-center text-muted-foreground">
                              a
                            </span>

                            <Input
                              type="time"
                              value={horaInput(horario.hora_fin)}
                              onChange={(event) =>
                                actualizarHorario(
                                  dia.dia,
                                  "hora_fin",
                                  event.target.value
                                )
                              }
                              required
                            />
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-muted-foreground">
                            No se podrán asignar citas a este empleado este día.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-2xl"
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={loading} className="rounded-2xl">
                {loading
                  ? "Guardando..."
                  : esEditar
                    ? "Guardar cambios"
                    : "Crear empleado"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
