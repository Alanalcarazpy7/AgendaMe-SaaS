"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ClienteForm() {
  const router = useRouter();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [notasInternas, setNotasInternas] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setOk(null);

    try {
      const response = await fetch("/api/dashboard/clientes", {
        method: "POST",
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
        const message = data.error ?? "No se pudo crear el cliente.";
        setError(message);
        toast.error("No se pudo crear el cliente", { description: message });
        return;
      }

      setNombreCompleto("");
      setTelefono("");
      setEmail("");
      setDocumento("");
      setNotasInternas("");
      setOk("Cliente creado correctamente.");
      toast.success("Cliente creado correctamente");

      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado.");
      toast.error("No se pudo crear el cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo cliente</CardTitle>
      </CardHeader>

      <CardContent>
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

          {ok && (
            <Alert>
              <AlertDescription>{ok}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? "Guardando..." : "Crear cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
