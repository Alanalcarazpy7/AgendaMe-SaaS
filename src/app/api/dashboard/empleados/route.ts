import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { validarCapacidadPlan } from "@/lib/planes/plan-limits";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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

function normalizarServicios(body: any) {
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
        .map((item: any) => {
          if (typeof item === "string") return item;
          return item?.id ?? item?.servicio_id ?? item?.value;
        })
        .map((id: unknown) => limpiar(id))
        .filter(Boolean)
    )
  );
}

function normalizarHorarios(body: any) {
  const raw = body.horarios ?? body.horarios_empleado ?? body.horariosEmpleado;

  if (!raw) return [];

  const lista = Array.isArray(raw) ? raw : Object.values(raw);

  const horarios = lista
    .map((item: any) => {
      const diaSemana = normalizarDia(item.dia_semana ?? item.diaSemana ?? item.dia);

      if (diaSemana === null) return null;

      const activo = normalizarBoolean(item.activo);

      const horaInicio = normalizarTime(
        item.hora_inicio ?? item.horaInicio ?? item.inicio
      );

      const horaFin = normalizarTime(
        item.hora_fin ?? item.horaFin ?? item.fin
      );

      const descansoInicio = normalizarTime(
        item.descanso_inicio ?? item.descansoInicio
      );

      const descansoFin = normalizarTime(
        item.descanso_fin ?? item.descansoFin
      );

      return {
        dia_semana: diaSemana,
        activo,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
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

  return horarios;
}

async function obtenerSucursalPrincipal(supabase: any, negocioId: string) {
  const { data, error } = await supabase.rpc(
    "obtener_o_crear_sucursal_principal",
    {
      p_negocio_id: negocioId,
    }
  );

  if (error) throw new Error(error.message);

  return data as string;
}

export async function POST(request: Request) {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;

    if (!access.puedeGestionarEmpleados) {
      return NextResponse.json(
        { error: "No tenés permiso para crear empleados." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = createServiceRoleClient();

    const nombre = limpiar(body.nombre);

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del empleado es obligatorio." },
        { status: 400 }
      );
    }

    const estado = limpiar(body.estado || "activo");

    if (!["activo", "inactivo"].includes(estado)) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 }
      );
    }

    if (estado === "activo") {
      const capacidad = await validarCapacidadPlan({
        supabase,
        negocioId: access.negocio.id,
        recurso: "empleados",
      });

      if (!capacidad.ok) {
        return NextResponse.json(
          { error: capacidad.message },
          { status: 403 }
        );
      }
    }

    let sucursalId = limpiar(body.sucursal_id ?? body.sucursalId);

    if (access.scope === "sucursal") {
      sucursalId = access.sucursalId ?? "";
    }

    if (!sucursalId) {
      sucursalId = await obtenerSucursalPrincipal(supabase, access.negocio.id);
    }

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

    const servicioIds = normalizarServicios(body);
    const horarios = normalizarHorarios(body);

    if (servicioIds.length > 0) {
      const { data: serviciosValidos, error: serviciosError } = await supabase
        .from("servicios")
        .select("id")
        .eq("negocio_id", access.negocio.id)
        .in("id", servicioIds);

      if (serviciosError) throw new Error(serviciosError.message);

      const idsValidos = new Set((serviciosValidos ?? []).map((item) => item.id));

      const invalido = servicioIds.find((id) => !idsValidos.has(id));

      if (invalido) {
        return NextResponse.json(
          { error: "Uno de los servicios seleccionados no pertenece al negocio." },
          { status: 400 }
        );
      }
    }

    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .insert({
        negocio_id: access.negocio.id,
        sucursal_id: sucursalId,
        nombre,
        email: normalizarTexto(body.email),
        telefono: normalizarTexto(body.telefono),
        color_calendario: normalizarTexto(body.color_calendario ?? body.colorCalendario ?? body.color ?? body.color),
        estado,
      })
      .select("id")
      .single();

    if (empleadoError) throw new Error(empleadoError.message);

    if (servicioIds.length > 0) {
      const { error: serviciosInsertError } = await supabase
        .from("empleado_servicios")
        .insert(
          servicioIds.map((servicioId) => ({
            empleado_id: empleado.id,
            servicio_id: servicioId,
          }))
        );

      if (serviciosInsertError) throw new Error(serviciosInsertError.message);
    }

    if (horarios.length > 0) {
      const { error: horariosError } = await supabase
        .from("horarios_empleado")
        .insert(
          horarios.map((horario) => ({
            empleado_id: empleado.id,
            dia_semana: horario.dia_semana,
            activo: horario.activo,
            hora_inicio: horario.hora_inicio,
            hora_fin: horario.hora_fin,
            descanso_inicio: horario.descanso_inicio,
            descanso_fin: horario.descanso_fin,
          }))
        );

      if (horariosError) throw new Error(horariosError.message);
    }

    return NextResponse.json({
      message: "Empleado creado correctamente.",
      empleadoId: empleado.id,
    });
  } catch (error) {
    console.error("Error creando empleado:", error);

    const message =
      error instanceof Error ? error.message : "No se pudo crear el empleado.";

    const status = message.includes("horario activo") ? 400 : 500;

    return NextResponse.json(
      { error: message || "No se pudo crear el empleado." },
      { status }
    );
  }
}
