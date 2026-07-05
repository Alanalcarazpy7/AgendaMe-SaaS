import { NextResponse } from "next/server";
import { calcularDisponibilidadReserva } from "@/lib/reservas/disponibilidad";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);

    const servicioId = searchParams.get("servicioId") ?? "";
    const fecha = searchParams.get("fecha") ?? "";
    const sucursalId = searchParams.get("sucursalId");

    if (!servicioId || !fecha) {
      return NextResponse.json(
        { error: "Faltan datos para consultar disponibilidad." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const disponibilidad = await calcularDisponibilidadReserva({
      supabase,
      slug,
      servicioId,
      fecha,
      sucursalId,
    });

    return NextResponse.json({
      slots: disponibilidad.slots,
      sucursalId: disponibilidad.sucursalId,
    });
  } catch (error) {
    console.error("Error consultando disponibilidad:", error);

    return NextResponse.json(
      { error: "No se pudo consultar la disponibilidad." },
      { status: 500 }
    );
  }
}