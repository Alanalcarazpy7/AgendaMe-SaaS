"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Filter, Loader2, RefreshCw } from "lucide-react";

type Sucursal = {
  id: string;
  nombre: string;
  estado: string;
};

type ExportarPanelProps = {
  puedeExportarServicios: boolean;
  puedeFiltrarSucursal: boolean;
  sucursales: Sucursal[];
  scopeLabel: string;
};

type PreviewData = {
  titulo: string;
  columnas: string[];
  filas: Array<Array<string | number | null>>;
  total: number;
};

function fechaHoy() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function inicioMes() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

const descripcionPorTipo: Record<string, string> = {
  citas:
    "Vista de agenda con fechas, estados, precios, cliente, servicio, empleado y sucursal.",
  clientes:
    "Listado de clientes visibles según la vista actual o la sucursal seleccionada.",
  empleados:
    "Listado de empleados con datos básicos y sucursal asignada.",
  servicios:
    "Catálogo global de servicios del negocio. Solo disponible para admin global.",
};

export function ExportarPanel({
  puedeExportarServicios,
  puedeFiltrarSucursal,
  sucursales,
  scopeLabel,
}: ExportarPanelProps) {
  const [tipo, setTipo] = useState("citas");
  const [desde, setDesde] = useState(inicioMes());
  const [hasta, setHasta] = useState(fechaHoy());
  const [sucursalId, setSucursalId] = useState("todas");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState("");

  const tiposDisponibles = useMemo(() => {
    const base = [
      {
        id: "citas",
        nombre: "Citas",
      },
      {
        id: "clientes",
        nombre: "Clientes",
      },
      {
        id: "empleados",
        nombre: "Empleados",
      },
    ];

    if (puedeExportarServicios) {
      base.push({
        id: "servicios",
        nombre: "Servicios",
      });
    }

    return base;
  }, [puedeExportarServicios]);

  function buildParams(formato: "json" | "xlsx") {
    const params = new URLSearchParams();
    params.set("tipo", tipo);
    params.set("formato", formato);

    if (tipo === "citas") {
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
    }

    if (puedeFiltrarSucursal) {
      params.set("sucursalId", sucursalId);
    }

    return params;
  }

  async function cargarVistaPrevia() {
    try {
      setLoadingPreview(true);
      setError("");

      const params = buildParams("json");

      const response = await fetch(`/api/dashboard/exportar?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo cargar la vista previa.");
        setPreview(null);
        return;
      }

      setPreview(data);
    } catch {
      setError("No se pudo cargar la vista previa.");
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  function descargarXlsx() {
    const params = buildParams("xlsx");
    window.location.href = `/api/dashboard/exportar?${params.toString()}`;
  }

  useEffect(() => {
    cargarVistaPrevia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, desde, hasta, sucursalId]);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Exportación de datos</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Exportar a Excel
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Revisá exactamente qué datos se van a exportar y descargalos en formato XLSX con columnas y anchos preparados para Excel.
        </p>
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Filtros</h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium">Qué querés exportar</label>
            <select
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            >
              {tiposDisponibles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          {tipo === "citas" && (
            <>
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
            </>
          )}

          {puedeFiltrarSucursal && (
            <div>
              <label className="text-sm font-medium">Sucursal</label>
              <select
                value={sucursalId}
                onChange={(event) => setSucursalId(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
              >
                <option value="todas">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={cargarVistaPrevia}
            disabled={loadingPreview}
            className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
          >
            {loadingPreview ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualizar vista previa
          </button>

          <button
            type="button"
            onClick={descargarXlsx}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar XLSX
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
          <div className="border-b p-5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-bold">Vista previa</h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Estos son los mismos datos que se descargarán en Excel.
            </p>
          </div>

          {loadingPreview ? (
            <div className="flex items-center p-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando datos...
            </div>
          ) : !preview ? (
            <div className="p-6 text-sm text-muted-foreground">
              Todavía no hay vista previa.
            </div>
          ) : preview.filas.length === 0 ? (
            <div className="p-6">
              <p className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                No hay datos para los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    {preview.columnas.map((columna) => (
                      <th key={columna} className="whitespace-nowrap px-4 py-3 font-bold">
                        {columna}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {preview.filas.map((fila, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {fila.map((celda, cellIndex) => (
                        <td key={cellIndex} className="max-w-[280px] px-4 py-3 align-top">
                          <span className="line-clamp-3">
                            {formatCell(celda)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl border bg-background p-5 shadow-sm">
          <h2 className="text-xl font-bold">Resumen</h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-muted-foreground">Vista actual</p>
              <p className="mt-1 font-bold">{scopeLabel}</p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-muted-foreground">Tipo</p>
              <p className="mt-1 font-bold">
                {tiposDisponibles.find((item) => item.id === tipo)?.nombre}
              </p>
            </div>

            {tipo === "citas" && (
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground">Rango</p>
                <p className="mt-1 font-bold">
                  {desde || "Sin inicio"} → {hasta || "Sin fin"}
                </p>
              </div>
            )}

            {puedeFiltrarSucursal && (
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground">Sucursal</p>
                <p className="mt-1 font-bold">
                  {sucursalId === "todas"
                    ? "Todas las sucursales"
                    : sucursales.find((sucursal) => sucursal.id === sucursalId)
                        ?.nombre ?? "Sucursal"}
                </p>
              </div>
            )}

            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-muted-foreground">Registros</p>
              <p className="mt-1 text-2xl font-bold">{preview?.total ?? 0}</p>
            </div>
          </div>

          <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-xs text-green-800">
            El archivo se descarga como XLSX real, con encabezados, filtros y columnas ajustadas para Excel.
          </p>

          <p className="mt-3 text-sm text-muted-foreground">
            {descripcionPorTipo[tipo]}
          </p>
        </div>
      </section>
    </div>
  );
}