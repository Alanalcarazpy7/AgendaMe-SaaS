"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type Relacion<T> = T | T[] | null | undefined;

type Cliente = {
  id: string;
  nombre_completo: string;
  telefono?: string | null;
  email?: string | null;
};

type Servicio = {
  id: string;
  nombre: string;
  duracion_minutos?: number | null;
  precio?: number | string | null;
};

type Empleado = {
  id: string;
  nombre: string;
  sucursal_id?: string | null;
};

type Sucursal = {
  id: string;
  nombre: string;
};

type Reserva = {
  id: string;
  negocio_id?: string;
  sucursal_id?: string | null;
  cliente_id: string;
  servicio_id: string;
  empleado_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  precio?: number | string | null;
  notas?: string | null;
  origen?: string | null;
  seguimiento_token?: string | null;
  created_at?: string | null;
  clientes?: Relacion<Cliente>;
  servicios?: Relacion<Servicio>;
  empleados?: Relacion<Empleado>;
  sucursales?: Relacion<Sucursal>;
};

type TiempoReserva = "hoy" | "proximas" | "vencidas";
type FiltroVista = "todas" | "pendientes" | "confirmadas" | "vencidas";

type ReservasPendientesPanelProps = {
  reservas?: Reserva[];
  initialReservas?: Reserva[];
  clientes?: Cliente[];
  servicios?: Servicio[];
  empleados?: Empleado[];
};

const RESERVAS_PAGE_SIZE = 20;

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function horaCorta(hora: string | null | undefined) {
  return String(hora ?? "").slice(0, 5);
}

function fechaDisplay(fecha: string) {
  const [year, month, day] = fecha.split("-");

  if (!year || !month || !day) return fecha;

  return `${day}/${month}/${year}`;
}

function fechaRecibidaDisplay(fecha?: string | null) {
  if (!fecha) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-PY", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Asuncion",
    }).format(new Date(fecha));
  } catch {
    return fecha;
  }
}

function hoyLocal() {
  // Fijo a America/Asuncion (no al huso del servidor ni del navegador): evita
  // que el servidor y el cliente calculen "hoy" distinto cerca de medianoche
  // (mismatch de hidratación) y usa el huso real del negocio.
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((p) => p.type === "year")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";
  const dia = partes.find((p) => p.type === "day")?.value ?? "";

  return `${anio}-${mes}-${dia}`;
}

function cardBase(extra = "") {
  return `rounded-[1.5rem] border border-border/80 bg-card/90 shadow-[0_16px_48px_rgb(15_23_42/0.07)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/20 dark:ring-white/5 ${extra}`;
}

function estadoTiempo(reserva: Reserva, hoy: string): TiempoReserva {
  if (reserva.fecha < hoy) return "vencidas";
  if (reserva.fecha === hoy) return "hoy";
  return "proximas";
}

function estadoLabel(estado: string) {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
  };

  return labels[estado] ?? estado;
}

