"use client";

import { useMemo, useState } from "react";
import { Loader2, Save, UserRoundCog } from "lucide-react";

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
  const sucursalesSafe = sucursales ?? initialSucursales ?? [];
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
        setError(data.error ?? "No se pudo asignar el empleado a la sucursal.");
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
    } catch {
      setError("No se pudo asignar el empleado a la sucursal.");
    } finally {
      setLoadingId("");
    }
  }

  return (
    <section className="rounded-3xl border bg-background p-5 shadow-sm">
      <div>
        <p className="text-sm text-muted-foreground">
          Sucursal del empleado
        </p>

        <h2 className="mt-1 text-2xl font-bold">
          Asignar sucursal a empleados
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Seleccioná empleados ya creados en la sección Empleados y asignales una
          sucursal. Para que aparezcan en la reserva pública, también deben tener
          servicios y horarios configurados.
        </p>
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
        <div className="mt-5 overflow-hidden rounded-3xl border">
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
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
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
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            empleado.estado === "activo"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
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
                          className="h-10 w-full rounded-xl border bg-background px-3"
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
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
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