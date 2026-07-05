type SupabaseLike = any;

type CalcularDisponibilidadParams = {
  supabase: SupabaseLike;
  slug: string;
  servicioId: string;
  fecha: string;
  sucursalId?: string | null;
  stepMinutes?: number;
};

type TimeRange = {
  inicio: string;
  fin: string;
};

function toMinutes(hora: string) {
  const [h, m] = String(hora).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function sumarMinutosHora(hora: string, minutos: number) {
  return fromMinutes(toMinutes(hora) + minutos);
}

function overlap(aInicio: number, aFin: number, bInicio: number, bFin: number) {
  return aInicio < bFin && aFin > bInicio;
}

function estaDentro(slotInicio: number, slotFin: number, rango: TimeRange) {
  return slotInicio >= toMinutes(rango.inicio) && slotFin <= toMinutes(rango.fin);
}

function cruzaDescanso(
  slotInicio: number,
  slotFin: number,
  descansoInicio?: string | null,
  descansoFin?: string | null
) {
  if (!descansoInicio || !descansoFin) return false;

  return overlap(slotInicio, slotFin, toMinutes(descansoInicio), toMinutes(descansoFin));
}

export async function calcularDisponibilidadReserva({
  supabase,
  slug,
  servicioId,
  fecha,
  sucursalId,
  stepMinutes,
}: CalcularDisponibilidadParams) {
  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id, slug, estado, intervalo_reserva_minutos")
    .eq("slug", slug)
    .eq("estado", "activo")
    .maybeSingle();

  if (negocioError) throw new Error(negocioError.message);

  if (!negocio) {
    return {
      slots: [] as string[],
      slotEmployees: {} as Record<string, string[]>,
      negocio: null,
      servicio: null,
      sucursalId: null,
    };
  }

  const { data: servicio, error: servicioError } = await supabase
    .from("servicios")
    .select("id, nombre, duracion_minutos, precio, estado")
    .eq("id", servicioId)
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo")
    .maybeSingle();

  if (servicioError) throw new Error(servicioError.message);

  if (!servicio) {
    return {
      slots: [] as string[],
      slotEmployees: {} as Record<string, string[]>,
      negocio,
      servicio: null,
      sucursalId: null,
    };
  }

  let sucursalFinalId = sucursalId || null;

  if (sucursalFinalId) {
    const { data: sucursal, error: sucursalError } = await supabase
      .from("sucursales")
      .select("id")
      .eq("id", sucursalFinalId)
      .eq("negocio_id", negocio.id)
      .eq("estado", "activo")
      .maybeSingle();

    if (sucursalError) throw new Error(sucursalError.message);

    if (!sucursal) {
      return {
        slots: [] as string[],
        slotEmployees: {} as Record<string, string[]>,
        negocio,
        servicio,
        sucursalId: null,
      };
    }
  } else {
    const { data: sucursalPrincipal } = await supabase
      .from("sucursales")
      .select("id")
      .eq("negocio_id", negocio.id)
      .eq("es_principal", true)
      .maybeSingle();

    sucursalFinalId = sucursalPrincipal?.id ?? null;
  }

  const date = new Date(`${fecha}T12:00:00`);
  const diaSemana = date.getDay();

  const { data: horarioNegocio, error: horarioNegocioError } = await supabase
    .from("horarios_negocio")
    .select("dia_semana, activo, hora_apertura, hora_cierre")
    .eq("negocio_id", negocio.id)
    .eq("dia_semana", diaSemana)
    .maybeSingle();

  if (horarioNegocioError) throw new Error(horarioNegocioError.message);

  if (
    !horarioNegocio ||
    !horarioNegocio.activo ||
    !horarioNegocio.hora_apertura ||
    !horarioNegocio.hora_cierre
  ) {
    return {
      slots: [] as string[],
      slotEmployees: {} as Record<string, string[]>,
      negocio,
      servicio,
      sucursalId: sucursalFinalId,
    };
  }

  let empleadoServiciosQuery = supabase
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
    .eq("servicio_id", servicio.id);

  const { data: empleadoServicios, error: empleadoServiciosError } =
    await empleadoServiciosQuery;

  if (empleadoServiciosError) throw new Error(empleadoServiciosError.message);

  const empleadosDisponibles = (empleadoServicios ?? [])
    .map((row: any) => {
      const empleado = Array.isArray(row.empleados) ? row.empleados[0] : row.empleados;
      return empleado;
    })
    .filter((empleado: any) => {
      if (!empleado || empleado.estado !== "activo") return false;
      if (sucursalFinalId && empleado.sucursal_id !== sucursalFinalId) return false;
      return true;
    });

  if (empleadosDisponibles.length === 0) {
    return {
      slots: [] as string[],
      slotEmployees: {} as Record<string, string[]>,
      negocio,
      servicio,
      sucursalId: sucursalFinalId,
    };
  }

  const empleadoIds = empleadosDisponibles.map((empleado: any) => empleado.id);

  const { data: horariosEmpleado, error: horariosEmpleadoError } = await supabase
    .from("horarios_empleado")
    .select(
      "empleado_id, dia_semana, activo, hora_inicio, hora_fin, descanso_inicio, descanso_fin"
    )
    .in("empleado_id", empleadoIds)
    .eq("dia_semana", diaSemana);

  if (horariosEmpleadoError) throw new Error(horariosEmpleadoError.message);

  let citasQuery = supabase
    .from("citas")
    .select("id, empleado_id, hora_inicio, hora_fin, estado, sucursal_id")
    .eq("negocio_id", negocio.id)
    .eq("fecha", fecha)
    .in("empleado_id", empleadoIds)
    .in("estado", ["pendiente", "confirmada", "completada"]);

  if (sucursalFinalId) {
    citasQuery = citasQuery.eq("sucursal_id", sucursalFinalId);
  }

  const { data: citasOcupadas, error: citasError } = await citasQuery;

  if (citasError) throw new Error(citasError.message);

  let bloqueosQuery = supabase
    .from("bloqueos_horario")
    .select("id, empleado_id, sucursal_id, fecha_inicio, fecha_fin")
    .eq("negocio_id", negocio.id)
    .lte("fecha_inicio", `${fecha}T23:59:59`)
    .gte("fecha_fin", `${fecha}T00:00:00`);

  const { data: bloqueos, error: bloqueosError } = await bloqueosQuery;

  if (bloqueosError) throw new Error(bloqueosError.message);

  const duracion = Number(servicio.duracion_minutos ?? 30);
  const step = Number(negocio.intervalo_reserva_minutos ?? stepMinutes ?? 30);

  const negocioRango = {
    inicio: String(horarioNegocio.hora_apertura).slice(0, 5),
    fin: String(horarioNegocio.hora_cierre).slice(0, 5),
  };

  const inicioNegocio = toMinutes(negocioRango.inicio);
  const finNegocio = toMinutes(negocioRango.fin);

  const slotEmployees: Record<string, string[]> = {};

  for (const empleado of empleadosDisponibles) {
    const horario = (horariosEmpleado ?? []).find(
      (item: any) => item.empleado_id === empleado.id
    );

    if (horario && !horario.activo) continue;

    const rangoEmpleado = horario?.hora_inicio && horario?.hora_fin
      ? {
          inicio: String(horario.hora_inicio).slice(0, 5),
          fin: String(horario.hora_fin).slice(0, 5),
        }
      : negocioRango;

    const inicio = Math.max(inicioNegocio, toMinutes(rangoEmpleado.inicio));
    const fin = Math.min(finNegocio, toMinutes(rangoEmpleado.fin));

    for (let actual = inicio; actual + duracion <= fin; actual += step) {
      const slotInicio = actual;
      const slotFin = actual + duracion;
      const hora = fromMinutes(slotInicio);

      if (!estaDentro(slotInicio, slotFin, negocioRango)) continue;

      if (
        cruzaDescanso(
          slotInicio,
          slotFin,
          horario?.descanso_inicio,
          horario?.descanso_fin
        )
      ) {
        continue;
      }

      const ocupadoPorCita = (citasOcupadas ?? []).some((cita: any) => {
        if (cita.empleado_id !== empleado.id) return false;

        return overlap(
          slotInicio,
          slotFin,
          toMinutes(String(cita.hora_inicio).slice(0, 5)),
          toMinutes(String(cita.hora_fin).slice(0, 5))
        );
      });

      if (ocupadoPorCita) continue;

      const bloqueado = (bloqueos ?? []).some((bloqueo: any) => {
        const bloqueoEmpleadoId = bloqueo.empleado_id ?? null;
        const bloqueoSucursalId = bloqueo.sucursal_id ?? null;

        const aplicaAlEmpleado =
          bloqueoEmpleadoId === null || bloqueoEmpleadoId === empleado.id;

        const aplicaSucursal =
          bloqueoSucursalId === null ||
          !sucursalFinalId ||
          bloqueoSucursalId === sucursalFinalId;

        if (!aplicaAlEmpleado || !aplicaSucursal) return false;

        const inicioBloqueo = new Date(bloqueo.fecha_inicio);
        const finBloqueo = new Date(bloqueo.fecha_fin);

        const bloqueoInicioMin =
          inicioBloqueo.getHours() * 60 + inicioBloqueo.getMinutes();
        const bloqueoFinMin =
          finBloqueo.getHours() * 60 + finBloqueo.getMinutes();

        return overlap(slotInicio, slotFin, bloqueoInicioMin, bloqueoFinMin);
      });

      if (bloqueado) continue;

      if (!slotEmployees[hora]) {
        slotEmployees[hora] = [];
      }

      slotEmployees[hora].push(empleado.id);
    }
  }

  const slots = Object.keys(slotEmployees).sort();

  return {
    slots,
    slotEmployees,
    negocio,
    servicio,
    sucursalId: sucursalFinalId,
  };
}