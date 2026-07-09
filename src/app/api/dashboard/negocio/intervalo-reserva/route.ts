import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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

async function obtenerNegocioDelUsuario() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return {
      error: "No autenticado.",
      status: 401,
      negocioId: null,
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
      error: "No tenés un negocio activo.",
      status: 404,
      negocioId: null,
    };
  }

  return {
    error: null,
    status: 200,
    negocioId: membresia.negocio_id as string,
  };
}

export async function GET() {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;


  try {
    const resultado = await obtenerNegocioDelUsuario();

    if (resultado.error || !resultado.negocioId) {
      return NextResponse.json(
        {
          error: resultado.error,
        },
        {
          status: resultado.status,
        }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: negocio, error } = await supabase
      .from("negocios")
      .select("intervalo_reserva_minutos")
      .eq("id", resultado.negocioId)
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

    const resultado = await obtenerNegocioDelUsuario();

    if (resultado.error || !resultado.negocioId) {
      return NextResponse.json(
        {
          error: resultado.error,
        },
        {
          status: resultado.status,
        }
      );
    }

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("negocios")
      .update({
        intervalo_reserva_minutos: intervalo,
      })
      .eq("id", resultado.negocioId);

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