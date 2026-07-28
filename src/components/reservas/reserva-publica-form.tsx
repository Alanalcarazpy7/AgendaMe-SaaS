"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  ListChecks,
  LockKeyhole,
  Loader2,
  Mail,
  MapPin,
  NotebookText,
  Phone,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { fechaActualNegocio } from "@/lib/reservas/fecha-reserva";
import { cn } from "@/lib/utils";

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

type ValidationField =
  | "sucursal"
  | "servicio"
  | "fecha"
  | "hora"
  | "nombre"
  | "telefono"
  | "email";

type ValidationErrors = Partial<Record<ValidationField, string>>;

function formatGs(valor: number | string | null) {
  const numero = Number(valor ?? 0);
  return `Gs. ${numero.toLocaleString("es-PY")}`;
}

function hoyISO() {
  return fechaActualNegocio();
}

function fechaLegible(fecha: string) {
  if (!fecha) return "Fecha pendiente";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-PY", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

const inputClass =
  "mt-2 h-11 w-full rounded-md border-2 border-border bg-background px-3.5 text-sm shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 hover:border-primary/35 focus:border-primary focus:ring-3 focus:ring-primary/15";

function StepHeading({
  number,
  title,
  description,
  icon: Icon,
  complete,
}: {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  complete: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-md border transition-colors",
          complete
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            : "border-primary/20 bg-primary/10 text-primary",
        )}
      >
        {complete ? (
          <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Icon className="size-4" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">
          Paso {number}
        </p>
        <h2 className="mt-0.5 text-lg font-bold leading-tight">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;

  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function LockedStep({
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
    <section className="border-b border-border/70 bg-muted/15 p-5 last:border-b-0 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">
            Paso {number}
          </p>
          <h2 className="mt-0.5 text-base font-bold text-muted-foreground">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
        <LockKeyhole
          className="size-4 shrink-0 text-muted-foreground"
          aria-label="Paso bloqueado"
        />
      </div>
    </section>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  detail,
  complete,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  complete: boolean;
}) {
  return (
    <div className="flex gap-3 border-b border-border/70 py-3.5 last:border-b-0">
      <div
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-md",
          complete
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        {complete ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Icon className="size-4" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-0.5 break-words text-sm font-semibold",
            !complete && "text-muted-foreground",
          )}
        >
          {value}
        </p>
        {detail && (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {detail}
          </p>
        )}
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
  const sucursalInicial = mostrarSucursales ? "" : sucursales[0]?.id ?? "";

  const [servicioId, setServicioId] = useState("");
  const [sucursalId, setSucursalId] = useState(sucursalInicial);
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
  const [slotsError, setSlotsError] = useState("");
  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>({});
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
    [servicioId, serviciosVisibles],
  );

  const sucursalSeleccionada = useMemo(
    () => sucursales.find((sucursal) => sucursal.id === sucursalId),
    [sucursalId, sucursales],
  );

  const sucursalCompleta = Boolean(sucursalId);
  const servicioCompleto = Boolean(servicioSeleccionado);
  const horarioCompleto = Boolean(fecha && horaInicio);
  const contactoCompleto = Boolean(
    clienteNombre.trim() && clienteTelefono.trim(),
  );

  const progressSteps = [
    ...(mostrarSucursales
      ? [{ key: "sucursal", label: "Sucursal", complete: sucursalCompleta }]
      : []),
    { key: "servicio", label: "Servicio", complete: servicioCompleto },
    { key: "horario", label: "Horario", complete: horarioCompleto },
    { key: "contacto", label: "Tus datos", complete: contactoCompleto },
  ];
  const completedSteps = progressSteps.filter((step) => step.complete).length;
  const progressPercentage = Math.round(
    (completedSteps / progressSteps.length) * 100,
  );

  useEffect(() => {
    async function cargarDisponibilidad() {
      setSlots([]);
      setHoraInicio("");
      setSlotsError("");
      setValidationErrors((current) => ({
        ...current,
        hora: undefined,
      }));

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
          `/api/public/disponibilidad/${negocioSlug}?${params.toString()}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setSlotsError(
            data.error ?? "No se pudo cargar la disponibilidad.",
          );
          return;
        }

        setSlots(data.slots ?? []);
      } catch {
        setSlotsError("No se pudo cargar la disponibilidad.");
      } finally {
        setLoadingSlots(false);
      }
    }

    cargarDisponibilidad();
  }, [negocioSlug, servicioId, fecha, sucursalId, mostrarSucursales]);

  function clearFieldError(field: ValidationField) {
    setValidationErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
    setError("");
  }

  function scrollToField(field: ValidationField) {
    const sectionMap: Record<ValidationField, string> = {
      sucursal: "reserva-sucursal",
      servicio: "reserva-servicio",
      fecha: "reserva-horario",
      hora: "reserva-horario",
      nombre: "reserva-contacto",
      telefono: "reserva-contacto",
      email: "reserva-contacto",
    };

    window.requestAnimationFrame(() => {
      document
        .getElementById(sectionMap[field])
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function validarReserva() {
    const errors: ValidationErrors = {};

    if (!sucursalId) {
      errors.sucursal = "Seleccioná una sucursal.";
    }

    if (!servicioId) {
      errors.servicio = "Seleccioná un servicio.";
    }

    if (!fecha || fecha < hoyISO()) {
      errors.fecha = "Elegí una fecha válida.";
    }

    if (!horaInicio) {
      errors.hora = "Seleccioná un horario disponible.";
    }

    if (clienteNombre.trim().length < 2) {
      errors.nombre = "Ingresá tu nombre completo.";
    }

    if (clienteTelefono.replace(/\D/g, "").length < 6) {
      errors.telefono = "Ingresá un teléfono válido.";
    }

    if (
      clienteEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail.trim())
    ) {
      errors.email = "Ingresá un correo válido o dejalo vacío.";
    }

    return errors;
  }

  async function reservar() {
    const errors = validarReserva();
    const firstField = Object.keys(errors)[0] as ValidationField | undefined;

    setValidationErrors(errors);
    setError("");
    setSuccessUrl("");

    if (firstField) {
      setError("Revisá los datos marcados para continuar.");
      scrollToField(firstField);
      return;
    }

    try {
      setLoadingSubmit(true);

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
          clienteNombre: clienteNombre.trim(),
          clienteTelefono: clienteTelefono.trim(),
          clienteEmail: clienteEmail.trim(),
          notas: notas.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setHoraInicio("");
          setSlotsError(
            data.error ??
              "Ese horario ya no está disponible. Elegí otro horario.",
          );
          scrollToField("hora");
          return;
        }

        setError(data.error ?? "No se pudo crear la reserva.");
        return;
      }

      setSuccessUrl(data.seguimientoUrl);
    } catch {
      setError(
        "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      setLoadingSubmit(false);
    }
  }

  function reiniciarReserva() {
    setServicioId("");
    setSucursalId(sucursalInicial);
    setFecha(hoyISO());
    setSlots([]);
    setHoraInicio("");
    setClienteNombre("");
    setClienteTelefono("");
    setClienteEmail("");
    setNotas("");
    setError("");
    setSlotsError("");
    setValidationErrors({});
    setSuccessUrl("");
  }

  if (successUrl) {
    return (
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_24px_70px_rgb(15_23_42/0.12)]">
        <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
          <div className="flex flex-col justify-between bg-emerald-600 p-6 text-white sm:p-8">
            <div className="grid size-12 place-items-center rounded-lg bg-white/15">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </div>

            <div className="mt-10">
              <p className="text-sm font-semibold text-emerald-100">
                Solicitud registrada
              </p>
              <h2 className="mt-2 text-3xl font-bold leading-tight text-balance">
                Reserva enviada
              </h2>
              <p className="mt-3 text-sm leading-6 text-emerald-50/90">
                El negocio la revisará y podrás consultar su estado desde tu
                enlace personal.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <SummaryRow
                icon={ListChecks}
                label="Servicio"
                value={servicioSeleccionado?.nombre ?? "Servicio"}
                detail={
                  servicioSeleccionado
                    ? `${servicioSeleccionado.duracion_minutos} min · ${formatGs(
                        servicioSeleccionado.precio,
                      )}`
                    : undefined
                }
                complete
              />
              <SummaryRow
                icon={CalendarDays}
                label="Fecha y hora"
                value={fechaLegible(fecha)}
                detail={horaInicio}
                complete
              />
              <SummaryRow
                icon={MapPin}
                label="Sucursal"
                value={sucursalSeleccionada?.nombre ?? "Sucursal principal"}
                complete
              />
              <SummaryRow
                icon={UserRound}
                label="A nombre de"
                value={clienteNombre}
                detail={clienteTelefono}
                complete
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={successUrl}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 outline-none transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                Ver estado de mi reserva
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={reiniciarReserva}
                className="h-11 rounded-md border-2 border-border px-5 text-sm font-bold outline-none transition-colors hover:border-primary/40 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                Hacer otra reserva
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <article className="rounded-lg border border-border bg-card shadow-[0_24px_70px_rgb(15_23_42/0.10)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <header className="border-b border-border/70 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold text-primary">
                  Reserva online
                </p>
                <h2 className="mt-1 text-2xl font-bold leading-tight">
                  Armá tu reserva
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Elegí el servicio y el horario. No se realiza ningún cobro
                  desde esta pantalla.
                </p>
              </div>

              <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                {completedSteps} de {progressSteps.length} completos
              </p>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <ol className="mt-3 grid grid-cols-3 gap-2 text-xs sm:flex sm:items-center sm:justify-between">
              {progressSteps.map((step) => (
                <li
                  key={step.key}
                  className={cn(
                    "flex items-center gap-1.5 font-medium",
                    step.complete
                      ? "text-emerald-600 dark:text-emerald-300"
                      : "text-muted-foreground",
                  )}
                >
                  {step.complete ? (
                    <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                  {step.label}
                </li>
              ))}
            </ol>

            {error && (
              <div
                role="alert"
                className="mt-4 flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm leading-5 text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}
          </header>

          {mostrarSucursales && (
            <section
              id="reserva-sucursal"
              className="scroll-mt-20 border-b border-border/70 p-5 sm:p-6"
            >
              <StepHeading
                number="1"
                title="¿Dónde querés reservar?"
                description="Seleccioná la sucursal que te quede mejor."
                icon={Building2}
                complete={sucursalCompleta}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {sucursales.map((sucursal) => {
                  const active = sucursalId === sucursal.id;

                  return (
                    <button
                      key={sucursal.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSucursalId(sucursal.id);
                        setServicioId("");
                        setHoraInicio("");
                        setSlots([]);
                        clearFieldError("sucursal");
                      }}
                      className={cn(
                        "group min-h-24 rounded-lg border-2 p-4 text-left outline-none transition-[background-color,border-color,box-shadow,transform]",
                        "hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40",
                        active
                          ? "border-primary bg-primary/8 shadow-md shadow-primary/10"
                          : "border-border bg-background hover:border-primary/35",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold">{sucursal.nombre}</p>
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {sucursal.direccion || "Dirección a confirmar"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-full border",
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-transparent",
                          )}
                        >
                          <Check className="size-3.5" aria-hidden="true" />
                        </span>
                      </div>

                      {sucursal.telefono && (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="size-3.5" aria-hidden="true" />
                          {sucursal.telefono}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              <FieldError>{validationErrors.sucursal}</FieldError>
            </section>
          )}

          <section
            id="reserva-servicio"
            className="scroll-mt-20 border-b border-border/70 p-5 sm:p-6"
          >
            <StepHeading
              number={mostrarSucursales ? "2" : "1"}
              title="Elegí el servicio"
              description="Compará duración, precio y detalles antes de continuar."
              icon={ListChecks}
              complete={servicioCompleto}
            />

            {!sucursalId ? (
              <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                Primero seleccioná una sucursal para ver sus servicios.
              </div>
            ) : serviciosVisibles.length === 0 ? (
              <div className="mt-5 flex gap-3 rounded-lg border border-amber-300/50 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                Esta sucursal todavía no tiene servicios disponibles. Contactá
                al negocio para coordinar.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 xl:grid-cols-2">
                {serviciosVisibles.map((servicio) => {
                  const active = servicioId === servicio.id;

                  return (
                    <button
                      key={servicio.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setServicioId(servicio.id);
                        setHoraInicio("");
                        clearFieldError("servicio");
                      }}
                      className={cn(
                        "group grid min-h-28 grid-cols-[4.75rem_minmax(0,1fr)] gap-3 rounded-lg border-2 p-3 text-left outline-none transition-[background-color,border-color,box-shadow,transform]",
                        "hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40",
                        active
                          ? "border-primary bg-primary/8 shadow-md shadow-primary/10"
                          : "border-border bg-background hover:border-primary/35",
                      )}
                    >
                      <div className="relative size-[4.75rem] overflow-hidden rounded-md bg-muted">
                        {servicio.imagen_url ? (
                          <Image
                            src={servicio.imagen_url}
                            alt={servicio.nombre}
                            fill
                            sizes="76px"
                            unoptimized
                            className="object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div
                            className="grid h-full place-items-center"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${
                                servicio.color ?? "var(--primary)"
                              } 14%, var(--muted))`,
                            }}
                          >
                            <Sparkles
                              className="size-7"
                              style={{
                                color: servicio.color ?? "var(--primary)",
                              }}
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-col self-stretch">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold leading-5">{servicio.nombre}</p>
                          <span
                            className={cn(
                              "grid size-5 shrink-0 place-items-center rounded-full border",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-transparent",
                            )}
                          >
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                        </div>

                        {servicio.descripcion && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {servicio.descripcion}
                          </p>
                        )}

                        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3.5" aria-hidden="true" />
                            {servicio.duracion_minutos} min
                          </span>
                          <span className="text-sm font-bold">
                            {formatGs(servicio.precio)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <FieldError>{validationErrors.servicio}</FieldError>
          </section>

          {servicioCompleto ? (
            <section
              id="reserva-horario"
              className="scroll-mt-20 border-b border-border/70 p-5 sm:p-6"
            >
            <StepHeading
              number={mostrarSucursales ? "3" : "2"}
              title="Elegí fecha y horario"
              description="Mostramos únicamente horarios disponibles para el servicio."
              icon={CalendarDays}
              complete={horarioCompleto}
            />

            <div className="mt-5 grid gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
              <div>
                <label htmlFor="reserva-fecha" className="text-sm font-semibold">
                  Fecha
                </label>
                <div className="relative">
                  <input
                    id="reserva-fecha"
                    type="date"
                    min={hoyISO()}
                    value={fecha}
                    onClick={(event) => {
                      try {
                        event.currentTarget.showPicker?.();
                      } catch {
                        event.currentTarget.focus();
                      }
                    }}
                    onChange={(event) => {
                      setFecha(event.target.value);
                      clearFieldError("fecha");
                    }}
                    aria-invalid={Boolean(validationErrors.fecha)}
                    className={cn(
                      inputClass,
                      "cursor-text pr-12 [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                      validationErrors.fecha &&
                        "border-destructive focus:border-destructive focus:ring-destructive/15",
                    )}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-2 grid size-7 place-items-center rounded-md border border-primary/20 bg-primary/10 text-primary shadow-sm">
                    <CalendarDays className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <FieldError>{validationErrors.fecha}</FieldError>
              </div>

              <div>
                <p className="text-sm font-semibold">Selección actual</p>
                <div className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-border bg-muted/35 px-3.5 text-sm">
                  <ListChecks
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "truncate",
                      !servicioSeleccionado && "text-muted-foreground",
                    )}
                  >
                    {servicioSeleccionado
                      ? `${servicioSeleccionado.nombre} · ${servicioSeleccionado.duracion_minutos} min`
                      : "Seleccioná un servicio"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">Horarios disponibles</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hora local del negocio
                  </p>
                </div>
                {horaInicio && (
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {horaInicio} seleccionado
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <div
                  className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4"
                  aria-label="Cargando horarios"
                >
                  {Array.from({ length: 8 }, (_, index) => (
                    <div
                      key={index}
                      className="h-10 animate-pulse rounded-md bg-muted"
                    />
                  ))}
                </div>
              ) : slotsError ? (
                <div
                  role="alert"
                  className="mt-4 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-5 text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {slotsError}
                </div>
              ) : slots.length === 0 ? (
                <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                  {servicioId
                    ? "No hay horarios disponibles para esta fecha. Probá con otro día."
                    : "Seleccioná un servicio para consultar los horarios."}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      aria-pressed={horaInicio === slot}
                      onClick={() => {
                        setHoraInicio(slot);
                        clearFieldError("hora");
                      }}
                      className={cn(
                        "h-10 rounded-md border-2 px-2 text-sm font-bold tabular-nums outline-none transition-[background-color,color,border-color,box-shadow,transform]",
                        "hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring/40",
                        horaInicio === slot
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              <FieldError>{validationErrors.hora}</FieldError>
            </div>
            </section>
          ) : (
            <LockedStep
              number={mostrarSucursales ? "3" : "2"}
              title="Elegí fecha y horario"
              description="Primero elegí un servicio para consultar la agenda."
              icon={CalendarDays}
            />
          )}

          {horarioCompleto ? (
            <section
              id="reserva-contacto"
              className="scroll-mt-20 p-5 sm:p-6"
            >
            <StepHeading
              number={mostrarSucursales ? "4" : "3"}
              title="Tus datos de contacto"
              description="El negocio los usará para identificar y gestionar esta reserva."
              icon={UserRound}
              complete={contactoCompleto}
            />

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="reserva-nombre" className="text-sm font-semibold">
                  Nombre completo
                </label>
                <input
                  id="reserva-nombre"
                  autoComplete="name"
                  value={clienteNombre}
                  onChange={(event) => {
                    setClienteNombre(event.target.value);
                    clearFieldError("nombre");
                  }}
                  aria-invalid={Boolean(validationErrors.nombre)}
                  className={cn(
                    inputClass,
                    validationErrors.nombre &&
                      "border-destructive focus:border-destructive focus:ring-destructive/15",
                  )}
                  placeholder="Tu nombre"
                />
                <FieldError>{validationErrors.nombre}</FieldError>
              </div>

              <div>
                <label
                  htmlFor="reserva-telefono"
                  className="text-sm font-semibold"
                >
                  Teléfono
                </label>
                <input
                  id="reserva-telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={clienteTelefono}
                  onChange={(event) => {
                    setClienteTelefono(event.target.value);
                    clearFieldError("telefono");
                  }}
                  aria-invalid={Boolean(validationErrors.telefono)}
                  className={cn(
                    inputClass,
                    validationErrors.telefono &&
                      "border-destructive focus:border-destructive focus:ring-destructive/15",
                  )}
                  placeholder="0981..."
                />
                <FieldError>{validationErrors.telefono}</FieldError>
              </div>

              <div>
                <label htmlFor="reserva-email" className="text-sm font-semibold">
                  Email <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-[1.3rem] size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="reserva-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={clienteEmail}
                    onChange={(event) => {
                      setClienteEmail(event.target.value);
                      clearFieldError("email");
                    }}
                    aria-invalid={Boolean(validationErrors.email)}
                    className={cn(
                      inputClass,
                      "pl-10",
                      validationErrors.email &&
                        "border-destructive focus:border-destructive focus:ring-destructive/15",
                    )}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                <FieldError>{validationErrors.email}</FieldError>
              </div>

              <div>
                <label htmlFor="reserva-notas" className="text-sm font-semibold">
                  Nota <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <div className="relative">
                  <NotebookText
                    className="pointer-events-none absolute left-3.5 top-[1.3rem] size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="reserva-notas"
                    value={notas}
                    onChange={(event) => setNotas(event.target.value)}
                    className={cn(inputClass, "pl-10")}
                    placeholder="Detalle adicional"
                  />
                </div>
              </div>
            </div>
            </section>
          ) : (
            <LockedStep
              number={mostrarSucursales ? "4" : "3"}
              title="Tus datos de contacto"
              description="Este paso se habilita después de elegir un horario."
              icon={UserRound}
            />
          )}
        </div>

        <aside className="border-t border-border/70 bg-muted/22 lg:border-l lg:border-t-0">
          <div className="p-5 lg:sticky lg:top-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                <NotebookText className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold">Tu reserva</h2>
                <p className="text-xs text-muted-foreground">
                  Revisá antes de enviar
                </p>
              </div>
            </div>

            <div className="mt-4 border-y border-border/70">
              {mostrarSucursales && (
                <SummaryRow
                  icon={MapPin}
                  label="Sucursal"
                  value={sucursalSeleccionada?.nombre ?? "Elegí una sucursal"}
                  detail={sucursalSeleccionada?.direccion ?? undefined}
                  complete={sucursalCompleta}
                />
              )}
              <SummaryRow
                icon={ListChecks}
                label="Servicio"
                value={servicioSeleccionado?.nombre ?? "Elegí un servicio"}
                detail={
                  servicioSeleccionado
                    ? `${servicioSeleccionado.duracion_minutos} min · ${formatGs(
                        servicioSeleccionado.precio,
                      )}`
                    : undefined
                }
                complete={servicioCompleto}
              />
              <SummaryRow
                icon={CalendarDays}
                label="Fecha y hora"
                value={fechaLegible(fecha)}
                detail={horaInicio || "Elegí un horario"}
                complete={horarioCompleto}
              />
              <SummaryRow
                icon={UserRound}
                label="Contacto"
                value={clienteNombre || "Completá tus datos"}
                detail={clienteTelefono || undefined}
                complete={contactoCompleto}
              />
            </div>

            <button
              type="button"
              onClick={reservar}
              disabled={loadingSubmit}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 outline-none transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingSubmit ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CalendarDays className="size-4" aria-hidden="true" />
              )}
              {loadingSubmit ? "Enviando solicitud" : "Solicitar reserva"}
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
              La solicitud quedará pendiente hasta que el negocio la confirme.
            </p>

            <div className="mt-5 flex gap-2 border-t border-border/70 pt-4 text-xs leading-5 text-muted-foreground">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                aria-hidden="true"
              />
              No compartimos tus datos con otros negocios.
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
