import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CitasPanel,
  type CitaItem,
} from "@/components/citas/citas-panel";
import type {
  ClienteCitaItem,
  EmpleadoCitaItem,
  EmpleadoServicioCitaItem,
  ServicioCitaItem,
} from "@/components/citas/cita-dialog";

export default async function CitasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membresias, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (membresiaError) {
    throw new Error(membresiaError.message);
  }

  const membresia = membresias?.[0];

  if (!membresia) {
    redirect("/onboarding/negocio");
  }

  const [
    { data: clientesData, error: clientesError },
    { data: serviciosData, error: serviciosError },
    { data: empleadosData, error: empleadosError },
    { data: relacionesData, error: relacionesError },
    { data: citasData, error: citasError },
  ] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre_completo, telefono, estado")
      .eq("negocio_id", membresia.negocio_id)
      .order("nombre_completo", { ascending: true }),

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, color, estado")
      .eq("negocio_id", membresia.negocio_id)
      .order("nombre", { ascending: true }),

    supabase
      .from("empleados")
      .select("id, nombre, color_calendario, estado")
      .eq("negocio_id", membresia.negocio_id)
      .order("nombre", { ascending: true }),

    supabase
      .from("empleado_servicios")
      .select("empleado_id, servicio_id"),

    supabase
      .from("citas")
      .select("id, cliente_id, servicio_id, empleado_id, fecha, hora_inicio, hora_fin, estado, created_at")
      .eq("negocio_id", membresia.negocio_id)
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false }),
  ]);

  if (clientesError) throw new Error(clientesError.message);
  if (serviciosError) throw new Error(serviciosError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  if (relacionesError) throw new Error(relacionesError.message);
  if (citasError) throw new Error(citasError.message);

  const clientes = (clientesData ?? []) as ClienteCitaItem[];
  const servicios = (serviciosData ?? []) as ServicioCitaItem[];
  const empleados = (empleadosData ?? []) as EmpleadoCitaItem[];
  const citas = (citasData ?? []) as CitaItem[];

  const empleadosIds = empleados.map((empleado) => empleado.id);
  const empleadoServicios = ((relacionesData ?? []) as EmpleadoServicioCitaItem[]).filter(
    (relacion) => empleadosIds.includes(relacion.empleado_id)
  );

  return (
    <CitasPanel
      citas={citas}
      clientes={clientes}
      servicios={servicios}
      empleados={empleados}
      empleadoServicios={empleadoServicios}
    />
  );
}