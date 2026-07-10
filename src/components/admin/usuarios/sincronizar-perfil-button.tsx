"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sincronizarPerfilUsuarioAction } from "@/lib/admin/actions/usuarios";

type Props = {
  usuarioId: string;
  email: string | null;
  nombre: string | null;
};

export function SincronizarPerfilButton({ usuarioId, email, nombre }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function sincronizar() {
    startTransition(async () => {
      const result = await sincronizarPerfilUsuarioAction({ usuarioId, email, nombre });

      if (!result.ok) {
        toast.error("No se pudo crear el perfil", {
          description: result.error,
        });
        return;
      }

      toast.success("Perfil creado", {
        description: "La cuenta ya tiene una ficha operativa base.",
      });
      if (result.auditWarning) toast.warning("Auditoria incompleta", { description: result.auditWarning });
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl" onClick={sincronizar} disabled={pending}>
      <RefreshCcw className={`mr-1.5 h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
      Crear perfil
    </Button>
  );
}
