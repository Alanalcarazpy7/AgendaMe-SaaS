"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  User,
  Scissors,
  XCircle,
} from "lucide-react";

type Relacion<T> = T | T[] | null | undefined;

type Cliente = {
  id: string;
  nombre_completo: string;
  telefono?: string | null;
  email?: string | null;
};

type Servicio = {
  id: string;
  nombre: string;
  duracion_minutos?: number | null;
  precio?: number | string | null;
};

type Empleado = {
  id: string;
  nombre: string;
  sucursal_id?: string | null;
};

type Sucursal = {
  id: string;
  nombre: string;
};

type Reserva = {
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
  clientes?: Relacion<Cliente>;
  servicios?: Relacion<Servicio>;
  empleados?: Relacion<Empleado>;
  sucursales?: Relacion<Sucursal>;
};

type ReservasPendientesPanelProps = {
  reservas?: Reserva[];
  initialReservas?: Reserva[];
  clientes?: Cliente[];
  servicios?: Servicio[];
  empleados?: Empleado[];
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function horaCorta(hora: string | null | undefined) {
  return String(hora ?? "").slice(0, 5);
}

function fechaDisplay(fecha: string) {
  const [year, month, day] = fecha.split("-");

  if (!year || !month || !day) return fecha;

  return `${day}/${month}/${year}`;
}

function fechaRecibidaDisplay(fecha?: string | null) {
  if (!fecha) return "-";

  try {
    return new Intl.DateTimeFormat("es-PY", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(fecha));
  } catch {
    return fecha;
  }
}

function estadoBadge(estado: string) {
  const styles: Record<string, string> = {
    pendiente: "border-yellow-200 bg-yellow-50 text-yellow-700",
    confirmada: "border-blue-200 bg-blue-50 text-blue-700",
    completada: "border-green-200 bg-green-50 text-green-700",
    cancelada: "border-red-200 bg-red-50 text-red-700",
    no_asistio: "border-orange-200 bg-orange-50 text-orange-700",
  };

  return styles[estado] ?? "border-muted bg-muted text-muted-foreground";
}

export function ReservasPendientesPanel({
  reservas,
  initialReservas,
  clientes = [],
  servicios = [],
  empleados = [],
}: ReservasPendientesPanelProps) {
  const [items, setItems] = useState<Reserva[]>(reservas ?? initialReservas ?? []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const reservasOrdenadas = useMemo(() => {
    return [...items].sort((a, b) => {
      const fechaA = `${a.fecha} ${horaCorta(a.hora_inicio)}`;
      const fechaB = `${b.fecha} ${horaCorta(b.hora_inicio)}`;

      return fechaA.localeCompare(fechaB);
    });
  }, [items]);

  function clienteDe(reserva: Reserva) {
    return (
      obtenerObjeto(reserva.clientes) ??
      clientes.find((cliente) => cliente.id === reserva.cliente_id) ??
      null
    );
  }

  function servicioDe(reserva: Reserva) {
    return (
      obtenerObjeto(reserva.servicios) ??
      servicios.find((servicio) => servicio.id === reserva.servicio_id) ??
      null
    );
  }

  function empleadoDe(reserva: Reserva) {
    return (
      obtenerObjeto(reserva.empleados) ??
      empleados.find((empleado) => empleado.id === reserva.empleado_id) ??
      null
    );
  }

  function sucursalDe(reserva: Reserva) {
    return obtenerObjeto(reserva.sucursales);
  }

  async function cambiarEstado(reserva: Reserva, estado: "confirmada" | "cancelada") {
    try {
      setLoadingId(`${reserva.id}-${estado}`);
      setError("");

      const response = await fetch(`/api/dashboard/citas/${reserva.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo actualizar la reserva.");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== reserva.id));
    } catch {
      setError("No se pudo actualizar la reserva.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Solicitudes recibidas desde el link público
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Reservas pendientes
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Revisá, confirmá o cancelá las reservas que todavía están pendientes.
            </p>
          </div>

          <Link
            href="/dashboard/citas"
            className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Ver calendario
          </Link>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-3xl border bg-background shadow-sm">
        {reservasOrdenadas.length === 0 ? (
          <div className="p-6">
            <p className="rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground">
              No hay reservas pendientes para esta vista.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-5 py-4 font-bold">Cliente</th>
                  <th className="px-5 py-4 font-bold">Servicio</th>
                  <th className="px-5 py-4 font-bold">Empleado</th>
                  <th className="px-5 py-4 font-bold">Fecha del turno</th>
                  <th className="px-5 py-4 font-bold">Sucursal</th>
                  <th className="px-5 py-4 font-bold">Recibida</th>
                  <th className="px-5 py-4 font-bold">Estado</th>
                  <th className="px-5 py-4 text-right font-bold">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {reservasOrdenadas.map((reserva) => {
                  const cliente = clienteDe(reserva);
                  const servicio = servicioDe(reserva);
                  const empleado = empleadoDe(reserva);
                  const sucursal = sucursalDe(reserva);

                  const calendarioHref = `/dashboard/citas?fecha=${reserva.fecha}&cita=${reserva.id}`;

                  return (
                    <tr key={reserva.id} className="border-t align-top">
                      <td className="px-5 py-5">
                        <div className="flex gap-3">
                          <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">
                              {cliente?.nombre_completo ?? "Sin cliente"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {cliente?.telefono ?? "Sin teléfono"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex gap-3">
                          <Scissors className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">
                              {servicio?.nombre ?? "Sin servicio"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {servicio?.duracion_minutos
                                ? `${servicio.duracion_minutos} min`
                                : "Duración no cargada"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-semibold">
                          {empleado?.nombre ?? "Sin empleado"}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-bold">{fechaDisplay(reserva.fecha)}</p>
                        <p className="mt-1 flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          {horaCorta(reserva.hora_inicio)} - {horaCorta(reserva.hora_fin)}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p className="font-medium">
                          {sucursal?.nombre ?? "Sucursal principal"}
                        </p>
                      </td>

                      <td className="px-5 py-5 text-muted-foreground">
                        {fechaRecibidaDisplay(reserva.created_at)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadge(
                            reserva.estado
                          )}`}
                        >
                          {reserva.estado}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            href={calendarioHref}
                            className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver / editar
                          </Link>

                          <button
                            type="button"
                            onClick={() => cambiarEstado(reserva, "confirmada")}
                            disabled={Boolean(loadingId)}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
                          >
                            {loadingId === `${reserva.id}-confirmada` ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Confirmar
                          </button>

                          <button
                            type="button"
                            onClick={() => cambiarEstado(reserva, "cancelada")}
                            disabled={Boolean(loadingId)}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                          >
                            {loadingId === `${reserva.id}-cancelada` ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}