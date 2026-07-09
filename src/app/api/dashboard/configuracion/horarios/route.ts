import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const horarioSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  activo: z.boolean(),
  hora_apertura: z.string().nullable(),
  hora_cierre: z.string().nullable(),
});

const bodySchema = z.object({
  horarios: z.array(horarioSchema).length(7),
});

function normalizarHora(valor: string | null) {
  if (!valor) return null;
  return valor.slice(0, 5);
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
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de horarios inválidos." },
      { status: 400 }
    );
  }

  const { data: membresias, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id, rol")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (membresiaError) {
    return NextResponse.json(
      { error: membresiaError.message || "No se pudo validar tu negocio." },
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

  if (membresia.rol !== "admin") {
    return NextResponse.json(
      { error: "Solo un administrador puede modificar horarios." },
      { status: 403 }
    );
  }

  const horarios = parsed.data.horarios;

  for (const horario of horarios) {
    const horaApertura = horario.activo
      ? normalizarHora(horario.hora_apertura)
      : null;

    const horaCierre = horario.activo
      ? normalizarHora(horario.hora_cierre)
      : null;

    if (horario.activo && (!horaApertura || !horaCierre)) {
      return NextResponse.json(
        { error: "Los días activos deben tener hora de apertura y cierre." },
        { status: 400 }
      );
    }

    if (horario.activo && horaApertura! >= horaCierre!) {
      return NextResponse.json(
        { error: "La hora de cierre debe ser posterior a la apertura." },
        { status: 400 }
      );
    }

    const { data: existente, error: buscarError } = await supabase
      .from("horarios_negocio")
      .select("id")
      .eq("negocio_id", membresia.negocio_id)
      .eq("dia_semana", horario.dia_semana)
      .maybeSingle();

    if (buscarError) {
      return NextResponse.json(
        { error: buscarError.message },
        { status: 500 }
      );
    }

    if (existente) {
      const { error: updateError } = await supabase
        .from("horarios_negocio")
        .update({
          activo: horario.activo,
          hora_apertura: horaApertura,
          hora_cierre: horaCierre,
        })
        .eq("id", existente.id)
        .eq("negocio_id", membresia.negocio_id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("horarios_negocio")
        .insert({
          negocio_id: membresia.negocio_id,
          dia_semana: horario.dia_semana,
          activo: horario.activo,
          hora_apertura: horaApertura,
          hora_cierre: horaCierre,
        });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}