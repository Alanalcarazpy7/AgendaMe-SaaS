import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { nivelPlan } from "@/lib/planes/plan-access";

export type DashboardAccessRole =
  | "admin_global"
  | "gerente_sucursal"
  | "recepcionista_sucursal"
  | "empleado_sucursal";

export type DashboardAccessScope = "global" | "sucursal";

type AccessResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string | null;
      };
      negocio: {
        id: string;
        nombre: string;
        slug?: string | null;
        logo_url?: string | null;
      };
      planClave: string;
      planNombre: string;
      planNivel: number;
      scope: DashboardAccessScope;
      rol: DashboardAccessRole;
      sucursalId: string | null;
      sucursalNombre: string | null;
      puedeVerTodo: boolean;
      puedeGestionarPlanes: boolean;
      puedeGestionarConfiguracion: boolean;
      puedeGestionarSucursales: boolean;
      puedeGestionarEmpleados: boolean;
      puedeGestionarClientes: boolean;
      puedeGestionarCitas: boolean;
      puedeVerReportes: boolean;
      puedeVerReportesGlobales: boolean;
      puedeExportar: boolean;
      puedeUsarRecordatorios: boolean;
    }
  | {
      ok: false;
      reason: "unauthenticated" | "no_access" | "not_enterprise_branch";
    };

async function obtenerPlanActivo(
  supabase: ReturnType<typeof createServiceRoleClient>,
  negocioId: string
) {
  const { data: suscripcion, error: suscripcionError } = await supabase
    .from("suscripciones")
    .select("plan_id")
    .eq("negocio_id", negocioId)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (suscripcionError) {
    throw new Error(suscripcionError.message);
  }

  if (!suscripcion?.plan_id) {
    return {
      planClave: "gratis",
      planNombre: "Gratis",
      planNivel: 0,
    };
  }

  const { data: plan, error: planError } = await supabase
    .from("planes_saas")
    .select("clave, nombre")
    .eq("id", suscripcion.plan_id)
    .maybeSingle();

  if (planError) {
    throw new Error(planError.message);
  }

  return {
    planClave: plan?.clave ?? "gratis",
    planNombre: plan?.nombre ?? "Gratis",
    planNivel: nivelPlan(plan?.clave ?? "gratis"),
  };
}

function permisosPorRol({
  rol,
  scope,
  planNivel,
}: {
  rol: DashboardAccessRole;
  scope: DashboardAccessScope;
  planNivel: number;
}) {
  const global = scope === "global";

  return {
    puedeVerTodo: global,

    puedeGestionarPlanes: global,
    puedeGestionarConfiguracion: global,
    puedeGestionarSucursales: global && planNivel >= 3,

    puedeGestionarEmpleados:
      global || rol === "gerente_sucursal",

    puedeGestionarClientes:
      global ||
      rol === "gerente_sucursal" ||
      rol === "recepcionista_sucursal",

    puedeGestionarCitas:
      global ||
      rol === "gerente_sucursal" ||
      rol === "recepcionista_sucursal",

    puedeVerReportes:
      global || rol === "gerente_sucursal",

    puedeVerReportesGlobales:
      global,

    puedeExportar:
      global
        ? planNivel >= 2
        : rol === "gerente_sucursal" && planNivel >= 3,

    puedeUsarRecordatorios:
      global
        ? planNivel >= 2
        : ["gerente_sucursal", "recepcionista_sucursal"].includes(rol) &&
          planNivel >= 3,
  };
}

export async function resolveDashboardAccess(): Promise<AccessResult> {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      reason: "unauthenticated",
    };
  }

  const supabase = createServiceRoleClient();

  const { data: membresiaGlobal, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id, rol")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError) {
    throw new Error(membresiaError.message);
  }

  if (membresiaGlobal) {
    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id, nombre, slug, logo_url")
      .eq("id", membresiaGlobal.negocio_id)
      .maybeSingle();

    if (negocioError) {
      throw new Error(negocioError.message);
    }

    if (!negocio) {
      return {
        ok: false,
        reason: "no_access",
      };
    }

    const plan = await obtenerPlanActivo(supabase, negocio.id);

    const permisos = permisosPorRol({
      rol: "admin_global",
      scope: "global",
      planNivel: plan.planNivel,
    });

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      negocio,
      ...plan,
      scope: "global",
      rol: "admin_global",
      sucursalId: null,
      sucursalNombre: null,
      ...permisos,
    };
  }

  const email = String(user.email ?? "").trim().toLowerCase();

  if (!email) {
    return {
      ok: false,
      reason: "no_access",
    };
  }

  let { data: accesoSucursal, error: accesoError } = await supabase
    .from("sucursal_usuarios")
    .select(
      `
      id,
      negocio_id,
      sucursal_id,
      usuario_id,
      email,
      rol,
      activo,
      sucursales (
        nombre
      )
    `
    )
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (accesoError) {
    throw new Error(accesoError.message);
  }

  if (!accesoSucursal) {
    const { data: accesoPorEmail, error: accesoEmailError } = await supabase
      .from("sucursal_usuarios")
      .select(
        `
        id,
        negocio_id,
        sucursal_id,
        usuario_id,
        email,
        rol,
        activo,
        sucursales (
          nombre
        )
      `
      )
      .eq("email", email)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    if (accesoEmailError) {
      throw new Error(accesoEmailError.message);
    }

    accesoSucursal = accesoPorEmail;

    if (accesoSucursal && !accesoSucursal.usuario_id) {
      await supabase
        .from("sucursal_usuarios")
        .update({
          usuario_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", accesoSucursal.id);
    }
  }

  if (!accesoSucursal) {
    return {
      ok: false,
      reason: "no_access",
    };
  }

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id, nombre, logo_url")
    .eq("id", accesoSucursal.negocio_id)
    .maybeSingle();

  if (negocioError) {
    throw new Error(negocioError.message);
  }

  if (!negocio) {
    return {
      ok: false,
      reason: "no_access",
    };
  }

  const plan = await obtenerPlanActivo(supabase, negocio.id);

  if (plan.planNivel < 3) {
    return {
      ok: false,
      reason: "not_enterprise_branch",
    };
  }

  const rol = accesoSucursal.rol as DashboardAccessRole;

  const permisos = permisosPorRol({
    rol,
    scope: "sucursal",
    planNivel: plan.planNivel,
  });

  const sucursal = Array.isArray(accesoSucursal.sucursales)
    ? accesoSucursal.sucursales[0]
    : accesoSucursal.sucursales;

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    negocio,
    ...plan,
    scope: "sucursal",
    rol,
    sucursalId: accesoSucursal.sucursal_id,
    sucursalNombre: sucursal?.nombre ?? "Sucursal",
    ...permisos,
  };
}

export async function requireDashboardAccess() {
  const access = await resolveDashboardAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/auth/login");
    }

    redirect("/onboarding/negocio");
  }

  return access;
}

export function aplicarFiltroSucursal<T extends { eq: Function }>(
  query: T,
  access: Awaited<ReturnType<typeof requireDashboardAccess>>,
  columna = "sucursal_id"
) {
  if (access.scope === "sucursal" && access.sucursalId) {
    return query.eq(columna, access.sucursalId);
  }

  return query;
}