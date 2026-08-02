import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const informacionSchema = z.object({
  telefono: z.string().trim().max(40, "El teléfono es demasiado largo."),
  direccion: z.string().trim().max(180, "La ubicación es demasiado larga."),
  descripcion: z
    .string()
    .trim()
    .max(280, "La descripción no puede superar los 280 caracteres."),
});

function textoNullable(valor: string) {
  return valor || null;
}

export async function PATCH(request: Request) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  if (!guard.access.puedeGestionarConfiguracion) {
    return NextResponse.json(
      { error: "No tenés permiso para modificar la información del negocio." },
      { status: 403 },
    );
  }

  try {
    const parsed = informacionSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Revisá los datos ingresados." },
        { status: 400 },
      );
    }

    const informacion = {
      telefono: textoNullable(parsed.data.telefono),
      direccion: textoNullable(parsed.data.direccion),
      descripcion: textoNullable(parsed.data.descripcion),
    };
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("negocios")
      .update(informacion)
      .eq("id", guard.access.negocio.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Información actualizada correctamente.",
      informacion,
    });
  } catch (error) {
    console.error("Error actualizando información del negocio:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? error.message
            : "No se pudo actualizar la información.",
      },
      { status: 400 },
    );
  }
}
