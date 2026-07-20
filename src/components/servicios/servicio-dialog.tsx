"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
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
  Sparkles,
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEditar = variant === "editar";
  const nombrePreview = nombre.trim() || "Nombre del servicio";
  const descripcionPreview =
    descripcion.trim() || "Descripción breve para que tu cliente entienda qué incluye.";

  useEffect(() => {
    if (!open) return;

    setNombre(servicio?.nombre ?? "");
    setDescripcion(servicio?.descripcion ?? "");
    setDuracionMinutos(String(servicio?.duracion_minutos ?? 30));
    setPrecio(
      servicio?.precio !== null && servicio?.precio !== undefined
        ? String(servicio.precio)
        : ""
    );
    setColor(servicio?.color ?? "#2563eb");
    setError(null);
  }, [open, servicio]);

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

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo guardar el servicio.";
        setError(message);
        toast.error("No se pudo guardar el servicio", { description: message });
        return;
      }

      setOpen(false);
      toast.success(esEditar ? "Servicio actualizado" : "Servicio creado");
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
          className="rounded-2xl"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="rounded-2xl">
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:!max-w-[calc(100vw-2rem)] xl:w-[58rem] xl:!max-w-[58rem]">
          <div className="max-h-[92dvh] overflow-y-auto overflow-x-hidden">
            <div className="grid min-w-0 xl:grid-cols-[20rem_minmax(0,1fr)]">
            <aside className="relative min-w-0 overflow-hidden border-b bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] p-4 text-white sm:p-5 xl:border-b-0 xl:border-r">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-white/70 to-teal-300" />

              <p className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50/90">
                <Sparkles className="h-3.5 w-3.5" />
                Vista previa
              </p>

              <div className="mt-4 rounded-[1.35rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-slate-950/20 sm:mt-6">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-4 w-4 shrink-0 rounded-full ring-4 ring-white/15"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <h3 className="break-words text-xl font-bold tracking-tight">
                      {nombrePreview}
                    </h3>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-cyan-50/82">
                      {descripcionPreview}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs text-cyan-50/75">Duración</p>
                    <p className="mt-1 font-bold">{duracionMinutos || 0} min</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-xs text-cyan-50/75">Precio</p>
                    <p className="mt-1 truncate font-bold">{formatPrecioPreview(precio)}</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-cyan-50/78">
                Este color ayuda a reconocer el servicio en agenda, reportes y reservas.
              </p>
            </aside>

            <div className="min-w-0 p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="pr-12 text-2xl leading-tight tracking-tight">
                  {esEditar ? "Editar servicio" : "Nuevo servicio"}
                </DialogTitle>
                <DialogDescription className="max-w-xl leading-6">
                  {esEditar
                    ? "Actualizá los datos que usa tu agenda y el link público."
                    : "Cargá una prestación con duración, precio y color de referencia."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del servicio</Label>
                  <div className="relative">
                    <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="nombre"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      placeholder="Ej: Corte de pelo, limpieza facial, consulta"
                      required
                      className="h-11 rounded-2xl pl-9"
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
                        className="h-11 rounded-2xl pl-9"
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
                        className="h-11 rounded-2xl pl-9"
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
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 ${
                            activo ? "border-foreground shadow-lg" : "border-border/70"
                          }`}
                          style={{ backgroundColor: colorItem }}
                          aria-label={`Elegir color ${colorItem}`}
                        >
                          {activo && <Check className="h-4 w-4 text-white" />}
                        </button>
                      );
                    })}

                    <div className="flex h-10 items-center gap-2 rounded-2xl border bg-background/70 px-3">
                      <span
                        className="h-5 w-5 rounded-xl border"
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
                      className="rounded-2xl pl-9"
                    />
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
                    className="rounded-2xl"
                  >
                    Cancelar
                  </Button>

                  <Button type="submit" disabled={loading} className="rounded-2xl">
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
