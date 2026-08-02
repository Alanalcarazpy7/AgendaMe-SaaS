"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlignLeft,
  Check,
  Clock3,
  Loader2,
  Palette,
  Pencil,
  Plus,
  ReceiptText,
  Tag,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ServicioItem = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  precio: number | string | null;
  color: string | null;
  imagen_url: string | null;
  estado: "activo" | "inactivo";
  created_at: string;
};

type ServicioDialogProps = {
  servicio?: ServicioItem;
  variant: "crear" | "editar";
};

const coloresRapidos = [
  "#2563eb",
  "#06b6d4",
  "#14b8a6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#111827",
];

function formatPrecioPreview(precio: string) {
  const numero = Number(precio || 0);

  if (numero <= 0) return "Sin precio";

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(numero);
}

export function ServicioDialog({ servicio, variant }: ServicioDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState("30");
  const [precio, setPrecio] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreviewUrl, setImagenPreviewUrl] = useState("");
  const [quitarImagen, setQuitarImagen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imagenInputRef = useRef<HTMLInputElement | null>(null);

  const esEditar = variant === "editar";
  const nombrePreview = nombre.trim() || "Nombre del servicio";
  const descripcionPreview =
    descripcion.trim() || "Descripción opcional del servicio.";
  const imagenPreview =
    imagenPreviewUrl || (!quitarImagen ? (servicio?.imagen_url ?? "") : "");

  useEffect(() => {
    if (!open) return;

    // Reset the form from the service selected by the parent on every opening.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNombre(servicio?.nombre ?? "");
    setDescripcion(servicio?.descripcion ?? "");
    setDuracionMinutos(String(servicio?.duracion_minutos ?? 30));
    setPrecio(
      servicio?.precio !== null && servicio?.precio !== undefined
        ? String(servicio.precio)
        : ""
    );
    setColor(servicio?.color ?? "#2563eb");
    setImagenFile(null);
    setImagenPreviewUrl("");
    setQuitarImagen(false);
    setError(null);
  }, [open, servicio]);

  useEffect(() => {
    return () => {
      if (imagenPreviewUrl) URL.revokeObjectURL(imagenPreviewUrl);
    };
  }, [imagenPreviewUrl]);

  function seleccionarImagen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Usá una imagen JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar 2 MB.");
      event.target.value = "";
      return;
    }

    setImagenFile(file);
    setImagenPreviewUrl(URL.createObjectURL(file));
    setQuitarImagen(false);
    setError(null);
  }

  function quitarImagenSeleccionada() {
    setImagenFile(null);
    setImagenPreviewUrl("");
    setQuitarImagen(Boolean(servicio?.imagen_url));
    if (imagenInputRef.current) imagenInputRef.current.value = "";
  }

  async function sincronizarImagen(servicioId: string) {
    if (imagenFile) {
      const formData = new FormData();
      formData.append("file", imagenFile);
      const response = await fetch(`/api/dashboard/servicios/${servicioId}/imagen`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        return data.error ?? "La imagen no pudo subirse.";
      }
    } else if (quitarImagen && servicio?.imagen_url) {
      const response = await fetch(`/api/dashboard/servicios/${servicioId}/imagen`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        return data.error ?? "La imagen no pudo quitarse.";
      }
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const url = esEditar
        ? `/api/dashboard/servicios/${servicio?.id}`
        : "/api/dashboard/servicios";

      const method = esEditar ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          descripcion,
          duracionMinutos,
          precio,
          color,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        servicio?: { id: string };
      };

      if (!response.ok) {
        const message = data.error ?? "No se pudo guardar el servicio.";
        setError(message);
        toast.error("No se pudo guardar el servicio", { description: message });
        return;
      }

      const servicioId = data.servicio?.id ?? servicio?.id;
      const advertenciaImagen = servicioId
        ? await sincronizarImagen(servicioId)
        : "No se pudo identificar el servicio para guardar la imagen.";

      setOpen(false);
      toast.success(esEditar ? "Servicio actualizado" : "Servicio creado");
      if (advertenciaImagen) {
        toast.warning("El servicio se guardó sin actualizar la imagen", {
          description: advertenciaImagen,
        });
      }
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {esEditar ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-lg"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="rounded-lg">
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:!max-w-[calc(100vw-2rem)] xl:w-[58rem] xl:!max-w-[58rem]">
          <div className="max-h-[92dvh] overflow-y-auto overflow-x-hidden">
            <div className="grid min-w-0 xl:grid-cols-[20rem_minmax(0,1fr)]">
            <aside
              className="relative min-w-0 overflow-hidden border-b p-4 text-white transition-colors duration-200 sm:p-5 xl:border-b-0 xl:border-r"
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 28%, #07131f)`,
                borderColor: `color-mix(in srgb, ${color} 34%, rgba(255,255,255,.1))`,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />

              <p className="inline-flex items-center rounded-md border border-white/15 bg-black/10 px-2.5 py-1 text-[11px] font-bold text-white/80">
                VISTA EN RESERVAS
              </p>

              <div
                className="mt-4 overflow-hidden rounded-lg border bg-black/10 shadow-2xl shadow-slate-950/20 sm:mt-6"
                style={{ borderColor: `color-mix(in srgb, ${color} 58%, rgba(255,255,255,.18))` }}
              >
                <div className="relative aspect-[16/9] border-b border-white/10 bg-black/20">
                  {imagenPreview ? (
                    <Image
                      src={imagenPreview}
                      alt="Vista previa del servicio"
                      fill
                      unoptimized
                      sizes="320px"
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full flex-col items-center justify-center text-white/70"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, rgba(0,0,0,.24))` }}
                    >
                      <span className="text-3xl font-black text-white/90">{nombrePreview.slice(0, 1).toUpperCase()}</span>
                      <span className="mt-2 text-[11px] font-bold">SIN IMAGEN</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-[10px] font-black text-white/55">SERVICIO</p>
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-4 w-4 shrink-0 rounded-full ring-4 ring-white/15"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <h3 className="break-words text-xl font-bold tracking-tight">
                        {nombrePreview}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/75">
                        {descripcionPreview}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div
                      className="rounded-md border border-white/10 p-3"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, rgba(0,0,0,.14))` }}
                    >
                      <p className="text-xs text-white/65">Duración</p>
                      <p className="mt-1 font-bold">{duracionMinutos || 0} min</p>
                    </div>
                    <div
                      className="rounded-md border border-white/10 p-3"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, rgba(0,0,0,.14))` }}
                    >
                      <p className="text-xs text-white/65">Precio</p>
                      <p className="mt-1 truncate font-bold">{formatPrecioPreview(precio)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/65">
                La imagen y el color se muestran en el enlace público.
              </p>
            </aside>

            <div className="min-w-0 p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="pr-12 text-2xl leading-tight tracking-tight">
                  {esEditar ? "Editar servicio" : "Nuevo servicio"}
                </DialogTitle>
                <DialogDescription className="max-w-xl leading-6">
                  {esEditar
                    ? "Modificá la ficha publicada en tu agenda."
                    : "Definí la ficha que podrán elegir tus clientes."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del servicio</Label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      placeholder="Ej: Corte de pelo, limpieza facial, consulta"
                      required
                      className="h-11 rounded-lg pl-9"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duracionMinutos">Duración</Label>
                    <div className="relative">
                      <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="duracionMinutos"
                        type="number"
                        min="5"
                        step="5"
                        value={duracionMinutos}
                        onChange={(event) => setDuracionMinutos(event.target.value)}
                        placeholder="30"
                        required
                        className="h-11 rounded-lg pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio</Label>
                    <div className="relative">
                      <ReceiptText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="precio"
                        type="number"
                        min="0"
                        step="1000"
                        value={precio}
                        onChange={(event) => setPrecio(event.target.value)}
                        placeholder="50000"
                        className="h-11 rounded-lg pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <Label>Color del servicio</Label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {coloresRapidos.map((colorItem) => {
                      const activo = colorItem.toLowerCase() === color.toLowerCase();

                      return (
                        <button
                          key={colorItem}
                          type="button"
                          onClick={() => setColor(colorItem)}
                          className={`flex h-10 w-10 items-center justify-center rounded-md border shadow-sm transition-[box-shadow,border-color] duration-150 ${
                            activo ? "border-foreground shadow-lg" : "border-border/70"
                          }`}
                          style={{ backgroundColor: colorItem }}
                          aria-label={`Elegir color ${colorItem}`}
                        >
                          {activo && <Check className="h-4 w-4 text-white" />}
                        </button>
                      );
                    })}

                    <div className="flex h-10 items-center gap-2 rounded-lg border bg-background/70 px-3">
                      <span
                        className="h-5 w-5 rounded border"
                        style={{ backgroundColor: color }}
                      />
                      <Input
                        type="color"
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                        className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                        aria-label="Color personalizado"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <div className="relative">
                    <AlignLeft className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="descripcion"
                      value={descripcion}
                      onChange={(event) => setDescripcion(event.target.value)}
                      placeholder="Detalle breve: qué incluye, para quién es o qué debe esperar el cliente."
                      rows={4}
                      className="rounded-lg pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="imagenServicio">Imagen del servicio</Label>
                    <span className="text-xs text-muted-foreground">JPG, PNG o WEBP · 2 MB</span>
                  </div>
                  <input
                    ref={imagenInputRef}
                    id="imagenServicio"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={seleccionarImagen}
                  />
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/25 p-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imagenInputRef.current?.click()}
                    >
                      <UploadCloud className="size-4" />
                      {imagenPreview ? "Reemplazar imagen" : "Elegir imagen"}
                    </Button>
                    {imagenPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={quitarImagenSeleccionada}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Quitar
                      </Button>
                    )}
                    <span className="min-w-0 truncate text-xs text-muted-foreground">
                      {imagenFile?.name ?? (imagenPreview ? "Imagen actual" : "Ningún archivo seleccionado")}
                    </span>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="rounded-lg"
                  >
                    Cancelar
                  </Button>

                  <Button type="submit" disabled={loading} className="rounded-lg">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading
                      ? "Guardando..."
                      : esEditar
                        ? "Guardar cambios"
                        : "Crear servicio"}
                  </Button>
                </div>
              </form>
            </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
