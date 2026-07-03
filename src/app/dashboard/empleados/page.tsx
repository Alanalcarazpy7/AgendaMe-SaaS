import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmpleadosPanel } from "@/components/empleados/empleados-panel";
import type {
  EmpleadoItem,
  HorarioEmpleadoItem,
  ServicioParaEmpleado,
} from "@/components/empleados/empleado-dialog";

type EmpleadoServicioRow = {
  empleado_id: string;
  servicio_id: string;
};

type HorarioEmpleadoRow = {
  empleado_id: string;
  dia_semana: number;
  activo: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
};

export default async function EmpleadosPage() {
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
    { data: empleadosData, error: empleadosError },
    { data: serviciosData, error: serviciosError },
  ] = await Promise.all([
    supabase
      .from("empleados")
      .select("id, nombre, email, telefono, color_calendario, estado, created_at")
      .eq("negocio_id", membresia.negocio_id)
      .order("created_at", { ascending: false }),

    supabase
      .from("servicios")
      .select("id, nombre, estado")
      .eq("negocio_id", membresia.negocio_id)
      .order("nombre", { ascending: true }),
  ]);

  if (empleadosError) {
    throw new Error(empleadosError.message);
  }

  if (serviciosError) {
    throw new Error(serviciosError.message);
  }

  const empleadosBase = (empleadosData ?? []) as Omit<
    EmpleadoItem,
    "servicios_ids" | "horarios"
  >[];

  const servicios = (serviciosData ?? []) as ServicioParaEmpleado[];
  const empleadosIds = empleadosBase.map((empleado) => empleado.id);

  let relaciones: EmpleadoServicioRow[] = [];
  let horariosRows: HorarioEmpleadoRow[] = [];

  if (empleadosIds.length > 0) {
    const [
      { data: relacionesData, error: relacionesError },
      { data: horariosData, error: horariosError },
    ] = await Promise.all([
      supabase
        .from("empleado_servicios")
        .select("empleado_id, servicio_id")
        .in("empleado_id", empleadosIds),

      supabase
        .from("horarios_empleado")
        .select("empleado_id, dia_semana, activo, hora_inicio, hora_fin")
        .in("empleado_id", empleadosIds),
    ]);

    if (relacionesError) {
      throw new Error(relacionesError.message);
    }

    if (horariosError) {
      throw new Error(horariosError.message);
    }

    relaciones = (relacionesData ?? []) as EmpleadoServicioRow[];
    horariosRows = (horariosData ?? []) as HorarioEmpleadoRow[];
  }

  const empleados: EmpleadoItem[] = empleadosBase.map((empleado) => {
    const serviciosIds = relaciones
      .filter((relacion) => relacion.empleado_id === empleado.id)
      .map((relacion) => relacion.servicio_id);

    const horarios: HorarioEmpleadoItem[] = horariosRows
      .filter((horario) => horario.empleado_id === empleado.id)
      .map((horario) => ({
        dia_semana: horario.dia_semana,
        activo: horario.activo,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
      }))
      .sort((a, b) => a.dia_semana - b.dia_semana);

    return {
      ...empleado,
      servicios_ids: serviciosIds,
      horarios,
    };
  });

  return <EmpleadosPanel empleados={empleados} servicios={servicios} />;
}