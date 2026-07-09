"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
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

export type ClienteItem = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  documento: string | null;
  notas_internas: string | null;
  estado: "activo" | "inactivo";
  created_at: string;
};

type ClienteDialogProps = {
  cliente?: ClienteItem;
  variant: "crear" | "editar";
};

export function ClienteDialog({ cliente, variant }: ClienteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [notasInternas, setNotasInternas] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEditar = variant === "editar";

  useEffect(() => {
    if (!open) return;

    setNombreCompleto(cliente?.nombre_completo ?? "");
    setTelefono(cliente?.telefono ?? "");
    setEmail(cliente?.email ?? "");
    setDocumento(cliente?.documento ?? "");
    setNotasInternas(cliente?.notas_internas ?? "");
    setError(null);
  }, [open, cliente]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const url = esEditar
        ? `/api/dashboard/clientes/${cliente?.id}`
        : "/api/dashboard/clientes";

      const method = esEditar ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreCompleto,
          telefono,
          email,
          documento,
          notasInternas,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el cliente.");
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
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="rounded-2xl">
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="rounded-2xl">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{esEditar ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>
              {esEditar
                ? "Actualizá los datos del cliente."
                : "Cargá los datos básicos del cliente."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombreCompleto">Nombre completo</Label>
              <Input
                id="nombreCompleto"
                value={nombreCompleto}
                onChange={(event) => setNombreCompleto(event.target.value)}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  placeholder="Ej: 0981 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="cliente@correo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  value={documento}
                  onChange={(event) => setDocumento(event.target.value)}
                  placeholder="C.I. o RUC"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notasInternas">Notas internas</Label>
              <Textarea
                id="notasInternas"
                value={notasInternas}
                onChange={(event) => setNotasInternas(event.target.value)}
                placeholder="Observaciones internas del negocio."
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="rounded-2xl">
                Cancelar
              </Button>

              <Button type="submit" disabled={loading} className="rounded-2xl">
                {loading ? "Guardando..." : esEditar ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
