import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

function validarIntervalo(valor: unknown) {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < 5 ||
    numero > 120 ||
    numero % 5 !== 0
  ) {
    return null;
  }

  return numero;
}

export async function GET() {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  try {
    const supabase = createServiceRoleClient();

    const { data: negocio, error } = await supabase
      .from("negocios")
      .select("intervalo_reserva_minutos")
      .eq("id", guard.access.negocio.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      intervaloReservaMinutos: negocio?.intervalo_reserva_minutos ?? 30,
    });
  } catch (error) {
    console.error("Error obteniendo intervalo de reserva:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo obtener la configuración.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  try {
    const body = await request.json();
    const intervalo = validarIntervalo(body.intervaloReservaMinutos);

    if (!intervalo) {
      return NextResponse.json(
        {
          error:
            "El intervalo debe ser un número entre 5 y 120 minutos, múltiplo de 5.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("negocios")
      .update({
        intervalo_reserva_minutos: intervalo,
      })
      .eq("id", guard.access.negocio.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      message: "Intervalo actualizado correctamente.",
      intervaloReservaMinutos: intervalo,
    });
  } catch (error) {
    console.error("Error actualizando intervalo de reserva:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo actualizar el intervalo.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
