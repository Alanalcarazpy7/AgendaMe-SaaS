import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteContext = {
  params: Promise<{
    empleadoId: string;
  }>;
};

type ActivarEmpleadoResultado = {
  ok: boolean;
  mensaje: string | null;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarTexto(valor: unknown) {
  const texto = limpiar(valor);
  return texto.length > 0 ? texto : null;
}

function normalizarTime(valor: unknown) {
  const texto = limpiar(valor);

  if (!texto) return null;

  // Acepta HH:mm o HH:mm:ss
  if (/^\d{2}:\d{2}$/.test(texto)) return `${texto}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(texto)) return texto;

  return null;
}

function normalizarBoolean(valor: unknown) {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "string") {
    return ["true", "1", "si", "sí", "activo"].includes(valor.toLowerCase());
  }

  return Boolean(valor);
}

function normalizarDia(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isInteger(numero)) return null;
  if (numero < 0 || numero > 6) return null;

  return numero;
}

type JsonRecord = Record<string, unknown>;

function comoRegistro(valor: unknown): JsonRecord {
  return typeof valor === "object" && valor !== null
    ? (valor as JsonRecord)
    : {};
}

function tieneCampo(objeto: object, campo: string) {
  return Object.prototype.hasOwnProperty.call(objeto, campo);
}

function tieneServiciosProvistos(body: JsonRecord) {
  return (
    tieneCampo(body, "serviciosIds") ||
    tieneCampo(body, "servicioIds") ||
    tieneCampo(body, "servicio_ids") ||
    tieneCampo(body, "servicios_ids") ||
    tieneCampo(body, "serviciosSeleccionados") ||
    tieneCampo(body, "servicios")
  );
}

function normalizarServicios(body: JsonRecord) {
  const raw =
    body.serviciosIds ??
    body.servicioIds ??
    body.servicio_ids ??
    body.servicios_ids ??
    body.serviciosSeleccionados ??
    body.servicios ??
    [];

  if (!Array.isArray(raw)) return [];

  return Array.from(
    new Set(
      raw
        .map((item: unknown) => {
          if (typeof item === "string") return item;
          const registro = comoRegistro(item);
          return registro.id ?? registro.servicio_id ?? registro.value;
        })
        .map((id: unknown) => limpiar(id))
        .filter(Boolean)
    )
  );
}

function normalizarHorarios(body: JsonRecord) {
  const raw = body.horarios ?? body.horarios_empleado ?? body.horariosEmpleado;

  if (!raw) return null;

  const lista = Array.isArray(raw) ? raw : Object.values(raw);

  const horarios = lista
    .map((item: unknown) => {
      const registro = comoRegistro(item);
      const diaSemana = normalizarDia(
        registro.dia_semana ?? registro.diaSemana ?? registro.dia
      );

      if (diaSemana === null) return null;

      const activo = normalizarBoolean(registro.activo);

      const horaInicio = normalizarTime(
        registro.hora_inicio ?? registro.horaInicio ?? registro.inicio
      );

      const horaFin = normalizarTime(
        registro.hora_fin ?? registro.horaFin ?? registro.fin
      );

      const descansoInicio = normalizarTime(
        registro.descanso_inicio ?? registro.descansoInicio
      );

      const descansoFin = normalizarTime(
        registro.descanso_fin ?? registro.descansoFin
      );

      return {
        dia_semana: diaSemana,
        activo,
        hora_inicio: activo ? horaInicio : horaInicio,
        hora_fin: activo ? horaFin : horaFin,
        descanso_inicio: descansoInicio,
        descanso_fin: descansoFin,
      };
    })
    .filter(Boolean) as Array<{
      dia_semana: number;
      activo: boolean;
      hora_inicio: string | null;
      hora_fin: string | null;
      descanso_inicio: string | null;
      descanso_fin: string | null;
    }>;

  const horarioActivoIncompleto = horarios.find(
    (horario) => horario.activo && (!horario.hora_inicio || !horario.hora_fin)
  );

  if (horarioActivoIncompleto) {
    throw new Error(
      `El horario activo del día ${horarioActivoIncompleto.dia_semana} debe tener hora de inicio y fin.`
    );
  }

  const horarioActivoInvalido = horarios.find(
    (horario) =>
      horario.activo &&
      horario.hora_inicio &&
      horario.hora_fin &&
      horario.hora_inicio >= horario.hora_fin
  );

  if (horarioActivoInvalido) {
    throw new Error(
      `La hora de fin del día ${horarioActivoInvalido.dia_semana} debe ser posterior a la hora de inicio.`
    );
  }

  return horarios;
}

async function getEmpleadoId(context: RouteContext) {
  const params = await context.params;
  return limpiar(params.empleadoId);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const empleadoId = await getEmpleadoId(context);

    if (!empleadoId) {
      return NextResponse.json(
        { error: "Falta el ID del empleado." },
        { status: 400 }
      );
    }

    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;

    if (!access.puedeGestionarEmpleados) {
      return NextResponse.json(
        { error: "No tenés permiso para editar empleados." },
        { status: 403 }
      );
    }

    const body = comoRegistro(await request.json());
    const supabase = createServiceRoleClient();

    const { data: empleadoActual, error: empleadoActualError } = await supabase
      .from("empleados")
      .select("id, negocio_id, sucursal_id, estado")
      .eq("id", empleadoId)
      .eq("negocio_id", access.negocio.id)
      .maybeSingle();

    if (empleadoActualError) throw new Error(empleadoActualError.message);

    if (!empleadoActual) {
      return NextResponse.json(
        { error: "El empleado no existe o no pertenece a este negocio." },
        { status: 404 }
      );
    }

    if (
      access.scope === "sucursal" &&
      access.sucursalId &&
      empleadoActual.sucursal_id !== access.sucursalId
    ) {
      return NextResponse.json(
        { error: "No podés editar empleados de otra sucursal." },
        { status: 403 }
      );
    }

    const nombreProvisto = tieneCampo(body, "nombre");
    const nombre = nombreProvisto ? limpiar(body.nombre) : null;

    if (nombreProvisto && !nombre) {
      return NextResponse.json(
        { error: "El nombre del empleado es obligatorio." },
        { status: 400 }
      );
    }

    const estadoProvisto = tieneCampo(body, "estado");
    const estado = estadoProvisto ? limpiar(body.estado) : empleadoActual.estado;

    if (estadoProvisto && !["activo", "inactivo"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    if (estado === "activo" && empleadoActual.estado !== "activo") {
      // Chequeo + activación en una sola transacción con lock por negocio,
      // para evitar que dos activaciones simultáneas superen el límite del
      // plan (ver supabase/patches/2026-08-activar-empleado-cliente-atomico.sql).
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "activar_empleado_con_limite",
        { p_empleado_id: empleadoId, p_negocio_id: access.negocio.id }
      );

      if (rpcError) {
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }

      const resultado = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as
        | ActivarEmpleadoResultado
        | undefined;

      if (!resultado?.ok) {
        return NextResponse.json(
          {
            error:
              resultado?.mensaje ??
              "No podés activar más empleados con tu plan actual.",
          },
          { status: 403 }
        );
      }
    }

    let sucursalId = limpiar(body.sucursal_id ?? body.sucursalId);

    if (access.scope === "sucursal") {
      sucursalId = access.sucursalId ?? "";
    }

    if (sucursalId) {
      const { data: sucursal, error: sucursalError } = await supabase
        .from("sucursales")
        .select("id, estado")
        .eq("id", sucursalId)
        .eq("negocio_id", access.negocio.id)
        .maybeSingle();

      if (sucursalError) throw new Error(sucursalError.message);

      if (!sucursal) {
        return NextResponse.json(
          { error: "La sucursal seleccionada no existe." },
          { status: 400 }
        );
      }

      if (sucursal.estado !== "activo") {
        return NextResponse.json(
          { error: "No podés asignar una sucursal inactiva." },
          { status: 400 }
        );
      }
    }

    const serviciosProvistos = tieneServiciosProvistos(body);
    const servicioIds = serviciosProvistos ? normalizarServicios(body) : null;
    const horarios = normalizarHorarios(body);

    if (servicioIds !== null && servicioIds.length === 0) {
      return NextResponse.json(
        { error: "Seleccioná al menos un servicio activo para el empleado." },
        { status: 400 }
      );
    }

    if (servicioIds !== null) {
      const { data: serviciosValidos, error: serviciosError } = await supabase
        .from("servicios")
        .select("id")
        .eq("negocio_id", access.negocio.id)
        .eq("estado", "activo")
        .in("id", servicioIds);

      if (serviciosError) throw new Error(serviciosError.message);

      const idsValidos = new Set((serviciosValidos ?? []).map((item) => item.id));

      const invalido = servicioIds.find((id) => !idsValidos.has(id));

      if (invalido) {
        return NextResponse.json(
          { error: "Uno de los servicios seleccionados no está activo o no pertenece al negocio." },
          { status: 400 }
        );
      }
    }

    const updateEmpleado: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (nombreProvisto) updateEmpleado.nombre = nombre;
    if (tieneCampo(body, "email")) updateEmpleado.email = normalizarTexto(body.email);
    if (tieneCampo(body, "telefono")) updateEmpleado.telefono = normalizarTexto(body.telefono);
    if (
      tieneCampo(body, "color_calendario") ||
      tieneCampo(body, "colorCalendario") ||
      tieneCampo(body, "color")
    ) {
      updateEmpleado.color_calendario = normalizarTexto(
        body.color_calendario ?? body.colorCalendario ?? body.color
      );
    }
    if (estadoProvisto) updateEmpleado.estado = estado;
    if (sucursalId) updateEmpleado.sucursal_id = sucursalId;

    const { error: empleadoError } = await supabase
      .from("empleados")
      .update(updateEmpleado)
      .eq("id", empleadoId)
      .eq("negocio_id", access.negocio.id);

    if (empleadoError) throw new Error(empleadoError.message);

    // Reemplazar servicios del empleado solo si el frontend los envió.
    if (servicioIds !== null) {
      const { error: deleteServiciosError } = await supabase
        .from("empleado_servicios")
        .delete()
        .eq("empleado_id", empleadoId);

      if (deleteServiciosError) throw new Error(deleteServiciosError.message);

      const { error: insertServiciosError } = await supabase
        .from("empleado_servicios")
        .insert(
          servicioIds.map((servicioId) => ({
            empleado_id: empleadoId,
            servicio_id: servicioId,
          }))
        );

      if (insertServiciosError) throw new Error(insertServiciosError.message);
    }

    // Reemplazar horarios solo si el frontend los envió.
    if (horarios) {
      const { error: deleteHorariosError } = await supabase
        .from("horarios_empleado")
        .delete()
        .eq("empleado_id", empleadoId);

      if (deleteHorariosError) throw new Error(deleteHorariosError.message);

      if (horarios.length > 0) {
        const horariosPayload = horarios.map((horario) => ({
          empleado_id: empleadoId,
          dia_semana: horario.dia_semana,
          activo: horario.activo,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          descanso_inicio: horario.descanso_inicio,
          descanso_fin: horario.descanso_fin,
        }));

        const { error: horariosError } = await supabase
          .from("horarios_empleado")
          .insert(horariosPayload);

        if (horariosError) throw new Error(horariosError.message);
      }
    }

    return NextResponse.json({
      message: "Empleado actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error actualizando empleado:", error);

    const message =
      error instanceof Error
        ? error.message
        : "No se pudo actualizar el empleado.";

    const status = /horario activo|hora de fin/i.test(message) ? 400 : 500;

    return NextResponse.json(
      { error: message || "No se pudo actualizar el empleado." },
      { status }
    );
  }
}
