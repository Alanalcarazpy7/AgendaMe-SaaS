import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

async function obtenerNegocioIdDelUsuario() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return {
      negocioId: null,
      error: "No autenticado.",
      status: 401,
    };
  }

  const supabase = createServiceRoleClient();

  const { data: membresia, error } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!membresia) {
    return {
      negocioId: null,
      error: "No tenés un negocio activo.",
      status: 404,
    };
  }

  return {
    negocioId: membresia.negocio_id as string,
    error: null,
    status: 200,
  };
}

export async function GET() {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;


  try {
    const resultado = await obtenerNegocioIdDelUsuario();

    if (resultado.error || !resultado.negocioId) {
      return NextResponse.json(
        { error: resultado.error },
        { status: resultado.status }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: servicios, error } = await supabase
      .from("servicios")
      .select("id, nombre, descripcion, estado, imagen_url")
      .eq("negocio_id", resultado.negocioId)
      .order("nombre", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      servicios: servicios ?? [],
    });
  } catch (error) {
    console.error("Error listando imágenes de servicios:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudieron cargar los servicios.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}