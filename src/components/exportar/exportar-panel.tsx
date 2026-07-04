"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function ExportarPanel() {
  const [tipo, setTipo] = useState("citas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("tipo", tipo);

      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const response = await fetch(`/api/dashboard/exportar?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "No se pudo exportar.");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${tipo}-agendame.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo exportar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Plan Profesional</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Exportar CSV
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Descargá citas, clientes, servicios o empleados para analizar tus datos fuera de AgendaMe.
        </p>
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium">Datos a exportar</label>
            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            >
              <option value="citas">Citas</option>
              <option value="clientes">Clientes</option>
              <option value="servicios">Servicios</option>
              <option value="empleados">Empleados</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={descargar}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Descargar
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}