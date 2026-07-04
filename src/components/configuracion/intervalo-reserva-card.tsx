"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPCIONES_INTERVALO = Array.from({ length: 24 }, (_, index) => {
  return (index + 1) * 5;
});

export function IntervaloReservaCard() {
  const [intervalo, setIntervalo] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargarConfiguracion() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/dashboard/negocio/intervalo-reserva");
        const data = await response.json();

        if (cancelado) return;

        if (!response.ok) {
          setError(data.error ?? "No se pudo cargar la configuración.");
          return;
        }

        setIntervalo(String(data.intervaloReservaMinutos ?? 30));
      } catch {
        if (!cancelado) {
          setError("No se pudo cargar la configuración.");
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    cargarConfiguracion();

    return () => {
      cancelado = true;
    };
  }, []);

  async function guardar() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/dashboard/negocio/intervalo-reserva", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intervaloReservaMinutos: Number(intervalo),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el intervalo.");
        return;
      }

      setIntervalo(String(data.intervaloReservaMinutos));
      setSuccess("Intervalo actualizado correctamente.");

      window.setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch {
      setError("No se pudo guardar el intervalo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Intervalo de reservas</h2>
          </div>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Definí cada cuánto se muestran los horarios disponibles en el link
            público de reservas. Esto no cambia la duración de los servicios:
            solo controla los bloques visibles para el cliente.
          </p>
        </div>

        {success && (
          <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Guardado
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[280px_1fr] sm:items-end">
        <div>
          <label className="text-sm font-medium">
            Mostrar horarios cada
          </label>

          <select
            value={intervalo}
            onChange={(event) => setIntervalo(event.target.value)}
            disabled={loading || saving}
            className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {OPCIONES_INTERVALO.map((opcion) => (
              <option key={opcion} value={opcion}>
                Cada {opcion} minutos
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          Ejemplo: si elegís <strong>20 minutos</strong>, el cliente verá
          horarios como 08:00, 08:20, 08:40, 09:00. Si un servicio dura 50
          minutos, igual bloqueará 50 minutos reales en la agenda.
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          onClick={guardar}
          disabled={loading || saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar intervalo
        </Button>
      </div>
    </section>
  );
}