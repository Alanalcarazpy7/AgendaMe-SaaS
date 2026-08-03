"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, UsersRound } from "lucide-react";
import {
  EmpleadoDialog,
  type EmpleadoItem,
  type ServicioParaEmpleado,
} from "@/components/empleados/empleado-dialog";
import { EmpleadoEstadoButton } from "@/components/empleados/empleado-estado-button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LimiteRecursoInfo } from "@/lib/planes/limite-recurso";

type EmpleadosPanelProps = {
  empleados: EmpleadoItem[];
  servicios: ServicioParaEmpleado[];
  limiteEmpleados: LimiteRecursoInfo;
};

type EstadoFiltro = "todos" | "activo" | "inactivo";

const EMPLEADOS_PAGE_SIZE = 20;
const nombresDias = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function cardBase(extra = "") {
  return `rounded-lg border border-border/80 bg-card shadow-sm shadow-slate-950/5 dark:shadow-black/15 ${extra}`;
}

function hora(valor: string | null) {
  if (!valor) return "";
  return valor.slice(0, 5);
}

function compactarDias(dias: number[]) {
  const ordenados = [...dias].sort((a, b) => a - b);
  const grupos: number[][] = [];

  for (const dia of ordenados) {
    const ultimoGrupo = grupos[grupos.length - 1];
    const ultimoDia = ultimoGrupo?.[ultimoGrupo.length - 1];

    if (!ultimoGrupo || ultimoDia === undefined || dia !== ultimoDia + 1) {
      grupos.push([dia]);
    } else {
      ultimoGrupo.push(dia);
    }
  }

  return grupos
    .map((grupo) => {
      const inicio = grupo[0];
      const fin = grupo[grupo.length - 1];

      if (inicio === fin) return nombresDias[inicio];

      return `${nombresDias[inicio]}-${nombresDias[fin]}`;
    })
    .join(", ");
}

function obtenerResumenHorarios(empleado: EmpleadoItem) {
  if (!empleado.horarios || empleado.horarios.length === 0) {
    return ["Usa horario del negocio"];
  }

  const activos = empleado.horarios.filter(
    (horario) => horario.activo && horario.hora_inicio && horario.hora_fin
  );

  if (activos.length === 0) {
    return ["Sin dias activos"];
  }

  const grupos = new Map<string, number[]>();

  for (const horario of activos) {
    const clave = `${hora(horario.hora_inicio)}-${hora(horario.hora_fin)}`;

    if (!grupos.has(clave)) {
      grupos.set(clave, []);
    }

    grupos.get(clave)!.push(horario.dia_semana);
  }

  return Array.from(grupos.entries()).map(([rango, dias]) => {
    const [inicio, fin] = rango.split("-");

    return `${compactarDias(dias)} - ${inicio}-${fin}`;
  });
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  return partes.map((parte) => parte[0]).join("").toUpperCase() || "EM";
}

