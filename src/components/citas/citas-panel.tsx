"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Save } from "lucide-react";
import {
  CitaDialog,
  type ClienteCitaItem,
  type EmpleadoCitaItem,
  type EmpleadoServicioCitaItem,
  type ServicioCitaItem,
} from "@/components/citas/cita-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
};

type CitasPanelProps = {
  citas: CitaItem[];
  clientes: ClienteCitaItem[];
  servicios: ServicioCitaItem[];
  empleados: EmpleadoCitaItem[];
  empleadoServicios: EmpleadoServicioCitaItem[];
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
  if (estado === "no_asistio") return "no asistió";
  return estado;
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
  return "#71717a";
}

export function CitasPanel({
  citas,
  clientes,
  servicios,
  empleados,
  empleadoServicios,
}: CitasPanelProps) {
  const hoy = new Date();

  const [fechaBase, setFechaBase] = useState(new Date());
  const [empleadoFiltro, setEmpleadoFiltro] = useState("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(toIsoDate(hoy));
  const [horaSeleccionada, setHoraSeleccionada] = useState("09:00");

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaItem | null>(null);
  const [detalleFecha, setDetalleFecha] = useState("");
  const [detalleHora, setDetalleHora] = useState("");
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
      const coincideSemana = fechasSemana.has(cita.fecha);
      const coincideEmpleado =
        empleadoFiltro === "todos" || cita.empleado_id === empleadoFiltro;

      return coincideSemana && coincideEmpleado;
    });
  }, [citas, diasSemana, empleadoFiltro]);

  function abrirNuevaCita(fecha: string, horaInicio: string) {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(horaInicio);
    setModalOpen(true);
  }

  function abrirDetalle(cita: CitaItem) {
    setCitaSeleccionada(cita);
    setDetalleFecha(cita.fecha);
    setDetalleHora(hora(cita.hora_inicio));
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
        alert(data.error ?? "No se pudo actualizar la cita.");
        return;
      }

      window.location.reload();
    } finally {
      setGuardandoCambio(false);
    }
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
    <div className="mx-auto max-w-none space-y-4">
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
            onClick={() => abrirNuevaCita(toIsoDate(hoy), "09:00")}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nueva cita
          </Button>
        </div>
      </section>

      <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
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
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1420px]">
            <div className="sticky top-0 z-20 grid grid-cols-[76px_repeat(7,minmax(185px,1fr))] border-b bg-background">
              <div className="border-r px-3 py-2 text-xs font-medium text-muted-foreground">
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
                    className={`cursor-pointer border-r px-3 py-2 text-center transition hover:bg-blue-50 ${
                      esHoy ? "bg-blue-50" : ""
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {diasCortos[index]}
                    </p>
                    <p className="text-xl font-bold leading-none">
                      {dia.getDate()}
                    </p>
                  </button>
                );
              })}
            </div>

            <div
              className="grid grid-cols-[76px_repeat(7,minmax(185px,1fr))]"
              style={{ height: timelineHeight }}
            >
              <div className="relative border-r bg-background">
                {horas.map((horaNumero) => (
                  <div
                    key={horaNumero}
                    className="absolute left-0 right-0 border-t px-2 pt-1 text-xs text-muted-foreground"
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
                      const empleado = empleadosMap.get(cita.empleado_id);

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

                      return (
                        <button
                          key={cita.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            abrirDetalle(cita);
                          }}
                          className="absolute z-10 cursor-pointer overflow-hidden rounded-lg border bg-white text-left shadow-sm ring-1 ring-black/5 transition hover:z-20 hover:shadow-md hover:ring-black/10"
                          style={{
                            top,
                            height,
                            left: `calc(${layout.left} + 6px)`,
                            width: `calc(${layout.width} - 12px)`,
                            borderLeftWidth: 5,
                            borderLeftColor:
                              servicio?.color ??
                              empleado?.color_calendario ??
                              colorEstado(cita.estado),
                          }}
                          title={`${hora(cita.hora_inicio)} - ${hora(cita.hora_fin)} · ${cliente?.nombre_completo ?? "Cliente"} · ${servicio?.nombre ?? "Servicio"}`}
                        >
                          <div className="flex h-full min-h-0 flex-col justify-center gap-0.5 px-2 py-1">
                            <div className="flex min-w-0 items-center gap-1">
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: colorEstado(cita.estado) }}
                              />

                              <p className="min-w-0 truncate text-[11px] font-bold leading-tight">
                                {hora(cita.hora_inicio)} - {hora(cita.hora_fin)}
                              </p>
                            </div>

                            <p className="truncate text-[12px] font-semibold leading-tight">
                              {cliente?.nombre_completo ?? "Cliente"}
                            </p>

                            <p className="truncate text-[11px] leading-tight text-muted-foreground">
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
        empleadoServicios={empleadoServicios}
        onSaved={() => window.location.reload()}
      />

      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalles de la cita</DialogTitle>
            <DialogDescription>
              Información completa del turno seleccionado.
            </DialogDescription>
          </DialogHeader>

          {citaSeleccionada && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold">
                    {citaDetalleCliente?.nombre_completo ?? "Cliente no encontrado"}
                  </p>
                  {citaDetalleCliente?.telefono && (
                    <p className="text-sm text-muted-foreground">
                      {citaDetalleCliente.telefono}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Servicio</p>
                  <p className="font-semibold">
                    {citaDetalleServicio?.nombre ?? "Servicio no encontrado"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {citaDetalleServicio?.duracion_minutos ?? "-"} min ·{" "}
                    {formatearPrecio(citaDetalleServicio?.precio ?? null)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Empleado</p>
                  <p className="font-semibold">
                    {citaDetalleEmpleado?.nombre ?? "Empleado no encontrado"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${estadoClass(
                      citaSeleccionada.estado
                    )}`}
                  >
                    {estadoLabel(citaSeleccionada.estado)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fecha</p>
                  <Input
                    type="date"
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
                    {hora(citaSeleccionada.hora_fin)}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={guardandoCambio}
                    onClick={() =>
                      actualizarCita(citaSeleccionada.id, {
                        fecha: detalleFecha,
                        horaInicio: detalleHora,
                      })
                    }
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Guardar fecha y hora
                  </Button>
                </div>
              </div>

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