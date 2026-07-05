import { NextResponse } from "next/server";
import {
  calcularDisponibilidadReserva,
  sumarMinutosHora,
} from "@/lib/reservas/disponibilidad";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type ReservaPayload = {
  servicioId?: string;
  sucursalId?: string | null;
  fecha?: string;
  horaInicio?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  notas?: string;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = (await request.json()) as ReservaPayload;

    const servicioId = limpiar(body.servicioId);
    const sucursalId = limpiar(body.sucursalId) || null;
    const fecha = limpiar(body.fecha);
    const horaInicio = limpiar(body.horaInicio);
    const clienteNombre = limpiar(body.clienteNombre);
    const clienteTelefono = limpiar(body.clienteTelefono);
    const clienteEmail = limpiar(body.clienteEmail);
    const notas = limpiar(body.notas);

    if (!servicioId || !fecha || !horaInicio || !clienteNombre || !clienteTelefono) {
      return NextResponse.json(
        { error: "Completá todos los datos obligatorios." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const disponibilidad = await calcularDisponibilidadReserva({
      supabase,
      slug,
      servicioId,
      fecha,
      sucursalId,
    });

    if (!disponibilidad.negocio || !disponibilidad.servicio) {
      return NextResponse.json(
        { error: "No se encontró el negocio o servicio." },
        { status: 404 }
      );
    }

    if (!disponibilidad.slots.includes(horaInicio)) {
      return NextResponse.json(
        { error: "Ese horario ya no está disponible." },
        { status: 409 }
      );
    }

    const empleadoId = disponibilidad.slotEmployees[horaInicio]?.[0];

    if (!empleadoId) {
      return NextResponse.json(
        { error: "No hay empleado disponible para ese horario." },
        { status: 409 }
      );
    }

    const negocioId = disponibilidad.negocio.id;
    const sucursalFinalId = disponibilidad.sucursalId;
    const servicio = disponibilidad.servicio;
    const horaFin = sumarMinutosHora(
      horaInicio,
      Number(servicio.duracion_minutos ?? 30)
    );

    let clienteId: string | null = null;

    const { data: clienteExistente, error: clienteBuscarError } = await supabase
      .from("clientes")
      .select("id")
      .eq("negocio_id", negocioId)
      .eq("telefono", clienteTelefono)
      .maybeSingle();

    if (clienteBuscarError) {
      throw new Error(clienteBuscarError.message);
    }

    if (clienteExistente?.id) {
      clienteId = clienteExistente.id;

      await supabase
        .from("clientes")
        .update({
          nombre_completo: clienteNombre,
          email: clienteEmail || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clienteId)
        .eq("negocio_id", negocioId);
    } else {
      const { data: clienteNuevo, error: clienteError } = await supabase
        .from("clientes")
        .insert({
          negocio_id: negocioId,
          nombre_completo: clienteNombre,
          telefono: clienteTelefono,
          email: clienteEmail || null,
          estado: "activo",
        })
        .select("id")
        .single();

      if (clienteError) {
        throw new Error(clienteError.message);
      }

      clienteId = clienteNuevo.id;
    }

    const { data: cita, error: citaError } = await supabase
      .from("citas")
      .insert({
        negocio_id: negocioId,
        sucursal_id: sucursalFinalId,
        cliente_id: clienteId,
        servicio_id: servicio.id,
        empleado_id: empleadoId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: "pendiente",
        precio: servicio.precio ?? 0,
        origen: "publico",
        notas: notas || null,
      })
      .select("id, seguimiento_token")
      .single();

    if (citaError) {
      throw new Error(citaError.message);
    }

    return NextResponse.json({
      message: "Reserva creada correctamente.",
      citaId: cita.id,
      seguimientoToken: cita.seguimiento_token,
      seguimientoUrl: `/reserva/estado/${cita.seguimiento_token}`,
    });
  } catch (error) {
    console.error("Error creando reserva pública:", error);

    return NextResponse.json(
      { error: "No se pudo crear la reserva." },
      { status: 500 }
    );
  }
}