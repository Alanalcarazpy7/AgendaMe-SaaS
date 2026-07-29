"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarClock, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import {
  fechaActualNegocio,
  fechaHoraReservaPasada,
} from "@/lib/reservas/fecha-reserva";

export type RelacionReserva<T> = T | T[] | null | undefined;

export type ClienteReserva = {
  id: string;
  nombre_completo: string;
  telefono?: string | null;
  email?: string | null;
};

export type ServicioReserva = {
  id: string;
  nombre: string;
  duracion_minutos?: number | null;
  precio?: number | string | null;
};

export type EmpleadoReserva = {
  id: string;
  nombre: string;
  sucursal_id?: string | null;
};

export type SucursalReserva = {
  id: string;
  nombre: string;
};

export type ReservaDashboard = {
  id: string;
  negocio_id?: string;
  sucursal_id?: string | null;
  cliente_id: string;
  servicio_id: string;
  empleado_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  precio?: number | string | null;
  notas?: string | null;
  origen?: string | null;
  seguimiento_token?: string | null;
  created_at?: string | null;
  clientes?: RelacionReserva<ClienteReserva>;
  servicios?: RelacionReserva<ServicioReserva>;
  empleados?: RelacionReserva<EmpleadoReserva>;
  sucursales?: RelacionReserva<SucursalReserva>;
};

type EstadoReserva =
  | "pendiente"
  | "confirmada"
  | "completada"
  | "no_asistio"
  | "cancelada";

type Props = {
  reserva: ReservaDashboard;
  clienteActual: ClienteReserva | null;
  servicioActual: ServicioReserva | null;
  empleadoActual: EmpleadoReserva | null;
  clientes: ClienteReserva[];
  servicios: ServicioReserva[];
  empleados: EmpleadoReserva[];
  puedeEditarCliente?: boolean;
  disabled?: boolean;
  onClienteSaved: (cliente: ClienteReserva) => void;
  onSaved: (reserva: ReservaDashboard) => void;
};

const ESTADOS_TERMINALES = new Set<EstadoReserva>([
  "completada",
  "no_asistio",
  "cancelada",
]);

const ESTADO_LABEL: Record<EstadoReserva, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  no_asistio: "No asistió",
  cancelada: "Cancelada",
};

function horaCorta(hora: string) {
  return hora.slice(0, 5);
}

function sumarMinutos(hora: string, minutos: number) {
  const [horas, minutosActuales] = hora.split(":").map(Number);
  const total = horas * 60 + minutosActuales + minutos;
  const horaFinal = Math.floor(total / 60);
  const minutoFinal = total % 60;

  return `${String(horaFinal).padStart(2, "0")}:${String(minutoFinal).padStart(2, "0")}`;
}

