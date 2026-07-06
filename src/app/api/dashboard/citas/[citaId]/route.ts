import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteContext = {
  params: Promise<{
    citaId: string;
  }>;
};

type Payload = {
  clienteId?: string;
  cliente_id?: string;
  servicioId?: string;
  servicio_id?: string;
  empleadoId?: string;
  empleado_id?: string;
  fecha?: string;
  horaInicio?: string;
  hora_inicio?: string;
  estado?: string;
  notas?: string;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function toMinutes(hora: string) {
  const [h, m] = String(hora).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function sumarMinutos(hora: string, minutos: number) {
  return fromMinutes(toMinutes(hora) + minutos);
}

function overlap(aInicio: number, aFin: number, bInicio: number, bFin: number) {
  return aInicio < bFin && aFin > bInicio;
}

function fechaHoraPasada(fecha: string, hora: string) {
  const ahoraParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    ahoraParts.find((part) => part.type === type)?.value ?? "";

  const ahoraComparable = `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
  const citaComparable = `${fecha} ${hora.slice(0, 5)}`;

  return citaComparable < ahoraComparable;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;

    if (!access.puedeGestionarCitas) {
      return NextResponse.json(
        { error: "No tenés permiso para editar citas." },
        { status: 403 }
      );
    }

    const { citaId } = await context.params;
    const body = (await request.json()) as Payload;

    const supabase = createServiceRoleClient();

    const { data: citaActual, error: citaActualError } = await supabase
      .from("citas")
      .select("id, negocio_id, sucursal_id, cliente_id, servicio_id, empleado_id, fecha, hora_inicio, hora_fin, estado")
      .eq("id", citaId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (citaActualError) throw new Error(citaActualError.message);

    if (!citaActual) {
      return NextResponse.json(
        { error: "Cita no encontrada." },
        { status: 404 }
      );
    }

    if (
      access.scope === "sucursal" &&
      access.sucursalId &&
      citaActual.sucursal_id !== access.sucursalId
    ) {
      return NextResponse.json(
        { error: "No podés modificar citas de otra sucursal." },
        { status: 403 }
      );
    }

    const clienteId = limpiar(body.clienteId ?? body.cliente_id) || citaActual.cliente_id;
    const servicioId = limpiar(body.servicioId ?? body.servicio_id) || citaActual.servicio_id;
    const empleadoId = limpiar(body.empleadoId ?? body.empleado_id) || citaActual.empleado_id;
    const fecha = limpiar(body.fecha) || citaActual.fecha;
    const horaInicio =
      limpiar(body.horaInicio ?? body.hora_inicio).slice(0, 5) ||
      String(citaActual.hora_inicio).slice(0, 5);
    const estado = limpiar(body.estado) || citaActual.estado;
    const notas = body.notas === undefined ? undefined : limpiar(body.notas);

    if (!["pendiente", "confirmada", "completada", "no_asistio", "cancelada"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    const cambiaFechaHora =
      fecha !== citaActual.fecha ||
      horaInicio !== String(citaActual.hora_inicio).slice(0, 5);

    if (cambiaFechaHora && fechaHoraPasada(fecha, horaInicio)) {
      return NextResponse.json(
        { error: "No se puede mover una cita a una fecha u hora pasada." },
        { status: 400 }
      );
    }

    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .select("id, sucursal_id, estado")
      .eq("id", empleadoId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (empleadoError) throw new Error(empleadoError.message);

    if (!empleado || empleado.estado !== "activo") {
      return NextResponse.json(
        { error: "Empleado no encontrado o inactivo." },
        { status: 404 }
      );
    }

    if (
      access.scope === "sucursal" &&
      access.sucursalId &&
      empleado.sucursal_id !== access.sucursalId
    ) {
      return NextResponse.json(
        { error: "No podés asignar citas a empleados de otra sucursal." },
        { status: 403 }
      );
    }

    const sucursalId = empleado.sucursal_id;

    const { data: servicio, error: servicioError } = await supabase
      .from("servicios")
      .select("id, duracion_minutos, precio, estado")
      .eq("id", servicioId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (servicioError) throw new Error(servicioError.message);

    if (!servicio || servicio.estado !== "activo") {
      return NextResponse.json(
        { error: "Servicio no encontrado o inactivo." },
        { status: 404 }
      );
    }

    const { data: relacionServicio, error: relacionError } = await supabase
      .from("empleado_servicios")
      .select("empleado_id")
      .eq("empleado_id", empleadoId)
      .eq("servicio_id", servicioId)
      .maybeSingle();

    if (relacionError) throw new Error(relacionError.message);

    if (!relacionServicio) {
      return NextResponse.json(
        { error: "El empleado no realiza este servicio." },
        { status: 400 }
      );
    }

    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .select("id, estado")
      .eq("id", clienteId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (clienteError) throw new Error(clienteError.message);

    if (!cliente || cliente.estado !== "activo") {
      return NextResponse.json(
        { error: "Cliente no encontrado o inactivo." },
        { status: 404 }
      );
    }

    if (access.scope === "sucursal" && access.sucursalId) {
      await supabase
        .from("cliente_sucursales")
        .insert({
          negocio_id: access.negocio.id,
          cliente_id: clienteId,
          sucursal_id: access.sucursalId,
        })
        .select("id")
        .maybeSingle();
    }

    const horaFin = sumarMinutos(horaInicio, Number(servicio.duracion_minutos ?? 30));

    const { data: citasOcupadas, error: ocupadasError } = await supabase
      .from("citas")
      .select("id, hora_inicio, hora_fin")
      .eq("negocio_id", access.negocio.id)
      .eq("empleado_id", empleadoId)
      .eq("fecha", fecha)
      .neq("id", citaId)
      .in("estado", ["pendiente", "confirmada", "completada"]);

    if (ocupadasError) throw new Error(ocupadasError.message);

    const inicioNueva = toMinutes(horaInicio);
    const finNueva = toMinutes(horaFin);

    const solapa = (citasOcupadas ?? []).some((cita) =>
      overlap(
        inicioNueva,
        finNueva,
        toMinutes(String(cita.hora_inicio).slice(0, 5)),
        toMinutes(String(cita.hora_fin).slice(0, 5))
      )
    );

    if (solapa) {
      return NextResponse.json(
        { error: "El empleado ya tiene una cita en ese horario." },
        { status: 409 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      sucursal_id: sucursalId,
      cliente_id: clienteId,
      servicio_id: servicioId,
      empleado_id: empleadoId,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado,
      precio: servicio.precio ?? 0,
      updated_at: new Date().toISOString(),
    };

    if (notas !== undefined) {
      updatePayload.notas = notas || null;
    }

    const { error: updateError } = await supabase
      .from("citas")
      .update(updatePayload)
      .eq("id", citaId)
      .eq("negocio_id", access.negocio.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      message: "Cita actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error editando cita:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la cita." },
      { status: 500 }
    );
  }
}