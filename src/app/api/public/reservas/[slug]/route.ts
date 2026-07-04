import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  calcularDisponibilidadReserva,
  sumarMinutosHora,
} from "@/lib/reservas/disponibilidad";

type ReservaPublicaRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ReservaPayload = {
  servicioId?: string;
  fecha?: string;
  horaInicio?: string;
  nombreCompleto?: string;
  telefono?: string;
  email?: string;
};

function normalizarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarTelefono(valor: unknown) {
  const raw = String(valor ?? "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("595")) return digits;

  if (digits.startsWith("0")) {
    return `595${digits.slice(1)}`;
  }

  return digits;
}

function normalizarHora(valor: unknown) {
  return String(valor ?? "").slice(0, 5);
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "No se pudo crear la reserva.";
}

export async function POST(request: Request, { params }: ReservaPublicaRouteProps) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as ReservaPayload;

    const servicioId = normalizarTexto(body.servicioId);
    const fecha = normalizarTexto(body.fecha);
    const horaInicio = normalizarHora(body.horaInicio);
    const nombreCompleto = normalizarTexto(body.nombreCompleto);
    const telefono = normalizarTelefono(body.telefono);
    const email = normalizarTexto(body.email).toLowerCase();

    if (!servicioId || !fecha || !horaInicio || !nombreCompleto || !telefono) {
      return NextResponse.json(
        {
          error: "Completá servicio, fecha, horario, nombre y teléfono.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createServiceRoleClient();

    const disponibilidad = await calcularDisponibilidadReserva({
      supabase,
      slug,
      servicioId,
      fecha,
    });

    if (disponibilidad.error) {
      return NextResponse.json(
        {
          error: disponibilidad.error,
        },
        {
          status: disponibilidad.status ?? 400,
        }
      );
    }

    if (!disponibilidad.negocio || !disponibilidad.servicio) {
      return NextResponse.json(
        {
          error: "No se pudo validar el negocio o servicio.",
        },
        {
          status: 400,
        }
      );
    }

    const slotSeleccionado = disponibilidad.slots.find(
      (slot) => slot.hora === horaInicio
    );

    if (!slotSeleccionado || slotSeleccionado.empleadosDisponibles.length === 0) {
      return NextResponse.json(
        {
          error:
            "Ese horario ya no está disponible. Elegí otro horario de la lista.",
        },
        {
          status: 409,
        }
      );
    }

    const empleadoAsignado = slotSeleccionado.empleadosDisponibles[0];
    const horaFin = sumarMinutosHora(
      horaInicio,
      disponibilidad.servicio.duracion_minutos
    );

    const { data: clienteExistente, error: clienteBuscarError } = await supabase
      .from("clientes")
      .select("id")
      .eq("negocio_id", disponibilidad.negocio.id)
      .eq("telefono", telefono)
      .maybeSingle();

    if (clienteBuscarError) {
      throw new Error(clienteBuscarError.message);
    }

    let clienteId = clienteExistente?.id as string | undefined;

    if (!clienteId) {
      const { data: clienteNuevo, error: clienteCrearError } = await supabase
        .from("clientes")
        .insert({
          negocio_id: disponibilidad.negocio.id,
          nombre_completo: nombreCompleto,
          telefono,
          email: email || null,
          estado: "activo",
        })
        .select("id")
        .single();

      if (clienteCrearError) {
        throw new Error(clienteCrearError.message);
      }

      clienteId = clienteNuevo.id as string;
    }

    const { data: cita, error: citaError } = await supabase
      .from("citas")
      .insert({
        negocio_id: disponibilidad.negocio.id,
        cliente_id: clienteId,
        servicio_id: disponibilidad.servicio.id,
        empleado_id: empleadoAsignado.id,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: "pendiente",
        precio: disponibilidad.servicio.precio ?? 0,
        notas: null,
        origen: "publico",
      })
      .select("id, fecha, hora_inicio, hora_fin, estado, seguimiento_token")
      .single();

    if (citaError) {
      console.error("Error creando cita pública:", citaError);

      return NextResponse.json(
        {
          error:
            citaError.message ||
            "Ese horario ya no está disponible. Elegí otro horario.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      message: "Reserva creada correctamente.",
      reserva: cita,
      negocio: {
        nombre: disponibilidad.negocio.nombre,
        slug: disponibilidad.negocio.slug,
      },
      servicio: {
        nombre: disponibilidad.servicio.nombre,
      },
      seguimientoUrl: `/reserva/estado/${cita.seguimiento_token}`,
    });
  } catch (error) {
    console.error("Error en reserva pública:", error);

    return NextResponse.json(
      {
        error: obtenerMensajeError(error),
      },
      {
        status: 500,
      }
    );
  }
}