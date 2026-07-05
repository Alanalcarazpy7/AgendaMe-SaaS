"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
} from "lucide-react";

type ServicioPublico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number | string | null;
  color: string | null;
  imagen_url?: string | null;
};

type SucursalPublica = {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  es_principal: boolean;
};

type ReservaPublicaFormProps = {
  negocioSlug: string;
  servicios: ServicioPublico[];
  sucursales?: SucursalPublica[];
  serviciosPorSucursal?: Record<string, string[]>;
};

function formatGs(valor: number | string | null) {
  const numero = Number(valor ?? 0);
  return `Gs. ${numero.toLocaleString("es-PY")}`;
}

function hoyISO() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReservaPublicaForm({
  negocioSlug,
  servicios,
  sucursales = [],
  serviciosPorSucursal = {},
}: ReservaPublicaFormProps) {
  const mostrarSucursales = sucursales.length > 1;

  const [servicioId, setServicioId] = useState("");
  const [sucursalId, setSucursalId] = useState(
    mostrarSucursales ? "" : sucursales[0]?.id ?? ""
  );
  const [fecha, setFecha] = useState(hoyISO());
  const [slots, setSlots] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState("");
  const [successUrl, setSuccessUrl] = useState("");

  const serviciosVisibles = useMemo(() => {
    if (!sucursalId) return servicios;

    return servicios.filter((servicio) => {
      const sucursalesDelServicio = serviciosPorSucursal[servicio.id] ?? [];

      if (sucursalesDelServicio.length === 0) return true;

      return sucursalesDelServicio.includes(sucursalId);
    });
  }, [servicios, serviciosPorSucursal, sucursalId]);

  const servicioSeleccionado = useMemo(
    () => serviciosVisibles.find((servicio) => servicio.id === servicioId),
    [servicioId, serviciosVisibles]
  );

  useEffect(() => {
    if (!servicioId) return;

    const existeEnSucursal = serviciosVisibles.some(
      (servicio) => servicio.id === servicioId
    );

    if (!existeEnSucursal) {
      setServicioId("");
      setHoraInicio("");
      setSlots([]);
    }
  }, [servicioId, serviciosVisibles]);

  useEffect(() => {
    async function cargarDisponibilidad() {
      setSlots([]);
      setHoraInicio("");
      setError("");

      if (!servicioId || !fecha) return;
      if (mostrarSucursales && !sucursalId) return;

      try {
        setLoadingSlots(true);

        const params = new URLSearchParams();
        params.set("servicioId", servicioId);
        params.set("fecha", fecha);

        if (sucursalId) {
          params.set("sucursalId", sucursalId);
        }

        const response = await fetch(
          `/api/public/disponibilidad/${negocioSlug}?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "No se pudo cargar la disponibilidad.");
          return;
        }

        setSlots(data.slots ?? []);
      } catch {
        setError("No se pudo cargar la disponibilidad.");
      } finally {
        setLoadingSlots(false);
      }
    }

    cargarDisponibilidad();
  }, [negocioSlug, servicioId, fecha, sucursalId, mostrarSucursales]);

  async function reservar() {
    try {
      setLoadingSubmit(true);
      setError("");
      setSuccessUrl("");

      if (!sucursalId) {
        setError("Seleccioná una sucursal.");
        return;
      }

      if (!servicioId || !fecha || !horaInicio || !clienteNombre || !clienteTelefono) {
        setError("Completá servicio, fecha, hora, nombre y teléfono.");
        return;
      }

      const response = await fetch(`/api/public/reservas/${negocioSlug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          servicioId,
          sucursalId,
          fecha,
          horaInicio,
          clienteNombre,
          clienteTelefono,
          clienteEmail,
          notas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear la reserva.");
        return;
      }

      setSuccessUrl(data.seguimientoUrl);
    } catch {
      setError("No se pudo crear la reserva.");
    } finally {
      setLoadingSubmit(false);
    }
  }

  if (successUrl) {
    return (
      <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-100 text-green-700">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h2 className="mt-6 text-3xl font-bold">Reserva enviada</h2>

        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Tu reserva fue registrada como pendiente. El negocio podrá confirmarla o cancelarla.
        </p>

        <Link
          href={successUrl}
          className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Ver estado de mi reserva
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {mostrarSucursales && (
        <section className="rounded-3xl border bg-background p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold">Elegí una sucursal</h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {sucursales.map((sucursal) => (
              <button
                key={sucursal.id}
                type="button"
                onClick={() => {
                  setSucursalId(sucursal.id);
                  setServicioId("");
                  setHoraInicio("");
                  setSlots([]);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  sucursalId === sucursal.id
                    ? "border-foreground bg-foreground text-background"
                    : "bg-muted/20 hover:bg-muted"
                }`}
              >
                <p className="font-bold">{sucursal.nombre}</p>
                <p className="mt-1 text-sm opacity-80">
                  {sucursal.direccion || "Sin dirección cargada"}
                </p>
                {sucursal.telefono && (
                  <p className="mt-1 text-xs opacity-80">{sucursal.telefono}</p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <h2 className="text-xl font-bold">Elegí un servicio</h2>

        {!sucursalId ? (
          <p className="mt-4 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Primero seleccioná una sucursal para ver sus servicios disponibles.
          </p>
        ) : serviciosVisibles.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Esta sucursal todavía no tiene servicios disponibles. Asigná servicios y horarios a sus empleados desde el panel del negocio.
          </p>
        ) : (
          <div className="mt-4 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviciosVisibles.map((servicio) => (
              <button
                key={servicio.id}
                type="button"
                onClick={() => setServicioId(servicio.id)}
                className={`overflow-hidden rounded-3xl border text-left transition ${
                  servicioId === servicio.id
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "hover:bg-muted/40"
                }`}
              >
                {servicio.imagen_url && (
                  <img
                    src={servicio.imagen_url}
                    alt={servicio.nombre}
                    className="h-36 w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <p className="font-bold">{servicio.nombre}</p>
                  {servicio.descripcion && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {servicio.descripcion}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>{servicio.duracion_minutos} min</span>
                    <span className="font-semibold">{formatGs(servicio.precio)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Fecha</label>
            <input
              type="date"
              min={hoyISO()}
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Servicio seleccionado</label>
            <div className="mt-2 flex h-11 items-center rounded-xl border bg-muted/30 px-3 text-sm text-muted-foreground">
              {servicioSeleccionado
                ? `${servicioSeleccionado.nombre} · ${servicioSeleccionado.duracion_minutos} min`
                : "Seleccioná un servicio"}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-bold">Horarios disponibles</h3>
          </div>

          {loadingSlots ? (
            <div className="mt-4 flex items-center rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando horarios...
            </div>
          ) : slots.length === 0 ? (
            <p className="mt-4 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              {servicioId
                ? "No hay horarios disponibles para esta fecha."
                : "Seleccioná un servicio para ver horarios."}
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setHoraInicio(slot)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    horaInicio === slot
                      ? "bg-foreground text-background"
                      : "hover:bg-muted"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <h2 className="text-xl font-bold">Tus datos</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Nombre completo</label>
            <input
              value={clienteNombre}
              onChange={(event) => setClienteNombre(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Teléfono</label>
            <input
              value={clienteTelefono}
              onChange={(event) => setClienteTelefono(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              placeholder="0981..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email opcional</label>
            <input
              type="email"
              value={clienteEmail}
              onChange={(event) => setClienteEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              placeholder="email@ejemplo.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notas opcionales</label>
            <input
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              placeholder="Detalle adicional"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={reservar}
          disabled={loadingSubmit}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
        >
          {loadingSubmit ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarDays className="mr-2 h-4 w-4" />
          )}
          Solicitar reserva
        </button>
      </section>
    </div>
  );
}