import type { SupabaseClient } from "@supabase/supabase-js";

const TIMEZONE = "America/Asuncion";
const DEFAULT_STEP_MINUTES = 30;

type NegocioBasico = {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  intervalo_reserva_minutos: number | null;
};

type ServicioBasico = {
  id: string;
  negocio_id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number | string;
  estado: string;
  intervalo_reserva_minutos: number | null;
};

type EmpleadoBasico = {
  id: string;
  nombre: string;
};

type HorarioNegocio = {
  activo: boolean;
  hora_apertura: string | null;
  hora_cierre: string | null;
};

type HorarioEmpleado = {
  empleado_id: string;
  activo: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  descanso_inicio: string | null;
  descanso_fin: string | null;
};

type CitaOcupada = {
  empleado_id: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  intervalo_reserva_minutos: number | null;
};

type BloqueoHorario = {
  empleado_id: string | null;
  fecha_inicio: string;
  fecha_fin: string;
};

export type SlotDisponible = {
  hora: string;
  empleadosDisponibles: EmpleadoBasico[];
};

export type DisponibilidadResultado = {
  negocio: NegocioBasico | null;
  servicio: ServicioBasico | null;
  slots: SlotDisponible[];
  error?: string;
  status?: number;
};

function obtenerParteFechaAsuncion(nombre: Intl.DateTimeFormatPartTypes) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  return parts.find((part) => part.type === nombre)?.value ?? "";
}

function hoyAsuncionIso() {
  const year = obtenerParteFechaAsuncion("year");
  const month = obtenerParteFechaAsuncion("month");
  const day = obtenerParteFechaAsuncion("day");

  return `${year}-${month}-${day}`;
}

function minutosAhoraAsuncion() {
  const hour = Number(obtenerParteFechaAsuncion("hour")) % 24;
  const minute = Number(obtenerParteFechaAsuncion("minute"));

  return hour * 60 + minute;
}

