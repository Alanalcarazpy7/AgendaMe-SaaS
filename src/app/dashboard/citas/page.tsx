import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CitasPanel, type CitaItem } from "@/components/citas/citas-panel";
import type {
  ClienteCitaItem,
  EmpleadoCitaItem,
  EmpleadoServicioCitaItem,
  ServicioCitaItem,
} from "@/components/citas/cita-dialog";

type CitasPageProps = {
  searchParams?: Promise<{
    fecha?: string;
    hora?: string;
    cita?: string;
  }>;
};

export default async function CitasPage({ searchParams }: CitasPageProps) {
  const filtros = (await searchParams) ?? {};

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
    { data: clientes, error: clientesError },
    { data: servicios, error: serviciosError },
    { data: empleados, error: empleadosError },
    { data: citas, error: citasError },
  ] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre_completo, telefono, email")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .order("nombre_completo", { ascending: true }),

    supabase
      .from("servicios")
      .select("id, nombre, descripcion, duracion_minutos, precio, color")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),

    supabase
      .from("empleados")
      .select("id, nombre, color_calendario")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),

    supabase
      .from("citas")
      .select("id, cliente_id, servicio_id, empleado_id, fecha, hora_inicio, hora_fin, estado, seguimiento_token, created_at")
      .eq("negocio_id", membresia.negocio_id)
      .order("fecha", { ascending: true })
      .order("hora_inicio", { ascending: true }),
  ]);

  if (clientesError) throw new Error(clientesError.message);
  if (serviciosError) throw new Error(serviciosError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  if (citasError) throw new Error(citasError.message);

  const empleadosIds = ((empleados ?? []) as EmpleadoCitaItem[]).map(
    (empleado) => empleado.id
  );

  let empleadoServicios: EmpleadoServicioCitaItem[] = [];

  if (empleadosIds.length > 0) {
    const { data: relaciones, error: relacionesError } = await supabase
      .from("empleado_servicios")
      .select("empleado_id, servicio_id")
      .in("empleado_id", empleadosIds);

    if (relacionesError) {
      throw new Error(relacionesError.message);
    }

    empleadoServicios = (relaciones ?? []) as EmpleadoServicioCitaItem[];
  }

  return (
    <CitasPanel
      key={`${filtros.fecha ?? "hoy"}-${filtros.hora ?? "sin-hora"}-${filtros.cita ?? "sin-cita"}`}
      citas={(citas ?? []) as CitaItem[]}
      clientes={(clientes ?? []) as ClienteCitaItem[]}
      servicios={(servicios ?? []) as ServicioCitaItem[]}
      empleados={(empleados ?? []) as EmpleadoCitaItem[]}
      empleadoServicios={empleadoServicios}
      initialFecha={filtros.fecha}
      initialHora={filtros.hora}
      highlightCitaId={filtros.cita}
    />
  );
}