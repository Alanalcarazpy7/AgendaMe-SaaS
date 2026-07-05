"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Power, ShieldCheck } from "lucide-react";

type Sucursal = {
  id: string;
  nombre: string;
  estado: string;
};

type AccesoSucursal = {
  id: string;
  sucursal_id: string;
  email: string;
  rol: string;
  activo: boolean;
  created_at: string;
  sucursales:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

type SucursalUsuariosPanelProps = {
  sucursales: Sucursal[];
  initialAccesos: AccesoSucursal[];
};

const emptyForm = {
  id: "",
  sucursal_id: "",
  email: "",
  rol: "gerente_sucursal",
  activo: true,
};

function nombreSucursal(acceso: AccesoSucursal) {
  const sucursal = Array.isArray(acceso.sucursales)
    ? acceso.sucursales[0]
    : acceso.sucursales;

  return sucursal?.nombre ?? "Sucursal";
}

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    gerente_sucursal: "Gerente",
    recepcionista_sucursal: "Recepcionista",
    empleado_sucursal: "Personal de sucursal",
  };

  return labels[rol] ?? rol;
}

export function SucursalUsuariosPanel({
  sucursales,
  initialAccesos,
}: SucursalUsuariosPanelProps) {
  const [accesos, setAccesos] = useState(initialAccesos);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const editando = Boolean(form.id);
  const sucursalesActivas = sucursales.filter((sucursal) => sucursal.estado === "activo");

  async function cargar() {
    const response = await fetch("/api/dashboard/sucursales/usuarios");
    const data = await response.json();

    if (response.ok) {
      setAccesos(data.accesos ?? []);
    }
  }

  async function guardar() {
    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/sucursales/usuarios", {
        method: editando ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el acceso.");
        return;
      }

      setMensaje(data.message ?? "Acceso guardado correctamente.");
      setForm(emptyForm);
      await cargar();
    } catch {
      setError("No se pudo guardar el acceso.");
    } finally {
      setLoading(false);
    }
  }

  async function desactivar(id: string) {
    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/sucursales/usuarios", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo desactivar el acceso.");
        return;
      }

      setMensaje(data.message ?? "Acceso desactivado.");
      await cargar();
    } catch {
      setError("No se pudo desactivar el acceso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-background p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Usuarios con acceso al dashboard</h2>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Asigná correos para que puedan entrar al dashboard de una sucursal. Esto NO crea empleados que atienden citas; los empleados reales se crean en la sección Empleados.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium">Sucursal</label>
          <select
            value={form.sucursal_id}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, sucursal_id: event.target.value }))
            }
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          >
            <option value="">Seleccionar</option>
            {sucursalesActivas.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Email del usuario</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            placeholder="usuario@email.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Rol</label>
          <select
            value={form.rol}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, rol: event.target.value }))
            }
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          >
            <option value="gerente_sucursal">Gerente</option>
            <option value="recepcionista_sucursal">Recepcionista</option>
            <option value="empleado_sucursal">Personal de sucursal</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Estado</label>
          <select
            value={form.activo ? "activo" : "inactivo"}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                activo: event.target.value === "activo",
              }))
            }
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
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
          {editando ? "Guardar acceso" : "Crear acceso"}
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

      <div className="mt-6 space-y-3">
        {accesos.length === 0 ? (
          <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Todavía no agregaste accesos por sucursal.
          </p>
        ) : (
          accesos.map((acceso) => (
            <div
              key={acceso.id}
              className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-bold">{acceso.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {nombreSucursal(acceso)} · {rolLabel(acceso.rol)}
                </p>
                <span className="mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium">
                  {acceso.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      id: acceso.id,
                      sucursal_id: acceso.sucursal_id,
                      email: acceso.email,
                      rol: acceso.rol,
                      activo: acceso.activo,
                    })
                  }
                  className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </button>

                {acceso.activo && (
                  <button
                    type="button"
                    onClick={() => desactivar(acceso.id)}
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
  );
}