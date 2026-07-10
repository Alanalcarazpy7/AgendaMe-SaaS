"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  LinkIcon,
  MapPin,
  Phone,
  Store,
  UserRound,
} from "lucide-react";
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

type OnboardingNegocioFormProps = {
  correoConfirmado?: boolean;
};

function generarSlug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\u00f1/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OnboardingNegocioForm({
  correoConfirmado = false,
}: OnboardingNegocioFormProps) {
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
      setError("Ocurrio un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Configura tu negocio
        </CardTitle>
        <CardDescription>
          Estos datos crean tu espacio de AgendaMe con el plan gratis activo.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {correoConfirmado && (
          <Alert className="mb-5 border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="font-medium text-emerald-800 dark:text-emerald-200">
              Correo confirmado. Completa estos datos y vas a entrar al panel con tu plan gratis.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nombreResponsable">Tu nombre</Label>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <Input
                id="nombreResponsable"
                value={nombreResponsable}
                onChange={(event) => setNombreResponsable(event.target.value)}
                placeholder="Ej: Alan Silva"
                required
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del negocio</Label>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
              <Store className="h-4 w-4 text-muted-foreground" />
              <Input
                id="nombre"
                value={nombre}
                onChange={(event) => handleNombreChange(event.target.value)}
                placeholder="Ej: Barberia Central"
                required
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Link publico</Label>
            <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
              <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="shrink-0 text-sm text-muted-foreground">
                /reservar/
              </span>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(generarSlug(event.target.value))}
                placeholder="barberia-central"
                required
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo minusculas, numeros y guiones. Sin espacios ni acentos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rubro">Rubro</Label>
              <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
                <Store className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="rubro"
                  value={rubro}
                  onChange={(event) => setRubro(event.target.value)}
                  placeholder="Barberia, estetica..."
                  className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono / WhatsApp</Label>
              <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  placeholder="0981 000 000"
                  className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Direccion</Label>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                id="direccion"
                value={direccion}
                onChange={(event) => setDireccion(event.target.value)}
                placeholder="Ej: Asuncion, Paraguay"
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Conta brevemente que servicios ofrece tu negocio."
              rows={4}
              className="rounded-2xl bg-background/70"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="border-destructive/25 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-2xl font-bold"
            disabled={loading}
          >
            {loading ? "Creando negocio..." : "Crear mi negocio"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
