import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { nivelPlan } from "@/lib/planes/plan-access";

type Payload = {
  id?: string;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  estado?: string;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

async function getContext() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado.", status: 401 as const };
  }

  const supabase = createServiceRoleClient();

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError) throw new Error(membresiaError.message);

  if (!membresia) {
    return { error: "No tenés un negocio activo.", status: 404 as const };
  }

  const { data: suscripcion, error: suscripcionError } = await supabase
    .from("suscripciones")
    .select("plan_id")
    .eq("negocio_id", membresia.negocio_id)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (suscripcionError) throw new Error(suscripcionError.message);

  let planClave = "gratis";

  if (suscripcion?.plan_id) {
    const { data: plan, error: planError } = await supabase
      .from("planes_saas")
      .select("clave")
      .eq("id", suscripcion.plan_id)
      .maybeSingle();

    if (planError) throw new Error(planError.message);

    planClave = plan?.clave ?? "gratis";
  }

  if (nivelPlan(planClave) < 3) {
    return {
      error: "La gestión de sucursales está disponible desde el Plan Empresarial.",
      status: 403 as const,
    };
  }

  return {
    supabase,
    negocioId: membresia.negocio_id as string,
  };
}

export async function GET() {
  try {
    const context = await getContext();

    if ("error" in context) {
      return NextResponse.json(
        { error: context.error },
        { status: context.status }
      );
    }

    const { supabase, negocioId } = context;

    await supabase.rpc("obtener_o_crear_sucursal_principal", {
      p_negocio_id: negocioId,
    });

    const { data, error } = await supabase
      .from("sucursales")
      .select("id, nombre, direccion, telefono, estado, es_principal, created_at")
      .eq("negocio_id", negocioId)
      .order("es_principal", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ sucursales: data ?? [] });
  } catch (error) {
    console.error("Error listando sucursales:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar las sucursales." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getContext();

    if ("error" in context) {
      return NextResponse.json(
        { error: context.error },
        { status: context.status }
      );
    }

    const { supabase, negocioId } = context;
    const body = (await request.json()) as Payload;

    const nombre = limpiar(body.nombre);
    const direccion = limpiar(body.direccion);
    const telefono = limpiar(body.telefono);

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre de la sucursal es obligatorio." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("sucursales").insert({
      negocio_id: negocioId,
      nombre,
      direccion: direccion || null,
      telefono: telefono || null,
      estado: "activo",
      es_principal: false,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Sucursal creada correctamente." });
  } catch (error) {
    console.error("Error creando sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo crear la sucursal." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getContext();

    if ("error" in context) {
      return NextResponse.json(
        { error: context.error },
        { status: context.status }
      );
    }

    const { supabase, negocioId } = context;
    const body = (await request.json()) as Payload;

    const id = limpiar(body.id);
    const nombre = limpiar(body.nombre);
    const direccion = limpiar(body.direccion);
    const telefono = limpiar(body.telefono);
    const estado = limpiar(body.estado) || "activo";

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID de la sucursal." },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre de la sucursal es obligatorio." },
        { status: 400 }
      );
    }

    if (!["activo", "inactivo"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    const { data: sucursalActual, error: sucursalError } = await supabase
      .from("sucursales")
      .select("id, es_principal")
      .eq("id", id)
      .eq("negocio_id", negocioId)
      .maybeSingle();

    if (sucursalError) throw new Error(sucursalError.message);

    if (!sucursalActual) {
      return NextResponse.json(
        { error: "Sucursal no encontrada." },
        { status: 404 }
      );
    }

    if (sucursalActual.es_principal && estado === "inactivo") {
      return NextResponse.json(
        { error: "La sucursal principal no se puede desactivar." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("sucursales")
      .update({
        nombre,
        direccion: direccion || null,
        telefono: telefono || null,
        estado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("negocio_id", negocioId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Sucursal actualizada correctamente." });
  } catch (error) {
    console.error("Error actualizando sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la sucursal." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getContext();

    if ("error" in context) {
      return NextResponse.json(
        { error: context.error },
        { status: context.status }
      );
    }

    const { supabase, negocioId } = context;
    const body = (await request.json()) as Payload;

    const id = limpiar(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID de la sucursal." },
        { status: 400 }
      );
    }

    const { data: sucursalActual, error: sucursalError } = await supabase
      .from("sucursales")
      .select("id, es_principal")
      .eq("id", id)
      .eq("negocio_id", negocioId)
      .maybeSingle();

    if (sucursalError) throw new Error(sucursalError.message);

    if (!sucursalActual) {
      return NextResponse.json(
        { error: "Sucursal no encontrada." },
        { status: 404 }
      );
    }

    if (sucursalActual.es_principal) {
      return NextResponse.json(
        { error: "La sucursal principal no se puede desactivar." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("sucursales")
      .update({
        estado: "inactivo",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("negocio_id", negocioId);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Sucursal desactivada correctamente." });
  } catch (error) {
    console.error("Error desactivando sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo desactivar la sucursal." },
      { status: 500 }
    );
  }
}