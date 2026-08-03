"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Search,
} from "lucide-react";
import {
  ServicioDialog,
  type ServicioItem,
} from "@/components/servicios/servicio-dialog";
import { ServicioEstadoButton } from "@/components/servicios/servicio-estado-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LimiteRecursoInfo } from "@/lib/planes/limite-recurso";

type ServiciosPanelProps = {
  servicios: ServicioItem[];
  limiteServicios: LimiteRecursoInfo;
};

type EstadoFiltro = "todos" | "activo" | "inactivo";

const CANTIDAD_INICIAL = 6;

function formatearPrecio(precio: number | string | null) {
  const numero = Number(precio ?? 0);

  if (numero <= 0) return "Sin precio";

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(numero);
}

export function ServiciosPanel({ servicios, limiteServicios }: ServiciosPanelProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("activo");
  const [cantidadVisible, setCantidadVisible] = useState(CANTIDAD_INICIAL);

  const resumen = useMemo(() => {
    const activos = servicios.filter((servicio) => servicio.estado === "activo").length;
    const conImagen = servicios.filter((servicio) => Boolean(servicio.imagen_url)).length;

    return {
      activos,
      inactivos: servicios.length - activos,
      conImagen,
    };
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return servicios.filter((servicio) => {
      const coincideEstado = estadoFiltro === "todos" || servicio.estado === estadoFiltro;
      const coincideBusqueda =
        !query ||
        servicio.nombre.toLowerCase().includes(query) ||
        servicio.descripcion?.toLowerCase().includes(query);

      return coincideEstado && coincideBusqueda;
    });
  }, [servicios, busqueda, estadoFiltro]);

  const serviciosVisibles = serviciosFiltrados.slice(0, cantidadVisible);
  const restantes = serviciosFiltrados.length - serviciosVisibles.length;
  const filtros: { label: string; value: EstadoFiltro; count: number }[] = [
    { label: "Todos", value: "todos", count: servicios.length },
    { label: "Activos", value: "activo", count: resumen.activos },
    { label: "Inactivos", value: "inactivo", count: resumen.inactivos },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <section className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm sm:p-6">
        <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black text-primary">CATÁLOGO DE SERVICIOS</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Servicios</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Cada ficha reúne imagen, duración, precio y disponibilidad.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center divide-x divide-border rounded-lg border bg-background text-center">
              <div className="min-w-20 px-3 py-2">
                <strong className="block text-lg leading-none">{servicios.length}</strong>
                <span className="mt-1 block text-[11px] text-muted-foreground">Total</span>
              </div>
              <div className="min-w-20 px-3 py-2">
                <strong className="block text-lg leading-none text-emerald-600 dark:text-emerald-300">
                  {resumen.activos}
                </strong>
                <span className="mt-1 block text-[11px] text-muted-foreground">Activos</span>
              </div>
              <div className="min-w-20 px-3 py-2">
                <strong className="block text-lg leading-none">{resumen.conImagen}</strong>
                <span className="mt-1 block text-[11px] text-muted-foreground">Con imagen</span>
              </div>
            </div>
            <ServicioDialog variant="crear" limiteInfo={limiteServicios} />
          </div>
        </div>
      </section>

      {servicios.length > 0 && (
        <section className="rounded-lg border bg-card p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-center">
            <div className="flex h-10 items-center gap-2 rounded-lg border bg-background px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value);
                  setCantidadVisible(CANTIDAD_INICIAL);
                }}
                placeholder="Buscar servicio..."
                className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {filtros.map((filtro) => {
                const activo = estadoFiltro === filtro.value;

                return (
                  <button
                    key={filtro.value}
                    type="button"
                    onClick={() => {
                      setEstadoFiltro(filtro.value);
                      setCantidadVisible(CANTIDAD_INICIAL);
                    }}
                    className={`flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold outline-none transition-[background-color,color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/30 ${
                      activo
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filtro.label}
                    <span className="tabular-nums opacity-70">{filtro.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {servicios.length === 0 ? (
        <section className="rounded-lg border border-dashed bg-card px-6 py-10 text-center shadow-sm">
          <span className="text-4xl font-black text-primary">01</span>
          <h2 className="mt-3 text-xl font-bold">Creá tu primer servicio</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Agregá nombre, duración, precio e imagen en el mismo paso.
          </p>
          <div className="mt-5 flex justify-center">
            <ServicioDialog variant="crear" limiteInfo={limiteServicios} />
          </div>
        </section>
      ) : serviciosFiltrados.length === 0 ? (
        <section className="rounded-lg border bg-card px-6 py-9 text-center shadow-sm">
          <Search className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-bold">No encontramos servicios</h2>
          <p className="mt-1 text-sm text-muted-foreground">Probá otra búsqueda o filtro.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-3 xl:grid-cols-2">
            {serviciosVisibles.map((servicio) => {
              const activo = servicio.estado === "activo";

              return (
                <article
                  key={servicio.id}
                  className="group relative grid min-h-36 grid-cols-[6.5rem_minmax(0,1fr)] overflow-hidden rounded-lg border bg-card shadow-[0_10px_30px_rgb(15_23_42/0.06)] transition-[border-color,box-shadow] hover:shadow-[0_14px_36px_rgb(15_23_42/0.1)] sm:grid-cols-[8rem_minmax(0,1fr)]"
                  style={{
                    borderColor: `color-mix(in srgb, ${servicio.color ?? "#2563eb"} 28%, var(--border))`,
                  }}
                >
                  <span
                    className="absolute inset-x-0 top-0 z-10 h-0.5"
                    style={{ backgroundColor: servicio.color ?? "#2563eb" }}
                    aria-hidden="true"
                  />
                  <div className="relative min-h-full border-r bg-muted">
                    {servicio.imagen_url ? (
                      <Image
                        src={servicio.imagen_url}
                        alt={servicio.nombre}
                        fill
                        unoptimized
                        sizes="128px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        className="flex h-full flex-col items-center justify-center px-2 text-center"
                        style={{
                          color: servicio.color ?? "#2563eb",
                          backgroundColor: `color-mix(in srgb, ${servicio.color ?? "#2563eb"} 12%, var(--muted))`,
                        }}
                      >
                        <span className="text-3xl font-black">{servicio.nombre.slice(0, 1).toUpperCase()}</span>
                        <span className="mt-1 text-[10px] font-bold opacity-70">SIN IMAGEN</span>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: servicio.color ?? "#2563eb" }}
                            aria-hidden="true"
                          />
                          <h2 className="truncate font-bold">{servicio.nombre}</h2>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {servicio.descripcion || "Sin descripción"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold ${
                          activo
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${activo ? "bg-emerald-500" : "bg-muted-foreground/55"}`} aria-hidden="true" />
                        {activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <span>
                        <strong className="font-semibold text-foreground">Duración</strong> · {servicio.duracion_minutos} min
                      </span>
                      <span className="min-w-0 truncate">
                        <strong className="font-semibold text-foreground">Precio</strong> · {formatearPrecio(servicio.precio)}
                      </span>
                    </div>

                    <div className="mt-auto flex flex-wrap justify-end gap-2 pt-3">
                      <ServicioDialog variant="editar" servicio={servicio} />
                      <ServicioEstadoButton
                        servicioId={servicio.id}
                        estado={servicio.estado}
                        limiteInfo={limiteServicios}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {restantes > 0 && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCantidadVisible((actual) => actual + CANTIDAD_INICIAL)}
              >
                Mostrar {Math.min(restantes, CANTIDAD_INICIAL)} más
                <ChevronDown className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
