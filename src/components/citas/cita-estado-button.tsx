"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CitaEstadoButtonProps = {
  citaId: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada" | "no_asistio";
  nuevoEstado: "pendiente" | "confirmada" | "cancelada" | "completada" | "no_asistio";
  label: string;
};

export function CitaEstadoButton({
  citaId,
  estado,
  nuevoEstado,
  label,
}: CitaEstadoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (estado === nuevoEstado) {
    return null;
  }

  async function handleClick() {
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/citas/${citaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? "No se pudo actualizar el estado de la cita.");
        return;
      }

      toast.success("Estado actualizado correctamente");
      router.refresh();
    } catch {
      toast.error("Ocurrió un error inesperado. Intentá de nuevo.");
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
    >
      {loading ? "..." : label}
    </Button>
  );
}