"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ServicioImagenItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  imagen_url: string | null;
};

function panelBase(extra = "") {
  return `rounded-[1.5rem] border border-border/80 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5 ${extra}`;
}

export function ServiciosImagenesPanel() {
  const [servicios, setServicios] = useState<ServicioImagenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const resumen = useMemo(() => {
    const conImagen = servicios.filter((servicio) => Boolean(servicio.imagen_url)).length;

    return {
      total: servicios.length,
      conImagen,
      sinImagen: servicios.length - conImagen,
    };
  }, [servicios]);

  async function cargarServicios() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/dashboard/servicios/imagenes");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudieron cargar los servicios.");
        return;
      }

      setServicios(Array.isArray(data.servicios) ? data.servicios : []);
    } catch {
      setError("No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarServicios();
  }, []);

  async function subirImagen(servicioId: string, file: File | null) {
    if (!file) return;

    try {
      setUploadingId(servicioId);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/dashboard/servicios/${servicioId}/imagen`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo subir la imagen.");
        return;
      }

      setServicios((actual) =>
        actual.map((servicio) =>
          servicio.id === servicioId
            ? {
                ...servicio,
                imagen_url: data.imagenUrl,
              }
            : servicio
        )
      );
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setUploadingId(null);

      const input = inputRefs.current[servicioId];

      if (input) {
        input.value = "";
      }
    }
  }

  async function eliminarImagen(servicioId: string) {
    try {
      setDeletingId(servicioId);
      setError("");

      const response = await fetch(
        `/api/dashboard/servicios/${servicioId}/imagen`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo eliminar la imagen.");
        return;
      }

      setServicios((actual) =>
        actual.map((servicio) =>
          servicio.id === servicioId
            ? {
                ...servicio,
                imagen_url: null,
              }
            : servicio
        )
      );
    } catch {
      setError("No se pudo eliminar la imagen.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={panelBase("overflow-hidden")}>
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <ImagePlus className="h-3.5 w-3.5 text-primary" />
                Galería pública
              </p>

              <h2 className="mt-4 text-2xl font-bold tracking-tight">
                Imágenes de servicios
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Sumá una imagen clara para que el cliente reconozca cada servicio antes de reservar. Ideal: horizontal, JPG/PNG/WEBP y menos de 2 MB.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={cargarServicios}
              disabled={loading}
              className="rounded-2xl"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualizar
            </Button>
          </div>
        </div>

        <aside className="border-t border-border/70 bg-muted/25 p-4 xl:border-l xl:border-t-0">
          <div className="grid gap-2">
            <div className="rounded-2xl border bg-background/60 p-3">
              <p className="text-xs text-muted-foreground">Servicios</p>
              <p className="mt-1 text-2xl font-bold">{resumen.total}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Con imagen</p>
                <p className="mt-1 text-lg font-bold">{resumen.conImagen}</p>
              </div>
              <div className="rounded-2xl border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className="mt-1 text-lg font-bold">{resumen.sinImagen}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="border-t p-5 sm:p-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.25rem] border bg-background/60">
                <div className="aspect-[16/9] animate-pulse bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
                  <div className="h-9 w-36 animate-pulse rounded-2xl bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : servicios.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed bg-muted/35 p-6 text-center text-sm text-muted-foreground">
            Todavía no hay servicios cargados.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servicios.map((servicio) => {
              const uploading = uploadingId === servicio.id;
              const deleting = deletingId === servicio.id;

              return (
                <article
                  key={servicio.id}
                  className="group overflow-hidden rounded-[1.25rem] border bg-background/70 shadow-sm transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="relative aspect-[16/9] bg-muted">
                    {servicio.imagen_url ? (
                      <img
                        src={servicio.imagen_url}
                        alt={servicio.nombre}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                        <ImagePlus className="h-9 w-9" />
                        <p className="mt-2 text-sm font-semibold">Sin imagen</p>
                      </div>
                    )}

                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-2xl px-3 py-1 text-xs font-bold shadow-lg backdrop-blur ${
                        servicio.imagen_url
                          ? "bg-emerald-500/90 text-white"
                          : "bg-background/85 text-muted-foreground"
                      }`}
                    >
                      {servicio.imagen_url && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {servicio.imagen_url ? "Lista" : "Pendiente"}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{servicio.nombre}</p>
                        {servicio.descripcion && (
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {servicio.descripcion}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-2xl px-2.5 py-1 text-xs font-bold ${
                          servicio.estado === "activo"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {servicio.estado}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <input
                        ref={(element) => {
                          inputRefs.current[servicio.id] = element;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) =>
                          subirImagen(
                            servicio.id,
                            event.target.files?.[0] ?? null
                          )
                        }
                      />

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading || deleting}
                        onClick={() => inputRefs.current[servicio.id]?.click()}
                        className="rounded-2xl"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UploadCloud className="h-4 w-4" />
                        )}
                        {servicio.imagen_url ? "Cambiar" : "Subir"}
                      </Button>

                      {servicio.imagen_url && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={uploading || deleting}
                          onClick={() => eliminarImagen(servicio.id)}
                          className="rounded-2xl"
                        >
                          {deleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Quitar
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
