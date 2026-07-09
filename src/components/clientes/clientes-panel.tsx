"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, UsersRound } from "lucide-react";
import { ClienteDialog, type ClienteItem } from "@/components/clientes/cliente-dialog";
import { ClienteEstadoButton } from "@/components/clientes/cliente-estado-button";
import { Input } from "@/components/ui/input";

type ClientesPanelProps = {
  clientes: ClienteItem[];
};

type EstadoFiltro = "todos" | "activo" | "inactivo";

const CLIENTES_PAGE_SIZE = 20;

function cardBase(extra = "") {
  return `rounded-[1.5rem] border border-border/80 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5 ${extra}`;
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const letras = partes.map((parte) => parte[0]).join("").toUpperCase();
  return letras || "CL";
}

export function ClientesPanel({ clientes }: ClientesPanelProps) {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [pagina, setPagina] = useState(1);

  const resumen = useMemo(() => {
    const activos = clientes.filter((cliente) => cliente.estado === "activo").length;
    const conTelefono = clientes.filter((cliente) => Boolean(cliente.telefono)).length;
    const conEmail = clientes.filter((cliente) => Boolean(cliente.email)).length;

    return {
      total: clientes.length,
      activos,
      inactivos: clientes.length - activos,
      conTelefono,
      conEmail,
    };
  }, [clientes]);

  const clientesFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const coincideEstado = estadoFiltro === "todos" || cliente.estado === estadoFiltro;
      const coincideBusqueda =
        !query ||
        cliente.nombre_completo.toLowerCase().includes(query) ||
        cliente.telefono?.toLowerCase().includes(query) ||
        cliente.email?.toLowerCase().includes(query) ||
        cliente.documento?.toLowerCase().includes(query) ||
        cliente.notas_internas?.toLowerCase().includes(query);

      return coincideEstado && coincideBusqueda;
    });
  }, [clientes, busqueda, estadoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / CLIENTES_PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desdeResultado =
    clientesFiltrados.length === 0 ? 0 : (paginaActual - 1) * CLIENTES_PAGE_SIZE + 1;
  const hastaResultado = Math.min(paginaActual * CLIENTES_PAGE_SIZE, clientesFiltrados.length);
  const clientesVisibles = clientesFiltrados.slice(
    (paginaActual - 1) * CLIENTES_PAGE_SIZE,
    paginaActual * CLIENTES_PAGE_SIZE
  );

  const filtros: { value: EstadoFiltro; label: string; count: number }[] = [
    { value: "todos", label: "Todos", count: resumen.total },
    { value: "activo", label: "Activos", count: resumen.activos },
    { value: "inactivo", label: "Inactivos", count: resumen.inactivos },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className={cardBase("overflow-hidden")}>
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <div className="relative p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-teal-500" />

            <p className="inline-flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <UsersRound className="h-3.5 w-3.5 text-primary" />
              Base de clientes
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance">Clientes</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Contactos, documentos y notas internas en una tabla rapida para operar sin scroll innecesario.
            </p>

            <div className="mt-5">
              <ClienteDialog variant="crear" />
            </div>
          </div>

          <aside className="border-t border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] p-4 text-white xl:border-l xl:border-t-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Total</p>
                <p className="mt-1 text-3xl font-bold">{resumen.total}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Activos</p>
                <p className="mt-1 text-3xl font-bold">{resumen.activos}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Con telefono</p>
                <p className="mt-1 text-2xl font-bold">{resumen.conTelefono}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Con correo</p>
                <p className="mt-1 text-2xl font-bold">{resumen.conEmail}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={cardBase("p-4")}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nombre, telefono, correo, documento o nota..."
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filtros.map((filtro) => {
              const activo = estadoFiltro === filtro.value;

              return (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => {
                    setEstadoFiltro(filtro.value);
                    setPagina(1);
                  }}
                  className={`inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 ${
                    activo
                      ? "border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "border-border/80 bg-background/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {filtro.label}
                  <span className={`rounded-xl px-2 py-0.5 text-xs ${activo ? "bg-white/20" : "bg-muted"}`}>
                    {filtro.count}
                  </span>
                </button>
              );
            })}
            {(busqueda || estadoFiltro !== "todos") && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setEstadoFiltro("todos");
                  setPagina(1);
                }}
                className="inline-flex h-10 items-center rounded-2xl border border-border/80 bg-background/70 px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </section>

      {clientes.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <UsersRound className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Todavia no hay clientes</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Carga clientes para reutilizarlos en reservas, citas y seguimiento.
          </p>
          <div className="mt-5 flex justify-center">
            <ClienteDialog variant="crear" />
          </div>
        </section>
      ) : clientesFiltrados.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <h2 className="text-xl font-bold tracking-tight">No encontramos clientes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Proba con otro texto o cambia el filtro de estado.
          </p>
        </section>
      ) : (
        <section className={cardBase("overflow-hidden")}>
          <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <strong className="text-foreground">
                {desdeResultado}-{hastaResultado}
              </strong>{" "}
              de <strong className="text-foreground">{clientesFiltrados.length}</strong> clientes
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina(Math.max(1, paginaActual - 1))}
                disabled={paginaActual <= 1}
                className="inline-flex h-9 items-center gap-1 rounded-2xl border bg-background/70 px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="rounded-2xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
                {paginaActual}/{totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual >= totalPaginas}
                className="inline-flex h-9 items-center gap-1 rounded-2xl border bg-background/70 px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-45"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Telefono</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Notas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/70">
                {clientesVisibles.map((cliente) => {
                  const activo = cliente.estado === "activo";

                  return (
                    <tr key={cliente.id} className="bg-card/40 transition-colors hover:bg-muted/35">
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                            {iniciales(cliente.nombre_completo)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{cliente.nombre_completo}</p>
                            <p className="truncate text-xs text-muted-foreground">Ficha de cliente</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{cliente.telefono || "-"}</td>
                      <td className="max-w-[13rem] px-4 py-3 text-muted-foreground">
                        <span className="block truncate">{cliente.email || "-"}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{cliente.documento || "-"}</td>
                      <td className="max-w-[16rem] px-4 py-3 text-muted-foreground">
                        <span className="block truncate">{cliente.notas_internas || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-bold ${
                            activo
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <ClienteDialog variant="editar" cliente={cliente} />
                          <ClienteEstadoButton clienteId={cliente.id} estado={cliente.estado} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
