"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type SolicitarPlanButtonProps = {
  planClave: string;
  planActual: boolean;
};

export function SolicitarPlanButton({
  planClave,
  planActual,
}: SolicitarPlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function solicitar() {
    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/planes/solicitudes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planClave,
          mensaje: "Solicitud desde página interna de planes.",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo solicitar el cambio.");
        return;
      }

      setMensaje("Solicitud registrada.");

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("No se pudo solicitar el cambio.");
    } finally {
      setLoading(false);
    }
  }

  if (planActual) {
    return (
      <Button disabled className="w-full">
        Plan actual
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" className="w-full" onClick={solicitar} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Solicitar cambio
      </Button>

      {mensaje && <p className="text-xs text-green-700">{mensaje}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}