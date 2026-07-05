import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Payload = {
  nombre?: string;
  email?: string;
  telefono?: string;
  color_calendario?: string;
  estado?: string;
  servicio_ids?: string[];
  horarios?: {
    dia_semana: number;
    activo: boolean;
    hora_inicio: string;
    hora_fin: string;
    descanso_inicio?: string | null;
    descanso_fin?: string | null;
  }[];
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function limpiarColor(valor: unknown) {
  const color = limpiar(valor);
  return color || "#2563eb";
}

function validarEstado(estado: string) {
  return ["activo", "inactivo"].includes(estado);
}

export async function POST(request: Request) {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarEmpleados) {
      return NextResponse.json(
        { error: "No tenés permiso para crear empleados." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;

    const nombre = limpiar(body.nombre);
    const email = limpiar(body.email);
    const telefono = limpiar(body.telefono);
    const color = limpiarColor(body.color_calendario);
    const estado = limpiar(body.estado) || "activo";
    const servicioIds = Array.isArray(body.servicio_ids) ? body.servicio_ids : [];
    const horarios = Array.isArray(body.horarios) ? body.horarios : [];

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del empleado es obligatorio." },
        { status: 400 }
      );
    }

    if (!validarEstado(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    let sucursalId: string | null = access.sucursalId;

    if (!sucursalId) {
      const { data: principal, error: principalError } = await supabase
        .from("sucursales")
        .select("id")
        .eq("negocio_id", access.negocio.id)
        .eq("es_principal", true)
        .maybeSingle();

      if (principalError) throw new Error(principalError.message);

      sucursalId = principal?.id ?? null;
    }

    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .insert({
        negocio_id: access.negocio.id,
        sucursal_id: sucursalId,
        nombre,
        email: email || null,
        telefono: telefono || null,
        color_calendario: color,
        estado,
      })
      .select("id")
      .single();

    if (empleadoError) throw new Error(empleadoError.message);

    if (servicioIds.length > 0) {
      const relaciones = servicioIds.map((servicioId) => ({
        empleado_id: empleado.id,
        servicio_id: servicioId,
      }));

      const { error: relacionesError } = await supabase
        .from("empleado_servicios")
        .insert(relaciones);

      if (relacionesError) throw new Error(relacionesError.message);
    }

    if (horarios.length > 0) {
      const horariosPayload = horarios.map((horario) => ({
        empleado_id: empleado.id,
        dia_semana: horario.dia_semana,
        activo: horario.activo,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        descanso_inicio: horario.descanso_inicio || null,
        descanso_fin: horario.descanso_fin || null,
      }));

      const { error: horariosError } = await supabase
        .from("horarios_empleado")
        .insert(horariosPayload);

      if (horariosError) throw new Error(horariosError.message);
    }

    return NextResponse.json({
      message: "Empleado creado correctamente.",
      empleadoId: empleado.id,
    });
  } catch (error) {
    console.error("Error creando empleado:", error);

    return NextResponse.json(
      { error: "No se pudo crear el empleado." },
      { status: 500 }
    );
  }
}