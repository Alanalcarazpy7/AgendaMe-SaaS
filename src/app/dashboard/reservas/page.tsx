import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ReservasPendientesPanel,
  type ClienteReservaOption,
  type EmpleadoReservaOption,
  type EmpleadoServicioReservaOption,
  type ReservaPendienteItem,
  type ServicioReservaOption,
} from "@/components/reservas/reservas-pendientes-panel";

type Relacion<T> = T | T[] | null;

type CitaPendienteRaw = {
  id: string;
  cliente_id: string;
  servicio_id: string;
  empleado_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada" | "no_asistio";
  created_at: string;
  seguimiento_token: string | null;
  clientes: Relacion<{
    nombre_completo: string;
    telefono: string | null;
    email: string | null;
  }>;
  servicios: Relacion<{
    nombre: string;
  }>;
  empleados: Relacion<{
    nombre: string;
  }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

export default async function ReservasPendientesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .single();

  if (membresiaError || !membresia) {
    redirect("/onboarding/negocio");
  }

  const [
    { data: citasData, error: citasError },
    { data: clientesData, error: clientesError },
    { data: serviciosData, error: serviciosError },
    { data: empleadosData, error: empleadosError },
  ] = await Promise.all([
    supabase
      .from("citas")
      .select(
        `
        id,
        cliente_id,
        servicio_id,
        empleado_id,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        seguimiento_token,
        created_at,
        clientes (
          nombre_completo,
          telefono,
          email
        ),
        servicios (
          nombre
        ),
        empleados (
          nombre
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "pendiente")
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true }),

    supabase
      .from("clientes")
      .select("id, nombre_completo, telefono, email")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .order("nombre_completo", { ascending: true }),

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),

    supabase
      .from("empleados")
      .select("id, nombre")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),
  ]);

  if (citasError) throw new Error(citasError.message);
  if (clientesError) throw new Error(clientesError.message);
  if (serviciosError) throw new Error(serviciosError.message);
  if (empleadosError) throw new Error(empleadosError.message);

  const empleadosIds = ((empleadosData ?? []) as EmpleadoReservaOption[]).map(
    (empleado) => empleado.id
  );

  let empleadoServicios: EmpleadoServicioReservaOption[] = [];

  if (empleadosIds.length > 0) {
    const { data: relacionesData, error: relacionesError } = await supabase
      .from("empleado_servicios")
      .select("empleado_id, servicio_id")
      .in("empleado_id", empleadosIds);

    if (relacionesError) {
      throw new Error(relacionesError.message);
    }

    empleadoServicios = (relacionesData ?? []) as EmpleadoServicioReservaOption[];
  }

  const reservas: ReservaPendienteItem[] = (
    (citasData ?? []) as CitaPendienteRaw[]
  ).map((cita) => {
    const cliente = obtenerObjeto(cita.clientes);
    const servicio = obtenerObjeto(cita.servicios);
    const empleado = obtenerObjeto(cita.empleados);

    return {
      id: cita.id,
      cliente_id: cita.cliente_id,
      servicio_id: cita.servicio_id,
      empleado_id: cita.empleado_id,
      fecha: cita.fecha,
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin,
      estado: cita.estado,
      created_at: cita.created_at,
      seguimiento_token: cita.seguimiento_token,
      cliente_nombre: cliente?.nombre_completo ?? "Cliente",
      cliente_telefono: cliente?.telefono ?? null,
      cliente_email: cliente?.email ?? null,
      servicio_nombre: servicio?.nombre ?? "Servicio",
      empleado_nombre: empleado?.nombre ?? "Empleado",
    };
  });

  return (
    <ReservasPendientesPanel
      reservas={reservas}
      clientes={(clientesData ?? []) as ClienteReservaOption[]}
      servicios={(serviciosData ?? []) as ServicioReservaOption[]}
      empleados={(empleadosData ?? []) as EmpleadoReservaOption[]}
      empleadoServicios={empleadoServicios}
    />
  );
}