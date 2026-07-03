"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus } from "lucide-react";
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
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#111827",
];

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
        setError(data.error ?? "No se pudo guardar el servicio.");
        return;
      }

      setOpen(false);
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
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo servicio
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {esEditar ? "Editar servicio" : "Nuevo servicio"}
            </DialogTitle>
            <DialogDescription>
              {esEditar
                ? "Actualizá los datos del servicio."
                : "Cargá un servicio, tratamiento, atención o prestación que tu negocio ofrece."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del servicio</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ej: Consulta, atención, servicio o tratamiento"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duracionMinutos">Duración estimada</Label>
                <Input
                  id="duracionMinutos"
                  type="number"
                  min="5"
                  step="5"
                  value={duracionMinutos}
                  onChange={(event) => setDuracionMinutos(event.target.value)}
                  placeholder="Ej: 30"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  En minutos. Ejemplo: 30, 45, 60.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio">Precio</Label>
                <Input
                  id="precio"
                  type="number"
                  min="0"
                  step="1000"
                  value={precio}
                  onChange={(event) => setPrecio(event.target.value)}
                  placeholder="Ej: 50000"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Podés dejarlo vacío.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Color del servicio</Label>

              <div className="flex flex-wrap items-center gap-3">
                {coloresRapidos.map((colorItem) => {
                  const activo = colorItem.toLowerCase() === color.toLowerCase();

                  return (
                    <button
                      key={colorItem}
                      type="button"
                      onClick={() => setColor(colorItem)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition hover:scale-105"
                      style={{ backgroundColor: colorItem }}
                      aria-label={`Elegir color ${colorItem}`}
                    >
                      {activo && <Check className="h-4 w-4 text-white" />}
                    </button>
                  );
                })}

                <div className="flex items-center gap-2 rounded-full border px-3 py-2">
                  <span
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <Input
                    type="color"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-muted-foreground">
                    Personalizado
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Ej: Breve detalle de lo que incluye este servicio."
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={loading}>
                {loading
                  ? "Guardando..."
                  : esEditar
                    ? "Guardar cambios"
                    : "Crear servicio"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}