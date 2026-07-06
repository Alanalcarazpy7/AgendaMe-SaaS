import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type PlanClave = "gratis" | "basico" | "profesional" | "empresarial";

export type PlanDb = {
  id: string;
  clave: PlanClave;
  nombre: string;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes?: number | null;
};

export type FixtureNegocio = {
  negocioId: string;
  slug: string;
  sucursalId: string;
  plan: PlanDb;
};

function cargarEnvLocal() {
  const root = process.cwd();

  for (const fileName of [".env.local", ".env"]) {
    const file = path.join(root, fileName);

    if (!fs.existsSync(file)) continue;

    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const clean = line.trim();

      if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;

      const index = clean.indexOf("=");
      const key = clean.slice(0, index).trim();
      let value = clean.slice(index + 1).trim();

      value = value.replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

let cachedClient: SupabaseClient | null = null;

export function supabaseAdmin() {
  cargarEnvLocal();

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_URL en .env.local");
  }

  if (!serviceKey) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

export function idCorto() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function obtenerPlan(planClave: PlanClave): Promise<PlanDb> {
  const supabase = supabaseAdmin();

  const selectConClientes =
    "id, clave, nombre, limite_citas_mensuales, limite_empleados, limite_servicios, limite_clientes";

  let result = await supabase
    .from("planes_saas")
    .select(selectConClientes)
    .eq("clave", planClave)
    .single();

  if (result.error) {
    const msg = result.error.message ?? "";

    if (/limite_clientes|schema cache|column/i.test(msg)) {
      result = await supabase
        .from("planes_saas")
        .select("id, clave, nombre, limite_citas_mensuales, limite_empleados, limite_servicios")
        .eq("clave", planClave)
        .single();
    }
  }

  if (result.error || !result.data) {
    throw new Error(`No se pudo obtener el plan ${planClave}: ${result.error?.message}`);
  }

  return result.data as PlanDb;
}

export async function obtenerPlanes() {
  const claves: PlanClave[] = ["gratis", "basico", "profesional", "empresarial"];
  const planes: Record<PlanClave, PlanDb> = {} as Record<PlanClave, PlanDb>;

  for (const clave of claves) {
    planes[clave] = await obtenerPlan(clave);
  }

  return planes;
}

export function fechaParaIndice(monthOffset: number, index: number) {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);

  // 16 turnos por día. Así evitamos repetir misma fecha+hora en tests grandes.
  const dia = Math.floor(index / 16) + 1;

  base.setDate(Math.min(dia, 28));

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function yearMonth(monthOffset: number) {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);

  return {
    anio: base.getFullYear(),
    mes: base.getMonth() + 1,
  };
}

export function horaParaIndice(index: number) {
  const slot = index % 16;
  const hour = 8 + Math.floor(slot / 2);
  const minute = slot % 2 === 0 ? "00" : "30";

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function sumar30Min(hora: string) {
  const [hh, mm] = hora.split(":").map(Number);
  const total = hh * 60 + mm + 30;

  const nextH = Math.floor(total / 60);
  const nextM = total % 60;

  return `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
}

export async function crearNegocioPrueba(planClave: PlanClave): Promise<FixtureNegocio> {
  const supabase = supabaseAdmin();
  const plan = await obtenerPlan(planClave);
  const id = idCorto();
  const slug = `test-limites-${planClave}-${id}`.replace(/[^a-z0-9-]/g, "-");

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .insert({
      nombre: `TEST Limites ${planClave} ${id}`,
      slug,
      estado: "activo",
    })
    .select("id, slug")
    .single();

  if (negocioError || !negocio) {
    throw new Error(`No se pudo crear negocio de prueba: ${negocioError?.message}`);
  }

  const updated = await supabase
    .from("suscripciones")
    .update({
      plan_id: plan.id,
      estado: "activa",
      fecha_inicio: new Date().toISOString(),
      fecha_vencimiento: null,
    })
    .eq("negocio_id", negocio.id)
    .eq("estado", "activa")
    .select("id")
    .maybeSingle();

  if (updated.error) {
    throw new Error(`No se pudo actualizar suscripción: ${updated.error.message}`);
  }

  if (!updated.data) {
    const inserted = await supabase
      .from("suscripciones")
      .insert({
        negocio_id: negocio.id,
        plan_id: plan.id,
        estado: "activa",
        fecha_inicio: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (inserted.error) {
      throw new Error(`No se pudo insertar suscripción: ${inserted.error.message}`);
    }
  }

  let sucursalId = "";

  const rpc = await supabase.rpc("obtener_o_crear_sucursal_principal", {
    p_negocio_id: negocio.id,
  });

  const existente = await supabase
    .from("sucursales")
    .select("id")
    .eq("negocio_id", negocio.id)
    .eq("es_principal", true)
    .limit(1)
    .maybeSingle();

  if (existente.data?.id) {
    sucursalId = existente.data.id;
  } else {
    const creada = await supabase
      .from("sucursales")
      .insert({
        negocio_id: negocio.id,
        nombre: "Sucursal principal",
        es_principal: true,
        estado: "activo",
      })
      .select("id")
      .single();

    if (creada.error || !creada.data) {
      throw new Error(`No se pudo crear sucursal: ${creada.error?.message || rpc.error?.message}`);
    }

    sucursalId = creada.data.id;
  }

  return {
    negocioId: negocio.id,
    slug: negocio.slug,
    sucursalId,
    plan,
  };
}

export async function borrarNegocioPrueba(negocioId: string) {
  const supabase = supabaseAdmin();

  await supabase.from("negocios").delete().eq("id", negocioId);
}

export async function crearCliente(negocioId: string, index: number) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      negocio_id: negocioId,
      nombre_completo: `Cliente DB Test ${idCorto()} ${index}`,
      telefono: `09${String(Date.now()).slice(-7)}${String(index).padStart(3, "0")}`,
      email: `cliente-db-${idCorto()}@example.com`,
      estado: "activo",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo crear cliente");
  }

  return data.id as string;
}

export async function intentarCrearCliente(negocioId: string, index: number) {
  const supabase = supabaseAdmin();

  return supabase
    .from("clientes")
    .insert({
      negocio_id: negocioId,
      nombre_completo: `Cliente DB Test ${idCorto()} ${index}`,
      telefono: `09${String(Date.now()).slice(-7)}${String(index).padStart(3, "0")}`,
      email: `cliente-db-${idCorto()}@example.com`,
      estado: "activo",
    })
    .select("id")
    .single();
}

export async function crearServicio(negocioId: string, index: number) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("servicios")
    .insert({
      negocio_id: negocioId,
      nombre: `Servicio DB Test ${index} ${idCorto()}`,
      duracion_minutos: 30,
      precio: 10000,
      estado: "activo",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo crear servicio");
  }

  return data.id as string;
}

export async function intentarCrearServicio(negocioId: string, index: number) {
  const supabase = supabaseAdmin();

  return supabase
    .from("servicios")
    .insert({
      negocio_id: negocioId,
      nombre: `Servicio DB Test ${index} ${idCorto()}`,
      duracion_minutos: 30,
      precio: 10000,
      estado: "activo",
    })
    .select("id")
    .single();
}

export async function crearEmpleado(negocioId: string, sucursalId: string, index: number) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("empleados")
    .insert({
      negocio_id: negocioId,
      sucursal_id: sucursalId,
      nombre: `Empleado DB Test ${index} ${idCorto()}`,
      estado: "activo",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo crear empleado");
  }

  return data.id as string;
}

export async function intentarCrearEmpleado(negocioId: string, sucursalId: string, index: number) {
  const supabase = supabaseAdmin();

  return supabase
    .from("empleados")
    .insert({
      negocio_id: negocioId,
      sucursal_id: sucursalId,
      nombre: `Empleado DB Test ${index} ${idCorto()}`,
      estado: "activo",
    })
    .select("id")
    .single();
}

export async function asignarEmpleadoServicio(
  empleadoId: string,
  servicioId: string,
  negocioId: string
) {
  const supabase = supabaseAdmin();

  let result = await supabase
    .from("empleado_servicios")
    .insert({
      empleado_id: empleadoId,
      servicio_id: servicioId,
    });

  if (result.error && /negocio_id/i.test(result.error.message)) {
    result = await supabase
      .from("empleado_servicios")
      .insert({
        empleado_id: empleadoId,
        servicio_id: servicioId,
        negocio_id: negocioId,
      } as any);
  }

  if (result.error) {
    throw new Error(`No se pudo asignar empleado_servicio: ${result.error.message}`);
  }
}

export async function crearHorariosBase(args: {
  negocioId: string;
  empleadoId: string;
}) {
  const supabase = supabaseAdmin();

  const horariosNegocio = Array.from({ length: 7 }, (_, dia) => ({
    negocio_id: args.negocioId,
    dia_semana: dia,
    activo: true,
    hora_apertura: "07:00",
    hora_cierre: "20:00",
  }));

  const { error: negocioHorarioError } = await supabase
    .from("horarios_negocio")
    .upsert(horariosNegocio, {
      onConflict: "negocio_id,dia_semana",
    });

  if (negocioHorarioError) {
    throw new Error(`No se pudo crear horario del negocio: ${negocioHorarioError.message}`);
  }

  const horariosEmpleado = Array.from({ length: 7 }, (_, dia) => ({
    empleado_id: args.empleadoId,
    dia_semana: dia,
    activo: true,
    hora_inicio: "07:00",
    hora_fin: "20:00",
    descanso_inicio: null,
    descanso_fin: null,
  }));

  const { error: empleadoHorarioError } = await supabase
    .from("horarios_empleado")
    .upsert(horariosEmpleado, {
      onConflict: "empleado_id,dia_semana",
    });

  if (empleadoHorarioError) {
    throw new Error(`No se pudo crear horario del empleado: ${empleadoHorarioError.message}`);
  }
}
export async function prepararAgendaBase(fixture: FixtureNegocio) {
  const clienteId = await crearCliente(fixture.negocioId, 1);
  const servicioId = await crearServicio(fixture.negocioId, 1);
  const empleadoId = await crearEmpleado(fixture.negocioId, fixture.sucursalId, 1);

  await asignarEmpleadoServicio(empleadoId, servicioId, fixture.negocioId);

  await crearHorariosBase({
    negocioId: fixture.negocioId,
    empleadoId,
  });

  return {
    clienteId,
    servicioId,
    empleadoId,
  };
}

export async function crearCitaDirecta(args: {
  negocioId: string;
  sucursalId: string;
  clienteId: string;
  servicioId: string;
  empleadoId: string;
  monthOffset: number;
  index: number;
}) {
  const supabase = supabaseAdmin();

  const fecha = fechaParaIndice(args.monthOffset, args.index);
  const horaInicio = horaParaIndice(args.index);
  const horaFin = sumar30Min(horaInicio);

  const { data, error } = await supabase
    .from("citas")
    .insert({
      negocio_id: args.negocioId,
      sucursal_id: args.sucursalId,
      cliente_id: args.clienteId,
      servicio_id: args.servicioId,
      empleado_id: args.empleadoId,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: "pendiente",
      precio: 10000,
      origen: "dashboard",
      notas: `Cita DB límite ${args.index}`,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("No se pudo crear cita");
  }

  return data.id as string;
}

export async function intentarCrearCitaDirecta(args: {
  negocioId: string;
  sucursalId: string;
  clienteId: string;
  servicioId: string;
  empleadoId: string;
  monthOffset: number;
  index: number;
}) {
  const supabase = supabaseAdmin();

  const fecha = fechaParaIndice(args.monthOffset, args.index);
  const horaInicio = horaParaIndice(args.index);
  const horaFin = sumar30Min(horaInicio);

  return supabase
    .from("citas")
    .insert({
      negocio_id: args.negocioId,
      sucursal_id: args.sucursalId,
      cliente_id: args.clienteId,
      servicio_id: args.servicioId,
      empleado_id: args.empleadoId,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: "pendiente",
      precio: 10000,
      origen: "dashboard",
      notas: `Cita DB límite ${args.index}`,
    })
    .select("id")
    .single();
}

export async function usoMensual(negocioId: string, monthOffset: number) {
  const supabase = supabaseAdmin();
  const ym = yearMonth(monthOffset);

  const { data, error } = await supabase
    .from("uso_plan_mensual")
    .select("citas_creadas")
    .eq("negocio_id", negocioId)
    .eq("anio", ym.anio)
    .eq("mes", ym.mes)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Number(data?.citas_creadas ?? 0);
}