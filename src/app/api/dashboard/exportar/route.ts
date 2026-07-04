import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { nivelPlan } from "@/lib/planes/plan-access";

type Relacion<T> = T | T[] | null;

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");
}

async function getContext() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado.", status: 401 as const };
  }

  const supabase = createServiceRoleClient();

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError) throw new Error(membresiaError.message);

  if (!membresia) {
    return { error: "No tenés un negocio activo.", status: 404 as const };
  }

  const { data: suscripcion, error: suscripcionError } = await supabase
    .from("suscripciones")
    .select("plan_id")
    .eq("negocio_id", membresia.negocio_id)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (suscripcionError) throw new Error(suscripcionError.message);

  let planClave = "gratis";

  if (suscripcion?.plan_id) {
    const { data: plan, error: planError } = await supabase
      .from("planes_saas")
      .select("clave")
      .eq("id", suscripcion.plan_id)
      .maybeSingle();

    if (planError) throw new Error(planError.message);

    planClave = plan?.clave ?? "gratis";
  }

  if (nivelPlan(planClave) < 2) {
    return { error: "Exportar CSV está disponible desde el Plan Profesional.", status: 403 as const };
  }

  return {
    supabase,
    negocioId: membresia.negocio_id as string,
  };
}

export async function GET(request: Request) {
  try {
    const context = await getContext();

    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const { supabase, negocioId } = context;
    const { searchParams } = new URL(request.url);

    const tipo = searchParams.get("tipo") ?? "citas";
    const desde = searchParams.get("desde");
    const hasta = searchParams.get("hasta");

    let csv = "";
    let filename = `${tipo}.csv`;

    if (tipo === "citas") {
      let query = supabase
        .from("citas")
        .select(
          `
          fecha,
          hora_inicio,
          hora_fin,
          estado,
          precio,
          origen,
          notas,
          clientes (
            nombre_completo,
            telefono,
            email
          ),
          servicios (
            nombre
          ),
          empleados (
            nombre
          )
        `
        )
        .eq("negocio_id", negocioId)
        .order("fecha", { ascending: true });

      if (desde) query = query.gte("fecha", desde);
      if (hasta) query = query.lte("fecha", hasta);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const rows = (data ?? []).map((cita: any) => {
        const cliente = obtenerObjeto(cita.clientes);
        const servicio = obtenerObjeto(cita.servicios);
        const empleado = obtenerObjeto(cita.empleados);

        return [
          cita.fecha,
          cita.hora_inicio,
          cita.hora_fin,
          cita.estado,
          cita.precio,
          cita.origen,
          cliente?.nombre_completo,
          cliente?.telefono,
          cliente?.email,
          servicio?.nombre,
          empleado?.nombre,
          cita.notas,
        ];
      });

      csv = toCsv(
        [
          "Fecha",
          "Hora inicio",
          "Hora fin",
          "Estado",
          "Precio",
          "Origen",
          "Cliente",
          "Teléfono",
          "Email",
          "Servicio",
          "Empleado",
          "Notas",
        ],
        rows
      );

      filename = "citas-agendame.csv";
    }

    if (tipo === "clientes") {
      const { data, error } = await supabase
        .from("clientes")
        .select("nombre_completo, telefono, email, estado, notas, created_at")
        .eq("negocio_id", negocioId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      csv = toCsv(
        ["Nombre", "Teléfono", "Email", "Estado", "Notas", "Creado"],
        (data ?? []).map((cliente: any) => [
          cliente.nombre_completo,
          cliente.telefono,
          cliente.email,
          cliente.estado,
          cliente.notas,
          cliente.created_at,
        ])
      );

      filename = "clientes-agendame.csv";
    }

    if (tipo === "servicios") {
      const { data, error } = await supabase
        .from("servicios")
        .select("nombre, descripcion, duracion_minutos, precio, estado, created_at")
        .eq("negocio_id", negocioId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      csv = toCsv(
        ["Nombre", "Descripción", "Duración", "Precio", "Estado", "Creado"],
        (data ?? []).map((servicio: any) => [
          servicio.nombre,
          servicio.descripcion,
          servicio.duracion_minutos,
          servicio.precio,
          servicio.estado,
          servicio.created_at,
        ])
      );

      filename = "servicios-agendame.csv";
    }

    if (tipo === "empleados") {
      const { data, error } = await supabase
        .from("empleados")
        .select("nombre, email, telefono, estado, created_at")
        .eq("negocio_id", negocioId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);

      csv = toCsv(
        ["Nombre", "Email", "Teléfono", "Estado", "Creado"],
        (data ?? []).map((empleado: any) => [
          empleado.nombre,
          empleado.email,
          empleado.telefono,
          empleado.estado,
          empleado.created_at,
        ])
      );

      filename = "empleados-agendame.csv";
    }

    if (!csv) {
      return NextResponse.json({ error: "Tipo de exportación inválido." }, { status: 400 });
    }

    return new Response(`\ufeff${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exportando CSV:", error);

    return NextResponse.json(
      { error: "No se pudo exportar el archivo." },
      { status: 500 }
    );
  }
}