export function ReservaEditarDialog({
  reserva,
  clienteActual,
  servicioActual,
  empleadoActual,
  clientes,
  servicios,
  empleados,
  puedeEditarCliente = false,
  disabled = false,
  onClienteSaved,
  onSaved,
}: Props) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [clienteId, setClienteId] = useState(reserva.cliente_id);
  const [clienteNombre, setClienteNombre] = useState(
    clienteActual?.nombre_completo ?? "",
  );
  const [clienteTelefono, setClienteTelefono] = useState(
    clienteActual?.telefono ?? "",
  );
  const [clienteEmail, setClienteEmail] = useState(clienteActual?.email ?? "");
  const [servicioId, setServicioId] = useState(reserva.servicio_id);
  const [empleadoId, setEmpleadoId] = useState(reserva.empleado_id);
  const [fecha, setFecha] = useState(reserva.fecha);
  const [horaInicio, setHoraInicio] = useState(horaCorta(reserva.hora_inicio));
  const [estado, setEstado] = useState<EstadoReserva>(
    reserva.estado as EstadoReserva,
  );
  const [notas, setNotas] = useState(reserva.notas ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const terminal = ESTADOS_TERMINALES.has(reserva.estado as EstadoReserva);
  const servicioSeleccionado =
    servicios.find((servicio) => servicio.id === servicioId) ?? servicioActual;
  const duracion = Number(servicioSeleccionado?.duracion_minutos ?? 30);
  const horaFin = sumarMinutos(horaInicio, duracion);
  const inicioPasado = fechaHoraReservaPasada(fecha, horaInicio);
  const finPasado = fechaHoraReservaPasada(fecha, horaFin);

  const estadosDisponibles = useMemo(() => {
    const actual = reserva.estado as EstadoReserva;

    if (ESTADOS_TERMINALES.has(actual)) return [actual];

    if (actual === "pendiente") {
      return finPasado
        ? (["pendiente", "completada", "no_asistio"] as EstadoReserva[])
        : inicioPasado
          ? (["pendiente", "confirmada"] as EstadoReserva[])
          : (["pendiente", "confirmada", "cancelada"] as EstadoReserva[]);
    }

    return finPasado
      ? (["confirmada", "completada", "no_asistio"] as EstadoReserva[])
      : inicioPasado
        ? (["confirmada"] as EstadoReserva[])
        : (["confirmada", "cancelada"] as EstadoReserva[]);
  }, [finPasado, inicioPasado, reserva.estado]);

  function abrir(openState: boolean) {
    setOpen(openState);

    if (!openState) return;

    setClienteId(reserva.cliente_id);
    setClienteNombre(clienteActual?.nombre_completo ?? "");
    setClienteTelefono(clienteActual?.telefono ?? "");
    setClienteEmail(clienteActual?.email ?? "");
    setServicioId(reserva.servicio_id);
    setEmpleadoId(reserva.empleado_id);
    setFecha(reserva.fecha);
    setHoraInicio(horaCorta(reserva.hora_inicio));
    setEstado(reserva.estado as EstadoReserva);
    setNotas(reserva.notas ?? "");
    setError("");
  }

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const clienteSeleccionado =
        clientes.find((item) => item.id === clienteId) ?? clienteActual;
      const clienteFueModificado =
        puedeEditarCliente &&
        Boolean(clienteSeleccionado) &&
        (clienteNombre.trim() !== clienteSeleccionado?.nombre_completo ||
          clienteTelefono.trim() !== (clienteSeleccionado?.telefono ?? "") ||
          clienteEmail.trim().toLowerCase() !==
            (clienteSeleccionado?.email ?? "").toLowerCase());
      let clienteGuardado = clienteSeleccionado;
      let datosClienteGuardados = false;

      if (clienteFueModificado) {
        const clienteResponse = await fetch(
          `/api/dashboard/clientes/${clienteId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nombreCompleto: clienteNombre,
              telefono: clienteTelefono,
              email: clienteEmail,
            }),
          },
        );
        const clienteData = await clienteResponse.json();

        if (!clienteResponse.ok) {
          const message =
            clienteData.error ??
            "No se pudieron actualizar los datos del cliente.";
          setError(message);
          toast.error("No se pudo actualizar el cliente", {
            description: message,
          });
          return;
        }

        clienteGuardado = {
          id: clienteId,
          nombre_completo: clienteNombre.trim(),
          telefono: clienteTelefono.trim() || null,
          email: clienteEmail.trim().toLowerCase() || null,
        };
        datosClienteGuardados = true;
        onClienteSaved(clienteGuardado);
      }

      const response = await fetch(`/api/dashboard/citas/${reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          servicioId,
          empleadoId,
          fecha,
          horaInicio,
          estado,
          notas,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        const apiMessage = data.error ?? "No se pudo actualizar la reserva.";
        const message = datosClienteGuardados
          ? `Los datos del cliente se guardaron, pero la reserva no: ${apiMessage}`
          : apiMessage;
        setError(message);
        toast.error("No se pudo actualizar la reserva", {
          description: message,
        });
        return;
      }

      const servicio =
        servicios.find((item) => item.id === servicioId) ?? servicioActual;
      const empleado =
        empleados.find((item) => item.id === empleadoId) ?? empleadoActual;

      onSaved({
        ...reserva,
        cliente_id: clienteId,
        servicio_id: servicioId,
        empleado_id: empleadoId,
        sucursal_id: empleado?.sucursal_id ?? reserva.sucursal_id,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado,
        precio: servicio?.precio ?? reserva.precio,
        notas: notas.trim() || null,
        clientes: clienteGuardado,
        servicios: servicio,
        empleados: empleado,
      });
      setOpen(false);
      toast.success("Reserva actualizada", {
        description: "Los cambios ya se reflejan en la bandeja y el calendario.",
      });
    } catch {
      setError("No se pudo actualizar la reserva.");
      toast.error("No se pudo actualizar la reserva");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => abrir(true)}
        disabled={disabled}
        title="Editar reserva"
        aria-label="Editar reserva"
        className="rounded-xl"
      >
        <Pencil className="size-4" />
      </Button>

      <DialogContent
        initialFocus={headerRef}
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader ref={headerRef} tabIndex={-1} className="outline-none">
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarClock className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold">Editar reserva</DialogTitle>
          <DialogDescription>
            Corregí la asignación, el horario o el estado sin crear una reserva
            duplicada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={guardar} className="space-y-5">
          {terminal && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              Esta reserva ya está cerrada. Conservamos sus datos operativos
              como historial; todavía podés corregir el contacto y las notas.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`reserva-cliente-${reserva.id}`}>Cliente</Label>
              <select
                id={`reserva-cliente-${reserva.id}`}
                value={clienteId}
                onChange={(event) => {
                  const siguienteId = event.target.value;
                  const siguiente = clientes.find(
                    (cliente) => cliente.id === siguienteId,
                  );
                  setClienteId(siguienteId);
                  setClienteNombre(siguiente?.nombre_completo ?? "");
                  setClienteTelefono(siguiente?.telefono ?? "");
                  setClienteEmail(siguiente?.email ?? "");
                }}
                disabled={terminal || saving}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition focus:border-primary focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre_completo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`reserva-servicio-${reserva.id}`}>Servicio</Label>
              <select
                id={`reserva-servicio-${reserva.id}`}
                value={servicioId}
                onChange={(event) => setServicioId(event.target.value)}
                disabled={terminal || saving}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition focus:border-primary focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {servicios.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`reserva-empleado-${reserva.id}`}>Empleado</Label>
              <select
                id={`reserva-empleado-${reserva.id}`}
                value={empleadoId}
                onChange={(event) => setEmpleadoId(event.target.value)}
                disabled={terminal || saving}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition focus:border-primary focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`reserva-estado-${reserva.id}`}>Estado</Label>
              <select
                id={`reserva-estado-${reserva.id}`}
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value as EstadoReserva)
                }
                disabled={terminal || saving}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition focus:border-primary focus:ring-3 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {estadosDisponibles.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {ESTADO_LABEL[opcion]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`reserva-fecha-${reserva.id}`}>Fecha</Label>
              <Input
                id={`reserva-fecha-${reserva.id}`}
                type="date"
                min={fechaActualNegocio()}
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                disabled={terminal || saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`reserva-hora-${reserva.id}`}>
                Hora de inicio
              </Label>
              <Input
                id={`reserva-hora-${reserva.id}`}
                type="time"
                value={horaInicio}
                onChange={(event) => setHoraInicio(event.target.value)}
                disabled={terminal || saving}
                required
              />
              <p className="text-xs text-muted-foreground">
                Finaliza a las {horaFin} según la duración del servicio.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/25 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Datos de contacto</h3>
                <p className="text-xs text-muted-foreground">
                  Corregí lo que el cliente escribió al reservar.
                </p>
              </div>
              {!puedeEditarCliente && (
                <span className="text-xs font-medium text-muted-foreground">
                  Solo lectura para tu rol
                </span>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`reserva-cliente-nombre-${reserva.id}`}>
                  Nombre completo
                </Label>
                <Input
                  id={`reserva-cliente-nombre-${reserva.id}`}
                  value={clienteNombre}
                  onChange={(event) => setClienteNombre(event.target.value)}
                  disabled={!puedeEditarCliente || saving}
                  minLength={2}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`reserva-cliente-telefono-${reserva.id}`}>
                  Teléfono
                </Label>
                <Input
                  id={`reserva-cliente-telefono-${reserva.id}`}
                  value={clienteTelefono}
                  onChange={(event) => setClienteTelefono(event.target.value)}
                  disabled={!puedeEditarCliente || saving}
                  inputMode="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`reserva-cliente-email-${reserva.id}`}>
                  Correo
                </Label>
                <Input
                  id={`reserva-cliente-email-${reserva.id}`}
                  type="email"
                  value={clienteEmail}
                  onChange={(event) => setClienteEmail(event.target.value)}
                  disabled={!puedeEditarCliente || saving}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`reserva-notas-${reserva.id}`}>Notas internas</Label>
            <Textarea
              id={`reserva-notas-${reserva.id}`}
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              disabled={saving}
              rows={3}
              placeholder="Indicaciones o correcciones útiles para el equipo."
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
