import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const servicioUpdateSchema = z.object({
  nombre: z.string().min(2, "Ingresá el nombre del servicio.").optional(),
  descripcion: z.string().optional(),
  duracionMinutos: z.coerce
    .number()
    .int("La duración debe ser un número entero.")
    .min(5, "La duración mínima es de 5 minutos.")
    .optional(),
  precio: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional(),
  color: z.string().optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
});

function limpiarTexto(valor?: string) {
  const limpio = valor?.trim();

  return limpio ? limpio : null;
}

function precioANumero(valor: number | string | undefined) {
  if (valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

function tieneCampo(objeto: object, campo: string) {
  return Object.prototype.hasOwnProperty.call(objeto, campo);
}

function obtenerMensajeError(errorMessage: string) {
  const mensaje = errorMessage.toLowerCase();

  if (mensaje.includes("limite") || mensaje.includes("límite")) {
    return "No podés activar o crear más servicios con tu plan actual.";
  }

  if (mensaje.includes("duplicate") || mensaje.includes("unique")) {
    return "Ya existe un servicio con esos datos.";
  }

  return errorMessage;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ servicioId: string }> }
) {
  const { servicioId } = await context.params;

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
  const parsed = servicioUpdateSchema.safeParse(body);

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
  const updateData: Record<string, string | number | null> = {};

  if (tieneCampo(datos, "nombre")) {
    updateData.nombre = datos.nombre!.trim();
  }

  if (tieneCampo(datos, "descripcion")) {
    updateData.descripcion = limpiarTexto(datos.descripcion);
  }

  if (tieneCampo(datos, "duracionMinutos")) {
    updateData.duracion_minutos = datos.duracionMinutos ?? null;
  }

  if (tieneCampo(datos, "precio")) {
    updateData.precio = precioANumero(datos.precio);
  }

  if (tieneCampo(datos, "color")) {
    updateData.color = limpiarTexto(datos.color) ?? "#111827";
  }

  if (tieneCampo(datos, "estado")) {
    updateData.estado = datos.estado ?? null;
  }

  const { data: servicio, error } = await supabase
    .from("servicios")
    .update(updateData)
    .eq("id", servicioId)
    .eq("negocio_id", membresia.negocio_id)
    .select("id, nombre, estado")
    .single();

  if (error) {
    return NextResponse.json(
      { error: obtenerMensajeError(error.message) },
      { status: 500 }
    );
  }

  return NextResponse.json({ servicio });
}