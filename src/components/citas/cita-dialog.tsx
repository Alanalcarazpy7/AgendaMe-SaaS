"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
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

export type ClienteCitaItem = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  estado: "activo" | "inactivo";
};

export type ServicioCitaItem = {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number | string | null;
  color: string | null;
  estado: "activo" | "inactivo";
};

export type EmpleadoCitaItem = {
  id: string;
  nombre: string;
  color_calendario: string | null;
  estado: "activo" | "inactivo";
};

export type EmpleadoServicioCitaItem = {
  empleado_id: string;
  servicio_id: string;
};

type CitaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFecha: string;
  initialHoraInicio: string;
  clientes: ClienteCitaItem[];
  servicios: ServicioCitaItem[];
  empleados: EmpleadoCitaItem[];
  empleadoServicios: EmpleadoServicioCitaItem[];
  onSaved: () => void;
};

function sumarMinutos(hora: string, minutos: number) {
  if (!hora) return "";

  const [hh, mm] = hora.split(":").map(Number);
  const total = hh * 60 + mm + minutos;
  const nuevaHora = Math.floor(total / 60);
  const nuevosMinutos = total % 60;

  return `${String(nuevaHora).padStart(2, "0")}:${String(nuevosMinutos).padStart(2, "0")}`;
}

function formatearPrecio(precio: number | string | null) {
  const numero = Number(precio ?? 0);

  if (numero <= 0) return "Sin precio";

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(numero);
}

export function CitaDialog({
  open,
  onOpenChange,
  initialFecha,
  initialHoraInicio,
  clientes,
  servicios,
  empleados,
  empleadoServicios,
  onSaved,
}: CitaDialogProps) {
  const [clienteId, setClienteId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [fecha, setFecha] = useState(initialFecha);
  const [horaInicio, setHoraInicio] = useState(initialHoraInicio);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setFecha(initialFecha);
    setHoraInicio(initialHoraInicio);
    setError(null);
  }, [open, initialFecha, initialHoraInicio]);

  const clientesActivos = clientes.filter((cliente) => cliente.estado === "activo");
  const serviciosActivos = servicios.filter((servicio) => servicio.estado === "activo");
  const empleadosActivos = empleados.filter((empleado) => empleado.estado === "activo");

  const servicioSeleccionado = serviciosActivos.find(
    (servicio) => servicio.id === servicioId
  );

  const empleadosDisponibles = useMemo(() => {
    if (!servicioId) return [];

    const empleadosIds = empleadoServicios
      .filter((relacion) => relacion.servicio_id === servicioId)
      .map((relacion) => relacion.empleado_id);

    return empleadosActivos.filter((empleado) => empleadosIds.includes(empleado.id));
  }, [servicioId, empleadosActivos, empleadoServicios]);

  const horaFinEstimada =
    servicioSeleccionado && horaInicio
      ? sumarMinutos(horaInicio, servicioSeleccionado.duracion_minutos)
      : "";

  function handleServicioChange(value: string) {
    setServicioId(value);
    setEmpleadoId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clienteId,
          servicioId,
          empleadoId: empleadoId || null,
          fecha,
          horaInicio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo crear la cita.";
        setError(message);
        toast.error("No se pudo crear la cita", { description: message });
        return;
      }

      setClienteId("");
      setServicioId("");
      setEmpleadoId("");
      onOpenChange(false);
      toast.success("Cita creada correctamente");
      onSaved();
    } catch {
      setError("Ocurrió un error inesperado.");
      toast.error("No se pudo crear la cita");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
          <DialogDescription>
            Seleccioná cliente, servicio y horario. El empleado puede asignarse automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <select
              id="cliente"
              value={clienteId}
              onChange={(event) => setClienteId(event.target.value)}
              required
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Seleccionar cliente</option>
              {clientesActivos.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre_completo}
                  {cliente.telefono ? ` — ${cliente.telefono}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="servicio">Servicio</Label>
            <select
              id="servicio"
              value={servicioId}
              onChange={(event) => handleServicioChange(event.target.value)}
              required
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Seleccionar servicio</option>
              {serviciosActivos.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre} — {servicio.duracion_minutos} min
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="empleado">Empleado</Label>
            <select
              id="empleado"
              value={empleadoId}
              onChange={(event) => setEmpleadoId(event.target.value)}
              disabled={!servicioId}
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
            >
              <option value="">
                {servicioId
                  ? "Asignar automáticamente"
                  : "Primero seleccioná un servicio"}
              </option>

              {empleadosDisponibles.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre}
                </option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground">
              Si no elegís empleado, AgendaMe intentará asignar uno disponible para ese servicio.
            </p>
          </div>

          {servicioSeleccionado && (
            <div className="rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p>
                Servicio:{" "}
                <span className="font-medium text-foreground">
                  {servicioSeleccionado.nombre}
                </span>
              </p>
              <p>Duración: {servicioSeleccionado.duracion_minutos} minutos</p>
              <p>Precio: {formatearPrecio(servicioSeleccionado.precio)}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora de inicio</Label>
              <Input
                id="horaInicio"
                type="time"
                value={horaInicio}
                onChange={(event) => setHoraInicio(event.target.value)}
                required
              />
            </div>
          </div>

          {horaFinEstimada && (
            <p className="text-sm text-muted-foreground">
              Fin estimado:{" "}
              <span className="font-medium text-foreground">{horaFinEstimada}</span>
            </p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>

            <Button type="submit" disabled={loading}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              {loading ? "Creando..." : "Crear cita"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
