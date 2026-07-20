import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validarCapacidadPlan } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;

  const { servicioId } = await context.params;

  const body = await request.json();
  const parsed = servicioUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const datos = parsed.data;
  const admin = createServiceRoleClient();
  const negocioId = guard.access.negocio.id;

  if (datos.estado === "activo") {
    const { data: servicioActual, error: servicioActualError } = await admin
      .from("servicios")
      .select("estado")
      .eq("id", servicioId)
      .eq("negocio_id", negocioId)
      .maybeSingle();

    if (servicioActualError) {
      return NextResponse.json(
        { error: servicioActualError.message },
        { status: 500 }
      );
    }

    if (servicioActual?.estado !== "activo") {
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
    }
  }

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

  const { data: servicio, error } = await admin
    .from("servicios")
    .update(updateData)
    .eq("id", servicioId)
    .eq("negocio_id", negocioId)
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
