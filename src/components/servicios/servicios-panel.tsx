"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Layers3,
  Search,
  Sparkles,
  Tag,
} from "lucide-react";
import { ServicioDialog, type ServicioItem } from "@/components/servicios/servicio-dialog";
import { ServicioEstadoButton } from "@/components/servicios/servicio-estado-button";
import { Input } from "@/components/ui/input";

type ServiciosPanelProps = {
  servicios: ServicioItem[];
};

type EstadoFiltro = "todos" | "activo" | "inactivo";

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

function formatearPromedio(valor: number) {
  if (!Number.isFinite(valor) || valor <= 0) return "0";
  return Math.round(valor).toLocaleString("es-PY");
}

function cardBase(extra = "") {
  return `rounded-[1.5rem] border border-border/80 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5 ${extra}`;
}

function StatTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="rounded-[1.15rem] border border-white/15 bg-white/10 p-3 text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-cyan-50/85">{label}</p>
        <Icon className="h-4 w-4 text-cyan-50/80" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-cyan-50/75">{detail}</p>
    </article>
  );
}

export function ServiciosPanel({ servicios }: ServiciosPanelProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");

  const resumen = useMemo(() => {
    const activos = servicios.filter((servicio) => servicio.estado === "activo");
    const inactivos = servicios.length - activos.length;
    const duracionPromedio =
      servicios.length > 0
        ? servicios.reduce((acc, servicio) => acc + Number(servicio.duracion_minutos ?? 0), 0) /
          servicios.length
        : 0;
    const serviciosConPrecio = servicios.filter((servicio) => Number(servicio.precio ?? 0) > 0);
    const precioPromedio =
      serviciosConPrecio.length > 0
        ? serviciosConPrecio.reduce((acc, servicio) => acc + Number(servicio.precio ?? 0), 0) /
          serviciosConPrecio.length
        : 0;

    return {
      activos: activos.length,
      inactivos,
      duracionPromedio,
      precioPromedio,
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

  const filtros: { label: string; value: EstadoFiltro; count: number }[] = [
    { label: "Todos", value: "todos", count: servicios.length },
    { label: "Activos", value: "activo", count: resumen.activos },
    { label: "Inactivos", value: "inactivo", count: resumen.inactivos },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className={cardBase("overflow-hidden")}>
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_29rem]">
          <div className="relative p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-teal-500" />

            <p className="inline-flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Layers3 className="h-3.5 w-3.5 text-primary" />
              Catálogo operativo
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance">
              Servicios
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Organizá lo que vendés, cuánto dura, cuánto cuesta y si aparece en el link público de reservas.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ServicioDialog variant="crear" />

              <div className="inline-flex items-center gap-2 rounded-2xl border bg-background/65 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                Los servicios activos quedan disponibles para reservar.
              </div>
            </div>
          </div>

          <aside className="border-t border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] p-4 xl:border-l xl:border-t-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile
                label="Total cargados"
                value={String(servicios.length)}
                detail="Base completa del catálogo."
                icon={Layers3}
              />
              <StatTile
                label="Activos"
                value={String(resumen.activos)}
                detail="Visibles en agenda pública."
                icon={CheckCircle2}
              />
              <StatTile
                label="Duración media"
                value={`${formatearPromedio(resumen.duracionPromedio)} min`}
                detail="Referencia para capacidad."
                icon={Clock3}
              />
              <StatTile
                label="Precio medio"
                value={formatearPrecio(Math.round(resumen.precioPromedio))}
                detail="Solo servicios con precio."
                icon={Tag}
              />
            </div>
          </aside>
        </div>
      </section>

      <section className={cardBase("p-4")}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filtros.map((filtro) => {
              const activo = estadoFiltro === filtro.value;

              return (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => setEstadoFiltro(filtro.value)}
                  className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 ${
                    activo
                      ? "border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "border-border/80 bg-background/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {filtro.label}
                  <span className={`rounded-xl px-2 py-0.5 text-xs ${activo ? "bg-white/20" : "bg-muted"}`}>
                    {filtro.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {servicios.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Layers3 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Todavía no hay servicios</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Cargá el primero con duración, precio y color. Después podés sumarle imagen para el link público.
          </p>
          <div className="mt-5 flex justify-center">
            <ServicioDialog variant="crear" />
          </div>
        </section>
      ) : serviciosFiltrados.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <h2 className="text-xl font-bold tracking-tight">No encontramos servicios</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Probá con otro nombre, descripción o filtro de estado.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {serviciosFiltrados.map((servicio) => {
            const activo = servicio.estado === "activo";

            return (
              <article
                key={servicio.id}
                className={`${cardBase("overflow-hidden")} transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-primary/25`}
              >
                <div className="grid min-h-full sm:grid-cols-[0.85rem_minmax(0,1fr)]">
                  <div
                    className="min-h-2 sm:min-h-full"
                    style={{ backgroundColor: servicio.color ?? "#2563eb" }}
                  />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full ring-4 ring-primary/10"
                            style={{ backgroundColor: servicio.color ?? "#2563eb" }}
                          />
                          <h2 className="truncate text-lg font-bold tracking-tight">
                            {servicio.nombre}
                          </h2>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {servicio.descripcion || "Sin descripción cargada."}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-1 text-xs font-bold ${
                          activo
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {activo ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border bg-background/60 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Duración</p>
                        <p className="mt-1 font-bold">{servicio.duracion_minutos} min</p>
                      </div>
                      <div className="rounded-2xl border bg-background/60 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Precio</p>
                        <p className="mt-1 truncate font-bold">{formatearPrecio(servicio.precio)}</p>
                      </div>
                      <div className="rounded-2xl border bg-background/60 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Reservas</p>
                        <p className="mt-1 font-bold">{activo ? "Disponible" : "Oculto"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                      <p className="text-xs leading-5 text-muted-foreground">
                        {activo
                          ? "Los clientes pueden elegirlo en el link público."
                          : "No aparece como opción para nuevas reservas."}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <ServicioDialog variant="editar" servicio={servicio} />
                        <ServicioEstadoButton
                          servicioId={servicio.id}
                          estado={servicio.estado}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
