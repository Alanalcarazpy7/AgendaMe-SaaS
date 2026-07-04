"use client";

import { useState } from "react";
import { Building2, Loader2, Pencil, Plus, Power, Star } from "lucide-react";

type Sucursal = {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  estado: string;
  es_principal: boolean;
  created_at: string;
};

type SucursalesPanelProps = {
  initialSucursales: Sucursal[];
};

const emptyForm = {
  id: "",
  nombre: "",
  direccion: "",
  telefono: "",
  estado: "activo",
  es_principal: false,
};

export function SucursalesPanel({ initialSucursales }: SucursalesPanelProps) {
  const [sucursales, setSucursales] = useState(initialSucursales);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const editando = Boolean(form.id);

  async function cargar() {
    const response = await fetch("/api/dashboard/sucursales");
    const data = await response.json();

    if (response.ok) {
      setSucursales(data.sucursales ?? []);
    }
  }

  async function guardar() {
    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/sucursales", {
        method: editando ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }

      setMensaje(data.message ?? "Guardado correctamente.");
      setForm(emptyForm);
      await cargar();
    } catch {
      setError("No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  async function desactivar(id: string) {
    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/sucursales", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo desactivar.");
        return;
      }

      setMensaje(data.message ?? "Sucursal desactivada.");
      await cargar();
    } catch {
      setError("No se pudo desactivar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Plan Empresarial</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Sucursales
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestioná varias ubicaciones del mismo negocio. Todos los negocios tienen una sucursal principal interna.
        </p>
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">
            {editando ? "Editar sucursal" : "Nueva sucursal"}
          </h2>
        </div>

        {form.es_principal && (
          <p className="mt-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            Estás editando la sucursal principal. Podés cambiar nombre, dirección o teléfono, pero no desactivarla.
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <input
              value={form.nombre}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nombre: event.target.value }))
              }
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              placeholder="Casa central"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Dirección</label>
            <input
              value={form.direccion}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, direccion: event.target.value }))
              }
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              placeholder="Dirección"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Teléfono</label>
            <input
              value={form.telefono}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, telefono: event.target.value }))
              }
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              placeholder="0981..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Estado</label>
            <select
              value={form.estado}
              disabled={form.es_principal}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, estado: event.target.value }))
              }
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {editando ? "Guardar cambios" : "Crear sucursal"}
          </button>

          {editando && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted"
            >
              Cancelar
            </button>
          )}
        </div>

        {mensaje && (
          <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {mensaje}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <h2 className="text-xl font-bold">Sucursales registradas</h2>

        <div className="mt-4 space-y-3">
          {sucursales.length === 0 ? (
            <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              Todavía no registraste sucursales.
            </p>
          ) : (
            sucursales.map((sucursal) => (
              <div
                key={sucursal.id}
                className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{sucursal.nombre}</p>

                    {sucursal.es_principal && (
                      <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                        <Star className="mr-1 h-3 w-3" />
                        Principal
                      </span>
                    )}

                    <span className="inline-flex rounded-full border px-3 py-1 text-xs font-medium">
                      {sucursal.estado}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {sucursal.direccion || "Sin dirección"} ·{" "}
                    {sucursal.telefono || "Sin teléfono"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        id: sucursal.id,
                        nombre: sucursal.nombre,
                        direccion: sucursal.direccion ?? "",
                        telefono: sucursal.telefono ?? "",
                        estado: sucursal.estado,
                        es_principal: sucursal.es_principal,
                      })
                    }
                    className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </button>

                  {!sucursal.es_principal && sucursal.estado === "activo" && (
                    <button
                      type="button"
                      onClick={() => desactivar(sucursal.id)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted"
                    >
                      <Power className="mr-2 h-4 w-4" />
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}