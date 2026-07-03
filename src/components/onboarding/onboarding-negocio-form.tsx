"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function generarSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OnboardingNegocioForm() {
  const router = useRouter();

  const [nombreResponsable, setNombreResponsable] = useState("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [rubro, setRubro] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNombreChange(value: string) {
    setNombre(value);
    setSlug(generarSlug(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/negocio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreResponsable,
          nombre,
          slug,
          rubro,
          telefono,
          direccion,
          descripcion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear el negocio.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configurá tu negocio</CardTitle>
        <CardDescription>
          Estos datos serán la base de tu agenda online.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nombreResponsable">Tu nombre</Label>
            <Input
              id="nombreResponsable"
              value={nombreResponsable}
              onChange={(event) => setNombreResponsable(event.target.value)}
              placeholder="Ej: Alan Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del negocio</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(event) => handleNombreChange(event.target.value)}
              placeholder="Ej: Barbería Central"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Link público</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                /reservar/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(generarSlug(event.target.value))}
                placeholder="barberia-central"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo minúsculas, números y guiones. Sin espacios ni acentos.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rubro">Rubro</Label>
            <Input
              id="rubro"
              value={rubro}
              onChange={(event) => setRubro(event.target.value)}
              placeholder="Ej: Barbería, Odontología, Estética"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono / WhatsApp</Label>
            <Input
              id="telefono"
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              placeholder="Ej: 0981 000 000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={direccion}
              onChange={(event) => setDireccion(event.target.value)}
              placeholder="Ej: Asunción, Paraguay"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Contá brevemente qué servicios ofrece tu negocio."
              rows={4}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando negocio..." : "Crear mi negocio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
