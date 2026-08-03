"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LimiteRecursoDialog } from "@/components/planes/limite-recurso-dialog";
import type { LimiteRecursoInfo } from "@/lib/planes/limite-recurso";

type EmpleadoEstadoButtonProps = {
  empleadoId: string;
  estado: "activo" | "inactivo";
  limiteInfo?: LimiteRecursoInfo;
};

export function EmpleadoEstadoButton({
  empleadoId,
  estado,
  limiteInfo,
}: EmpleadoEstadoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mostrarLimite, setMostrarLimite] = useState(false);

  const nuevoEstado = estado === "activo" ? "inactivo" : "activo";

  async function handleClick() {
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/empleados/${empleadoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (nuevoEstado === "activo" && response.status === 403 && limiteInfo) {
          setMostrarLimite(true);
          return;
        }

        toast.error("No se pudo actualizar el empleado", {
          description: data.error ?? "Intentá de nuevo en unos segundos.",
        });
        return;
      }

      toast.success(
        nuevoEstado === "activo" ? "Empleado activado" : "Empleado ocultado"
      );
      router.refresh();
    } catch {
      toast.error("No se pudo actualizar el empleado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className="rounded-2xl"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : estado === "activo" ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        {loading ? "Actualizando..." : estado === "activo" ? "Ocultar" : "Activar"}
      </Button>

      {limiteInfo && (
        <LimiteRecursoDialog
          open={mostrarLimite}
          onOpenChange={setMostrarLimite}
          info={limiteInfo}
        />
      )}
    </>
  );
}
