import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const citaUpdateSchema = z.object({
  estado: z.enum(["pendiente", "confirmada", "cancelada", "completada", "no_asistio"]),
});

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
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
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

  const { data: cita, error } = await supabase
    .from("citas")
    .update({
      estado: parsed.data.estado,
    })
    .eq("id", citaId)
    .eq("negocio_id", membresia.negocio_id)
    .select("id, estado")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cita });
}