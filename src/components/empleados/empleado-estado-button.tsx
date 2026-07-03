"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type EmpleadoEstadoButtonProps = {
  empleadoId: string;
  estado: "activo" | "inactivo";
};

export function EmpleadoEstadoButton({
  empleadoId,
  estado,
}: EmpleadoEstadoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nuevoEstado = estado === "activo" ? "inactivo" : "activo";

  async function handleClick() {
    setLoading(true);

    try {
      await fetch(`/api/dashboard/empleados/${empleadoId}`, {
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