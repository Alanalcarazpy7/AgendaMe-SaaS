"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";

type CitaRecordatorio = {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  seguimiento_token: string;
  cliente: {
    nombre_completo: string;
    telefono: string | null;
  } | null;
  servicio: {
    nombre: string;
  } | null;
  empleado: {
    nombre: string;
  } | null;
};

type RecordatoriosPanelProps = {
  citas: CitaRecordatorio[];
};

function telefonoWa(telefono?: string | null) {
  return String(telefono ?? "").replace(/\D/g, "");
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

export function RecordatoriosPanel({ citas }: RecordatoriosPanelProps) {
  const [copiado, setCopiado] = useState("");

  const agrupadas = useMemo(() => {
    const map = new Map<string, CitaRecordatorio[]>();

    for (const cita of citas) {
      const actual = map.get(cita.fecha) ?? [];
      actual.push(cita);
      map.set(cita.fecha, actual);
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [citas]);

  function crearMensaje(cita: CitaRecordatorio, tipo: "recordatorio" | "confirmacion") {
    const cliente = cita.cliente?.nombre_completo ?? "cliente";
    const servicio = cita.servicio?.nombre ?? "tu servicio";
    const hora = String(cita.hora_inicio).slice(0, 5);
    const link = `${window.location.origin}/reserva/estado/${cita.seguimiento_token}`;

    if (tipo === "confirmacion") {
      return `Hola ${cliente}, te escribimos para confirmar si asistirás a tu cita de ${servicio} el ${formatearFecha(cita.fecha)} a las ${hora}. Podés ver el estado aquí: ${link}`;
    }

    return `Hola ${cliente}, te recordamos tu cita de ${servicio} el ${formatearFecha(cita.fecha)} a las ${hora}. Podés ver el estado aquí: ${link}`;
  }

  function abrirWhatsapp(cita: CitaRecordatorio, tipo: "recordatorio" | "confirmacion") {
    const telefono = telefonoWa(cita.cliente?.telefono);
    const mensaje = encodeURIComponent(crearMensaje(cita, tipo));

    if (!telefono) {
      alert("Este cliente no tiene teléfono cargado.");
      return;
    }

    window.open(`https://wa.me/${telefono}?text=${mensaje}`, "_blank", "noopener,noreferrer");
  }

  async function copiarMensaje(cita: CitaRecordatorio) {
    const mensaje = crearMensaje(cita, "recordatorio");
    await navigator.clipboard.writeText(mensaje);
    setCopiado(cita.id);

    setTimeout(() => setCopiado(""), 2000);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Plan Profesional</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Recordatorios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviá recordatorios manuales por WhatsApp para reducir ausencias.
        </p>
      </section>

      {citas.length === 0 ? (
        <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 text-2xl font-bold">Sin citas próximas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No hay citas pendientes o confirmadas para los próximos días.
          </p>
        </section>
      ) : (
        agrupadas.map(([fecha, citasDia]) => (
          <section key={fecha} className="rounded-3xl border bg-background p-5 shadow-sm">
            <h2 className="text-xl font-bold">{formatearFecha(fecha)}</h2>

            <div className="mt-4 space-y-3">
              {citasDia.map((cita) => (
                <div
                  key={cita.id}
                  className="rounded-2xl border bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-bold">
                        {String(cita.hora_inicio).slice(0, 5)} ·{" "}
                        {cita.cliente?.nombre_completo ?? "Cliente"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cita.servicio?.nombre ?? "Servicio"} ·{" "}
                        {cita.empleado?.nombre ?? "Empleado"} · Estado:{" "}
                        {cita.estado}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Teléfono: {cita.cliente?.telefono ?? "Sin teléfono"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => abrirWhatsapp(cita, "recordatorio")}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-3 text-sm font-semibold text-background transition hover:opacity-90"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Recordar
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirWhatsapp(cita, "confirmacion")}
                        className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted"
                      >
                        Confirmar asistencia
                      </button>

                      <button
                        type="button"
                        onClick={() => copiarMensaje(cita)}
                        className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition hover:bg-muted"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copiado === cita.id ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}