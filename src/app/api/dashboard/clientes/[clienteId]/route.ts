import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "No tenés sesión activa." },
      { status: 401 }
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

  const { data: membresias, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (membresiaError) {
    return NextResponse.json(
      { error: "No se pudo validar tu negocio." },
      { status: 500 }
    );
  }

  const membresia = membresias?.[0];

  if (!membresia) {
    return NextResponse.json(
      { error: "No tenés un negocio activo." },
      { status: 403 }
    );
  }

  const datos = parsed.data;
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
    .eq("negocio_id", membresia.negocio_id)
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