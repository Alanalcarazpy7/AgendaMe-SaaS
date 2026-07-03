import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const citaSchema = z.object({
  clienteId: z.string().uuid(),
  servicioId: z.string().uuid(),
  empleadoId: z.string().uuid().nullable().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
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

  if (mensaje.includes("servicio") && mensaje.includes("asignado")) {
    return "Ese empleado no tiene asignado ese servicio.";
  }

  return errorMessage;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No tenés sesión activa." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = citaSchema.safeParse(body);

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

  const datos = parsed.data;

  const [{ data: cliente }, { data: servicio }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, estado")
      .eq("id", datos.clienteId)
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .maybeSingle(),

    supabase
      .from("servicios")
      .select("id, duracion_minutos, estado")
      .eq("id", datos.servicioId)
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .maybeSingle(),
  ]);

  if (!cliente) {
    return NextResponse.json({ error: "Cliente no válido o inactivo." }, { status: 400 });
  }

  if (!servicio) {
    return NextResponse.json({ error: "Servicio no válido o inactivo." }, { status: 400 });
  }

  let empleadosCandidatos: string[] = [];

  if (datos.empleadoId) {
    const [{ data: empleado }, { data: asignacion }] = await Promise.all([
      supabase
        .from("empleados")
        .select("id, estado")
        .eq("id", datos.empleadoId)
        .eq("negocio_id", membresia.negocio_id)
        .eq("estado", "activo")
        .maybeSingle(),

      supabase
        .from("empleado_servicios")
        .select("empleado_id, servicio_id")
        .eq("empleado_id", datos.empleadoId)
        .eq("servicio_id", datos.servicioId)
        .maybeSingle(),
    ]);

    if (!empleado) {
      return NextResponse.json({ error: "Empleado no válido o inactivo." }, { status: 400 });
    }

    if (!asignacion) {
      return NextResponse.json(
        { error: "Ese empleado no tiene asignado ese servicio." },
        { status: 400 }
      );
    }

    empleadosCandidatos = [datos.empleadoId];
  } else {
    const { data: relaciones, error: relacionesError } = await supabase
      .from("empleado_servicios")
      .select("empleado_id")
      .eq("servicio_id", datos.servicioId);

    if (relacionesError) {
      return NextResponse.json({ error: relacionesError.message }, { status: 500 });
    }

    const idsAsignados = (relaciones ?? []).map((item) => item.empleado_id);

    if (idsAsignados.length === 0) {
      return NextResponse.json(
        { error: "No hay empleados asignados a este servicio." },
        { status: 400 }
      );
    }

    const { data: empleadosActivos, error: empleadosError } = await supabase
      .from("empleados")
      .select("id")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .in("id", idsAsignados);

    if (empleadosError) {
      return NextResponse.json({ error: empleadosError.message }, { status: 500 });
    }

    empleadosCandidatos = (empleadosActivos ?? []).map((empleado) => empleado.id);
  }

  if (empleadosCandidatos.length === 0) {
    return NextResponse.json(
      { error: "No hay empleados activos disponibles para este servicio." },
      { status: 400 }
    );
  }

  const horaFin = sumarMinutos(datos.horaInicio, servicio.duracion_minutos);

  let ultimoError: string | null = null;

  for (const candidatoId of empleadosCandidatos) {
    const { data: cita, error } = await supabase
      .from("citas")
      .insert({
        negocio_id: membresia.negocio_id,
        cliente_id: datos.clienteId,
        servicio_id: datos.servicioId,
        empleado_id: candidatoId,
        fecha: datos.fecha,
        hora_inicio: datos.horaInicio,
        hora_fin: horaFin,
        estado: "pendiente",
      })
      .select("id")
      .single();

    if (!error) {
      return NextResponse.json({ cita });
    }

    ultimoError = error.message;
  }

  return NextResponse.json(
    {
      error: ultimoError
        ? obtenerMensajeError(ultimoError)
        : "No se pudo crear la cita.",
    },
    { status: 400 }
  );
}