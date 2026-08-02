"use client";

import { useState, type FormEvent } from "react";
import { ExternalLink, LoaderCircle, MapPin, Phone, Save, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InformacionNegocioCardProps = {
  negocio: {
    nombre: string;
    slug: string;
    estado: string;
    rol: string;
    telefono: string | null;
    direccion: string | null;
    descripcion: string | null;
  };
};

export function InformacionNegocioCard({ negocio }: InformacionNegocioCardProps) {
  const [telefono, setTelefono] = useState(negocio.telefono ?? "");
  const [direccion, setDireccion] = useState(negocio.direccion ?? "");
  const [descripcion, setDescripcion] = useState(negocio.descripcion ?? "");
  const [guardando, setGuardando] = useState(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);

    try {
      const response = await fetch("/api/dashboard/negocio/informacion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, direccion, descripcion }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        toast.error("No se guardaron los cambios", {
          description: data.error ?? "Revisá la información e intentá nuevamente.",
        });
        return;
      }

      toast.success("Información del negocio actualizada", {
        description: "Los cambios ya están visibles en el enlace de reservas.",
      });
    } catch {
      toast.error("No se guardaron los cambios", {
        description: "No pudimos conectar con el servidor. Intentá nuevamente.",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Store className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-bold">Información pública</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Estos datos aparecen en el enlace de reservas cuando los completás.
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm">
          <a href={`/reservar/${negocio.slug}`} target="_blank" rel="noreferrer">
            Ver página pública
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      <form onSubmit={guardar} className="p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="negocio-telefono">Teléfono o WhatsApp</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="negocio-telefono"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value.slice(0, 40))}
                placeholder="0981 234 567"
                inputMode="tel"
                autoComplete="tel"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="negocio-direccion">Ubicación</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="negocio-direccion"
                value={direccion}
                onChange={(event) => setDireccion(event.target.value.slice(0, 180))}
                placeholder="Ciudad o dirección"
                autoComplete="street-address"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="negocio-descripcion">Descripción del negocio</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{descripcion.length}/280</span>
          </div>
          <Textarea
            id="negocio-descripcion"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value.slice(0, 280))}
            placeholder="Contá brevemente qué ofrecés"
            rows={3}
            maxLength={280}
            className="resize-none leading-6"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Nombre: <strong className="text-foreground">{negocio.nombre}</strong> · Estado: {negocio.estado} · Rol: {negocio.rol}
          </p>
          <Button type="submit" disabled={guardando} className="sm:min-w-40">
            {guardando ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </section>
  );
}
