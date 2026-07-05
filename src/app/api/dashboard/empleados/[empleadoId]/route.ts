import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteContext = {
  params: Promise<{
    empleadoId: string;
  }>;
};

type Payload = {
  nombre?: string;
  email?: string;
  telefono?: string;
  color_calendario?: string;
  estado?: string;
  servicio_ids?: string[];
  horarios?: {
    id?: string;
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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const access = await requireDashboardAccess();

    if (!access.puedeGestionarEmpleados) {
      return NextResponse.json(
        { error: "No tenés permiso para editar empleados." },
        { status: 403 }
      );
    }

    const { empleadoId } = await context.params;
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

    const { data: empleadoActual, error: empleadoActualError } = await supabase
      .from("empleados")
      .select("id, sucursal_id")
      .eq("id", empleadoId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (empleadoActualError) throw new Error(empleadoActualError.message);

    if (!empleadoActual) {
      return NextResponse.json(
        { error: "Empleado no encontrado." },
        { status: 404 }
      );
    }

    if (
      access.scope === "sucursal" &&
      access.sucursalId &&
      empleadoActual.sucursal_id !== access.sucursalId
    ) {
      return NextResponse.json(
        { error: "No podés editar empleados de otra sucursal." },
        { status: 403 }
      );
    }

    const { error: empleadoError } = await supabase
      .from("empleados")
      .update({
        nombre,
        email: email || null,
        telefono: telefono || null,
        color_calendario: color,
        estado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empleadoId)
      .eq("negocio_id", access.negocio.id);

    if (empleadoError) throw new Error(empleadoError.message);

    await supabase
      .from("empleado_servicios")
      .delete()
      .eq("empleado_id", empleadoId);

    if (servicioIds.length > 0) {
      const relaciones = servicioIds.map((servicioId) => ({
        empleado_id: empleadoId,
        servicio_id: servicioId,
      }));

      const { error: relacionesError } = await supabase
        .from("empleado_servicios")
        .insert(relaciones);

      if (relacionesError) throw new Error(relacionesError.message);
    }

    if (horarios.length > 0) {
      await supabase
        .from("horarios_empleado")
        .delete()
        .eq("empleado_id", empleadoId);

      const horariosPayload = horarios.map((horario) => ({
        empleado_id: empleadoId,
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
      message: "Empleado actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error actualizando empleado:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el empleado." },
      { status: 500 }
    );
  }
}