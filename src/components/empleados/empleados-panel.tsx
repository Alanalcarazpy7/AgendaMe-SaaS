"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  EmpleadoDialog,
  type EmpleadoItem,
  type ServicioParaEmpleado,
} from "@/components/empleados/empleado-dialog";
import { EmpleadoEstadoButton } from "@/components/empleados/empleado-estado-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type EmpleadosPanelProps = {
  empleados: EmpleadoItem[];
  servicios: ServicioParaEmpleado[];
};

const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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

      if (inicio === fin) {
        return nombresDias[inicio];
      }

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
    return ["Sin días activos"];
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

    return `${compactarDias(dias)} · ${inicio}-${fin}`;
  });
}

export function EmpleadosPanel({ empleados, servicios }: EmpleadosPanelProps) {
  const [busqueda, setBusqueda] = useState("");

  const empleadosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    if (!query) return empleados;

    return empleados.filter((empleado) => {
      return (
        empleado.nombre.toLowerCase().includes(query) ||
        empleado.email?.toLowerCase().includes(query) ||
        empleado.telefono?.toLowerCase().includes(query)
      );
    });
  }, [empleados, busqueda]);

  function obtenerNombresServicios(serviciosIds: string[]) {
    const nombres = servicios
      .filter((servicio) => serviciosIds.includes(servicio.id))
      .map((servicio) => servicio.nombre);

    if (nombres.length === 0) {
      return "Sin servicios asignados";
    }

    return nombres.join(", ");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
          <p className="mt-1 text-muted-foreground">
            Gestioná las personas que atenderán citas o realizarán servicios.
          </p>
        </div>

        <EmpleadoDialog variant="crear" servicios={servicios} />
      </section>

      <section className="flex max-w-md items-center gap-2 rounded-xl border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar empleados..."
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </section>

      <Card>
        <CardContent className="p-0">
          {empleados.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No hay empleados registrados.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tocá “Nuevo empleado” para cargar el primero.
              </p>
            </div>
          ) : empleadosFiltrados.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No encontramos empleados.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Probá con otro nombre, correo o teléfono.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Empleado</th>
                      <th className="px-4 py-3 font-medium">Contacto</th>
                      <th className="px-4 py-3 font-medium">Servicios</th>
                      <th className="px-4 py-3 font-medium">Horario</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {empleadosFiltrados.map((empleado) => {
                      const resumenHorarios = obtenerResumenHorarios(empleado);

                      return (
                        <tr key={empleado.id} className="border-t">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    empleado.color_calendario ?? "#2563eb",
                                }}
                              />

                              <p className="font-medium">{empleado.nombre}</p>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            <div>
                              <p>{empleado.email ?? "-"}</p>
                              <p className="text-xs">{empleado.telefono ?? ""}</p>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            <p className="max-w-xs truncate">
                              {obtenerNombresServicios(empleado.servicios_ids)}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex max-w-xs flex-wrap gap-1">
                              {resumenHorarios.map((texto) => (
                                <span
                                  key={texto}
                                  className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                                >
                                  {texto}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                empleado.estado === "activo"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {empleado.estado}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <EmpleadoDialog
                                variant="editar"
                                empleado={empleado}
                                servicios={servicios}
                              />

                              <EmpleadoEstadoButton
                                empleadoId={empleado.id}
                                estado={empleado.estado}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}