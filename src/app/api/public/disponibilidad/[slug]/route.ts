import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { calcularDisponibilidadReserva } from "@/lib/reservas/disponibilidad";

type DisponibilidadRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: DisponibilidadRouteProps) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const servicioId = searchParams.get("servicioId") ?? "";
    const fecha = searchParams.get("fecha") ?? "";

    const supabase = createServiceRoleClient();

    const resultado = await calcularDisponibilidadReserva({
      supabase,
      slug,
      servicioId,
      fecha,
    });

    if (resultado.error) {
      return NextResponse.json(
        {
          error: resultado.error,
          slots: [],
        },
        {
          status: resultado.status ?? 400,
        }
      );
    }

    return NextResponse.json({
      slots: resultado.slots.map((slot) => slot.hora),
    });
  } catch (error) {
    console.error("Error calculando disponibilidad pública:", error);

    return NextResponse.json(
      {
        error: "No se pudo calcular la disponibilidad.",
        slots: [],
      },
      {
        status: 500,
      }
    );
  }
}