"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type SolicitarPlanButtonProps = {
  planClave: string;
  planNombre: string;
  planActual: boolean;
};

export function SolicitarPlanButton({
  planClave,
  planNombre,
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
          mensaje: `El negocio solicita cambiar al plan ${planNombre} desde su panel.`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo solicitar el cambio.";
        setError(message);
        toast.error("No se pudo solicitar el cambio", { description: message });
        return;
      }

      setMensaje(`Solicitud enviada: ${planNombre}. Te contactaremos para coordinar el pago y activacion.`);
      toast.success("Solicitud enviada", {
        description: `${planNombre} quedó pendiente de revisión.`,
      });

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("No se pudo solicitar el cambio.");
      toast.error("No se pudo solicitar el cambio");
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
        Solicitar este plan
      </Button>

      {mensaje && <p className="text-xs text-green-700">{mensaje}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
