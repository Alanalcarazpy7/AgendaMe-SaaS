"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      await fetch(`/api/dashboard/servicios/${servicioId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: nuevoEstado,
        }),
      });

      router.refresh();
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
      {loading
        ? "Actualizando..."
        : estado === "activo"
          ? "Inactivar"
          : "Activar"}
    </Button>
  );
}