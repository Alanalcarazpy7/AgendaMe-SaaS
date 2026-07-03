"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  CitaDialog,
  type ClienteCitaItem,
  type EmpleadoCitaItem,
  type EmpleadoServicioCitaItem,
  type ServicioCitaItem,
} from "@/components/citas/cita-dialog";
import { CitaEstadoButton } from "@/components/citas/cita-estado-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

const horas = Array.from({ length: 13 }, (_, index) => index + 7);

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

function estadoClass(estado: CitaItem["estado"]) {
  if (estado === "confirmada") return "bg-blue-100 text-blue-700";
  if (estado === "completada") return "bg-green-100 text-green-700";
  if (estado === "cancelada") return "bg-red-100 text-red-700";
  if (estado === "no_asistio") return "bg-orange-100 text-orange-700";
  return "bg-muted text-muted-foreground";
}

function estadoLabel(estado: CitaItem["estado"]) {
  if (estado === "no_asistio") return "no asistió";
  return estado;
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function crearAnios(baseYear: number) {
  const inicio = baseYear - 5;
  const fin = baseYear + 5;

  return Array.from({ length: fin - inicio + 1 }, (_, index) => inicio + index);
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

  const inicioSemana = startOfWeekSunday(fechaBase);
  const finSemana = addDays(inicioSemana, 6);
  const diasSemana = Array.from({ length: 7 }, (_, index) =>
    addDays(inicioSemana, index)
  );

  const anioActual = fechaBase.getFullYear();
  const mesActual = fechaBase.getMonth();
  const anios = crearAnios(hoy.getFullYear());

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

  function obtenerCitasCelda(fecha: string, horaNumero: number) {
    return citasSemana.filter((cita) => {
      const horaCita = Number(cita.hora_inicio.slice(0, 2));
      return cita.fecha === fecha && horaCita === horaNumero;
    });
  }

  const tituloMes = capitalizar(
    inicioSemana.toLocaleDateString("es-PY", {
      month: "long",
      year: "numeric",
    })
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
          <p className="mt-1 text-muted-foreground">
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

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b bg-background p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setFechaBase(addWeeks(fechaBase, -1))}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Semana anterior
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setFechaBase(addWeeks(fechaBase, 1))}
                  >
                    Semana siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
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
                        setMonthYear(
                          fechaBase,
                          Number(event.target.value),
                          mesActual
                        )
                      )
                    }
                    className="h-10 cursor-pointer rounded-md border bg-muted/40 px-3 text-sm font-medium"
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
                        setMonthYear(
                          fechaBase,
                          anioActual,
                          Number(event.target.value)
                        )
                      )
                    }
                    className="h-10 cursor-pointer rounded-md border bg-muted/40 px-3 text-sm font-medium"
                  >
                    {meses.map((mes, index) => (
                      <option key={mes} value={index}>
                        {mes}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {tituloMes}
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Semana del {inicioSemana.getDate()} al {finSemana.getDate()} de{" "}
                  {meses[finSemana.getMonth()].toLowerCase()}
                </h2>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1050px]">
              <div className="grid grid-cols-[90px_repeat(7,1fr)] border-b bg-muted/40">
                <div className="border-r p-3 text-sm font-medium text-muted-foreground">
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
                      className={`cursor-pointer border-r p-3 text-center transition hover:bg-blue-50 ${
                        esHoy ? "bg-blue-50" : ""
                      }`}
                    >
                      <p className="text-sm text-muted-foreground">
                        {diasCortos[index]}
                      </p>
                      <p className="text-lg font-semibold">{dia.getDate()}</p>
                    </button>
                  );
                })}
              </div>

              {horas.map((horaNumero) => (
                <div
                  key={horaNumero}
                  className="grid min-h-[94px] grid-cols-[90px_repeat(7,1fr)] border-b"
                >
                  <div className="border-r bg-background p-3 text-sm text-muted-foreground">
                    {String(horaNumero).padStart(2, "0")}:00
                  </div>

                  {diasSemana.map((dia) => {
                    const fechaIso = toIsoDate(dia);
                    const horaInicio = `${String(horaNumero).padStart(2, "0")}:00`;
                    const citasCelda = obtenerCitasCelda(fechaIso, horaNumero);

                    return (
                      <div
                        key={`${fechaIso}-${horaNumero}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => abrirNuevaCita(fechaIso, horaInicio)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            abrirNuevaCita(fechaIso, horaInicio);
                          }
                        }}
                        className="group relative min-h-[94px] cursor-pointer border-r p-2 transition hover:bg-blue-50/70"
                      >
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          {citasCelda.length === 0 && (
                            <span className="inline-flex items-center rounded-full border bg-background/95 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                              <Plus className="mr-1 h-3.5 w-3.5" />
                              Nueva cita
                            </span>
                          )}
                        </div>

                        <div className="relative z-10 space-y-2">
                          {citasCelda.map((cita) => {
                            const cliente = clientesMap.get(cita.cliente_id);
                            const servicio = serviciosMap.get(cita.servicio_id);
                            const empleado = empleadosMap.get(cita.empleado_id);

                            return (
                              <div
                                key={cita.id}
                                onClick={(event) => event.stopPropagation()}
                                className="cursor-default rounded-xl border bg-background p-2 shadow-sm"
                                style={{
                                  borderLeftWidth: 4,
                                  borderLeftColor:
                                    servicio?.color ??
                                    empleado?.color_calendario ??
                                    "#2563eb",
                                }}
                              >
                                <p className="text-xs font-semibold">
                                  {hora(cita.hora_inicio)} - {hora(cita.hora_fin)}
                                </p>

                                <p className="mt-1 truncate text-sm font-medium">
                                  {cliente?.nombre_completo ?? "Cliente"}
                                </p>

                                <p className="truncate text-xs text-muted-foreground">
                                  {servicio?.nombre ?? "Servicio"} ·{" "}
                                  {empleado?.nombre ?? "Empleado"}
                                </p>

                                <span
                                  className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${estadoClass(
                                    cita.estado
                                  )}`}
                                >
                                  {estadoLabel(cita.estado)}
                                </span>

                                <div className="mt-2 flex flex-wrap gap-1">
                                  {cita.estado === "pendiente" && (
                                    <CitaEstadoButton
                                      citaId={cita.id}
                                      estado={cita.estado}
                                      nuevoEstado="confirmada"
                                      label="Confirmar"
                                    />
                                  )}

                                  {cita.estado !== "cancelada" &&
                                    cita.estado !== "completada" && (
                                      <CitaEstadoButton
                                        citaId={cita.id}
                                        estado={cita.estado}
                                        nuevoEstado="cancelada"
                                        label="Cancelar"
                                      />
                                    )}

                                  {cita.estado === "confirmada" && (
                                    <CitaEstadoButton
                                      citaId={cita.id}
                                      estado={cita.estado}
                                      nuevoEstado="completada"
                                      label="Completar"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}