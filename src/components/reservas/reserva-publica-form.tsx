"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ServicioReservaPublica = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number | string | null;
  color: string | null;
  imagen_url?: string | null;
};

type ReservaExitosa = {
  fecha: string;
  hora: string;
  servicio: string;
  negocio: string;
  seguimientoUrl: string;
};

type ReservaPublicaFormProps = {
  negocioNombre: string;
  negocioSlug: string;
  servicios: ServicioReservaPublica[];
  negocioTelefono?: string | null;
  colorPrimario?: string | null;
  colorAcento?: string | null;
};

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearPrecio(precio: number | string | null) {
  const valor = Number(precio ?? 0);

  if (!valor) return "Consultar precio";

  return `Gs. ${valor.toLocaleString("es-PY")}`;
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function hexToRgba(hex: string | null | undefined, alpha: number) {
  if (!hex || !/^#([A-Fa-f0-9]{6})$/.test(hex)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ReservaPublicaForm({
  negocioNombre,
  negocioSlug,
  servicios,
  colorPrimario,
  colorAcento,
}: ReservaPublicaFormProps) {
  const colorMarca = colorPrimario ?? colorAcento ?? "#111827";

  const [servicioId, setServicioId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const [horarios, setHorarios] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [error, setError] = useState("");
  const [reservaExitosa, setReservaExitosa] = useState<ReservaExitosa | null>(
    null
  );

  const servicioSeleccionado = useMemo(
    () => servicios.find((servicio) => servicio.id === servicioId) ?? null,
    [servicioId, servicios]
  );

  useEffect(() => {
    setHoraInicio("");
    setHorarios([]);
    setError("");

    if (!servicioId || !fecha) return;

    if (!negocioSlug) {
      setError("No se pudo identificar el negocio.");
      return;
    }

    let cancelado = false;

    async function cargarHorarios() {
      try {
        setLoadingHorarios(true);

        const response = await fetch(
          `/api/public/disponibilidad/${negocioSlug}?servicioId=${servicioId}&fecha=${fecha}`
        );

        const data = await response.json();

        if (cancelado) return;

        if (!response.ok) {
          setHorarios([]);
          setError(data.error ?? "No se pudo cargar la disponibilidad.");
          return;
        }

        setHorarios(Array.isArray(data.slots) ? data.slots : []);
      } catch {
        if (!cancelado) {
          setHorarios([]);
          setError("No se pudo cargar la disponibilidad.");
        }
      } finally {
        if (!cancelado) {
          setLoadingHorarios(false);
        }
      }
    }

    cargarHorarios();

    return () => {
      cancelado = true;
    };
  }, [servicioId, fecha, negocioSlug]);

  async function enviarReserva(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!servicioId || !fecha || !horaInicio || !nombreCompleto || !telefono) {
      setError("Completá servicio, fecha, horario, nombre y teléfono.");
      return;
    }

    try {
      setLoadingReserva(true);
      setError("");

      const response = await fetch(`/api/public/reservas/${negocioSlug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          servicioId,
          fecha,
          horaInicio,
          nombreCompleto,
          telefono,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear la reserva.");
        return;
      }

      setReservaExitosa({
        fecha: data.reserva?.fecha ?? fecha,
        hora: data.reserva?.hora_inicio?.slice(0, 5) ?? horaInicio,
        servicio:
          data.servicio?.nombre ?? servicioSeleccionado?.nombre ?? "Servicio",
        negocio: data.negocio?.nombre ?? negocioNombre,
        seguimientoUrl: data.seguimientoUrl ?? "",
      });

      setServicioId("");
      setFecha("");
      setHoraInicio("");
      setNombreCompleto("");
      setTelefono("");
      setEmail("");
      setHorarios([]);
    } catch {
      setError("No se pudo crear la reserva.");
    } finally {
      setLoadingReserva(false);
    }
  }

  if (reservaExitosa) {
    return (
      <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-yellow-100 text-yellow-700">
          <Clock className="h-8 w-8" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">
          Tu reserva está pendiente de confirmación
        </h2>

        <p className="mt-3 text-muted-foreground">
          El negocio recibió tu solicitud. Guardá el enlace de seguimiento para
          revisar si fue confirmada o cancelada.
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-2xl border bg-muted/30 p-4 text-left">
          <p className="font-semibold">{reservaExitosa.negocio}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {reservaExitosa.servicio}
          </p>
          <p className="mt-3 text-sm">
            <span className="font-medium">Fecha:</span>{" "}
            {formatearFecha(reservaExitosa.fecha)}
          </p>
          <p className="mt-1 text-sm">
            <span className="font-medium">Hora:</span> {reservaExitosa.hora}
          </p>
          <p className="mt-1 text-sm">
            <span className="font-medium">Estado:</span> Pendiente
          </p>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {reservaExitosa.seguimientoUrl && (
            <a
              href={reservaExitosa.seguimientoUrl}
              className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-xs transition"
              style={{ backgroundColor: colorMarca }}
            >
              Ver estado de mi reserva
            </a>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => setReservaExitosa(null)}
          >
            Hacer otra reserva
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={enviarReserva} className="space-y-6">
      {servicios.length === 0 ? (
        <div className="rounded-3xl border bg-background p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold">Reservas no disponibles</h2>
          <p className="mt-3 text-muted-foreground">
            Este negocio todavía no tiene servicios con empleados activos
            asignados.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-3xl border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Scissors className="h-5 w-5" style={{ color: colorMarca }} />
              <h2 className="text-xl font-bold">Elegí un servicio</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {servicios.map((servicio) => {
                const activo = servicio.id === servicioId;
                const colorServicio = servicio.color ?? colorMarca;

                return (
                  <button
                    key={servicio.id}
                    type="button"
                    onClick={() => setServicioId(servicio.id)}
                    className="overflow-hidden rounded-3xl border bg-background text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderColor: activo ? colorServicio : undefined,
                      backgroundColor: activo
                        ? hexToRgba(colorServicio, 0.08)
                        : undefined,
                      boxShadow: activo
                        ? `0 0 0 2px ${hexToRgba(colorServicio, 0.18)}`
                        : undefined,
                    }}
                  >
                    {servicio.imagen_url && (
                      <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                        <img
                          src={servicio.imagen_url}
                          alt={servicio.nombre}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: colorServicio }}
                            />
                            <p className="font-semibold">{servicio.nombre}</p>
                          </div>

                          {servicio.descripcion && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {servicio.descripcion}
                            </p>
                          )}
                        </div>

                        {activo && (
                          <CheckCircle2
                            className="h-5 w-5 shrink-0"
                            style={{ color: colorServicio }}
                          />
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="rounded-full bg-muted px-3 py-1">
                          {servicio.duracion_minutos} min
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1">
                          {formatearPrecio(servicio.precio)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" style={{ color: colorMarca }} />
              <h2 className="text-xl font-bold">Elegí fecha y horario</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  min={todayIso()}
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  disabled={!servicioId}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Horario elegido</label>
                <Input
                  className="mt-1"
                  value={horaInicio || "Seleccioná un horario disponible"}
                  disabled
                />
              </div>
            </div>

            <div className="mt-5">
              {!servicioId ? (
                <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Primero elegí un servicio para ver horarios disponibles.
                </p>
              ) : !fecha ? (
                <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Elegí una fecha para cargar los horarios disponibles.
                </p>
              ) : loadingHorarios ? (
                <div className="flex items-center gap-2 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando horarios disponibles...
                </div>
              ) : horarios.length === 0 ? (
                <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No hay horarios disponibles para ese servicio en esa fecha.
                </p>
              ) : (
                <div>
                  <p className="text-sm font-medium">Horarios disponibles</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {horarios.map((hora) => {
                      const activo = horaInicio === hora;

                      return (
                        <button
                          key={hora}
                          type="button"
                          onClick={() => setHoraInicio(hora)}
                          className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                          style={{
                            borderColor: activo ? colorMarca : undefined,
                            backgroundColor: activo ? colorMarca : undefined,
                            color: activo ? "#ffffff" : undefined,
                          }}
                        >
                          {hora}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border bg-background p-6 shadow-sm">
            <h2 className="text-xl font-bold">Tus datos</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Nombre completo</label>
                <Input
                  className="mt-1"
                  value={nombreCompleto}
                  onChange={(event) => setNombreCompleto(event.target.value)}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Teléfono / WhatsApp
                </label>
                <Input
                  className="mt-1"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  placeholder="Ej: 0981 123 456"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Email opcional</label>
                <Input
                  className="mt-1"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Ej: cliente@email.com"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loadingReserva ||
              !servicioId ||
              !fecha ||
              !horaInicio ||
              !nombreCompleto ||
              !telefono
            }
            className="h-12 w-full rounded-2xl text-base font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: colorMarca }}
          >
            {loadingReserva ? "Enviando reserva..." : "Solicitar reserva"}
          </button>
        </>
      )}
    </form>
  );
}