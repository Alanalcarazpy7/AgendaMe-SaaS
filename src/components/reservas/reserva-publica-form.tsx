"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ListChecks,
  type LucideIcon,
  Loader2,
  MapPin,
  NotebookText,
  Phone,
  UserRound,
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

function fechaLegible(fecha: string) {
  if (!fecha) return "Sin fecha";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PY", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

const inputClass =
  "mt-2 h-12 w-full rounded-2xl border border-border/80 bg-background/70 px-4 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--ease-out)] placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:bg-white/[0.04]";

const sectionClass =
  "rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_20px_65px_rgb(15_23_42/0.08)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5";

function StepHeader({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Paso {number}
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
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

  const sucursalSeleccionada = useMemo(
    () => sucursales.find((sucursal) => sucursal.id === sucursalId),
    [sucursalId, sucursales]
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
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-border/80 bg-card/90 p-8 text-center shadow-[0_24px_80px_rgb(15_23_42/0.10)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/30 dark:ring-white/5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h2 className="mt-6 text-3xl font-bold tracking-tight">Reserva enviada</h2>

        <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
          Tu solicitud quedó registrada como pendiente. El negocio podrá confirmarla o cancelarla.
        </p>

        <Link
          href={successUrl}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 outline-none transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Ver estado de mi reserva
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="space-y-5">
        {mostrarSucursales && (
          <section className={sectionClass}>
            <StepHeader
              number="01"
              title="Elegí una sucursal"
              description="Seleccioná dónde querés recibir el servicio."
              icon={MapPin}
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {sucursales.map((sucursal) => {
                const active = sucursalId === sucursal.id;

                return (
                  <button
                    key={sucursal.id}
                    type="button"
                    onClick={() => {
                      setSucursalId(sucursal.id);
                      setServicioId("");
                      setHoraInicio("");
                      setSlots([]);
                    }}
                    className={`group rounded-[1.35rem] border p-4 text-left outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-border/80 bg-background/60 hover:border-primary/25 hover:bg-background/80 dark:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{sucursal.nombre}</p>
                        <p className={`mt-1 text-sm leading-6 ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {sucursal.direccion || "Sin dirección cargada"}
                        </p>
                      </div>

                      {active && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>

                    {sucursal.telefono && (
                      <p className={`mt-3 inline-flex items-center gap-2 text-xs ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        <Phone className="h-3.5 w-3.5" />
                        {sucursal.telefono}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className={sectionClass}>
          <StepHeader
            number={mostrarSucursales ? "02" : "01"}
            title="Elegí un servicio"
            description="Compará duración y precio antes de seleccionar."
            icon={ListChecks}
          />

          {!sucursalId ? (
            <div className="mt-5 rounded-[1.35rem] border border-dashed bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
              Primero seleccioná una sucursal para ver sus servicios disponibles.
            </div>
          ) : serviciosVisibles.length === 0 ? (
            <div className="mt-5 flex gap-3 rounded-[1.35rem] border border-amber-300/50 bg-amber-50 p-5 text-sm leading-6 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              Esta sucursal todavía no tiene servicios disponibles. El negocio debe asignar servicios y horarios desde su panel.
            </div>
          ) : (
            <div className="mt-5 grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {serviciosVisibles.map((servicio) => {
                const active = servicioId === servicio.id;

                return (
                  <button
                    key={servicio.id}
                    type="button"
                    onClick={() => setServicioId(servicio.id)}
                    className={`group overflow-hidden rounded-[1.5rem] border text-left outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      active
                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 ring-2 ring-primary/15"
                        : "border-border/80 bg-background/60 hover:border-primary/25 hover:bg-background/80 hover:shadow-lg dark:bg-white/[0.04]"
                    }`}
                  >
                    <div className="relative h-36 bg-muted">
                      {servicio.imagen_url ? (
                        <img
                          src={servicio.imagen_url}
                          alt={servicio.nombre}
                          className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_18%,transparent),color-mix(in_srgb,var(--ring)_16%,transparent))] text-primary">
                          <ListChecks className="h-8 w-8" />
                        </div>
                      )}

                      {active && (
                        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="font-bold">{servicio.nombre}</p>
                      {servicio.descripcion && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {servicio.descripcion}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted/55 px-2.5 py-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {servicio.duracion_minutos} min
                        </span>
                        <span className="font-bold">{formatGs(servicio.precio)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className={sectionClass}>
          <StepHeader
            number={mostrarSucursales ? "03" : "02"}
            title="Elegí fecha y horario"
            description="Los horarios se actualizan según el servicio elegido."
            icon={CalendarDays}
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Fecha</label>
              <input
                type="date"
                min={hoyISO()}
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Servicio seleccionado</label>
              <div className="mt-2 flex h-12 items-center rounded-2xl border border-border/80 bg-muted/35 px-4 text-sm text-muted-foreground">
                {servicioSeleccionado
                  ? `${servicioSeleccionado.nombre} · ${servicioSeleccionado.duracion_minutos} min`
                  : "Seleccioná un servicio"}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Horarios disponibles</h3>
            </div>

            {loadingSlots ? (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={index}
                    className="h-11 animate-pulse rounded-2xl bg-muted"
                  />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="mt-4 rounded-[1.35rem] border border-dashed bg-muted/35 p-5 text-sm leading-6 text-muted-foreground">
                {servicioId
                  ? "No hay horarios disponibles para esta fecha."
                  : "Seleccioná un servicio para ver horarios."}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setHoraInicio(slot)}
                    className={`h-11 rounded-2xl border px-4 text-sm font-semibold outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      horaInicio === slot
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-border/80 bg-background/60 hover:border-primary/25 hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={sectionClass}>
          <StepHeader
            number={mostrarSucursales ? "04" : "03"}
            title="Tus datos"
            description="Dejá un contacto para que puedan confirmar tu reserva."
            icon={UserRound}
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold">Nombre completo</label>
              <input
                value={clienteNombre}
                onChange={(event) => setClienteNombre(event.target.value)}
                className={inputClass}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Teléfono</label>
              <input
                type="tel"
                value={clienteTelefono}
                onChange={(event) => setClienteTelefono(event.target.value)}
                className={inputClass}
                placeholder="0981..."
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Email opcional</label>
              <input
                type="email"
                value={clienteEmail}
                onChange={(event) => setClienteEmail(event.target.value)}
                className={inputClass}
                placeholder="email@ejemplo.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Notas opcionales</label>
              <input
                value={notas}
                onChange={(event) => setNotas(event.target.value)}
                className={inputClass}
                placeholder="Detalle adicional"
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 flex gap-3 rounded-[1.35rem] border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={reservar}
            disabled={loadingSubmit}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 outline-none transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:translate-y-0 disabled:opacity-60"
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

      <aside className="lg:sticky lg:top-5">
        <div className="rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-[0_20px_65px_rgb(15_23_42/0.08)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/25 dark:ring-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <NotebookText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Resumen</p>
              <p className="text-xs text-muted-foreground">Revisá antes de enviar.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="rounded-2xl border bg-muted/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Sucursal
              </p>
              <p className="mt-1 font-semibold">
                {sucursalSeleccionada?.nombre ?? "Pendiente"}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Servicio
              </p>
              <p className="mt-1 font-semibold">
                {servicioSeleccionado?.nombre ?? "Pendiente"}
              </p>
              {servicioSeleccionado && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {servicioSeleccionado.duracion_minutos} min · {formatGs(servicioSeleccionado.precio)}
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-muted/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Fecha y hora
              </p>
              <p className="mt-1 font-semibold capitalize">{fechaLegible(fecha)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {horaInicio || "Horario pendiente"}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/35 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Contacto
              </p>
              <p className="mt-1 font-semibold">{clienteNombre || "Nombre pendiente"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {clienteTelefono || "Teléfono pendiente"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
