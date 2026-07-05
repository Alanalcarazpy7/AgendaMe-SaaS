"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  PhoneOff,
  Search,
  Send,
} from "lucide-react";

type CitaRecordatorio = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  seguimiento_token: string | null;
  sucursal_id: string | null;
  sucursal: {
    id: string;
    nombre: string;
  } | null;
  cliente: {
    nombre_completo: string;
    telefono: string | null;
    email?: string | null;
  } | null;
  servicio: {
    nombre: string;
  } | null;
  empleado: {
    nombre: string;
  } | null;
};

type SucursalItem = {
  id: string;
  nombre: string;
};

type RecordatoriosPanelProps = {
  citas: CitaRecordatorio[];
  scope: "global" | "sucursal";
  sucursalNombre: string | null;
  sucursales: SucursalItem[];
};

type FiltroPeriodo = "hoy" | "manana" | "7dias";
type FiltroEstado = "todos" | "pendiente" | "confirmada";
type FiltroTelefono = "todos" | "con_telefono" | "sin_telefono";

function telefonoWa(telefono?: string | null) {
  const digits = String(telefono ?? "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("595")) return digits;

  if (digits.startsWith("0")) {
    return `595${digits.slice(1)}`;
  }

  return digits;
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function fechaLarga(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("es-PY", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

function hoyLocalIso() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function sumarDias(fecha: string, dias: number) {
  const date = new Date(`${fecha}T12:00:00`);
  date.setDate(date.getDate() + dias);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function estadoLabel(estado: string) {
  if (estado === "confirmada") return "Confirmada";
  if (estado === "pendiente") return "Pendiente";
  return estado;
}

function estadoClass(estado: string) {
  if (estado === "confirmada") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
}

function nombreCliente(cita: CitaRecordatorio) {
  return cita.cliente?.nombre_completo || "Cliente";
}

function textoSeguro(valor?: string | null, fallback = "-") {
  const texto = String(valor ?? "").trim();
  return texto || fallback;
}

function crearLinkEstado(cita: CitaRecordatorio) {
  if (!cita.seguimiento_token) return "";
  return `${window.location.origin}/reserva/estado/${cita.seguimiento_token}`;
}

function crearMensaje(cita: CitaRecordatorio, tipo: "recordatorio" | "confirmacion" | "reprogramar") {
  const cliente = nombreCliente(cita);
  const servicio = cita.servicio?.nombre ?? "tu servicio";
  const empleado = cita.empleado?.nombre ?? "nuestro equipo";
  const fecha = formatearFecha(cita.fecha);
  const hora = String(cita.hora_inicio).slice(0, 5);
  const link = crearLinkEstado(cita);

  const base =
    tipo === "confirmacion"
      ? `Hola ${cliente}, te escribimos para confirmar si vas a asistir a tu cita de ${servicio} el ${fecha} a las ${hora} con ${empleado}.`
      : tipo === "reprogramar"
        ? `Hola ${cliente}, te escribimos por tu cita de ${servicio} del ${fecha} a las ${hora}. Si necesitás reprogramar, respondé este mensaje y coordinamos otro horario.`
        : `Hola ${cliente}, te recordamos tu cita de ${servicio} el ${fecha} a las ${hora} con ${empleado}.`;

  if (!link) return `${base} ¡Te esperamos!`;

  return `${base} Podés ver el estado aquí: ${link}`;
}

function copiar(texto: string) {
  return navigator.clipboard.writeText(texto);
}

export function RecordatoriosPanel({
  citas,
  scope,
  sucursalNombre,
  sucursales,
}: RecordatoriosPanelProps) {
  const [copiado, setCopiado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState<FiltroPeriodo>("7dias");
  const [estado, setEstado] = useState<FiltroEstado>("todos");
  const [telefonoFiltro, setTelefonoFiltro] = useState<FiltroTelefono>("todos");
  const [sucursalId, setSucursalId] = useState("todas");
  const [accionandoId, setAccionandoId] = useState("");

  const hoy = hoyLocalIso();
  const manana = sumarDias(hoy, 1);
  const hasta7 = sumarDias(hoy, 7);

  const citasFiltradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return citas.filter((cita) => {
      if (periodo === "hoy" && cita.fecha !== hoy) return false;
      if (periodo === "manana" && cita.fecha !== manana) return false;
      if (periodo === "7dias" && (cita.fecha < hoy || cita.fecha > hasta7)) return false;

      if (estado !== "todos" && cita.estado !== estado) return false;

      const tieneTelefono = Boolean(telefonoWa(cita.cliente?.telefono));

      if (telefonoFiltro === "con_telefono" && !tieneTelefono) return false;
      if (telefonoFiltro === "sin_telefono" && tieneTelefono) return false;

      if (scope === "global" && sucursalId !== "todas" && cita.sucursal_id !== sucursalId) {
        return false;
      }

      if (query) {
        const texto = [
          cita.cliente?.nombre_completo,
          cita.cliente?.telefono,
          cita.servicio?.nombre,
          cita.empleado?.nombre,
          cita.sucursal?.nombre,
          cita.estado,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!texto.includes(query)) return false;
      }

      return true;
    });
  }, [busqueda, citas, estado, hasta7, hoy, manana, periodo, scope, sucursalId, telefonoFiltro]);

  const resumen = useMemo(() => {
    const pendientes = citasFiltradas.filter((cita) => cita.estado === "pendiente").length;
    const confirmadas = citasFiltradas.filter((cita) => cita.estado === "confirmada").length;
    const sinTelefono = citasFiltradas.filter((cita) => !telefonoWa(cita.cliente?.telefono)).length;
    const hoyCantidad = citasFiltradas.filter((cita) => cita.fecha === hoy).length;

    return {
      total: citasFiltradas.length,
      pendientes,
      confirmadas,
      sinTelefono,
      hoy: hoyCantidad,
    };
  }, [citasFiltradas, hoy]);

  const agrupadas = useMemo(() => {
    const map = new Map<string, CitaRecordatorio[]>();

    for (const cita of citasFiltradas) {
      const actual = map.get(cita.fecha) ?? [];
      actual.push(cita);
      map.set(cita.fecha, actual);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, items]) => [
        fecha,
        items.sort((a, b) => String(a.hora_inicio).localeCompare(String(b.hora_inicio))),
      ] as const);
  }, [citasFiltradas]);

  function abrirWhatsapp(cita: CitaRecordatorio, tipo: "recordatorio" | "confirmacion" | "reprogramar") {
    const telefono = telefonoWa(cita.cliente?.telefono);
    const mensaje = encodeURIComponent(crearMensaje(cita, tipo));

    if (!telefono) {
      alert("Este cliente no tiene teléfono cargado.");
      return;
    }

    window.open(`https://wa.me/${telefono}?text=${mensaje}`, "_blank", "noopener,noreferrer");
  }

  async function copiarMensaje(cita: CitaRecordatorio, tipo: "recordatorio" | "confirmacion" | "reprogramar") {
    const mensaje = crearMensaje(cita, tipo);

    await copiar(mensaje);
    setCopiado(`${cita.id}-${tipo}`);

    setTimeout(() => setCopiado(""), 1800);
  }

  async function marcarConfirmada(cita: CitaRecordatorio) {
    try {
      setAccionandoId(cita.id);

      const response = await fetch(`/api/dashboard/citas/${cita.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estado: "confirmada",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error ?? "No se pudo confirmar la cita.");
        return;
      }

      window.location.reload();
    } catch {
      alert("No se pudo confirmar la cita.");
    } finally {
      setAccionandoId("");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Plan Profesional</p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Recordatorios
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Gestioná recordatorios manuales por WhatsApp para reducir ausencias y confirmar asistencia.
            </p>

            {scope === "sucursal" && (
              <p className="mt-2 inline-flex rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium">
                Vista de sucursal: {sucursalNombre ?? "Sucursal"}
              </p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">Filtradas</p>
              <p className="mt-1 text-2xl font-bold">{resumen.total}</p>
            </div>

            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="mt-1 text-2xl font-bold">{resumen.pendientes}</p>
            </div>

            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">Confirmadas</p>
              <p className="mt-1 text-2xl font-bold">{resumen.confirmadas}</p>
            </div>

            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">Sin teléfono</p>
              <p className="mt-1 text-2xl font-bold">{resumen.sinTelefono}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border bg-background p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_repeat(4,minmax(150px,1fr))]">
          <div className="flex h-11 items-center gap-2 rounded-xl border bg-muted/20 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar cliente, teléfono, servicio o empleado..."
              className="h-full w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={periodo}
            onChange={(event) => setPeriodo(event.target.value as FiltroPeriodo)}
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="hoy">Hoy</option>
            <option value="manana">Mañana</option>
            <option value="7dias">Próximos 7 días</option>
          </select>

          <select
            value={estado}
            onChange={(event) => setEstado(event.target.value as FiltroEstado)}
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmada">Confirmadas</option>
          </select>

          <select
            value={telefonoFiltro}
            onChange={(event) => setTelefonoFiltro(event.target.value as FiltroTelefono)}
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="todos">Todos los teléfonos</option>
            <option value="con_telefono">Con teléfono</option>
            <option value="sin_telefono">Sin teléfono</option>
          </select>

          {scope === "global" ? (
            <select
              value={sucursalId}
              onChange={(event) => setSucursalId(event.target.value)}
              className="h-11 rounded-xl border bg-background px-3 text-sm"
            >
              <option value="todas">Todas las sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex h-11 items-center rounded-xl border bg-muted/20 px-3 text-sm text-muted-foreground">
              {sucursalNombre ?? "Sucursal"}
            </div>
          )}
        </div>
      </section>

      {citas.length === 0 ? (
        <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-2xl font-bold">Sin citas próximas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No hay citas pendientes o confirmadas para los próximos días.
          </p>
        </section>
      ) : citasFiltradas.length === 0 ? (
        <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-2xl font-bold">Sin resultados</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No encontramos citas con los filtros seleccionados.
          </p>
        </section>
      ) : (
        agrupadas.map(([fecha, citasDia]) => (
          <section key={fecha} className="rounded-3xl border bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {fechaLarga(fecha)}
                </p>
                <h2 className="mt-1 text-xl font-bold">{formatearFecha(fecha)}</h2>
              </div>

              <p className="text-sm text-muted-foreground">
                {citasDia.length} cita{citasDia.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {citasDia.map((cita) => {
                const telefono = telefonoWa(cita.cliente?.telefono);
                const sinTelefono = !telefono;

                return (
                  <article
                    key={cita.id}
                    className="rounded-2xl border bg-muted/10 p-4 transition hover:bg-muted/20"
                  >
                    <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold">
                            {String(cita.hora_inicio).slice(0, 5)}
                          </p>

                          <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${estadoClass(cita.estado)}`}>
                            {estadoLabel(cita.estado)}
                          </span>

                          {sinTelefono && (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                              <PhoneOff className="mr-1 h-3 w-3" />
                              Sin teléfono
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2 truncate text-base font-bold">
                          {nombreCliente(cita)}
                        </h3>

                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                          <p>
                            <span className="font-medium text-foreground">Servicio:</span>{" "}
                            {textoSeguro(cita.servicio?.nombre, "Servicio")}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">Empleado:</span>{" "}
                            {textoSeguro(cita.empleado?.nombre, "Empleado")}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">Teléfono:</span>{" "}
                            {textoSeguro(cita.cliente?.telefono, "Sin teléfono")}
                          </p>

                          <p>
                            <span className="font-medium text-foreground">Sucursal:</span>{" "}
                            {textoSeguro(cita.sucursal?.nombre, "Sucursal")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => abrirWhatsapp(cita, "recordatorio")}
                          disabled={sinTelefono}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Recordar
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirWhatsapp(cita, "confirmacion")}
                          disabled={sinTelefono}
                          className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Confirmar por WhatsApp
                        </button>

                        {cita.estado === "pendiente" && (
                          <button
                            type="button"
                            onClick={() => marcarConfirmada(cita)}
                            disabled={accionandoId === cita.id}
                            className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {accionandoId === cita.id ? "Guardando" : "Marcar confirmada"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => copiarMensaje(cita, "recordatorio")}
                          className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copiado === `${cita.id}-recordatorio` ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}