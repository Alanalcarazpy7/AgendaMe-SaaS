"use client";

import { useState } from "react";
import { BriefcaseBusiness, Loader2, MoveRight } from "lucide-react";

type Sucursal = {
  id: string;
  nombre: string;
  estado: string;
};

type Empleado = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  estado: string;
  sucursal_id: string | null;
  sucursales:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

type SucursalEmpleadosPanelProps = {
  sucursales: Sucursal[];
  initialEmpleados: Empleado[];
};

function nombreSucursal(empleado: Empleado) {
  const sucursal = Array.isArray(empleado.sucursales)
    ? empleado.sucursales[0]
    : empleado.sucursales;

  return sucursal?.nombre ?? "Sin sucursal";
}

export function SucursalEmpleadosPanel({
  sucursales,
  initialEmpleados,
}: SucursalEmpleadosPanelProps) {
  const [empleados, setEmpleados] = useState(initialEmpleados);
  const [empleadoId, setEmpleadoId] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const sucursalesActivas = sucursales.filter(
    (sucursal) => sucursal.estado === "activo"
  );

  async function cargar() {
    const response = await fetch("/api/dashboard/sucursales/empleados");
    const data = await response.json();

    if (response.ok) {
      setEmpleados(data.empleados ?? []);
    }
  }

  async function asignar() {
    try {
      setLoading(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/sucursales/empleados", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empleadoId,
          sucursalId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo asignar el empleado.");
        return;
      }

      setMensaje(data.message ?? "Empleado asignado correctamente.");
      setEmpleadoId("");
      setSucursalId("");
      await cargar();
    } catch {
      setError("No se pudo asignar el empleado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border bg-background p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Asignar empleados reales a sucursales</h2>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Seleccioná empleados ya creados en la sección Empleados y asignales una sucursal. Para que aparezcan horarios en la reserva pública, el empleado debe tener servicios y horarios configurados.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label className="text-sm font-medium">Empleado</label>
          <select
            value={empleadoId}
            onChange={(event) => setEmpleadoId(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          >
            <option value="">Seleccionar empleado</option>
            {empleados.map((empleado) => (
              <option key={empleado.id} value={empleado.id}>
                {empleado.nombre} · {nombreSucursal(empleado)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Sucursal</label>
          <select
            value={sucursalId}
            onChange={(event) => setSucursalId(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          >
            <option value="">Seleccionar sucursal</option>
            {sucursalesActivas.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={asignar}
          disabled={loading || !empleadoId || !sucursalId}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MoveRight className="mr-2 h-4 w-4" />
          )}
          Asignar
        </button>
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
        {empleados.length === 0 ? (
          <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Todavía no hay empleados cargados.
          </p>
        ) : (
          empleados.map((empleado) => (
            <div
              key={empleado.id}
              className="flex flex-col gap-2 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold">{empleado.nombre}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {empleado.email || "Sin email"} · {empleado.telefono || "Sin teléfono"}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm font-medium">{nombreSucursal(empleado)}</p>
                <p className="text-xs text-muted-foreground">{empleado.estado}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}