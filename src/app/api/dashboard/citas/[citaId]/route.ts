import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const citaUpdateSchema = z.object({
  estado: z
    .enum(["pendiente", "confirmada", "cancelada", "completada", "no_asistio"])
    .optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.").optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida.").optional(),
});

function sumarMinutos(hora: string, minutos: number) {
  const [hh, mm] = hora.split(":").map(Number);
  const total = hh * 60 + mm + minutos;
  const nuevaHora = Math.floor(total / 60);
  const nuevosMinutos = total % 60;

  return `${String(nuevaHora).padStart(2, "0")}:${String(nuevosMinutos).padStart(2, "0")}`;
}

function obtenerMensajeError(errorMessage: string) {
  const mensaje = errorMessage.toLowerCase();

  if (mensaje.includes("fuera del horario del negocio")) {
    return "La cita está fuera del horario configurado del negocio.";
  }

  if (mensaje.includes("fuera del horario del empleado")) {
    return "La cita está fuera del horario personalizado del empleado.";
  }

  if (mensaje.includes("bloqueo")) {
    return "La cita cae dentro de un horario bloqueado.";
  }

  if (mensaje.includes("solapamiento") || mensaje.includes("exclusion")) {
    return "Ese empleado ya tiene una cita en ese horario.";
  }

  if (mensaje.includes("límite") || mensaje.includes("limite") || mensaje.includes("plan")) {
    return "No podés crear más citas con tu plan actual.";
  }

  return errorMessage;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ citaId: string }> }
) {
  const { citaId } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No tenés sesión activa." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = citaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const { data: membresias, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (membresiaError) {
    return NextResponse.json({ error: "No se pudo validar tu negocio." }, { status: 500 });
  }

  const membresia = membresias?.[0];

  if (!membresia) {
    return NextResponse.json({ error: "No tenés un negocio activo." }, { status: 403 });
  }

  const { data: citaActual, error: citaActualError } = await supabase
    .from("citas")
    .select("id, negocio_id, servicio_id, fecha, hora_inicio, estado")
    .eq("id", citaId)
    .eq("negocio_id", membresia.negocio_id)
    .single();

  if (citaActualError || !citaActual) {
    return NextResponse.json({ error: "Cita no encontrada." }, { status: 404 });
  }

  const datos = parsed.data;
  const updateData: Record<string, string> = {};

  if (datos.estado) {
    updateData.estado = datos.estado;
  }

  if (datos.fecha || datos.horaInicio) {
    const nuevaFecha = datos.fecha ?? citaActual.fecha;
    const nuevaHoraInicio = datos.horaInicio ?? citaActual.hora_inicio.slice(0, 5);

    const { data: servicio, error: servicioError } = await supabase
      .from("servicios")
      .select("duracion_minutos")
      .eq("id", citaActual.servicio_id)
      .eq("negocio_id", membresia.negocio_id)
      .single();

    if (servicioError || !servicio) {
      return NextResponse.json(
        { error: "No se pudo obtener la duración del servicio." },
        { status: 500 }
      );
    }

    updateData.fecha = nuevaFecha;
    updateData.hora_inicio = nuevaHoraInicio;
    updateData.hora_fin = sumarMinutos(nuevaHoraInicio, servicio.duracion_minutos);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No hay cambios para guardar." }, { status: 400 });
  }

  const { data: cita, error } = await supabase
    .from("citas")
    .update(updateData)
    .eq("id", citaId)
    .eq("negocio_id", membresia.negocio_id)
    .select("id, estado, fecha, hora_inicio, hora_fin")
    .single();

  if (error) {
    return NextResponse.json(
      { error: obtenerMensajeError(error.message) },
      { status: 400 }
    );
  }

  return NextResponse.json({ cita });
}