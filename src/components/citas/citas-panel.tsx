"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import {
  CitaDialog,
  type ClienteCitaItem,
  type EmpleadoCitaItem,
  type EmpleadoServicioCitaItem,
  type ServicioCitaItem,
} from "@/components/citas/cita-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeguimientoActions } from "@/components/reservas/seguimiento-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type CitaItem = {
  id: string;
  cliente_id: string;
  servicio_id: string;
  empleado_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada" | "no_asistio";
  created_at: string;
  seguimiento_token?: string | null;
};

type CitasPanelProps = {
  citas: CitaItem[];
  clientes: ClienteCitaItem[];
  servicios: ServicioCitaItem[];
  empleados: EmpleadoCitaItem[];
  empleadoServicios?: EmpleadoServicioCitaItem[];
  initialFecha?: string;
  initialHora?: string;
  highlightCitaId?: string;
};

const START_HOUR = 7;
const END_HOUR = 20;
const PX_PER_MINUTE = 1.85;
const MIN_EVENT_HEIGHT = 34;

const horas = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, index) => START_HOUR + index
);

const diasCortos = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function todayIso() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function nowTime() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function esFechaHoraPasada(fecha: string, horaValor: string) {
  const hoy = todayIso();

  if (fecha < hoy) return true;
  if (fecha > hoy) return false;

  return horaAMinutos(horaValor) <= horaAMinutos(nowTime());
}

function fechaLocalDesdeIso(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const copia = new Date(date);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 10);
}

function startOfWeekSunday(date: Date) {
  const copia = new Date(date);
  copia.setHours(0, 0, 0, 0);
  copia.setDate(copia.getDate() - copia.getDay());
  return copia;
}

function addDays(date: Date, days: number) {
  const copia = new Date(date);
  copia.setDate(copia.getDate() + days);
  return copia;
}

function addWeeks(date: Date, weeks: number) {
  const copia = new Date(date);
  copia.setDate(copia.getDate() + weeks * 7);
  return copia;
}

function setMonthYear(base: Date, year: number, month: number) {
  const nuevaFecha = new Date(base);
  nuevaFecha.setFullYear(year);
  nuevaFecha.setMonth(month);
  nuevaFecha.setDate(1);
  nuevaFecha.setHours(0, 0, 0, 0);
  return nuevaFecha;
}

function hora(valor: string) {
  return valor.slice(0, 5);
}

function horaAMinutos(valor: string) {
  const [hh, mm] = hora(valor).split(":").map(Number);
  return hh * 60 + mm;
}

