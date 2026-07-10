"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PerfilPropietario } from "@/lib/admin/queries/perfil-propietario";
import { editarPerfilPropietarioAction } from "@/lib/admin/actions/perfil";

type Props = {
  perfil: PerfilPropietario;
};

const selectClass =
  "h-11 w-full rounded-2xl border border-border/80 bg-background/70 px-3 text-sm font-semibold outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

const TEMAS: { value: PerfilPropietario["tema"]; label: string; description: string }[] = [
  { value: "sistema", label: "Sistema", description: "Respeta la preferencia del dispositivo." },
  { value: "claro", label: "Claro", description: "Mas limpio para uso diurno." },
  { value: "oscuro", label: "Oscuro", description: "Menos brillo para sesiones largas." },
];

export function PerfilPropietarioForm({ perfil }: Props) {
  const [nombre, setNombre] = useState(perfil.nombre ?? "");
  const [avatarUrl, setAvatarUrl] = useState(perfil.avatarUrl ?? "");
  const [tema, setTema] = useState<PerfilPropietario["tema"]>(perfil.tema);
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      const result = await editarPerfilPropietarioAction({ nombre, avatarUrl: avatarUrl || null, tema });
      if (result.ok) {
        toast.success("Preferencias guardadas", {
          description: "El panel ya usa tu nombre, foto y tema seleccionados.",
        });
        const root = document.documentElement;
        if (tema === "oscuro") root.classList.add("dark");
        else if (tema === "claro") root.classList.remove("dark");
        else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          root.classList.toggle("dark", prefersDark);
        }
      } else {
        toast.error("No se pudo guardar", {
          description: result.error,
        });
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-border/75 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 dark:bg-card/80 dark:ring-white/5">
      <div className="border-b border-border/70 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight">Perfil del panel</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Estos datos solo personalizan tu experiencia dentro del panel privado.
            </p>
          </div>
          <span className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/15">
            <Sparkles className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-2">
          <Label htmlFor="perfil-email">Email</Label>
          <Input id="perfil-email" value={perfil.email ?? ""} disabled className="h-11 rounded-2xl bg-muted/60" />
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="perfil-nombre">Nombre visible</Label>
            <Input
              id="perfil-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
              className="h-11 rounded-2xl"
              placeholder="Nombre del propietario"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="perfil-avatar">Foto o logo</Label>
            <Input
              id="perfil-avatar"
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="h-11 rounded-2xl"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="perfil-tema">Tema preferido</Label>
          <select id="perfil-tema" className={selectClass} value={tema} onChange={(e) => setTema(e.target.value as PerfilPropietario["tema"])}>
            {TEMAS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="grid gap-2 sm:grid-cols-3">
            {TEMAS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTema(t.value)}
                className={`rounded-2xl border p-3 text-left transition ${
                  tema === t.value ? "border-primary bg-primary/10 text-primary" : "bg-background/60 hover:bg-muted"
                }`}
              >
                <span className="block text-sm font-bold">{t.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-muted/35 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Los cambios se aplican al guardar y el tema se actualiza al instante.</p>
          <Button type="button" onClick={guardar} disabled={pending || !nombre.trim()} className="h-10 rounded-2xl">
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </section>
  );
}
