import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { validarCapacidadPlan } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const clienteUpdateSchema = z.object({
  nombreCompleto: z.string().min(2, "Ingresá el nombre del cliente.").optional(),
  telefono: z.string().optional(),
  email: z.string().email("Correo inválido.").optional().or(z.literal("")),
  documento: z.string().optional(),
  notasInternas: z.string().optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

function limpiarTexto(valor?: string) {
  const limpio = valor?.trim();
  return limpio ? limpio : null;
}

function limpiarEmail(valor?: string) {
  const limpio = valor?.trim().toLowerCase();
  return limpio ? limpio : null;
}

function tieneCampo(objeto: object, campo: string) {
  return Object.prototype.hasOwnProperty.call(objeto, campo);
}

function obtenerMensajeDuplicado(errorMessage: string) {
  const mensaje = errorMessage.toLowerCase();

  if (
    mensaje.includes("telefono") ||
    mensaje.includes("idx_clientes_negocio_telefono_unico")
  ) {
    return "Ya existe un cliente con ese teléfono en este negocio.";
  }

  if (
    mensaje.includes("email") ||
    mensaje.includes("correo") ||
    mensaje.includes("idx_clientes_negocio_email_unico")
  ) {
    return "Ya existe un cliente con ese correo en este negocio.";
  }

  if (
    mensaje.includes("documento") ||
    mensaje.includes("idx_clientes_negocio_documento_unico")
  ) {
    return "Ya existe un cliente con ese documento en este negocio.";
  }

  return "Ya existe un cliente con esos datos en este negocio.";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ clienteId: string }> }
) {
  const { clienteId } = await context.params;

  const guard = await requireApiDashboardAccess();
  if (!guard.ok) return guard.response;

  if (!guard.access.puedeGestionarClientes) {
    return NextResponse.json(
      { error: "No tenés permiso para modificar clientes." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = clienteUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const negocioId = guard.access.negocio.id;
  const datos = parsed.data;

  if (guard.access.scope === "sucursal" && guard.access.sucursalId) {
    const { data: permitido, error: permisoError } = await supabase
      .from("cliente_sucursales")
      .select("id")
      .eq("negocio_id", negocioId)
      .eq("cliente_id", clienteId)
      .eq("sucursal_id", guard.access.sucursalId)
      .maybeSingle();

    if (permisoError) {
      return NextResponse.json(
        { error: permisoError.message },
        { status: 500 }
      );
    }

    if (!permitido) {
      return NextResponse.json(
        { error: "No podés editar clientes de otra sucursal." },
        { status: 403 }
      );
    }
  }

  if (datos.estado === "activo") {
    const { data: clienteActual, error: clienteActualError } = await supabase
      .from("clientes")
      .select("estado")
      .eq("id", clienteId)
      .eq("negocio_id", negocioId)
      .maybeSingle();

    if (clienteActualError) {
      return NextResponse.json(
        { error: clienteActualError.message },
        { status: 500 }
      );
    }

    if (clienteActual?.estado !== "activo") {
      const capacidad = await validarCapacidadPlan({
        supabase,
        negocioId,
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

  const updateData: Record<string, string | null> = {};

  if (tieneCampo(datos, "nombreCompleto")) {
    updateData.nombre_completo = datos.nombreCompleto!.trim();
  }

  if (tieneCampo(datos, "telefono")) {
    updateData.telefono = limpiarTexto(datos.telefono);
  }

  if (tieneCampo(datos, "email")) {
    updateData.email = limpiarEmail(datos.email);
  }

  if (tieneCampo(datos, "documento")) {
    updateData.documento = limpiarTexto(datos.documento);
  }

  if (tieneCampo(datos, "notasInternas")) {
    updateData.notas_internas = limpiarTexto(datos.notasInternas);
  }

  if (tieneCampo(datos, "estado")) {
    updateData.estado = datos.estado ?? null;
  }

  const { data: cliente, error } = await supabase
    .from("clientes")
    .update(updateData)
    .eq("id", clienteId)
    .eq("negocio_id", negocioId)
    .select("id, nombre_completo, estado")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: obtenerMensajeDuplicado(error.message) },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cliente });
}
