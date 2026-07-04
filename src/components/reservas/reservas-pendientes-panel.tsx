"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Phone,
  Save,
  Scissors,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeguimientoActions } from "@/components/reservas/seguimiento-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ReservaPendienteItem = {
  id: string;
  cliente_id: string;
  servicio_id: string;
  empleado_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada" | "no_asistio";
  created_at: string;
  seguimiento_token: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  cliente_email: string | null;
  servicio_nombre: string;
  empleado_nombre: string;
};

export type ClienteReservaOption = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
};

export type ServicioReservaOption = {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number | string | null;
};

export type EmpleadoReservaOption = {
  id: string;
  nombre: string;
};

export type EmpleadoServicioReservaOption = {
  empleado_id: string;
  servicio_id: string;
};

type ReservasPendientesPanelProps = {
  reservas: ReservaPendienteItem[];
  clientes: ClienteReservaOption[];
  servicios: ServicioReservaOption[];
  empleados: EmpleadoReservaOption[];
  empleadoServicios: EmpleadoServicioReservaOption[];
};

function hora(valor: string) {
  return valor.slice(0, 5);
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function formatearFechaHora(valor: string) {
  return new Date(valor).toLocaleString("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  });
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

function estadoClass(estado: ReservaPendienteItem["estado"]) {
  if (estado === "confirmada") return "bg-blue-100 text-blue-700";
  if (estado === "completada") return "bg-green-100 text-green-700";
  if (estado === "cancelada") return "bg-red-100 text-red-700";
  if (estado === "no_asistio") return "bg-orange-100 text-orange-700";
  return "bg-yellow-100 text-yellow-700";
}

function estadoLabel(estado: ReservaPendienteItem["estado"]) {
  if (estado === "no_asistio") return "No asistió";
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

export function ReservasPendientesPanel({
  reservas,
  clientes,
  servicios,
  empleados,
  empleadoServicios,
}: ReservasPendientesPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] =
    useState<ReservaPendienteItem | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [empleadoId, setEmpleadoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [estado, setEstado] =
    useState<ReservaPendienteItem["estado"]>("pendiente");

  const servicioSeleccionado = servicios.find(
    (servicio) => servicio.id === servicioId
  );

  const empleadosDisponibles = useMemo(() => {
    if (!servicioId) return empleados;

    const empleadosIds = new Set(
      empleadoServicios
        .filter((relacion) => relacion.servicio_id === servicioId)
        .map((relacion) => relacion.empleado_id)
    );

    return empleados.filter((empleado) => empleadosIds.has(empleado.id));
  }, [servicioId, empleados, empleadoServicios]);

  function abrirDetalle(reserva: ReservaPendienteItem) {
    setReservaSeleccionada(reserva);
    setClienteId(reserva.cliente_id);
    setServicioId(reserva.servicio_id);
    setEmpleadoId(reserva.empleado_id);
    setFecha(reserva.fecha);
    setHoraInicio(hora(reserva.hora_inicio));
    setEstado(reserva.estado);
    setDetalleOpen(true);
  }

  function cambiarServicio(nuevoServicioId: string) {
    setServicioId(nuevoServicioId);

    const empleadosIds = new Set(
      empleadoServicios
        .filter((relacion) => relacion.servicio_id === nuevoServicioId)
        .map((relacion) => relacion.empleado_id)
    );

    if (!empleadosIds.has(empleadoId)) {
      const primerEmpleado = empleados.find((empleado) =>
        empleadosIds.has(empleado.id)
      );

      setEmpleadoId(primerEmpleado?.id ?? "");
    }
  }

  async function actualizarReserva(
    citaId: string,
    body: Record<string, string>
  ) {
    setLoadingId(citaId);

    try {
      const response = await fetch(`/api/dashboard/citas/${citaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error ?? "No se pudo actualizar la reserva.");
        return;
      }

      window.location.reload();
    } finally {
      setLoadingId(null);
    }
  }

  function guardarCambios() {
    if (!reservaSeleccionada) return;

    if (!clienteId) {
      alert("Seleccioná un cliente.");
      return;
    }

    if (!servicioId) {
      alert("Seleccioná un servicio.");
      return;
    }

    if (!empleadoId) {
      alert("Seleccioná un empleado.");
      return;
    }

    actualizarReserva(reservaSeleccionada.id, {
      clienteId,
      servicioId,
      empleadoId,
      fecha,
      horaInicio,
      estado,
    });
  }

  if (reservas.length === 0) {
    return (
      <div className="rounded-3xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h2 className="mt-4 text-2xl font-bold">
          No hay reservas pendientes
        </h2>

        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Cuando un cliente reserve desde el link público, aparecerá acá en forma
          de tabla para confirmar, cancelar o editar rápido.
        </p>

        <Link
          href="/dashboard/citas"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground"
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Ver calendario
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Solicitudes recibidas desde el link público
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Reservas pendientes
            </h1>
            <p className="mt-2 text-muted-foreground">
              Vista rápida en tabla, ordenada por fecha y hora del turno.
            </p>
          </div>

          <Link
            href="/dashboard/citas"
            className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Ver calendario
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold">Servicio</th>
                <th className="px-4 py-3 text-left font-semibold">Empleado</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha del turno</th>
                <th className="px-4 py-3 text-left font-semibold">Recibida</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {reservas.map((reserva) => {
                const loading = loadingId === reserva.id;

                return (
                  <tr key={reserva.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {reserva.cliente_nombre}
                      </div>

                      {reserva.cliente_telefono && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {reserva.cliente_telefono}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                        <span>{reserva.servicio_nombre}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{reserva.empleado_nombre}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {formatearFecha(reserva.fecha)}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {hora(reserva.hora_inicio)} - {hora(reserva.hora_fin)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-muted-foreground">
                      {formatearFechaHora(reserva.created_at)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${estadoClass(
                          reserva.estado
                        )}`}
                      >
                        {estadoLabel(reserva.estado)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/dashboard/citas?fecha=${reserva.fecha}&hora=${hora(reserva.hora_inicio)}&cita=${reserva.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Ver en calendario
                        </Link>

                        <SeguimientoActions
                          token={reserva.seguimiento_token}
                          telefono={reserva.cliente_telefono}
                          label="Copiar link"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => abrirDetalle(reserva)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver / editar
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          disabled={loading}
                          onClick={() =>
                            actualizarReserva(reserva.id, {
                              estado: "confirmada",
                            })
                          }
                        >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Confirmar
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          onClick={() =>
                            actualizarReserva(reserva.id, {
                              estado: "cancelada",
                            })
                          }
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ver / editar reserva</DialogTitle>
            <DialogDescription>
              Podés ajustar la reserva antes de confirmarla.
            </DialogDescription>
          </DialogHeader>

          {reservaSeleccionada && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cliente</p>
                  <select
                    value={clienteId}
                    onChange={(event) => setClienteId(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre_completo}
                      </option>
                    ))}
                  </select>

                  {reservaSeleccionada.cliente_telefono && (
                    <p className="text-xs text-muted-foreground">
                      Tel: {reservaSeleccionada.cliente_telefono}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Servicio</p>
                  <select
                    value={servicioId}
                    onChange={(event) => cambiarServicio(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Seleccionar servicio</option>
                    {servicios.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre}
                      </option>
                    ))}
                  </select>

                  {servicioSeleccionado && (
                    <p className="text-xs text-muted-foreground">
                      {servicioSeleccionado.duracion_minutos} min ·{" "}
                      {formatearPrecio(servicioSeleccionado.precio)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Empleado</p>
                  <select
                    value={empleadoId}
                    onChange={(event) => setEmpleadoId(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Seleccionar empleado</option>
                    {empleadosDisponibles.map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre}
                      </option>
                    ))}
                  </select>

                  {empleadosDisponibles.length === 0 && (
                    <p className="text-xs text-red-600">
                      No hay empleados asignados a este servicio.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Estado</p>
                  <select
                    value={estado}
                    onChange={(event) =>
                      setEstado(
                        event.target.value as ReservaPendienteItem["estado"]
                      )
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="no_asistio">No asistió</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fecha</p>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Hora de inicio</p>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(event) => setHoraInicio(event.target.value)}
                  />
                </div>
              </div>

              {reservaSeleccionada.seguimiento_token && (
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Link de seguimiento del cliente
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Usá este enlace para que el cliente consulte el estado de su reserva.
                  </p>

                  <div className="mt-3">
                    <SeguimientoActions
                      token={reservaSeleccionada.seguimiento_token}
                      telefono={reservaSeleccionada.cliente_telefono}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingId === reservaSeleccionada.id}
                  onClick={guardarCambios}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </Button>

                <Button
                  type="button"
                  disabled={loadingId === reservaSeleccionada.id}
                  onClick={() =>
                    actualizarReserva(reservaSeleccionada.id, {
                      estado: "confirmada",
                    })
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={loadingId === reservaSeleccionada.id}
                  onClick={() =>
                    actualizarReserva(reservaSeleccionada.id, {
                      estado: "cancelada",
                    })
                  }
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}