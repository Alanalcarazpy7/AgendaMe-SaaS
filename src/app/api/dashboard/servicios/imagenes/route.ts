import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

export async function GET() {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  try {
    const supabase = createServiceRoleClient();

    const { data: servicios, error } = await supabase
      .from("servicios")
      .select("id, nombre, descripcion, estado, imagen_url")
      .eq("negocio_id", guard.access.negocio.id)
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
