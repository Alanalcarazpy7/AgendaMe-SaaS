"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ServicioDialog, type ServicioItem } from "@/components/servicios/servicio-dialog";
import { ServicioEstadoButton } from "@/components/servicios/servicio-estado-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ServiciosPanelProps = {
  servicios: ServicioItem[];
};

function formatearPrecio(precio: number | string | null) {
  const numero = Number(precio ?? 0);

  if (numero <= 0) {
    return "Sin precio";
  }

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(numero);
}

export function ServiciosPanel({ servicios }: ServiciosPanelProps) {
  const [busqueda, setBusqueda] = useState("");

  const serviciosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    if (!query) return servicios;

    return servicios.filter((servicio) => {
      return (
        servicio.nombre.toLowerCase().includes(query) ||
        servicio.descripcion?.toLowerCase().includes(query)
      );
    });
  }, [servicios, busqueda]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servicios</h1>
          <p className="mt-1 text-muted-foreground">
            Gestioná los servicios que ofrece tu negocio.
          </p>
        </div>

        <ServicioDialog variant="crear" />
      </section>

      <section className="flex max-w-md items-center gap-2 rounded-xl border bg-background px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar servicios..."
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </section>

      <Card>
        <CardContent className="p-0">
          {servicios.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No hay servicios registrados.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tocá “Nuevo servicio” para cargar el primero.
              </p>
            </div>
          ) : serviciosFiltrados.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No encontramos servicios.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Probá con otro nombre o descripción.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/60 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Servicio</th>
                      <th className="px-4 py-3 font-medium">Duración</th>
                      <th className="px-4 py-3 font-medium">Precio</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {serviciosFiltrados.map((servicio) => (
                      <tr key={servicio.id} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-1 h-3 w-3 rounded-full"
                              style={{ backgroundColor: servicio.color ?? "#111827" }}
                            />
                            <div>
                              <p className="font-medium">{servicio.nombre}</p>
                              {servicio.descripcion && (
                                <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                                  {servicio.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {servicio.duracion_minutos} min
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {formatearPrecio(servicio.precio)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              servicio.estado === "activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {servicio.estado}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ServicioDialog variant="editar" servicio={servicio} />
                            <ServicioEstadoButton
                              servicioId={servicio.id}
                              estado={servicio.estado}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
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