import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Scissors,
  Store,
  User,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type EstadoReservaPageProps = {
  params: Promise<{
    token: string;
  }>;
};

type Relacion<T> = T | T[] | null;

type CitaEstadoRaw = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada" | "no_asistio";
  created_at: string;
  negocios: Relacion<{
    nombre: string;
    slug: string;
    telefono: string | null;
    direccion: string | null;
  }>;
  clientes: Relacion<{
    nombre_completo: string;
  }>;
  servicios: Relacion<{
    nombre: string;
    duracion_minutos: number;
    precio: number | string | null;
  }>;
  empleados: Relacion<{
    nombre: string;
  }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function hora(valor: string) {
  return valor.slice(0, 5);
}

function formatearFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function estadoCopy(estado: CitaEstadoRaw["estado"]) {
  if (estado === "confirmada") {
    return {
      titulo: "Tu reserva fue confirmada",
      descripcion: "El negocio confirmó tu turno. Te recomendamos llegar unos minutos antes.",
      icon: CheckCircle2,
      className: "bg-green-100 text-green-700",
      badge: "Confirmada",
    };
  }

  if (estado === "cancelada") {
    return {
      titulo: "Tu reserva fue cancelada",
      descripcion: "El negocio canceló esta reserva. Podés solicitar otro turno desde el link público.",
      icon: XCircle,
      className: "bg-red-100 text-red-700",
      badge: "Cancelada",
    };
  }

  if (estado === "completada") {
    return {
      titulo: "Reserva completada",
      descripcion: "Esta cita ya fue atendida por el negocio.",
      icon: CheckCircle2,
      className: "bg-blue-100 text-blue-700",
      badge: "Completada",
    };
  }

  if (estado === "no_asistio") {
    return {
      titulo: "Marcada como no asistida",
      descripcion: "El negocio marcó esta cita como no asistida.",
      icon: AlertCircle,
      className: "bg-orange-100 text-orange-700",
      badge: "No asistió",
    };
  }

  return {
    titulo: "Tu reserva está pendiente",
    descripcion: "El negocio recibió tu solicitud y todavía debe confirmarla.",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-700",
    badge: "Pendiente",
  };
}

export default async function EstadoReservaPage({
  params,
}: EstadoReservaPageProps) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("citas")
    .select(
      `
      id,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      created_at,
      negocios (
        nombre,
        slug,
        telefono,
        direccion
      ),
      clientes (
        nombre_completo
      ),
      servicios (
        nombre,
        duracion_minutos,
        precio
      ),
      empleados (
        nombre
      )
    `
    )
    .eq("seguimiento_token", token)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const cita = data as CitaEstadoRaw;
  const negocio = obtenerObjeto(cita.negocios);
  const cliente = obtenerObjeto(cita.clientes);
  const servicio = obtenerObjeto(cita.servicios);
  const empleado = obtenerObjeto(cita.empleados);

  const estado = estadoCopy(cita.estado);
  const Icon = estado.icon;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${estado.className}`}
          >
            <Icon className="h-8 w-8" />
          </div>

          <span
            className={`mt-6 inline-flex rounded-full px-3 py-1 text-sm font-medium ${estado.className}`}
          >
            {estado.badge}
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {estado.titulo}
          </h1>

          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {estado.descripcion}
          </p>
        </section>

        <section className="mt-5 rounded-3xl border bg-background p-6 shadow-sm">
          <h2 className="text-xl font-bold">Detalle de la reserva</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="h-4 w-4" />
                Negocio
              </div>
              <p className="mt-2 font-semibold">{negocio?.nombre ?? "Negocio"}</p>
              {negocio?.telefono && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {negocio.telefono}
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Cliente
              </div>
              <p className="mt-2 font-semibold">
                {cliente?.nombre_completo ?? "Cliente"}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scissors className="h-4 w-4" />
                Servicio
              </div>
              <p className="mt-2 font-semibold">
                {servicio?.nombre ?? "Servicio"}
              </p>
              {servicio?.duracion_minutos && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {servicio.duracion_minutos} min
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Profesional
              </div>
              <p className="mt-2 font-semibold">
                {empleado?.nombre ?? "Asignado por el negocio"}
              </p>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Fecha y hora
              </div>
              <p className="mt-2 text-lg font-semibold">
                {formatearFecha(cita.fecha)} · {hora(cita.hora_inicio)} -{" "}
                {hora(cita.hora_fin)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {negocio?.slug && (
              <Link
                href={`/reservar/${negocio.slug}`}
                className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground"
              >
                Solicitar otra reserva
              </Link>
            )}

            {negocio?.telefono && (
              <a
                href={`https://wa.me/${negocio.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90"
              >
                Contactar al negocio
              </a>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Guardá este enlace para consultar el estado de tu reserva.
        </p>
      </div>
    </main>
  );
}