"use client";

import { useMemo, useState } from "react";
import { Loader2, Save, UserRoundCog } from "lucide-react";
import { toast } from "sonner";

type Sucursal = {
  id: string;
  nombre: string;
  estado?: string;
  es_principal?: boolean;
};

type Empleado = {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  estado?: string;
  sucursal_id?: string | null;
};

type Props = {
  sucursales?: Sucursal[];
  initialSucursales?: Sucursal[];
  empleados?: Empleado[];
  initialEmpleados?: Empleado[];
};

export function SucursalEmpleadosPanel({
  sucursales,
  initialSucursales,
  empleados,
  initialEmpleados,
}: Props) {
  const sucursalesSafe = useMemo(
    () => sucursales ?? initialSucursales ?? [],
    [initialSucursales, sucursales]
  );
  const [items, setItems] = useState<Empleado[]>(empleados ?? initialEmpleados ?? []);
  const [loadingId, setLoadingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sucursalesActivas = useMemo(() => {
    return sucursalesSafe.filter((sucursal) => sucursal.estado !== "inactivo");
  }, [sucursalesSafe]);

  function nombreSucursal(sucursalId?: string | null) {
    if (!sucursalId) return "Sin sucursal";

    return (
      sucursalesSafe.find((sucursal) => sucursal.id === sucursalId)?.nombre ??
      "Sucursal no encontrada"
    );
  }

  async function asignarSucursal(empleadoId: string, sucursalId: string) {
    try {
      setLoadingId(empleadoId);
      setError("");
      setSuccess("");

      const response = await fetch("/api/dashboard/sucursales/empleados", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empleado_id: empleadoId,
          sucursal_id: sucursalId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.error ?? "No se pudo asignar el empleado a la sucursal.";
        setError(message);
        toast.error("No se pudo guardar la asignación", {
          description: message,
        });
        return;
      }

      setItems((prev) =>
        prev.map((empleado) =>
          empleado.id === empleadoId
            ? {
                ...empleado,
                sucursal_id: sucursalId,
              }
            : empleado
        )
      );

      setSuccess("Empleado asignado correctamente.");
      toast.success("Sucursal del empleado actualizada");
    } catch {
      setError("No se pudo asignar el empleado a la sucursal.");
      toast.error("No se pudo guardar la asignación");
    } finally {
      setLoadingId("");
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
            Distribución del equipo
          </p>

          <h2 className="mt-1 text-lg font-bold">Sucursal de trabajo</h2>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Asigná cada empleado a una sede activa. Sus servicios y horarios se
            siguen administrando desde la pestaña Equipo.
          </p>
        </div>

        <span className="w-fit rounded-md bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
          {items.length} empleado{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </p>
      )}

      {sucursalesActivas.length === 0 ? (
        <p className="mt-5 rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground">
          Primero necesitás tener al menos una sucursal activa.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-5 rounded-2xl border bg-muted/30 p-5 text-sm text-muted-foreground">
          Todavía no hay empleados creados en la sección Empleados.
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-bold">Empleado de agenda</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold">Sucursal actual</th>
                  <th className="px-4 py-3 font-bold">Asignar a</th>
                  <th className="px-4 py-3 text-right font-bold">Acción</th>
                </tr>
              </thead>

              <tbody>
                {items.map((empleado) => {
                  const selectId = `sucursal-${empleado.id}`;
                  const disabled = loadingId === empleado.id;

                  return (
                    <tr key={empleado.id} className="border-t align-top">
                      <td className="px-4 py-4">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <UserRoundCog className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-semibold">{empleado.nombre}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {empleado.email || empleado.telefono || "Sin contacto cargado"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                            empleado.estado === "activo"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                          }`}
                        >
                          {empleado.estado ?? "activo"}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium">
                        {nombreSucursal(empleado.sucursal_id)}
                      </td>

                      <td className="px-4 py-4">
                        <select
                          id={selectId}
                          defaultValue={empleado.sucursal_id ?? sucursalesActivas[0]?.id ?? ""}
                          className="h-10 w-full rounded-md border bg-background px-3 outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                          disabled={disabled}
                        >
                          {sucursalesActivas.map((sucursal) => (
                            <option key={sucursal.id} value={sucursal.id}>
                              {sucursal.nombre}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              const select = document.getElementById(
                                selectId
                              ) as HTMLSelectElement | null;

                              const sucursalId = select?.value;

                              if (!sucursalId) {
                                setError("Seleccioná una sucursal.");
                                return;
                              }

                              asignarSucursal(empleado.id, sucursalId);
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
                          >
                            {disabled ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