export function EmpleadosPanel({ empleados, servicios, limiteEmpleados }: EmpleadosPanelProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("activo");
  const [pagina, setPagina] = useState(1);

  function obtenerServicios(serviciosIds: string[]) {
    return servicios.filter((servicio) => serviciosIds.includes(servicio.id));
  }

  const resumen = useMemo(() => {
    const activos = empleados.filter((empleado) => empleado.estado === "activo").length;
    const conServicios = empleados.filter((empleado) => empleado.servicios_ids.length > 0).length;
    const conHorarioPropio = empleados.filter(
      (empleado) => empleado.horarios && empleado.horarios.length > 0
    ).length;

    return {
      total: empleados.length,
      activos,
      inactivos: empleados.length - activos,
      conServicios,
      conHorarioPropio,
    };
  }, [empleados]);

  const query = busqueda.trim().toLowerCase();
  const empleadosFiltrados = empleados.filter((empleado) => {
    const nombresServicios = obtenerServicios(empleado.servicios_ids)
      .map((servicio) => servicio.nombre.toLowerCase())
      .join(" ");
    const coincideEstado = estadoFiltro === "todos" || empleado.estado === estadoFiltro;
    const coincideBusqueda =
      !query ||
      empleado.nombre.toLowerCase().includes(query) ||
      empleado.email?.toLowerCase().includes(query) ||
      empleado.telefono?.toLowerCase().includes(query) ||
      nombresServicios.includes(query);

    return coincideEstado && coincideBusqueda;
  });

  const totalPaginas = Math.max(1, Math.ceil(empleadosFiltrados.length / EMPLEADOS_PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desdeResultado =
    empleadosFiltrados.length === 0 ? 0 : (paginaActual - 1) * EMPLEADOS_PAGE_SIZE + 1;
  const hastaResultado = Math.min(paginaActual * EMPLEADOS_PAGE_SIZE, empleadosFiltrados.length);
  const empleadosVisibles = empleadosFiltrados.slice(
    (paginaActual - 1) * EMPLEADOS_PAGE_SIZE,
    paginaActual * EMPLEADOS_PAGE_SIZE
  );

  const filtros: { value: EstadoFiltro; label: string; count: number }[] = [
    { value: "todos", label: "Todos", count: resumen.total },
    { value: "activo", label: "Activos", count: resumen.activos },
    { value: "inactivo", label: "Inactivos", count: resumen.inactivos },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className={cardBase("overflow-hidden")}>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Directorio del equipo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada empleado puede tener servicios y disponibilidad propios.
            </p>
          </div>
          <EmpleadoDialog variant="crear" servicios={servicios} limiteInfo={limiteEmpleados} />
        </div>

        <dl className="grid grid-cols-2 border-t bg-muted/20 sm:grid-cols-4">
          {[
            ["Activos", resumen.activos],
            ["Inactivos", resumen.inactivos],
            ["Con servicios", resumen.conServicios],
            ["Horario propio", resumen.conHorarioPropio],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`px-4 py-3 ${index % 2 ? "border-l" : ""} ${
                index >= 2 ? "border-t sm:border-t-0" : ""
              } ${index === 2 ? "sm:border-l" : ""}`}
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={cardBase("p-3")}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-h-10 items-center gap-2 rounded-md border border-border/80 bg-background px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nombre, correo, teléfono o servicio"
              className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filtros.map((filtro) => {
              const activo = estadoFiltro === filtro.value;

              return (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => {
                    setEstadoFiltro(filtro.value);
                    setPagina(1);
                  }}
                  className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold outline-none transition-[background-color,color,border-color] focus-visible:ring-3 focus-visible:ring-ring/40 ${
                    activo
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {filtro.label}
                  <span className="text-xs tabular-nums">{filtro.count}</span>
                </button>
              );
            })}
            {(busqueda || estadoFiltro !== "todos") && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setEstadoFiltro("todos");
                  setPagina(1);
                }}
                className="inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </section>

      {empleados.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <UsersRound className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Todavia no hay empleados</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Carga personas del equipo para asignarles servicios y horarios de atencion.
          </p>
          <div className="mt-5 flex justify-center">
            <EmpleadoDialog variant="crear" servicios={servicios} limiteInfo={limiteEmpleados} />
          </div>
        </section>
      ) : empleadosFiltrados.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <h2 className="text-xl font-bold tracking-tight">No encontramos empleados</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Proba con otro texto o cambia el filtro de estado.
          </p>
        </section>
      ) : (
        <section className={cardBase("overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <strong className="text-foreground">
                {desdeResultado}-{hastaResultado}
              </strong>{" "}
              de <strong className="text-foreground">{empleadosFiltrados.length}</strong> empleados
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina(Math.max(1, paginaActual - 1))}
                disabled={paginaActual <= 1}
                className="inline-flex h-9 items-center gap-1 rounded-2xl border bg-background/70 px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="rounded-2xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
                {paginaActual}/{totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual >= totalPaginas}
                className="inline-flex h-9 items-center gap-1 rounded-2xl border bg-background/70 px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-45"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Servicios</th>
                  <th className="px-4 py-3">Horarios</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/70">
                {empleadosVisibles.map((empleado) => {
                  const activo = empleado.estado === "activo";
                  const serviciosAsignados = obtenerServicios(empleado.servicios_ids);
                  const resumenHorarios = obtenerResumenHorarios(empleado);

                  return (
                    <tr key={empleado.id} className="bg-card/40 transition-colors hover:bg-muted/35">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                            style={{ backgroundColor: empleado.color_calendario ?? "#2563eb" }}
                          >
                            {iniciales(empleado.nombre)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{empleado.nombre}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {serviciosAsignados.length} servicios asignados
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p className="max-w-[14rem] truncate">{empleado.email || "-"}</p>
                        <p className="mt-1 max-w-[14rem] truncate text-xs">{empleado.telefono || "-"}</p>
                      </td>
                      <td className="max-w-[18rem] px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {serviciosAsignados.length === 0 ? (
                            <span className="rounded-xl bg-muted px-2 py-1 text-xs text-muted-foreground">
                              Sin servicios
                            </span>
                          ) : (
                            serviciosAsignados.slice(0, 3).map((servicio) => (
                              <span
                                key={servicio.id}
                                className="rounded-xl bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
                              >
                                {servicio.nombre}
                              </span>
                            ))
                          )}
                          {serviciosAsignados.length > 3 && (
                            <Tooltip>
                              <TooltipTrigger className="rounded-xl bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground outline-none transition hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/40">
                                +{serviciosAsignados.length - 3}
                              </TooltipTrigger>
                              <TooltipContent>
                                {serviciosAsignados
                                  .slice(3)
                                  .map((servicio) => servicio.nombre)
                                  .join(", ")}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[18rem] px-4 py-3 text-muted-foreground">
                        <span className="block truncate">{resumenHorarios.slice(0, 2).join(" / ")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-bold ${
                            activo
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <EmpleadoDialog variant="editar" empleado={empleado} servicios={servicios} />
                          <EmpleadoEstadoButton
                            empleadoId={empleado.id}
                            estado={empleado.estado}
                            limiteInfo={limiteEmpleados}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