export function ReservasPendientesPanel({
  reservas,
  initialReservas,
  clientes = [],
  servicios = [],
  empleados = [],
}: ReservasPendientesPanelProps) {
  const [items, setItems] = useState<Reserva[]>(reservas ?? initialReservas ?? []);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroVista, setFiltroVista] = useState<FiltroVista>("pendientes");
  const [pagina, setPagina] = useState(1);

  const hoy = hoyLocal();

  function clienteDe(reserva: Reserva) {
    return (
      obtenerObjeto(reserva.clientes) ??
      clientes.find((cliente) => cliente.id === reserva.cliente_id) ??
      null
    );
  }

  function servicioDe(reserva: Reserva) {
    return (
      obtenerObjeto(reserva.servicios) ??
      servicios.find((servicio) => servicio.id === reserva.servicio_id) ??
      null
    );
  }

  function empleadoDe(reserva: Reserva) {
    return (
      obtenerObjeto(reserva.empleados) ??
      empleados.find((empleado) => empleado.id === reserva.empleado_id) ??
      null
    );
  }

  function sucursalDe(reserva: Reserva) {
    return obtenerObjeto(reserva.sucursales);
  }

  const resumen = useMemo(() => {
    const pendientes = items.filter(
      (reserva) => reserva.estado === "pendiente" && estadoTiempo(reserva, hoy) !== "vencidas"
    ).length;
    const vencidas = items.filter(
      (reserva) => reserva.estado === "pendiente" && estadoTiempo(reserva, hoy) === "vencidas"
    ).length;

    return {
      total: items.length,
      pendientes,
      confirmadas: items.filter((reserva) => reserva.estado === "confirmada").length,
      vencidas,
    };
  }, [items, hoy]);

  const query = busqueda.trim().toLowerCase();
  const reservasFiltradas = [...items]
    .sort((a, b) => {
      const fechaA = `${a.fecha} ${horaCorta(a.hora_inicio)}`;
      const fechaB = `${b.fecha} ${horaCorta(b.hora_inicio)}`;

      return fechaA.localeCompare(fechaB);
    })
    .filter((reserva) => {
      const cliente = clienteDe(reserva);
      const servicio = servicioDe(reserva);
      const empleado = empleadoDe(reserva);
      const sucursal = sucursalDe(reserva);
      const tiempo = estadoTiempo(reserva, hoy);
      const esVencida = reserva.estado === "pendiente" && tiempo === "vencidas";
      const coincideVista =
        filtroVista === "todas" ||
        (filtroVista === "pendientes" && reserva.estado === "pendiente" && !esVencida) ||
        (filtroVista === "confirmadas" && reserva.estado === "confirmada") ||
        (filtroVista === "vencidas" && esVencida);
      const coincideBusqueda =
        !query ||
        cliente?.nombre_completo.toLowerCase().includes(query) ||
        cliente?.telefono?.toLowerCase().includes(query) ||
        servicio?.nombre.toLowerCase().includes(query) ||
        empleado?.nombre.toLowerCase().includes(query) ||
        sucursal?.nombre.toLowerCase().includes(query);

      return coincideVista && coincideBusqueda;
    });

  const totalPaginas = Math.max(1, Math.ceil(reservasFiltradas.length / RESERVAS_PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desdeResultado =
    reservasFiltradas.length === 0 ? 0 : (paginaActual - 1) * RESERVAS_PAGE_SIZE + 1;
  const hastaResultado = Math.min(paginaActual * RESERVAS_PAGE_SIZE, reservasFiltradas.length);
  const reservasVisibles = reservasFiltradas.slice(
    (paginaActual - 1) * RESERVAS_PAGE_SIZE,
    paginaActual * RESERVAS_PAGE_SIZE
  );

  const filtros: { value: FiltroVista; label: string; count: number }[] = [
    { value: "todas", label: "Todas", count: resumen.total },
    { value: "pendientes", label: "Pendientes", count: resumen.pendientes },
    { value: "confirmadas", label: "Confirmadas", count: resumen.confirmadas },
    { value: "vencidas", label: "Vencidas", count: resumen.vencidas },
  ];

  async function cambiarEstado(reserva: Reserva, estado: "confirmada" | "cancelada") {
    try {
      setLoadingId(`${reserva.id}-${estado}`);
      setError("");
      setMensaje("");

      const response = await fetch(`/api/dashboard/citas/${reserva.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo actualizar la reserva.");
        return;
      }

      setItems((prev) =>
        prev.map((item) => (item.id === reserva.id ? { ...item, estado } : item))
      );
      setFiltroVista(estado === "confirmada" ? "confirmadas" : "todas");
      setPagina(1);
      setMensaje(
        estado === "confirmada"
          ? "Reserva confirmada. Ahora esta en la bandeja Confirmadas y se distingue en el calendario."
          : "Reserva cancelada. La dejamos visible por ahora para que veas el cambio de estado."
      );
    } catch {
      setError("No se pudo actualizar la reserva.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className={cardBase("overflow-hidden")}>
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="relative p-5 sm:p-6">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-teal-500" />

            <p className="inline-flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              Solicitudes desde el link publico
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance">
              Reservas
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Bandeja operativa para revisar pendientes, confirmar solicitudes y separar vencidas sin perder contexto.
            </p>

            <div className="mt-5">
              <Link
                href="/dashboard/citas"
                className="inline-flex h-10 items-center justify-center rounded-2xl border bg-background/70 px-4 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Ver calendario
              </Link>
            </div>
          </div>

          <aside className="border-t border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] p-4 text-white xl:border-l xl:border-t-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Pendientes</p>
                <p className="mt-1 text-3xl font-bold">{resumen.pendientes}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Confirmadas</p>
                <p className="mt-1 text-3xl font-bold">{resumen.confirmadas}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Vencidas</p>
                <p className="mt-1 text-2xl font-bold">{resumen.vencidas}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                <p className="text-xs text-cyan-50/80">Total visible</p>
                <p className="mt-1 text-2xl font-bold">{resumen.total}</p>
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
              placeholder="Buscar cliente, telefono, servicio, empleado o sucursal..."
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filtros.map((filtro) => {
              const activo = filtroVista === filtro.value;

              return (
                <button
                  key={filtro.value}
                  type="button"
                  onClick={() => {
                    setFiltroVista(filtro.value);
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
            {(busqueda || filtroVista !== "pendientes") && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setFiltroVista("pendientes");
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

      {error && (
        <p className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {mensaje}
        </p>
      )}

      {items.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Sin reservas visibles</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Cuando entren nuevas solicitudes desde el link publico, apareceran aca para confirmar, separar o cancelar.
          </p>
        </section>
      ) : reservasFiltradas.length === 0 ? (
        <section className={cardBase("p-8 text-center")}>
          <h2 className="text-xl font-bold tracking-tight">No encontramos reservas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Proba con otro filtro o busca por cliente, servicio o empleado.
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
              de <strong className="text-foreground">{reservasFiltradas.length}</strong> reservas
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
            <table className="w-full min-w-[1120px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Fecha y hora</th>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3">Recibida</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/70">
                {reservasVisibles.map((reserva) => {
                  const cliente = clienteDe(reserva);
                  const servicio = servicioDe(reserva);
                  const empleado = empleadoDe(reserva);
                  const sucursal = sucursalDe(reserva);
                  const tiempo = estadoTiempo(reserva, hoy);
                  const esVencida = reserva.estado === "pendiente" && tiempo === "vencidas";
                  const estaPendiente = reserva.estado === "pendiente";
                  const estaConfirmada = reserva.estado === "confirmada";
                  const estaCancelada = reserva.estado === "cancelada";
                  const calendarioHref = `/dashboard/citas?fecha=${reserva.fecha}&hora=${horaCorta(reserva.hora_inicio)}&cita=${reserva.id}`;
                  const cargandoConfirmar = loadingId === `${reserva.id}-confirmada`;
                  const cargandoCancelar = loadingId === `${reserva.id}-cancelada`;

                  return (
                    <tr
                      key={reserva.id}
                      className={`transition-colors hover:bg-muted/35 ${
                        estaConfirmada
                          ? "bg-blue-500/5"
                          : esVencida
                            ? "bg-destructive/5"
                            : estaCancelada
                              ? "bg-muted/50 opacity-80"
                              : "bg-card/40"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="max-w-[14rem] truncate font-semibold">
                          {cliente?.nombre_completo ?? "Sin cliente"}
                        </p>
                        <p className="mt-1 max-w-[14rem] truncate text-xs text-muted-foreground">
                          {cliente?.telefono ?? "Sin telefono"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[13rem] truncate font-medium">
                          {servicio?.nombre ?? "Sin servicio"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {servicio?.duracion_minutos ? `${servicio.duracion_minutos} min` : "Sin duracion"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{fechaDisplay(reserva.fecha)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {horaCorta(reserva.hora_inicio)} - {horaCorta(reserva.hora_fin)}
                        </p>
                      </td>
                      <td className="max-w-[12rem] px-4 py-3 text-muted-foreground">
                        <span className="block truncate">{empleado?.nombre ?? "Sin empleado"}</span>
                      </td>
                      <td className="max-w-[12rem] px-4 py-3 text-muted-foreground">
                        <span className="block truncate">{sucursal?.nombre ?? "Sucursal principal"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {fechaRecibidaDisplay(reserva.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-bold ${
                              estaConfirmada
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                : estaCancelada
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {estadoLabel(reserva.estado)}
                          </span>
                          <span
                            className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-bold ${
                              esVencida
                                ? "bg-destructive/10 text-destructive"
                                : tiempo === "hoy"
                                  ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {esVencida ? "Vencida" : tiempo === "hoy" ? "Hoy" : "Proxima"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={calendarioHref}
                            className="inline-flex h-9 items-center justify-center rounded-xl border bg-background/70 px-3 text-sm font-semibold transition hover:bg-accent hover:text-accent-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {estaPendiente && !esVencida && (
                            <button
                              type="button"
                              onClick={() => cambiarEstado(reserva, "confirmada")}
                              disabled={Boolean(loadingId)}
                              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                              title="Confirmar reserva"
                            >
                              {cargandoConfirmar ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {estaPendiente && (
                            <button
                              type="button"
                              onClick={() => cambiarEstado(reserva, "cancelada")}
                              disabled={Boolean(loadingId)}
                              className="inline-flex h-9 items-center justify-center rounded-xl bg-destructive px-3 text-sm font-semibold text-white transition hover:bg-destructive/90 disabled:opacity-60"
                              title={esVencida ? "Cancelar reserva vencida" : "Cancelar reserva"}
                            >
                              {cargandoCancelar ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {!estaPendiente && (
                            <span className="inline-flex h-9 items-center rounded-xl border bg-muted/40 px-3 text-xs font-bold text-muted-foreground">
                              Gestionada
                            </span>
                          )}
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
