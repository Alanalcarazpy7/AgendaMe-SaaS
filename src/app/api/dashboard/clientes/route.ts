import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { validarCapacidadPlan } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Payload = {
  id?: string;
  nombre_completo?: string;
  telefono?: string;
  email?: string;
  estado?: string;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

export async function POST(request: Request) {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;

    if (!access.puedeGestionarClientes) {
      return NextResponse.json(
        { error: "No tenés permiso para crear clientes." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;

    const nombre = limpiar(body.nombre_completo);
    const telefono = limpiar(body.telefono);
    const email = limpiar(body.email);

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del cliente es obligatorio." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const capacidad = await validarCapacidadPlan({
      supabase,
      negocioId: access.negocio.id,
      recurso: "clientes",
    });

    if (!capacidad.ok) {
      return NextResponse.json(
        { error: capacidad.message },
        { status: 403 }
      );
    }

    const { data: cliente, error } = await supabase
      .from("clientes")
      .insert({
        negocio_id: access.negocio.id,
        nombre_completo: nombre,
        telefono: telefono || null,
        email: email || null,
        estado: "activo",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    if (access.scope === "sucursal" && access.sucursalId) {
      await supabase
        .from("cliente_sucursales")
        .insert({
          negocio_id: access.negocio.id,
          cliente_id: cliente.id,
          sucursal_id: access.sucursalId,
        });
    }

    return NextResponse.json({ message: "Cliente creado correctamente." });
  } catch (error) {
    console.error("Error creando cliente:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo crear el cliente.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;

    if (!access.puedeGestionarClientes) {
      return NextResponse.json(
        { error: "No tenés permiso para editar clientes." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;

    const id = limpiar(body.id);
    const nombre = limpiar(body.nombre_completo);
    const telefono = limpiar(body.telefono);
    const email = limpiar(body.email);
    const estado = limpiar(body.estado) || "activo";

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del cliente." },
        { status: 400 }
      );
    }

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del cliente es obligatorio." },
        { status: 400 }
      );
    }

    if (!["activo", "inactivo"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    if (estado === "activo") {
      const { data: clienteActual, error: clienteActualError } = await supabase
        .from("clientes")
        .select("estado")
        .eq("id", id)
        .eq("negocio_id", access.negocio.id)
        .maybeSingle();

      if (clienteActualError) throw new Error(clienteActualError.message);

      if (clienteActual?.estado !== "activo") {
        const capacidad = await validarCapacidadPlan({
          supabase,
          negocioId: access.negocio.id,
          recurso: "clientes",
        });

        if (!capacidad.ok) {
          return NextResponse.json(
            { error: capacidad.message },
            { status: 403 }
          );
        }
      }
    }

    if (access.scope === "sucursal" && access.sucursalId) {
      const { data: permitido, error: permisoError } = await supabase
        .from("cliente_sucursales")
        .select("id")
        .eq("negocio_id", access.negocio.id)
        .eq("cliente_id", id)
        .eq("sucursal_id", access.sucursalId)
        .maybeSingle();

      if (permisoError) throw new Error(permisoError.message);

      if (!permitido) {
        return NextResponse.json(
          { error: "No podés editar clientes de otra sucursal." },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("clientes")
      .update({
        nombre_completo: nombre,
        telefono: telefono || null,
        email: email || null,
        estado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("negocio_id", access.negocio.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "Cliente actualizado correctamente." });
  } catch (error) {
    console.error("Error editando cliente:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo editar el cliente.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
