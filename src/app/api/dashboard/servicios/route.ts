import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validarCapacidadPlan } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const servicioSchema = z.object({
  nombre: z.string().min(2, "Ingresá el nombre del servicio."),
  descripcion: z.string().optional(),
  duracionMinutos: z.coerce
    .number()
    .int("La duración debe ser un número entero.")
    .min(5, "La duración mínima es de 5 minutos."),
  precio: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional(),
  color: z.string().optional(),
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

function obtenerMensajeError(errorMessage: string) {
  const mensaje = errorMessage.toLowerCase();

  if (mensaje.includes("limite") || mensaje.includes("límite")) {
    return "No podés crear más servicios con tu plan actual.";
  }

  if (mensaje.includes("duplicate") || mensaje.includes("unique")) {
    return "Ya existe un servicio con esos datos.";
  }

  return errorMessage;
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const parsed = servicioSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const admin = createServiceRoleClient();
  const negocioId = guard.access.negocio.id;
  const capacidad = await validarCapacidadPlan({
    supabase: admin,
    negocioId,
    recurso: "servicios",
  });

  if (!capacidad.ok) {
    return NextResponse.json(
      { error: capacidad.message },
      { status: 403 }
    );
  }

  const datos = parsed.data;

  const { data: servicio, error } = await admin
    .from("servicios")
    .insert({
      negocio_id: negocioId,
      nombre: datos.nombre.trim(),
      descripcion: limpiarTexto(datos.descripcion),
      duracion_minutos: datos.duracionMinutos,
      precio: precioANumero(datos.precio),
      color: limpiarTexto(datos.color) ?? "#111827",
    })
    .select("id, nombre")
    .single();

  if (error) {
    return NextResponse.json(
      { error: obtenerMensajeError(error.message) },
      { status: 500 }
    );
  }

  return NextResponse.json({ servicio });
}