function minutosAHora(totalMinutos: number) {
  const hh = Math.floor(totalMinutos / 60);
  const mm = totalMinutos % 60;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function redondearA10Minutos(minutos: number) {
  return Math.round(minutos / 10) * 10;
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function crearAnios(baseYear: number) {
  const inicio = baseYear - 5;
  const fin = baseYear + 5;

  return Array.from({ length: fin - inicio + 1 }, (_, index) => inicio + index);
}

function estadoClass(estado: CitaItem["estado"]) {
  if (estado === "confirmada") return "bg-blue-100 text-blue-700";
  if (estado === "completada") return "bg-green-100 text-green-700";
  if (estado === "cancelada") return "bg-red-100 text-red-700";
  if (estado === "no_asistio") return "bg-orange-100 text-orange-700";
  return "bg-zinc-100 text-zinc-700";
}

function estadoLabel(estado: CitaItem["estado"]) {
  if (estado === "no_asistio") return "No asistió";
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

function intervalosSeCruzan(a: CitaItem, b: CitaItem) {
  const aInicio = horaAMinutos(a.hora_inicio);
  const aFin = horaAMinutos(a.hora_fin);
  const bInicio = horaAMinutos(b.hora_inicio);
  const bFin = horaAMinutos(b.hora_fin);

  return aInicio < bFin && aFin > bInicio;
}

function obtenerLayoutSolapado(cita: CitaItem, citasDia: CitaItem[]) {
  const solapadas = citasDia
    .filter((item) => intervalosSeCruzan(cita, item))
    .sort((a, b) => {
      const diff = horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio);

      if (diff !== 0) return diff;

      return a.id.localeCompare(b.id);
    });

  const total = Math.max(solapadas.length, 1);
  const index = Math.max(
    solapadas.findIndex((item) => item.id === cita.id),
    0
  );

  return {
    width: `${100 / total}%`,
    left: `${(100 / total) * index}%`,
  };
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
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

function colorEstado(estado: CitaItem["estado"]) {
  if (estado === "confirmada") return "#2563eb";
  if (estado === "completada") return "#16a34a";
  if (estado === "cancelada") return "#dc2626";
  if (estado === "no_asistio") return "#f97316";
  return "#f59e0b";
}

function citaEstadoSurfaceClass(estado: CitaItem["estado"]) {
  if (estado === "confirmada") {
    return "border-blue-300/80 bg-blue-50 text-blue-950 shadow-sm ring-1 ring-blue-200/80 dark:border-blue-400/50 dark:bg-blue-950/45 dark:text-blue-50 dark:ring-blue-400/20";
  }

  if (estado === "completada") {
    return "border-emerald-300/80 bg-emerald-50 text-emerald-950 shadow-sm ring-1 ring-emerald-200/80 dark:border-emerald-400/50 dark:bg-emerald-950/45 dark:text-emerald-50 dark:ring-emerald-400/20";
  }

  if (estado === "no_asistio") {
    return "border-orange-300/80 bg-orange-50 text-orange-950 shadow-sm ring-1 ring-orange-200/80 dark:border-orange-400/50 dark:bg-orange-950/45 dark:text-orange-50 dark:ring-orange-400/20";
  }

  return "border-amber-300/80 bg-amber-50 text-amber-950 shadow-sm ring-1 ring-amber-200/80 dark:border-amber-400/50 dark:bg-amber-950/45 dark:text-amber-50 dark:ring-amber-400/20";
}

export function CitasPanel({
  citas,
  clientes,
  servicios,
  empleados,
  empleadoServicios,
  initialFecha,
  initialHora,
  highlightCitaId,
}: CitasPanelProps) {
  const hoy = new Date();

  const [fechaBase, setFechaBase] = useState(() =>
    initialFecha ? fechaLocalDesdeIso(initialFecha) : new Date()
  );

  const calendarioScrollRef = useRef<HTMLDivElement | null>(null);
  const [empleadoFiltro, setEmpleadoFiltro] = useState("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(toIsoDate(hoy));
  const [horaSeleccionada, setHoraSeleccionada] = useState("09:00");

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaItem | null>(null);

  const [detalleClienteId, setDetalleClienteId] = useState("");
  const [detalleServicioId, setDetalleServicioId] = useState("");
  const [detalleEmpleadoId, setDetalleEmpleadoId] = useState("");
  const [detalleFecha, setDetalleFecha] = useState("");
  const [detalleHora, setDetalleHora] = useState("");
  const [detalleEstado, setDetalleEstado] = useState<CitaItem["estado"]>("pendiente");

  const [guardandoCambio, setGuardandoCambio] = useState(false);

  const inicioSemana = startOfWeekSunday(fechaBase);
  const finSemana = addDays(inicioSemana, 6);
  const diasSemana = Array.from({ length: 7 }, (_, index) =>
    addDays(inicioSemana, index)
  );

  const anioActual = fechaBase.getFullYear();
  const mesActual = fechaBase.getMonth();
  const anios = crearAnios(hoy.getFullYear());

  const timelineHeight = (END_HOUR - START_HOUR) * 60 * PX_PER_MINUTE;

  useEffect(() => {
    if (!highlightCitaId) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById(`cita-${highlightCitaId}`);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [highlightCitaId, initialFecha, initialHora, fechaBase]);

  const clientesMap = useMemo(() => {
    return new Map(clientes.map((cliente) => [cliente.id, cliente]));
  }, [clientes]);

  const serviciosMap = useMemo(() => {
    return new Map(servicios.map((servicio) => [servicio.id, servicio]));
  }, [servicios]);

  const empleadosMap = useMemo(() => {
    return new Map(empleados.map((empleado) => [empleado.id, empleado]));
  }, [empleados]);

  const citasSemana = useMemo(() => {
    const fechasSemana = new Set(diasSemana.map(toIsoDate));

    return citas.filter((cita) => {
      if (cita.estado === "cancelada") return false;

      const coincideSemana = fechasSemana.has(cita.fecha);
      const coincideEmpleado =
        empleadoFiltro === "todos" || cita.empleado_id === empleadoFiltro;

      return coincideSemana && coincideEmpleado;
    });
  }, [citas, diasSemana, empleadoFiltro]);

  const empleadosDetalleDisponibles = useMemo(() => {
    if (!detalleServicioId) return empleados;

    const empleadosIds = new Set(
      (empleadoServicios ?? [])
        .filter((relacion) => relacion.servicio_id === detalleServicioId)
        .map((relacion) => relacion.empleado_id)
    );

    return empleados.filter((empleado) => empleadosIds.has(empleado.id));
  }, [detalleServicioId, empleados, empleadoServicios]);

  const servicioDetalleSeleccionado = detalleServicioId
    ? serviciosMap.get(detalleServicioId)
    : null;

  function obtenerEmpleadosPorServicio(servicioId: string) {
    const empleadosIds = new Set(
      (empleadoServicios ?? [])
        .filter((relacion) => relacion.servicio_id === servicioId)
        .map((relacion) => relacion.empleado_id)
    );

    return empleados.filter((empleado) => empleadosIds.has(empleado.id));
  }

  function cambiarServicioDetalle(servicioId: string) {
    setDetalleServicioId(servicioId);

    const disponibles = obtenerEmpleadosPorServicio(servicioId);

    if (!disponibles.some((empleado) => empleado.id === detalleEmpleadoId)) {
      setDetalleEmpleadoId(disponibles[0]?.id ?? "");
    }
  }

  function abrirNuevaCita(fecha: string, horaInicio: string) {
    if (esFechaHoraPasada(fecha, horaInicio)) {
      toast.error("No podés crear una cita en una fecha u hora que ya pasó.");
      return;
    }

    setFechaSeleccionada(fecha);
    setHoraSeleccionada(horaInicio);
    setModalOpen(true);
  }

  function obtenerInicioDisponibleParaNuevaCita() {
    const ahora = new Date();
    const fechaHoy = toIsoDate(ahora);
    const inicioDia = START_HOUR * 60;
    const finDia = END_HOUR * 60;
    const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
    const siguienteBloque = Math.ceil((minutosActuales + 1) / 10) * 10;

    if (siguienteBloque >= finDia) {
      const manana = addDays(fechaLocalDesdeIso(fechaHoy), 1);

      return {
        fecha: toIsoDate(manana),
        horaInicio: minutosAHora(inicioDia),
      };
    }

    return {
      fecha: fechaHoy,
      horaInicio: minutosAHora(Math.max(inicioDia, siguienteBloque)),
    };
  }

  function abrirNuevaCitaDesdeBoton() {
    const { fecha, horaInicio } = obtenerInicioDisponibleParaNuevaCita();

    setFechaBase(fechaLocalDesdeIso(fecha));
    abrirNuevaCita(fecha, horaInicio);
  }

  function abrirDetalle(cita: CitaItem) {
    setCitaSeleccionada(cita);
    setDetalleClienteId(cita.cliente_id);
    setDetalleServicioId(cita.servicio_id);
    setDetalleEmpleadoId(cita.empleado_id);
    setDetalleFecha(cita.fecha);
    setDetalleHora(hora(cita.hora_inicio));
    setDetalleEstado(cita.estado);
    setDetalleOpen(true);
  }

  function obtenerHoraDesdeClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;

    const minutosDesdeInicio = Math.max(
      0,
      Math.min(
        (END_HOUR - START_HOUR) * 60,
        redondearA10Minutos(y / PX_PER_MINUTE)
      )
    );

    return minutosAHora(START_HOUR * 60 + minutosDesdeInicio);
  }

  function abrirCitaDesdeClick(
    event: MouseEvent<HTMLDivElement>,
    fechaIso: string
  ) {
    abrirNuevaCita(fechaIso, obtenerHoraDesdeClick(event));
  }

  function obtenerCitasDia(fecha: string) {
    return citasSemana
      .filter((cita) => cita.fecha === fecha)
      .sort((a, b) => horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio));
  }

  async function actualizarCita(citaId: string, body: Record<string, string>) {
    setGuardandoCambio(true);

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
        toast.error("No se pudo actualizar la cita", {
          description: data.error ?? "Intentá de nuevo en unos segundos.",
        });
        return;
      }

      toast.success("Cita actualizada correctamente");
      window.location.reload();
    } catch {
      toast.error("No se pudo actualizar la cita");
    } finally {
      setGuardandoCambio(false);
    }
  }

  function guardarCambiosPrincipales() {
    if (!citaSeleccionada) return;

    if (!detalleClienteId) {
      toast.error("Seleccioná un cliente.");
      return;
    }

    if (!detalleServicioId) {
      toast.error("Seleccioná un servicio.");
      return;
    }

    if (!detalleEmpleadoId) {
      toast.error("Seleccioná un empleado para la cita.");
      return;
    }

    actualizarCita(citaSeleccionada.id, {
      clienteId: detalleClienteId,
      servicioId: detalleServicioId,
      empleadoId: detalleEmpleadoId,
      fecha: detalleFecha,
      horaInicio: detalleHora,
      estado: detalleEstado,
    });
  }

  const tituloMes = capitalizar(
    inicioSemana.toLocaleDateString("es-PY", {
      month: "long",
      year: "numeric",
    })
  );

  const citaDetalleCliente = citaSeleccionada
    ? clientesMap.get(citaSeleccionada.cliente_id)
    : null;

  const citaDetalleServicio = citaSeleccionada
    ? serviciosMap.get(citaSeleccionada.servicio_id)
    : null;

  const citaDetalleEmpleado = citaSeleccionada
    ? empleadosMap.get(citaSeleccionada.empleado_id)
    : null;

  return (
    <div className="mx-auto max-w-full space-y-4 overflow-hidden">
      <section className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná las citas de tu negocio.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={empleadoFiltro}
            onChange={(event) => setEmpleadoFiltro(event.target.value)}
            className="h-10 cursor-pointer rounded-md border bg-background px-3 text-sm"
          >
            <option value="todos">Todos los empleados</option>
            {empleados.map((empleado) => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre}
              </option>
            ))}
          </select>

          <Button
            type="button"
            className="cursor-pointer"
            onClick={abrirNuevaCitaDesdeBoton}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nueva cita
          </Button>
        </div>
      </section>

      <div className="max-w-full overflow-hidden rounded-3xl border bg-background shadow-sm">
        <div className="border-b bg-background px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setFechaBase(addWeeks(fechaBase, -1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setFechaBase(addWeeks(fechaBase, 1))}
                >
                  Siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setFechaBase(new Date())}
                >
                  Hoy
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={anioActual}
                  onChange={(event) =>
                    setFechaBase(
                      setMonthYear(fechaBase, Number(event.target.value), mesActual)
                    )
                  }
                  className="h-9 cursor-pointer rounded-md border bg-muted/40 px-3 text-sm font-medium"
                >
                  {anios.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>

                <select
                  value={mesActual}
                  onChange={(event) =>
                    setFechaBase(
                      setMonthYear(fechaBase, anioActual, Number(event.target.value))
                    )
                  }
                  className="h-9 cursor-pointer rounded-md border bg-muted/40 px-3 text-sm font-medium"
                >
                  {meses.map((mes, index) => (
                    <option key={mes} value={index}>
                      {mes}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-2xl border bg-muted/20 px-4 py-2 text-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {tituloMes}
                </p>
                <h2 className="text-lg font-bold tracking-tight">
                  Semana del {inicioSemana.getDate()} al {finSemana.getDate()} de{" "}
                  {meses[finSemana.getMonth()].toLowerCase()}
                </h2>
                <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Pendiente
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    Confirmada
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Completada
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    No asistio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={calendarioScrollRef} className="max-w-full overflow-x-auto">
          <div className="min-w-[900px] xl:w-full xl:min-w-0">
            <div className="sticky top-0 z-20 grid grid-cols-[64px_repeat(7,minmax(108px,1fr))] border-b bg-background xl:grid-cols-[64px_repeat(7,minmax(0,1fr))]">
              <div className="border-r px-2 py-2 text-xs font-medium text-muted-foreground">
                Hora
              </div>

              {diasSemana.map((dia, index) => {
                const iso = toIsoDate(dia);
                const esHoy = iso === toIsoDate(hoy);

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => abrirNuevaCita(iso, "09:00")}
                    className={`cursor-pointer border-r px-2 py-2 text-center transition hover:bg-blue-50 ${
                      esHoy ? "bg-blue-50" : ""
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {diasCortos[index]}
                    </p>
                    <p className="text-lg font-bold leading-none sm:text-xl">
                      {dia.getDate()}
                    </p>
                  </button>
                );
              })}
            </div>

            <div
              className="grid grid-cols-[64px_repeat(7,minmax(108px,1fr))] xl:grid-cols-[64px_repeat(7,minmax(0,1fr))]"
              style={{ height: timelineHeight }}
            >
              <div className="relative border-r bg-background">
                {horas.map((horaNumero) => (
                  <div
                    key={horaNumero}
                    className="absolute left-0 right-0 border-t px-1.5 pt-1 text-[11px] text-muted-foreground"
                    style={{
                      top: (horaNumero - START_HOUR) * 60 * PX_PER_MINUTE,
                    }}
                  >
                    {String(horaNumero).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {diasSemana.map((dia) => {
                const fechaIso = toIsoDate(dia);
                const citasDia = obtenerCitasDia(fechaIso);

                return (
                  <div
                    key={fechaIso}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => abrirCitaDesdeClick(event, fechaIso)}
                    className="group relative cursor-pointer border-r bg-background transition hover:bg-blue-50/40"
                  >
                    {horas.map((horaNumero) => (
                      <div
                        key={horaNumero}
                        className="absolute left-0 right-0 border-t"
                        style={{
                          top: (horaNumero - START_HOUR) * 60 * PX_PER_MINUTE,
                        }}
                      />
                    ))}

                    <div className="pointer-events-none absolute inset-x-2 top-3 flex justify-center opacity-0 transition group-hover:opacity-100">
                      <span className="inline-flex items-center rounded-full border bg-background/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Nueva cita
                      </span>
                    </div>

                    {citasDia.map((cita) => {
                      const cliente = clientesMap.get(cita.cliente_id);
                      const servicio = serviciosMap.get(cita.servicio_id);

                      const inicio = horaAMinutos(cita.hora_inicio);
                      const fin = horaAMinutos(cita.hora_fin);

                      const top = Math.max(
                        0,
                        (inicio - START_HOUR * 60) * PX_PER_MINUTE
                      );

                      const height = Math.max(
                        MIN_EVENT_HEIGHT,
                        (fin - inicio) * PX_PER_MINUTE
                      );

                      const layout = obtenerLayoutSolapado(cita, citasDia);
                      const estaResaltada = highlightCitaId === cita.id;
                      const estadoSurfaceClass = citaEstadoSurfaceClass(cita.estado);

                      return (
                        <button
                          key={cita.id}
                          id={`cita-${cita.id}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            abrirDetalle(cita);
                          }}
                          className={`absolute cursor-pointer overflow-hidden rounded-lg border text-left transition ${
                            estaResaltada
                              ? "z-40 border-cyan-300 bg-cyan-50 text-slate-950 outline outline-2 outline-offset-2 outline-cyan-300 shadow-[0_0_0_1px_rgb(34_211_238),0_0_24px_rgb(34_211_238/0.55),0_16px_38px_rgb(8_145_178/0.38)] ring-2 ring-cyan-300/80 dark:border-cyan-200 dark:bg-cyan-950/95 dark:text-white dark:outline-cyan-200 dark:shadow-[0_0_0_1px_rgb(103_232_249),0_0_28px_rgb(34_211_238/0.65),0_18px_42px_rgb(34_211_238/0.26)] dark:ring-cyan-200"
                              : `z-10 hover:z-20 hover:shadow-md ${estadoSurfaceClass}`
                          }`}
                          style={{
                            top,
                            height,
                            left: `calc(${layout.left} + 6px)`,
                            width: `calc(${layout.width} - 12px)`,
                            borderLeftWidth: estaResaltada ? 7 : 5,
                            borderLeftColor:
                              estaResaltada
                                ? "#22d3ee"
                                : colorEstado(cita.estado),
                          }}
                          title={`${hora(cita.hora_inicio)} - ${hora(cita.hora_fin)} · ${cliente?.nombre_completo ?? "Cliente"} · ${servicio?.nombre ?? "Servicio"}`}
                        >
                          {estaResaltada && (
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_0_3px_rgb(34_211_238/0.20),0_0_14px_rgb(34_211_238)] dark:bg-cyan-200"
                            />
                          )}

                          <div className="flex h-full min-h-0 flex-col justify-center gap-0.5 px-2 py-1">
                            <div className="flex min-w-0 items-center gap-1">
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${estaResaltada ? "bg-cyan-500 dark:bg-cyan-200" : ""}`}
                                style={{ backgroundColor: estaResaltada ? undefined : colorEstado(cita.estado) }}
                              />

                              <p className={`min-w-0 truncate text-[11px] font-bold leading-tight ${estaResaltada ? "text-cyan-950 dark:text-white" : ""}`}>
                                {hora(cita.hora_inicio)} - {hora(cita.hora_fin)}
                              </p>
                            </div>

                            <p className={`truncate text-[12px] font-semibold leading-tight ${estaResaltada ? "text-cyan-950 dark:text-white" : ""}`}>
                              {cliente?.nombre_completo ?? "Cliente"}
                            </p>

                            <p className={`truncate text-[11px] leading-tight ${estaResaltada ? "text-cyan-800 dark:text-cyan-100" : "text-current opacity-75"}`}>
                              {servicio?.nombre ?? "Servicio"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <CitaDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialFecha={fechaSeleccionada}
        initialHoraInicio={horaSeleccionada}
        clientes={clientes}
        servicios={servicios}
        empleados={empleados}
        empleadoServicios={empleadoServicios ?? []}
        onSaved={() => window.location.reload()}
      />

      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar cita</DialogTitle>
            <DialogDescription>
              Cambiá cliente, servicio, empleado, fecha, hora o estado.
            </DialogDescription>
          </DialogHeader>

          {citaSeleccionada && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Cliente</p>
                  <select
                    value={detalleClienteId}
                    onChange={(event) => setDetalleClienteId(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre_completo}
                      </option>
                    ))}
                  </select>

                  {citaDetalleCliente?.telefono && (
                    <p className="text-xs text-muted-foreground">
                      Actual: {citaDetalleCliente.telefono}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Servicio</p>
                  <select
                    value={detalleServicioId}
                    onChange={(event) => cambiarServicioDetalle(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Seleccionar servicio</option>
                    {servicios.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.nombre}
                      </option>
                    ))}
                  </select>

                  {servicioDetalleSeleccionado && (
                    <p className="text-xs text-muted-foreground">
                      {servicioDetalleSeleccionado.duracion_minutos} min ·{" "}
                      {formatearPrecio(servicioDetalleSeleccionado.precio ?? null)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Empleado asignado</p>
                  <select
                    value={detalleEmpleadoId}
                    onChange={(event) => setDetalleEmpleadoId(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Seleccionar empleado</option>
                    {empleadosDetalleDisponibles.map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre}
                      </option>
                    ))}
                  </select>

                  {empleadosDetalleDisponibles.length === 0 && (
                    <p className="text-xs text-red-600">
                      No hay empleados asignados a este servicio.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Estado de la cita</p>
                  <select
                    value={detalleEstado}
                    onChange={(event) =>
                      setDetalleEstado(event.target.value as CitaItem["estado"])
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="no_asistio">No asistió</option>
                    <option value="cancelada">Cancelada</option>
                  </select>

                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${estadoClass(
                      detalleEstado
                    )}`}
                  >
                    {estadoLabel(detalleEstado)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fecha</p>
                  <Input
                    type="date"
                    min={todayIso()}
                    value={detalleFecha}
                    onChange={(event) => setDetalleFecha(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Hora de inicio</p>
                  <Input
                    type="time"
                    value={detalleHora}
                    onChange={(event) => setDetalleHora(event.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Actual: {formatearFecha(citaSeleccionada.fecha)},{" "}
                    {hora(citaSeleccionada.hora_inicio)} -{" "}
                    {hora(citaSeleccionada.hora_fin)} ·{" "}
                    {citaDetalleServicio?.nombre ?? "Servicio"} ·{" "}
                    {citaDetalleEmpleado?.nombre ?? "Empleado"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={guardandoCambio}
                    onClick={guardarCambiosPrincipales}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </Button>
                </div>
              </div>

              {citaSeleccionada.seguimiento_token && (
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Enviar estado al cliente
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Copiá o enviá por WhatsApp el link para que el cliente consulte
                    si su reserva está pendiente, confirmada, cancelada o completada.
                  </p>

                  <div className="mt-3">
                    <SeguimientoActions
                      token={citaSeleccionada.seguimiento_token}
                      telefono={citaDetalleCliente?.telefono ?? null}
                      label="Copiar link"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-4">
                {citaSeleccionada.estado === "pendiente" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={guardandoCambio}
                    onClick={() =>
                      actualizarCita(citaSeleccionada.id, {
                        estado: "confirmada",
                      })
                    }
                  >
                    Confirmar
                  </Button>
                )}

                {citaSeleccionada.estado === "confirmada" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={guardandoCambio}
                      onClick={() =>
                        actualizarCita(citaSeleccionada.id, {
                          estado: "completada",
                        })
                      }
                    >
                      Marcar completada
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={guardandoCambio}
                      onClick={() =>
                        actualizarCita(citaSeleccionada.id, {
                          estado: "no_asistio",
                        })
                      }
                    >
                      No asistió
                    </Button>
                  </>
                )}

                {citaSeleccionada.estado !== "cancelada" &&
                  citaSeleccionada.estado !== "completada" && (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={guardandoCambio}
                      onClick={() =>
                        actualizarCita(citaSeleccionada.id, {
                          estado: "cancelada",
                        })
                      }
                    >
                      Cancelar cita
                    </Button>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
