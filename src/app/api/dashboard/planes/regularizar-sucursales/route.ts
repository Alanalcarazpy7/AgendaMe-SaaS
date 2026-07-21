import { NextResponse } from "next/server";
import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Payload = {
  sucursalId?: string;
  sucursal_id?: string;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireAdminGlobalApi();

    if (!guard.ok) return guard.response;

    if (!guard.access.puedeGestionarPlanes) {
      return NextResponse.json(
        { error: "No tenés permiso para regularizar el plan." },
        { status: 403 }
      );
    }

    if (guard.access.planNivel >= 3) {
      return NextResponse.json(
        { error: "Las sucursales se gestionan desde el módulo Sucursales." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;
    const sucursalId = limpiar(body.sucursalId ?? body.sucursal_id);

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Falta la sucursal a regularizar." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: sucursal, error: sucursalError } = await supabase
      .from("sucursales")
      .select("id, es_principal, estado")
      .eq("id", sucursalId)
      .eq("negocio_id", guard.access.negocio.id)
      .maybeSingle();

    if (sucursalError) throw new Error(sucursalError.message);

    if (!sucursal) {
      return NextResponse.json(
        { error: "La sucursal no existe o no pertenece a este negocio." },
        { status: 404 }
      );
    }

    if (sucursal.es_principal) {
      return NextResponse.json(
        { error: "La sucursal principal no se puede desactivar." },
        { status: 400 }
      );
    }

    if (sucursal.estado !== "activo") {
      return NextResponse.json({
        message: "La sucursal ya estaba desactivada.",
      });
    }

    const { error } = await supabase
      .from("sucursales")
      .update({
        estado: "inactivo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sucursalId)
      .eq("negocio_id", guard.access.negocio.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Sucursal desactivada correctamente.",
    });
  } catch (error) {
    console.error("Error regularizando sucursales:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo regularizar la sucursal.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
