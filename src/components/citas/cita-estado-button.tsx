"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      await fetch(`/api/dashboard/citas/${citaId}`, {
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
      {loading ? "..." : label}
    </Button>
  );
}