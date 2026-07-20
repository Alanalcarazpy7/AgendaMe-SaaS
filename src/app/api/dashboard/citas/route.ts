import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { validarCapacidadPlan } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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

type SeleccionarEmpleadoAutomaticoParams = {
  supabase: any;
  negocioId: string;
  servicioId: string;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  sucursalId?: string | null;
};

async function seleccionarEmpleadoAutomatico({
  supabase,
  negocioId,
  servicioId,
  fecha,
  horaInicio,
  duracionMinutos,
  sucursalId,
}: SeleccionarEmpleadoAutomaticoParams) {
  const date = new Date(`${fecha}T12:00:00`);
  const diaSemana = date.getDay();
  const inicioNueva = toMinutes(horaInicio);
  const finNueva = inicioNueva + duracionMinutos;

  const { data: horarioNegocio, error: horarioNegocioError } = await supabase
    .from("horarios_negocio")
    .select("activo, hora_apertura, hora_cierre")
    .eq("negocio_id", negocioId)
    .eq("dia_semana", diaSemana)
    .maybeSingle();

  if (horarioNegocioError) throw new Error(horarioNegocioError.message);

  if (
    !horarioNegocio ||
    !horarioNegocio.activo ||
    !horarioNegocio.hora_apertura ||
    !horarioNegocio.hora_cierre
  ) {
    return null;
  }

  const negocioInicio = toMinutes(String(horarioNegocio.hora_apertura).slice(0, 5));
  const negocioFin = toMinutes(String(horarioNegocio.hora_cierre).slice(0, 5));

  if (inicioNueva < negocioInicio || finNueva > negocioFin) {
    return null;
  }

  const { data: empleadoServicios, error: empleadoServiciosError } = await supabase
    .from("empleado_servicios")
    .select(
      `
      empleado_id,
      empleados (
        id,
        estado,
        sucursal_id
      )
    `
    )
    .eq("servicio_id", servicioId);

  if (empleadoServiciosError) throw new Error(empleadoServiciosError.message);

  const empleadosDisponibles = (empleadoServicios ?? [])
    .map((row: any) => {
      const empleado = Array.isArray(row.empleados) ? row.empleados[0] : row.empleados;
      return empleado;
    })
    .filter((empleado: any) => {
      if (!empleado || empleado.estado !== "activo") return false;
      if (sucursalId && empleado.sucursal_id !== sucursalId) return false;
      return true;
    });

  if (empleadosDisponibles.length === 0) return null;

  const empleadoIds = empleadosDisponibles.map((empleado: any) => empleado.id);

  const [
    { data: horariosEmpleado, error: horariosEmpleadoError },
    { data: citasOcupadas, error: citasError },
    { data: bloqueos, error: bloqueosError },
  ] = await Promise.all([
    supabase
      .from("horarios_empleado")
      .select(
        "empleado_id, activo, hora_inicio, hora_fin, descanso_inicio, descanso_fin"
      )
      .in("empleado_id", empleadoIds)
      .eq("dia_semana", diaSemana),
    supabase
      .from("citas")
      .select("id, empleado_id, hora_inicio, hora_fin")
      .eq("negocio_id", negocioId)
      .eq("fecha", fecha)
      .in("empleado_id", empleadoIds)
      .in("estado", ["pendiente", "confirmada", "completada"]),
    supabase
      .from("bloqueos_horario")
      .select("id, empleado_id, sucursal_id, fecha_inicio, fecha_fin")
      .eq("negocio_id", negocioId)
      .lte("fecha_inicio", `${fecha}T23:59:59`)
      .gte("fecha_fin", `${fecha}T00:00:00`),
  ]);

  if (horariosEmpleadoError) throw new Error(horariosEmpleadoError.message);
  if (citasError) throw new Error(citasError.message);
  if (bloqueosError) throw new Error(bloqueosError.message);

  for (const empleado of empleadosDisponibles) {
    const horario = (horariosEmpleado ?? []).find(
      (item: any) => item.empleado_id === empleado.id
    );

    if (horario && !horario.activo) continue;

    const empleadoInicio = horario?.hora_inicio
      ? toMinutes(String(horario.hora_inicio).slice(0, 5))
      : negocioInicio;
    const empleadoFin = horario?.hora_fin
      ? toMinutes(String(horario.hora_fin).slice(0, 5))
      : negocioFin;

    if (inicioNueva < Math.max(negocioInicio, empleadoInicio)) continue;
    if (finNueva > Math.min(negocioFin, empleadoFin)) continue;

    if (
      horario?.descanso_inicio &&
      horario?.descanso_fin &&
      overlap(
        inicioNueva,
        finNueva,
        toMinutes(String(horario.descanso_inicio).slice(0, 5)),
        toMinutes(String(horario.descanso_fin).slice(0, 5))
      )
    ) {
      continue;
    }

    const tieneCita = (citasOcupadas ?? []).some((cita: any) => {
      if (cita.empleado_id !== empleado.id) return false;

      return overlap(
        inicioNueva,
        finNueva,
        toMinutes(String(cita.hora_inicio).slice(0, 5)),
        toMinutes(String(cita.hora_fin).slice(0, 5))
      );
    });

    if (tieneCita) continue;

    const estaBloqueado = (bloqueos ?? []).some((bloqueo: any) => {
      const bloqueoEmpleadoId = bloqueo.empleado_id ?? null;
      const bloqueoSucursalId = bloqueo.sucursal_id ?? null;

      const aplicaAlEmpleado =
        bloqueoEmpleadoId === null || bloqueoEmpleadoId === empleado.id;
      const aplicaSucursal =
        bloqueoSucursalId === null ||
        !empleado.sucursal_id ||
        bloqueoSucursalId === empleado.sucursal_id;

      if (!aplicaAlEmpleado || !aplicaSucursal) return false;

      const inicioBloqueo = new Date(bloqueo.fecha_inicio);
      const finBloqueo = new Date(bloqueo.fecha_fin);

      return overlap(
        inicioNueva,
        finNueva,
        inicioBloqueo.getHours() * 60 + inicioBloqueo.getMinutes(),
        finBloqueo.getHours() * 60 + finBloqueo.getMinutes()
      );
    });

    if (!estaBloqueado) {
      return {
        empleadoId: empleado.id,
        sucursalId: empleado.sucursal_id ?? null,
      };
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;

    if (!access.puedeGestionarCitas) {
      return NextResponse.json(
        { error: "No tenés permiso para crear citas." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Payload;

    const clienteId = limpiar(body.clienteId ?? body.cliente_id);
    const servicioId = limpiar(body.servicioId ?? body.servicio_id);
    const empleadoIdInput = limpiar(body.empleadoId ?? body.empleado_id);
    const fecha = limpiar(body.fecha);
    const horaInicio = limpiar(body.horaInicio ?? body.hora_inicio).slice(0, 5);
    const estado = limpiar(body.estado) || "confirmada";
    const notas = limpiar(body.notas);

    if (access.rol === "empleado_sucursal" && !access.empleadoId) {
      return NextResponse.json(
        { error: "Tu cuenta no está vinculada a un empleado." },
        { status: 403 }
      );
    }

    if (
      access.rol === "empleado_sucursal" &&
      empleadoIdInput &&
      empleadoIdInput !== access.empleadoId
    ) {
      return NextResponse.json(
        { error: "No podés crear citas para otro empleado." },
        { status: 403 }
      );
    }

    if (!clienteId || !servicioId || !fecha || !horaInicio) {
      return NextResponse.json(
        { error: "Faltan datos para crear la cita." },
        { status: 400 }
      );
    }

    if (!["pendiente", "confirmada", "completada", "no_asistio", "cancelada"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    if (fechaHoraPasada(fecha, horaInicio)) {
      return NextResponse.json(
        { error: "No se puede crear una cita en una fecha u hora pasada." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const capacidad = await validarCapacidadPlan({
      supabase,
      negocioId: access.negocio.id,
      recurso: "citas",
      fechaCitas: fecha,
    });

    if (!capacidad.ok) {
      return NextResponse.json(
        { error: capacidad.message },
        { status: 403 }
      );
    }

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

    const duracionMinutos = Number(servicio.duracion_minutos ?? 30);
    let empleadoId = access.rol === "empleado_sucursal"
      ? access.empleadoId ?? ""
      : empleadoIdInput;
    let sucursalId: string | null = access.scope === "sucursal" ? access.sucursalId : null;

    if (!empleadoId) {
      const empleadoAutomatico = await seleccionarEmpleadoAutomatico({
        supabase,
        negocioId: access.negocio.id,
        servicioId,
        fecha,
        horaInicio,
        duracionMinutos,
        sucursalId: access.scope === "sucursal" ? access.sucursalId : null,
      });

      if (!empleadoAutomatico) {
        return NextResponse.json(
          {
            error:
              "No hay empleados disponibles para ese servicio y horario. Elegí otro horario o asigná un empleado manualmente.",
          },
          { status: 409 }
        );
      }

      empleadoId = empleadoAutomatico.empleadoId;
      sucursalId = empleadoAutomatico.sucursalId;
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
        { error: "No podés crear citas para otra sucursal." },
        { status: 403 }
      );
    }

    sucursalId = empleado.sucursal_id ?? sucursalId;

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

    if (sucursalId) {
      await supabase
        .from("cliente_sucursales")
        .insert({
          negocio_id: access.negocio.id,
          cliente_id: clienteId,
          sucursal_id: sucursalId,
        })
        .select("id")
        .maybeSingle();
    }

    const horaFin = sumarMinutos(horaInicio, duracionMinutos);

    const { data: citasOcupadas, error: ocupadasError } = await supabase
      .from("citas")
      .select("id, hora_inicio, hora_fin")
      .eq("negocio_id", access.negocio.id)
      .eq("empleado_id", empleadoId)
      .eq("fecha", fecha)
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

    const { data: cita, error: citaError } = await supabase
      .from("citas")
      .insert({
        negocio_id: access.negocio.id,
        sucursal_id: sucursalId,
        cliente_id: clienteId,
        servicio_id: servicioId,
        empleado_id: empleadoId,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado,
        precio: servicio.precio ?? 0,
        origen: "dashboard",
        notas: notas || null,
      })
      .select("id")
      .single();

    if (citaError) throw new Error(citaError.message);

    return NextResponse.json({
      message: "Cita creada correctamente.",
      citaId: cita.id,
    });
  } catch (error) {
    console.error("Error creando cita:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo crear la cita.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