function fechaLocalDesdeIso(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function esFechaIsoValida(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;

  const date = fechaLocalDesdeIso(fecha);

  if (Number.isNaN(date.getTime())) return false;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` === fecha;
}

function normalizarHora(valor: string) {
  return valor.slice(0, 5);
}

function horaAMinutos(valor: string) {
  const [hours, minutes] = normalizarHora(valor).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutosAHora(minutos: number) {
  const hours = Math.floor(minutos / 60);
  const mins = minutos % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function sumarMinutosHora(hora: string, minutos: number) {
  return minutosAHora(horaAMinutos(hora) + minutos);
}

function rangosSolapan(inicioA: number, finA: number, inicioB: number, finB: number) {
  return inicioA < finB && finA > inicioB;
}

function redondearArriba(minutos: number, step: number) {
  return Math.ceil(minutos / step) * step;
}

function rangoBloqueoEnFecha(bloqueo: BloqueoHorario, fecha: string) {
  const fechaInicio = bloqueo.fecha_inicio.slice(0, 10);
  const fechaFin = bloqueo.fecha_fin.slice(0, 10);

  const inicio =
    fechaInicio < fecha ? 0 : horaAMinutos(bloqueo.fecha_inicio.slice(11, 16));

  const fin =
    fechaFin > fecha ? 24 * 60 : horaAMinutos(bloqueo.fecha_fin.slice(11, 16));

  return { inicio, fin };
}

export async function calcularDisponibilidadReserva({
  supabase,
  slug,
  servicioId,
  fecha,
  stepMinutes = DEFAULT_STEP_MINUTES,
}: {
  supabase: SupabaseClient;
  slug: string;
  servicioId: string;
  fecha: string;
  stepMinutes?: number;
}): Promise<DisponibilidadResultado> {
  if (!slug || !servicioId || !fecha) {
    return {
      negocio: null,
      servicio: null,
      slots: [],
      error: "Faltan datos para calcular disponibilidad.",
      status: 400,
    };
  }

  if (!esFechaIsoValida(fecha)) {
    return {
      negocio: null,
      servicio: null,
      slots: [],
      error: "La fecha no es válida.",
      status: 400,
    };
  }

  if (fecha < hoyAsuncionIso()) {
    return {
      negocio: null,
      servicio: null,
      slots: [],
      error: "No se pueden reservar fechas pasadas.",
      status: 400,
    };
  }

  const { data: negocioData, error: negocioError } = await supabase
    .from("negocios")
    .select("id, nombre, slug, estado, intervalo_reserva_minutos")
    .eq("slug", slug)
    .eq("estado", "activo")
    .maybeSingle();

  if (negocioError) {
    throw new Error(negocioError.message);
  }

  if (!negocioData) {
    return {
      negocio: null,
      servicio: null,
      slots: [],
      error: "Negocio no disponible.",
      status: 404,
    };
  }

  const negocio = negocioData as NegocioBasico;

  const intervaloReservaMinutos =
    typeof negocio.intervalo_reserva_minutos === "number" &&
    negocio.intervalo_reserva_minutos >= 5 &&
    negocio.intervalo_reserva_minutos <= 120
      ? negocio.intervalo_reserva_minutos
      : stepMinutes;

  const { data: puedeOperar, error: puedeOperarError } = await supabase.rpc(
    "negocio_puede_operar",
    {
      p_negocio_id: negocio.id,
    }
  );

  if (puedeOperarError) {
    throw new Error(puedeOperarError.message);
  }

  if (!puedeOperar) {
    return {
      negocio,
      servicio: null,
      slots: [],
      error: "Este negocio no está disponible para recibir reservas.",
      status: 403,
    };
  }

  const { data: servicioData, error: servicioError } = await supabase
    .from("servicios")
    .select("id, negocio_id, nombre, duracion_minutos, precio, estado")
    .eq("id", servicioId)
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo")
    .maybeSingle();

  if (servicioError) {
    throw new Error(servicioError.message);
  }

  if (!servicioData) {
    return {
      negocio,
      servicio: null,
      slots: [],
      error: "Servicio no disponible.",
      status: 404,
    };
  }

  const servicio = servicioData as ServicioBasico;

  const diaSemana = fechaLocalDesdeIso(fecha).getDay();

  const { data: horarioNegocioData, error: horarioNegocioError } = await supabase
    .from("horarios_negocio")
    .select("activo, hora_apertura, hora_cierre")
    .eq("negocio_id", negocio.id)
    .eq("dia_semana", diaSemana)
    .maybeSingle();

  if (horarioNegocioError) {
    throw new Error(horarioNegocioError.message);
  }

  const horarioNegocio = horarioNegocioData as HorarioNegocio | null;

  if (
    !horarioNegocio ||
    !horarioNegocio.activo ||
    !horarioNegocio.hora_apertura ||
    !horarioNegocio.hora_cierre
  ) {
    return {
      negocio,
      servicio,
      slots: [],
    };
  }

  const { data: relacionesData, error: relacionesError } = await supabase
    .from("empleado_servicios")
    .select("empleado_id")
    .eq("servicio_id", servicio.id);

  if (relacionesError) {
    throw new Error(relacionesError.message);
  }

  const empleadoIds = ((relacionesData ?? []) as { empleado_id: string }[]).map(
    (relacion) => relacion.empleado_id
  );

  if (empleadoIds.length === 0) {
    return {
      negocio,
      servicio,
      slots: [],
    };
  }

  const { data: empleadosData, error: empleadosError } = await supabase
    .from("empleados")
    .select("id, nombre")
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo")
    .in("id", empleadoIds);

  if (empleadosError) {
    throw new Error(empleadosError.message);
  }

  const empleados = (empleadosData ?? []) as EmpleadoBasico[];

  if (empleados.length === 0) {
    return {
      negocio,
      servicio,
      slots: [],
    };
  }

  const empleadosActivosIds = empleados.map((empleado) => empleado.id);

  const [
    { data: horariosEmpleadoData, error: horariosEmpleadoError },
    { data: citasData, error: citasError },
    { data: bloqueosData, error: bloqueosError },
  ] = await Promise.all([
    supabase
      .from("horarios_empleado")
      .select(
        "empleado_id, activo, hora_inicio, hora_fin, descanso_inicio, descanso_fin"
      )
      .in("empleado_id", empleadosActivosIds)
      .eq("dia_semana", diaSemana),

    supabase
      .from("citas")
      .select("empleado_id, hora_inicio, hora_fin, estado")
      .eq("negocio_id", negocio.id)
      .eq("fecha", fecha)
      .in("empleado_id", empleadosActivosIds)
      .in("estado", ["pendiente", "confirmada", "completada"]),

    supabase
      .from("bloqueos_horario")
      .select("empleado_id, fecha_inicio, fecha_fin")
      .eq("negocio_id", negocio.id)
      .lt("fecha_inicio", `${fecha} 23:59:59`)
      .gt("fecha_fin", `${fecha} 00:00:00`),
  ]);

  if (horariosEmpleadoError) {
    throw new Error(horariosEmpleadoError.message);
  }

  if (citasError) {
    throw new Error(citasError.message);
  }

  if (bloqueosError) {
    throw new Error(bloqueosError.message);
  }

  const horariosEmpleado = (horariosEmpleadoData ?? []) as HorarioEmpleado[];
  const citas = (citasData ?? []) as CitaOcupada[];
  const bloqueos = (bloqueosData ?? []) as BloqueoHorario[];

  const horarioEmpleadoMap = new Map<string, HorarioEmpleado>();

  for (const horario of horariosEmpleado) {
    horarioEmpleadoMap.set(horario.empleado_id, horario);
  }

  const slotsMap = new Map<string, EmpleadoBasico[]>();

  const aperturaNegocio = horaAMinutos(horarioNegocio.hora_apertura);
  const cierreNegocio = horaAMinutos(horarioNegocio.hora_cierre);
  const esHoy = fecha === hoyAsuncionIso();
  const ahoraMinutos = minutosAhoraAsuncion();

  for (const empleado of empleados) {
    const horarioEmpleado = horarioEmpleadoMap.get(empleado.id);

    let inicioEmpleado = aperturaNegocio;
    let finEmpleado = cierreNegocio;
    let descansoInicio: number | null = null;
    let descansoFin: number | null = null;

    if (horarioEmpleado) {
      if (
        !horarioEmpleado.activo ||
        !horarioEmpleado.hora_inicio ||
        !horarioEmpleado.hora_fin
      ) {
        continue;
      }

      inicioEmpleado = Math.max(
        aperturaNegocio,
        horaAMinutos(horarioEmpleado.hora_inicio)
      );

      finEmpleado = Math.min(
        cierreNegocio,
        horaAMinutos(horarioEmpleado.hora_fin)
      );

      if (horarioEmpleado.descanso_inicio && horarioEmpleado.descanso_fin) {
        descansoInicio = horaAMinutos(horarioEmpleado.descanso_inicio);
        descansoFin = horaAMinutos(horarioEmpleado.descanso_fin);
      }
    }

    let inicioSlot = redondearArriba(inicioEmpleado, intervaloReservaMinutos);

    while (inicioSlot + servicio.duracion_minutos <= finEmpleado) {
      const finSlot = inicioSlot + servicio.duracion_minutos;

      const chocaConAhora = esHoy && inicioSlot <= ahoraMinutos;

      const chocaConDescanso =
        descansoInicio !== null &&
        descansoFin !== null &&
        rangosSolapan(inicioSlot, finSlot, descansoInicio, descansoFin);

      const chocaConCita = citas.some((cita) => {
        if (cita.empleado_id !== empleado.id) return false;

        return rangosSolapan(
          inicioSlot,
          finSlot,
          horaAMinutos(cita.hora_inicio),
          horaAMinutos(cita.hora_fin)
        );
      });

      const chocaConBloqueo = bloqueos.some((bloqueo) => {
        if (bloqueo.empleado_id && bloqueo.empleado_id !== empleado.id) {
          return false;
        }

        const rango = rangoBloqueoEnFecha(bloqueo, fecha);

        return rangosSolapan(inicioSlot, finSlot, rango.inicio, rango.fin);
      });

      if (!chocaConAhora && !chocaConDescanso && !chocaConCita && !chocaConBloqueo) {
        const hora = minutosAHora(inicioSlot);
        const empleadosDisponibles = slotsMap.get(hora) ?? [];

        empleadosDisponibles.push(empleado);
        slotsMap.set(hora, empleadosDisponibles);
      }

      inicioSlot += intervaloReservaMinutos;
    }
  }

  const slots: SlotDisponible[] = Array.from(slotsMap.entries())
    .sort(([horaA], [horaB]) => horaA.localeCompare(horaB))
    .map(([hora, empleadosDisponibles]) => ({
      hora,
      empleadosDisponibles,
    }));

  return {
    negocio,
    servicio,
    slots,
  };
}