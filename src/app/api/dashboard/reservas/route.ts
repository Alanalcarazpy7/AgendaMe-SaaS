import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { listarReservasDashboard } from "@/lib/reservas/dashboard-reservas";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;

    const access = accessGuard.access;

    if (!access.puedeGestionarReservas) {
      return NextResponse.json(
        { error: "No tenés permiso para consultar reservas." },
        { status: 403 },
      );
    }

    const reservas = await listarReservasDashboard(
      createServiceRoleClient(),
      access,
    );

    return NextResponse.json(
      { reservas },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error actualizando reservas:", error);

    return NextResponse.json(
      { error: "No se pudieron actualizar las reservas." },
      { status: 500 },
    );
  }
}
