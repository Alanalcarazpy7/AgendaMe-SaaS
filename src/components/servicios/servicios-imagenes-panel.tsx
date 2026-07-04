"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

type ServicioImagenItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  imagen_url: string | null;
};

export function ServiciosImagenesPanel() {
  const [servicios, setServicios] = useState<ServicioImagenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    <section className="rounded-3xl border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Imágenes de servicios</h2>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Agregá una imagen opcional para que el cliente vea mejor cada
            servicio en el link público de reservas. Recomendado: formato
            horizontal, JPG/PNG/WEBP y menos de 2 MB.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={cargarServicios}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando servicios...
        </div>
      ) : servicios.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          Todavía no hay servicios cargados.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {servicios.map((servicio) => {
            const uploading = uploadingId === servicio.id;
            const deleting = deletingId === servicio.id;

            return (
              <article
                key={servicio.id}
                className="overflow-hidden rounded-3xl border bg-background shadow-sm"
              >
                <div className="aspect-[16/9] bg-muted">
                  {servicio.imagen_url ? (
                    <img
                      src={servicio.imagen_url}
                      alt={servicio.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                      <ImagePlus className="h-8 w-8" />
                      <p className="mt-2 text-sm">Sin imagen</p>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{servicio.nombre}</p>

                      {servicio.descripcion && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {servicio.descripcion}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        servicio.estado === "activo"
                          ? "bg-green-50 text-green-700"
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
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      {servicio.imagen_url ? "Cambiar imagen" : "Subir imagen"}
                    </Button>

                    {servicio.imagen_url && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={uploading || deleting}
                        onClick={() => eliminarImagen(servicio.id)}
                      >
                        {deleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
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
    </section>
  );
}