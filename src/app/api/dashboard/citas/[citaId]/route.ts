import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const citaUpdateSchema = z.object({
  clienteId: z.string().uuid("Cliente inválido.").optional(),
  servicioId: z.string().uuid("Servicio inválido.").optional(),
  empleadoId: z.string().uuid("Empleado inválido.").optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.").optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida.").optional(),
  estado: z
    .enum(["pendiente", "confirmada", "cancelada", "completada", "no_asistio"])
    .optional(),
});

function hora(valor: string) {
  return valor.slice(0, 5);
}

function sumarMinutos(horaInicio: string, minutos: number) {
  const [hh, mm] = horaInicio.split(":").map(Number);
  const total = hh * 60 + mm + minutos;

  const nuevaHora = Math.floor(total / 60);
  const nuevosMinutos = total % 60;

  return `${String(nuevaHora).padStart(2, "0")}:${String(nuevosMinutos).padStart(2, "0")}`;
}

function horaAMinutos(valor: string) {
  const [hh, mm] = valor.slice(0, 5).split(":").map(Number);
  return hh * 60 + mm;
}

function ahoraParaguay() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  const fecha = `${get("year")}-${get("month")}-${get("day")}`;
  const horaActual = `${get("hour")}:${get("minute")}`;

  return {
    fecha,
    minutos: horaAMinutos(horaActual),
  };
}

function validarNoPasado(fecha: string, horaInicio: string) {
  const ahora = ahoraParaguay();

  if (fecha < ahora.fecha) {
    return "No podés mover una cita a una fecha pasada.";
  }

  if (fecha === ahora.fecha && horaAMinutos(horaInicio) <= ahora.minutos) {
    return "No podés mover una cita a una hora que ya pasó.";
  }

  return null;
}

function mensajeErrorCita(error: string) {
  const texto = error.toLowerCase();

  if (texto.includes("límite") || texto.includes("limite")) {
    return "Tu plan actual ya alcanzó el límite permitido.";
  }

  if (texto.includes("horario del negocio")) {
    return "La cita está fuera del horario del negocio.";
  }

  if (texto.includes("horario del empleado")) {
    return "La cita está fuera del horario del empleado.";
  }

  if (texto.includes("solap") || texto.includes("ocupado")) {
    return "Ese empleado ya tiene una cita en ese horario.";
  }

  if (texto.includes("bloqueo")) {
    return "Ese horario está bloqueado.";
  }

  return error;
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
    return NextResponse.json(
      { error: "No estás autenticado." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = citaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json(
      { error: "No se enviaron cambios." },
      { status: 400 }
    );
  }

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .single();

  if (membresiaError || !membresia) {
    return NextResponse.json(
      { error: "No tenés un negocio activo." },
      { status: 403 }
    );
  }

  const { data: citaActual, error: citaError } = await supabase
    .from("citas")
    .select(
      "id, negocio_id, cliente_id, servicio_id, empleado_id, fecha, hora_inicio, hora_fin, estado"
    )
    .eq("id", citaId)
    .eq("negocio_id", membresia.negocio_id)
    .single();

  if (citaError || !citaActual) {
    return NextResponse.json(
      { error: "No se encontró la cita." },
      { status: 404 }
    );
  }

  const clienteIdFinal = payload.clienteId ?? citaActual.cliente_id;
  const servicioIdFinal = payload.servicioId ?? citaActual.servicio_id;
  const empleadoIdFinal = payload.empleadoId ?? citaActual.empleado_id;
  const fechaFinal = payload.fecha ?? citaActual.fecha;
  const horaInicioFinal = payload.horaInicio ?? hora(citaActual.hora_inicio);

  if (payload.fecha || payload.horaInicio) {
    const errorFecha = validarNoPasado(fechaFinal, horaInicioFinal);

    if (errorFecha) {
      return NextResponse.json({ error: errorFecha }, { status: 400 });
    }
  }

  if (payload.clienteId) {
    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", clienteIdFinal)
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .maybeSingle();

    if (clienteError || !cliente) {
      return NextResponse.json(
        { error: "El cliente seleccionado no está activo o no existe." },
        { status: 400 }
      );
    }
  }

  const necesitaValidarServicio =
    Boolean(payload.servicioId) ||
    Boolean(payload.empleadoId) ||
    Boolean(payload.fecha) ||
    Boolean(payload.horaInicio);

  let duracionMinutos: number | null = null;

  if (necesitaValidarServicio) {
    const { data: servicio, error: servicioError } = await supabase
      .from("servicios")
      .select("id, duracion_minutos")
      .eq("id", servicioIdFinal)
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .maybeSingle();

    if (servicioError || !servicio) {
      return NextResponse.json(
        { error: "El servicio seleccionado no está activo o no existe." },
        { status: 400 }
      );
    }

    duracionMinutos = Number(servicio.duracion_minutos);
  }

  if (payload.empleadoId || payload.servicioId) {
    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .select("id")
      .eq("id", empleadoIdFinal)
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo")
      .maybeSingle();

    if (empleadoError || !empleado) {
      return NextResponse.json(
        { error: "El empleado seleccionado no está activo o no existe." },
        { status: 400 }
      );
    }

    const { data: relacion, error: relacionError } = await supabase
      .from("empleado_servicios")
      .select("empleado_id, servicio_id")
      .eq("empleado_id", empleadoIdFinal)
      .eq("servicio_id", servicioIdFinal)
      .maybeSingle();

    if (relacionError || !relacion) {
      return NextResponse.json(
        { error: "Ese empleado no tiene asignado el servicio seleccionado." },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, string> = {};

  if (payload.clienteId) updateData.cliente_id = clienteIdFinal;
  if (payload.servicioId) updateData.servicio_id = servicioIdFinal;
  if (payload.empleadoId) updateData.empleado_id = empleadoIdFinal;
  if (payload.estado) updateData.estado = payload.estado;

  if (payload.fecha || payload.horaInicio || payload.servicioId) {
    if (duracionMinutos === null) {
      const { data: servicio, error: servicioError } = await supabase
        .from("servicios")
        .select("duracion_minutos")
        .eq("id", servicioIdFinal)
        .eq("negocio_id", membresia.negocio_id)
        .single();

      if (servicioError || !servicio) {
        return NextResponse.json(
          { error: "No se pudo obtener la duración del servicio." },
          { status: 400 }
        );
      }

      duracionMinutos = Number(servicio.duracion_minutos);
    }

    updateData.fecha = fechaFinal;
    updateData.hora_inicio = horaInicioFinal;
    updateData.hora_fin = sumarMinutos(horaInicioFinal, duracionMinutos);
  }

  const { data: citaActualizada, error: updateError } = await supabase
    .from("citas")
    .update(updateData)
    .eq("id", citaId)
    .eq("negocio_id", membresia.negocio_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: mensajeErrorCita(updateError.message) },
      { status: 400 }
    );
  }

  return NextResponse.json({
    message: "Cita actualizada correctamente.",
    cita: citaActualizada,
  });
}