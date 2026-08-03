"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { LimiteRecursoContent } from "@/components/planes/limite-recurso-card";
import type { LimiteRecursoInfo } from "@/lib/planes/limite-recurso";

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
  limiteInfo?: LimiteRecursoInfo;
};

export function ClienteDialog({ cliente, variant, limiteInfo }: ClienteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const esEditar = variant === "editar";
  const limiteAlcanzado = !esEditar && Boolean(limiteInfo?.alcanzado);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [notasInternas, setNotasInternas] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    // Reset the form from the record selected by the parent on every opening.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        const message = data.error ?? "No se pudo guardar el cliente.";
        setError(message);
        toast.error("No se pudo guardar el cliente", { description: message });
        return;
      }

      setOpen(false);
      toast.success(esEditar ? "Cliente actualizado" : "Cliente creado");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado.");
      toast.error("No se pudo guardar el cliente");
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
      ) : limiteAlcanzado ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="rounded-2xl border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300"
        >
          <Lock className="h-4 w-4" />
          Actualizar plan
        </Button>
      ) : (
        <Button type="button" onClick={() => setOpen(true)} className="rounded-2xl">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        {limiteAlcanzado && limiteInfo ? (
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
            <LimiteRecursoContent info={limiteInfo} onCerrar={() => setOpen(false)} />
          </DialogContent>
        ) : (
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
                placeholder="Nombre y apellido del cliente"
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
                  placeholder="09XX XXX XXX"
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
        )}
      </Dialog>
    </>
  );
}
