import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const horarioSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  activo: z.boolean(),
  hora_inicio: z.string().nullable(),
  hora_fin: z.string().nullable(),
});

const empleadoSchema = z.object({
  nombre: z.string().min(2, "Ingresá el nombre del empleado."),
  email: z.string().email("Correo inválido.").optional().or(z.literal("")),
  telefono: z.string().optional(),
  color: z.string().optional(),
  serviciosIds: z.array(z.string().uuid()).optional(),
  horarios: z.array(horarioSchema).length(7).optional(),
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

function obtenerMensajeError(errorMessage: string) {
  const mensaje = errorMessage.toLowerCase();

  if (mensaje.includes("limite") || mensaje.includes("límite")) {
    return "No podés crear más empleados con tu plan actual.";
  }

  if (mensaje.includes("duplicate") || mensaje.includes("unique")) {
    return "Ya existe un empleado con esos datos.";
  }

  return errorMessage;
}

function validarHorarios(
  horarios: z.infer<typeof horarioSchema>[]
): string | null {
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

export async function POST(request: NextRequest) {
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
  const parsed = empleadoSchema.safeParse(body);

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

  const datos = parsed.data;
  const horarios = datos.horarios ?? [];

  if (horarios.length > 0) {
    const errorHorarios = validarHorarios(horarios);

    if (errorHorarios) {
      return NextResponse.json({ error: errorHorarios }, { status: 400 });
    }
  }

  const { data: empleado, error: empleadoError } = await supabase
    .from("empleados")
    .insert({
      negocio_id: membresia.negocio_id,
      nombre: datos.nombre.trim(),
      email: limpiarEmail(datos.email),
      telefono: limpiarTexto(datos.telefono),
      color_calendario: limpiarTexto(datos.color) ?? "#2563eb",
    })
    .select("id, nombre")
    .single();

  if (empleadoError) {
    return NextResponse.json(
      { error: obtenerMensajeError(empleadoError.message) },
      { status: 500 }
    );
  }

  const serviciosIds = datos.serviciosIds ?? [];

  if (serviciosIds.length > 0) {
    const registros = serviciosIds.map((servicioId) => ({
      empleado_id: empleado.id,
      servicio_id: servicioId,
    }));

    const { error: serviciosError } = await supabase
      .from("empleado_servicios")
      .insert(registros);

    if (serviciosError) {
      return NextResponse.json(
        { error: serviciosError.message },
        { status: 500 }
      );
    }
  }

  if (horarios.length > 0) {
    const registrosHorarios = horarios.map((horario) => ({
      empleado_id: empleado.id,
      dia_semana: horario.dia_semana,
      activo: horario.activo,
      hora_inicio: horario.activo ? normalizarHora(horario.hora_inicio) : null,
      hora_fin: horario.activo ? normalizarHora(horario.hora_fin) : null,
      descanso_inicio: null,
      descanso_fin: null,
    }));

    const { error: horariosError } = await supabase
      .from("horarios_empleado")
      .insert(registrosHorarios);

    if (horariosError) {
      return NextResponse.json(
        { error: horariosError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ empleado });
}