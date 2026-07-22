import { CitasPanel } from "@/components/citas/citas-panel";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { applySucursalScope, requirePermission } from "@/lib/dashboard/scope-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

type ClienteDashboard = {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  email?: string | null;
  estado: "activo" | "inactivo";
};

type ClienteSucursalRow = {
  clientes: Relacion<ClienteDashboard>;
};

type EmpleadoServicioRow = {
  servicio_id: string | null;
};

type HorarioEmpleadoRow = {
  id: string;
  dia_semana: number;
  activo: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  descanso_inicio: string | null;
  descanso_fin: string | null;
};

type EmpleadoDashboard = {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  color_calendario: string | null;
  estado: "activo" | "inactivo";
  sucursal_id?: string | null;
  empleado_servicios?: EmpleadoServicioRow[] | null;
  horarios_empleado?: HorarioEmpleadoRow[] | null;
};

type PageProps = {
  searchParams?: Promise<{
    fecha?: string;
    hora?: string;
    cita?: string;
  }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

/**
 * El calendario (CitasPanel) navega semana a semana enteramente en el
 * cliente sobre el array ya cargado -- no vuelve a pedir al servidor al
 * apretar "Anterior"/"Siguiente" ni al cambiar de mes/año. Antes esta
 * pagina traia TODAS las citas del negocio sin ningun limite de fecha: con
 * pocos meses de uso no se nota, pero un negocio real acumulando años de
 * historial terminaria trayendo miles de filas en cada carga del
 * calendario. Se acota a una ventana generosa (3 meses atras, 12 meses
 * adelante de la fecha que se este mirando) -- cubre por lejos el uso real
 * de un calendario de reservas. Fuera de esa ventana (ej. el selector de
 * año permite ir 5 años para atras/adelante) el calendario simplemente
 * mostraria la semana vacia, no un error. Si mas adelante hace falta
 * navegar bien lejos en el tiempo con datos reales, conviene que el
 * calendario vuelva a pedir al servidor por rango en vez de agrandar esta
 * ventana.
 */
function calcularVentanaCitas(fechaParam?: string) {
  const fechaValida = fechaParam && !Number.isNaN(new Date(fechaParam).getTime());
  const base = fechaValida ? new Date(fechaParam as string) : new Date();

  const desde = new Date(base);
  desde.setDate(desde.getDate() - 90);

  const hasta = new Date(base);
  hasta.setDate(hasta.getDate() + 365);

  const aIso = (fecha: Date) => fecha.toISOString().slice(0, 10);

  return { desde: aIso(desde), hasta: aIso(hasta) };
}

export default async function CitasPage({ searchParams }: PageProps) {
  const access = await requireDashboardAccess();
  requirePermission(access, "puedeGestionarCitas");
  const params = (await searchParams) ?? {};

  if (access.rol === "empleado_sucursal" && !access.empleadoId) {
    return (
      <div className="rounded-3xl border bg-card p-8 text-center shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
        <h1 className="text-2xl font-bold">Tu cuenta todavía no está vinculada</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
          Tu acceso de personal no está asociado a ningún empleado de la plantilla
          todavía. Pedile al gerente de tu sucursal que te vincule desde
          Sucursales → Usuarios para poder ver tu agenda.
        </p>
      </div>
    );
  }

  const supabase = createServiceRoleClient();
  const { desde: fechaDesde, hasta: fechaHasta } = calcularVentanaCitas(params.fecha);

  let citasQuery = supabase
    .from("citas")
    .select(
      `
      id,
      negocio_id,
      sucursal_id,
      cliente_id,
      servicio_id,
      empleado_id,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      precio,
      notas,
      origen,
      seguimiento_token,
      created_at,
      clientes (
        id,
        nombre_completo,
        telefono,
        email
      ),
      servicios (
        id,
        nombre,
        duracion_minutos,
        precio,
        color
      ),
      empleados (
        id,
        nombre,
        color_calendario,
        sucursal_id
      ),
      sucursales (
        id,
        nombre
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .gte("fecha", fechaDesde)
    .lte("fecha", fechaHasta)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  citasQuery = applySucursalScope(citasQuery, access);

  if (access.rol === "empleado_sucursal" && access.empleadoId) {
    citasQuery = citasQuery.eq("empleado_id", access.empleadoId);
  }

  let empleadosQuery = supabase
    .from("empleados")
    .select(
      `
      id,
      nombre,
      email,
      telefono,
      color_calendario,
      estado,
      sucursal_id,
      empleado_servicios (
        servicio_id
      ),
      horarios_empleado (
        id,
        dia_semana,
        activo,
        hora_inicio,
        hora_fin,
        descanso_inicio,
        descanso_fin
      )
    `
    )
    .eq("negocio_id", access.negocio.id)
    .eq("estado", "activo")
    .order("nombre", { ascending: true });

  empleadosQuery = applySucursalScope(empleadosQuery, access);

  const clientesPromise = (async (): Promise<ClienteDashboard[]> => {
    if (access.scope === "sucursal" && access.sucursalId) {
      const { data: clientesSucursal, error: clientesSucursalError } = await supabase
        .from("cliente_sucursales")
        .select(
          `
          clientes (
            id,
            nombre_completo,
            telefono,
            email,
            estado
          )
        `
        )
        .eq("negocio_id", access.negocio.id)
        .eq("sucursal_id", access.sucursalId);

      if (clientesSucursalError) {
        throw new Error(clientesSucursalError.message);
      }

      const clientesSucursalRows = (clientesSucursal ?? []) as ClienteSucursalRow[];

      return clientesSucursalRows
        .map((row) => obtenerObjeto(row.clientes))
        .filter((cliente): cliente is ClienteDashboard => Boolean(cliente))
        .filter((cliente) => cliente.estado === "activo");
    }

    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("id, nombre_completo, telefono, email, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre_completo", { ascending: true });

    if (clientesError) {
      throw new Error(clientesError.message);
    }

    return (clientesData ?? []) as ClienteDashboard[];
  })();

  const [
    { data: citas, error: citasError },
    { data: empleados, error: empleadosError },
    { data: servicios, error: serviciosError },
    clientes,
  ] = await Promise.all([
    citasQuery,

    empleadosQuery,

    supabase
      .from("servicios")
      .select("id, nombre, duracion_minutos, precio, color, estado")
      .eq("negocio_id", access.negocio.id)
      .eq("estado", "activo")
      .order("nombre", { ascending: true }),
    clientesPromise,
  ]);

  if (citasError) throw new Error(citasError.message);
  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);

  const empleadosNormalizados = ((empleados ?? []) as EmpleadoDashboard[]).map((empleado) => {
    const servicioIds = (empleado.empleado_servicios ?? [])
      .map((item) => item.servicio_id)
      .filter((servicioId): servicioId is string => Boolean(servicioId));

    const horarios = empleado.horarios_empleado ?? [];

    return {
      ...empleado,
      servicio_ids: servicioIds,
      servicios_ids: servicioIds,
      horarios,
      horarios_empleado: horarios,
      empleado_servicios: empleado.empleado_servicios ?? [],
    };
  });

  const empleadosVisibles =
    access.rol === "empleado_sucursal" && access.empleadoId
      ? empleadosNormalizados.filter((empleado) => empleado.id === access.empleadoId)
      : empleadosNormalizados;

  const empleadoServicios = empleadosVisibles.flatMap((empleado) => {
    return (empleado.empleado_servicios ?? [])
      .map((relacion) => ({
        empleado_id: empleado.id,
        servicio_id: relacion.servicio_id,
      }))
      .filter(
        (relacion): relacion is { empleado_id: string; servicio_id: string } =>
          Boolean(relacion.empleado_id && relacion.servicio_id)
      );
  });

  return (
    <CitasPanel
      key={`${params.fecha ?? ""}-${params.hora ?? ""}-${params.cita ?? ""}`}
      citas={citas ?? []}
      clientes={clientes}
      servicios={servicios ?? []}
      empleados={empleadosVisibles}
      empleadoServicios={empleadoServicios}
      initialFecha={params.fecha}
      initialHora={params.hora}
      highlightCitaId={params.cita}
    />
  );
}
