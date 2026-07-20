"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  X,
} from "lucide-react";

type Sucursal = {
  id: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  estado?: string;
  es_principal?: boolean;
  created_at?: string;
};

type Props = {
  sucursales?: Sucursal[];
  initialSucursales?: Sucursal[];
};

function estadoBadge(estado?: string) {
  if (estado === "activo") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export function SucursalesPanel({ sucursales, initialSucursales }: Props) {
  const [items, setItems] = useState<Sucursal[]>(sucursales ?? initialSucursales ?? []);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function refrescar() {
    const response = await fetch("/api/dashboard/sucursales");
    const data = await response.json();

    if (response.ok) {
      setItems(data.sucursales ?? []);
    }
  }

  async function crearSucursal() {
    try {
      setLoading("crear");
      setError("");

      const response = await fetch("/api/dashboard/sucursales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          direccion,
          telefono,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo crear la sucursal.";
        setError(message);
        toast.error("No se pudo crear la sucursal", { description: message });
        return;
      }

      setNombre("");
      setDireccion("");
      setTelefono("");

      toast.success("Sucursal creada correctamente");
      await refrescar();
    } catch {
      setError("No se pudo crear la sucursal.");
      toast.error("No se pudo crear la sucursal");
    } finally {
      setLoading("");
    }
  }

  function iniciarEdicion(sucursal: Sucursal) {
    setEditandoId(sucursal.id);
    setEditNombre(sucursal.nombre ?? "");
    setEditDireccion(sucursal.direccion ?? "");
    setEditTelefono(sucursal.telefono ?? "");
    setError("");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditNombre("");
    setEditDireccion("");
    setEditTelefono("");
  }

  async function guardarEdicion(sucursal: Sucursal) {
    try {
      setLoading(`${sucursal.id}-guardar`);
      setError("");

      const response = await fetch("/api/dashboard/sucursales", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: sucursal.id,
          nombre: editNombre,
          direccion: editDireccion,
          telefono: editTelefono,
          estado: sucursal.estado ?? "activo",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo actualizar la sucursal.";
        setError(message);
        toast.error("No se pudo actualizar la sucursal", {
          description: message,
        });
        return;
      }

      cancelarEdicion();
      toast.success("Sucursal actualizada correctamente");
      await refrescar();
    } catch {
      setError("No se pudo actualizar la sucursal.");
      toast.error("No se pudo actualizar la sucursal");
    } finally {
      setLoading("");
    }
  }

  async function cambiarEstado(sucursal: Sucursal) {
    if (sucursal.es_principal) {
      setError("La sucursal principal no se puede desactivar.");
      toast.error("La sucursal principal no se puede desactivar");
      return;
    }

    const nuevoEstado = sucursal.estado === "activo" ? "inactivo" : "activo";

    try {
      setLoading(`${sucursal.id}-estado`);
      setError("");

      const response = await fetch("/api/dashboard/sucursales", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: sucursal.id,
          nombre: sucursal.nombre,
          direccion: sucursal.direccion,
          telefono: sucursal.telefono,
          estado: nuevoEstado,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo cambiar el estado.";
        setError(message);
        toast.error("No se pudo cambiar el estado", { description: message });
        return;
      }

      toast.success(
        nuevoEstado === "activo" ? "Sucursal activada" : "Sucursal desactivada"
      );
      await refrescar();
    } catch {
      setError("No se pudo cambiar el estado.");
      toast.error("No se pudo cambiar el estado");
    } finally {
      setLoading("");
    }
  }

  return (
    <section className="rounded-3xl border bg-background p-5 shadow-sm">
      <div>
        <p className="text-sm text-muted-foreground">Ubicaciones del negocio</p>

        <h2 className="mt-1 text-2xl font-bold">
          Sucursales
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Creá y administrá las ubicaciones del negocio. Todos los negocios tienen
          una sucursal principal interna; en el Plan Empresarial podés agregar más
          sucursales y separar agenda, clientes, reportes y accesos.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3 rounded-3xl border bg-muted/20 p-4 lg:grid-cols-[1fr_1.2fr_1fr_auto]">
        <div>
          <label className="text-sm font-medium">Nombre</label>
          <input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            placeholder="Sucursal Centro"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Dirección</label>
          <input
            value={direccion}
            onChange={(event) => setDireccion(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            placeholder="Dirección de la sucursal"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <input
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            placeholder="0981..."
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={crearSucursal}
            disabled={loading === "crear"}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {loading === "crear" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Crear
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            Todavía no hay sucursales cargadas.
          </p>
        ) : (
          items.map((sucursal) => {
            const editando = editandoId === sucursal.id;

            return (
              <article
                key={sucursal.id}
                className="rounded-3xl border bg-background p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      {editando ? (
                        <input
                          value={editNombre}
                          onChange={(event) => setEditNombre(event.target.value)}
                          className="h-10 w-full rounded-xl border bg-background px-3 text-sm font-semibold"
                        />
                      ) : (
                        <h3 className="truncate text-lg font-bold">
                          {sucursal.nombre}
                        </h3>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${estadoBadge(
                            sucursal.estado
                          )}`}
                        >
                          {sucursal.estado ?? "activo"}
                        </span>

                        {sucursal.es_principal && (
                          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Principal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {editando ? (
                      <input
                        value={editDireccion}
                        onChange={(event) => setEditDireccion(event.target.value)}
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        placeholder="Dirección"
                      />
                    ) : (
                      <span>{sucursal.direccion || "Sin dirección cargada"}</span>
                    )}
                  </div>

                  <div className="flex gap-2 text-muted-foreground">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                    {editando ? (
                      <input
                        value={editTelefono}
                        onChange={(event) => setEditTelefono(event.target.value)}
                        className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                        placeholder="Teléfono"
                      />
                    ) : (
                      <span>{sucursal.telefono || "Sin teléfono cargado"}</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {editando ? (
                    <>
                      <button
                        type="button"
                        onClick={() => guardarEdicion(sucursal)}
                        disabled={loading === `${sucursal.id}-guardar`}
                        className="inline-flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
                      >
                        {loading === `${sucursal.id}-guardar` ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar
                      </button>

                      <button
                        type="button"
                        onClick={cancelarEdicion}
                        className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold hover:bg-muted"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(sucursal)}
                        className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold hover:bg-muted"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </button>

                      {!sucursal.es_principal && (
                        <button
                          type="button"
                          onClick={() => cambiarEstado(sucursal)}
                          disabled={loading === `${sucursal.id}-estado`}
                          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60"
                        >
                          {loading === `${sucursal.id}-estado` && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {sucursal.estado === "activo"
                            ? "Desactivar"
                            : "Activar"}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
