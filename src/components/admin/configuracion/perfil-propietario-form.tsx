"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PerfilPropietario } from "@/lib/admin/queries/perfil-propietario";
import { editarPerfilPropietarioAction } from "@/lib/admin/actions/perfil";

type Props = {
  perfil: PerfilPropietario;
};

const selectClass =
  "h-9 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

const TEMAS: { value: PerfilPropietario["tema"]; label: string }[] = [
  { value: "sistema", label: "Automático (según el sistema)" },
  { value: "claro", label: "Claro" },
  { value: "oscuro", label: "Oscuro" },
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
        toast.success("Preferencias guardadas.");
        // Aplica el tema de inmediato sin esperar a recargar la página.
        const root = document.documentElement;
        if (tema === "oscuro") root.classList.add("dark");
        else if (tema === "claro") root.classList.remove("dark");
        else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          root.classList.toggle("dark", prefersDark);
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-2xl border p-4">
      <div className="grid gap-1.5">
        <Label htmlFor="perfil-email">Email</Label>
        <Input id="perfil-email" value={perfil.email ?? ""} disabled />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="perfil-nombre">Nombre</Label>
        <Input id="perfil-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="perfil-avatar">URL de foto/logo (opcional)</Label>
        <Input
          id="perfil-avatar"
          type="url"
          placeholder="https://..."
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="perfil-tema">Tema</Label>
        <select
          id="perfil-tema"
          className={selectClass}
          value={tema}
          onChange={(e) => setTema(e.target.value as PerfilPropietario["tema"])}
        >
          {TEMAS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="button" onClick={guardar} disabled={pending || !nombre.trim()} className="self-start">
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
