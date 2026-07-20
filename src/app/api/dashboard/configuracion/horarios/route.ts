import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de horarios inválidos." },
      { status: 400 }
    );
  }

  if (!guard.access.puedeGestionarConfiguracion) {
    return NextResponse.json(
      { error: "No tenés permiso para modificar la configuración del negocio." },
      { status: 403 }
    );
  }

  const supabase = createServiceRoleClient();
  const negocioId = guard.access.negocio.id;
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
      .eq("negocio_id", negocioId)
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
        .eq("negocio_id", negocioId);

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
          negocio_id: negocioId,
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
