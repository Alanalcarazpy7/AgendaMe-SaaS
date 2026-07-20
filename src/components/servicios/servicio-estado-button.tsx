"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ServicioEstadoButtonProps = {
  servicioId: string;
  estado: "activo" | "inactivo";
};

export function ServicioEstadoButton({
  servicioId,
  estado,
}: ServicioEstadoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nuevoEstado = estado === "activo" ? "inactivo" : "activo";

  async function handleClick() {
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/servicios/${servicioId}`, {
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
        toast.error("No se pudo actualizar el servicio", {
          description: data.error ?? "Intentá de nuevo en unos segundos.",
        });
        return;
      }

      toast.success(
        nuevoEstado === "activo" ? "Servicio activado" : "Servicio ocultado"
      );
      router.refresh();
    } catch {
      toast.error("No se pudo actualizar el servicio");
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}
