import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const horarioSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  activo: z.boolean(),
  hora_inicio: z.string().nullable(),
  hora_fin: z.string().nullable(),
});

const empleadoUpdateSchema = z.object({
  nombre: z.string().min(2, "Ingresá el nombre del empleado.").optional(),
  email: z.string().email("Correo inválido.").optional().or(z.literal("")),
  telefono: z.string().optional(),
  color: z.string().optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
  serviciosIds: z.array(z.string().uuid()).optional(),
  horarios: z.array(horarioSchema).length(7).nullable().optional(),
});

function limpiarTexto(valor?: string) {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function limpiarEmail(valor?: string) {
  const limpio = valor?.trim().toLowerCase();
  return limpio ? limpio : null;
}

function normalizarHora(valor: string | null) {
  if (!valor) return null;
  return valor.slice(0, 5);
}

function tieneCampo(objeto: object, campo: string) {
  return Object.prototype.hasOwnProperty.call(objeto, campo);
}

function validarHorarios(horarios: z.infer<typeof horarioSchema>[]) {
  for (const horario of horarios) {
    const inicio = horario.activo ? normalizarHora(horario.hora_inicio) : null;
    const fin = horario.activo ? normalizarHora(horario.hora_fin) : null;

    if (horario.activo && (!inicio || !fin)) {
      return "Los días activos deben tener hora de inicio y fin.";
    }

    if (horario.activo && inicio! >= fin!) {
      return "La hora de salida debe ser posterior a la hora de entrada.";
    }
  }

  return null;
}

function obtenerMensajeError(errorMessage: string) {
  const mensaje = errorMessage.toLowerCase();

  if (mensaje.includes("limite") || mensaje.includes("límite")) {
    return "No podés activar o crear más empleados con tu plan actual.";
  }

  if (mensaje.includes("duplicate") || mensaje.includes("unique")) {
    return "Ya existe un empleado con esos datos.";
  }

  return errorMessage;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ empleadoId: string }> }
) {
  const { empleadoId } = await context.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "No tenés sesión activa." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = empleadoUpdateSchema.safeParse(body);

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
    return NextResponse.json(
      { error: "No se pudo validar tu negocio." },
      { status: 500 }
    );
  }

  const membresia = membresias?.[0];

  if (!membresia) {
    return NextResponse.json(
      { error: "No tenés un negocio activo." },
      { status: 403 }
    );
  }

  const { data: empleadoExistente, error: empleadoExisteError } = await supabase
    .from("empleados")
    .select("id, negocio_id")
    .eq("id", empleadoId)
    .eq("negocio_id", membresia.negocio_id)
    .single();

  if (empleadoExisteError || !empleadoExistente) {
    return NextResponse.json(
      { error: "Empleado no encontrado en este negocio." },
      { status: 404 }
    );
  }

  const datos = parsed.data;
  const updateData: Record<string, string | null> = {};

  if (tieneCampo(datos, "nombre")) {
    updateData.nombre = datos.nombre!.trim();
  }

  if (tieneCampo(datos, "email")) {
    updateData.email = limpiarEmail(datos.email);
  }

  if (tieneCampo(datos, "telefono")) {
    updateData.telefono = limpiarTexto(datos.telefono);
  }

  if (tieneCampo(datos, "color")) {
    updateData.color_calendario = limpiarTexto(datos.color) ?? "#2563eb";
  }

  if (tieneCampo(datos, "estado")) {
    updateData.estado = datos.estado ?? null;
  }

  if (Object.keys(updateData).length > 0) {
    const { error: empleadoError } = await supabase
      .from("empleados")
      .update(updateData)
      .eq("id", empleadoId)
      .eq("negocio_id", membresia.negocio_id);

    if (empleadoError) {
      return NextResponse.json(
        { error: obtenerMensajeError(empleadoError.message) },
        { status: 500 }
      );
    }
  }

  if (tieneCampo(datos, "serviciosIds")) {
    const serviciosIds = datos.serviciosIds ?? [];

    const { error: deleteServiciosError } = await supabase
      .from("empleado_servicios")
      .delete()
      .eq("empleado_id", empleadoId);

    if (deleteServiciosError) {
      return NextResponse.json(
        { error: deleteServiciosError.message },
        { status: 500 }
      );
    }

    if (serviciosIds.length > 0) {
      const registrosServicios = serviciosIds.map((servicioId) => ({
        empleado_id: empleadoId,
        servicio_id: servicioId,
      }));

      const { error: insertServiciosError } = await supabase
        .from("empleado_servicios")
        .insert(registrosServicios);

      if (insertServiciosError) {
        return NextResponse.json(
          { error: insertServiciosError.message },
          { status: 500 }
        );
      }
    }
  }

  if (tieneCampo(datos, "horarios")) {
    const horarios = datos.horarios;

    const { error: deleteHorariosError } = await supabase
      .from("horarios_empleado")
      .delete()
      .eq("empleado_id", empleadoId);

    if (deleteHorariosError) {
      return NextResponse.json(
        { error: deleteHorariosError.message },
        { status: 500 }
      );
    }

    if (horarios && horarios.length > 0) {
      const errorHorarios = validarHorarios(horarios);

      if (errorHorarios) {
        return NextResponse.json({ error: errorHorarios }, { status: 400 });
      }

      const registrosHorarios = horarios.map((horario) => ({
        empleado_id: empleadoId,
        dia_semana: horario.dia_semana,
        activo: horario.activo,
        hora_inicio: horario.activo ? normalizarHora(horario.hora_inicio) : null,
        hora_fin: horario.activo ? normalizarHora(horario.hora_fin) : null,
        descanso_inicio: null,
        descanso_fin: null,
      }));

      const { error: insertHorariosError } = await supabase
        .from("horarios_empleado")
        .insert(registrosHorarios);

      if (insertHorariosError) {
        return NextResponse.json(
          { error: insertHorariosError.message },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}