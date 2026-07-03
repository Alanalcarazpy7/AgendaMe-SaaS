import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const clienteSchema = z.object({
  nombreCompleto: z.string().min(2, "Ingresá el nombre del cliente."),
  telefono: z.string().optional(),
  email: z.string().email("Correo inválido.").optional().or(z.literal("")),
  documento: z.string().optional(),
  notasInternas: z.string().optional(),
});

function limpiarTexto(valor?: string) {
  const limpio = valor?.trim();

  return limpio ? limpio : null;
}

function limpiarEmail(valor?: string) {
  const limpio = valor?.trim().toLowerCase();

  return limpio ? limpio : null;
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

export async function POST(request: NextRequest) {
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
  const parsed = clienteSchema.safeParse(body);

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

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      negocio_id: membresia.negocio_id,
      nombre_completo: datos.nombreCompleto.trim(),
      telefono: limpiarTexto(datos.telefono),
      email: limpiarEmail(datos.email),
      documento: limpiarTexto(datos.documento),
      notas_internas: limpiarTexto(datos.notasInternas),
    })
    .select("id, nombre_completo")
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
