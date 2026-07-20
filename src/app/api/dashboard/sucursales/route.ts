import { NextResponse } from "next/server";
import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validarCapacidadPlan } from "@/lib/planes/plan-limits";

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
  const guard = await requireAdminGlobalApi();

  if (!guard.ok) {
    return {
      error:
        guard.response.status === 401
          ? "No autenticado."
          : "No tenés permiso para gestionar sucursales.",
      status: guard.response.status as 401 | 403,
    };
  }

  if (!guard.access.puedeGestionarSucursales) {
    return {
      error: "La gestión de sucursales está disponible desde el Plan Empresarial.",
      status: 403 as const,
    };
  }

  return {
    supabase: createServiceRoleClient(),
    negocioId: guard.access.negocio.id,
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

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudieron cargar las sucursales.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
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

    const capacidad = await validarCapacidadPlan({
      supabase,
      negocioId,
      recurso: "sucursales",
    });

    if (!capacidad.ok) {
      return NextResponse.json(
        { error: capacidad.message },
        { status: 403 }
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

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo crear la sucursal.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
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
      .select("id, es_principal, estado")
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

    if (estado === "activo" && sucursalActual.estado !== "activo") {
      const capacidad = await validarCapacidadPlan({
        supabase,
        negocioId,
        recurso: "sucursales",
      });

      if (!capacidad.ok) {
        return NextResponse.json(
          { error: capacidad.message },
          { status: 403 }
        );
      }
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

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo actualizar la sucursal.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
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

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo desactivar la sucursal.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
