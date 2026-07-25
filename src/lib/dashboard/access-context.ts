import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { nivelPlan } from "@/lib/planes/plan-access";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type DashboardAccessRole =
  | "admin_global"
  | "gerente_sucursal"
  | "recepcionista_sucursal"
  | "empleado_sucursal";

export type DashboardAccessScope = "global" | "sucursal";

type AccessOk = {
  ok: true;
  user: {
    id: string;
    email: string | null;
    nombre: string;
    telefono: string | null;
    cargo: string | null;
    avatar_url: string | null;
    tema: "sistema" | "claro" | "oscuro";
    color_acento: string | null;
    recibir_notificaciones: boolean;
  };
  negocio: {
    id: string;
    nombre: string;
    slug: string | null;
    logo_url: string | null;
  };
  planClave: string;
  planNombre: string;
  planNivel: number;
  scope: DashboardAccessScope;
  rol: DashboardAccessRole;
  sucursalId: string | null;
  sucursalNombre: string | null;
  empleadoId: string | null;
  puedeVerTodo: boolean;
  puedeGestionarPlanes: boolean;
  puedeGestionarConfiguracion: boolean;
  puedeGestionarSucursales: boolean;
  puedeGestionarEmpleados: boolean;
  puedeGestionarClientes: boolean;
  puedeGestionarCitas: boolean;
  puedeGestionarReservas: boolean;
  puedeVerReportes: boolean;
  puedeVerReportesGlobales: boolean;
  puedeExportar: boolean;
  puedeUsarRecordatorios: boolean;
};

export type BlockedBusinessContext = {
  user: AccessOk["user"];
  negocio: AccessOk["negocio"] & {
    estado: string;
    motivo_bloqueo: string | null;
    bloqueado_at: string | null;
  };
  planClave: string;
  rol: DashboardAccessRole;
  scope: DashboardAccessScope;
  sucursalNombre: string | null;
};

export type PlanRequiredDashboardContext = {
  user: AccessOk["user"];
  negocio: AccessOk["negocio"];
  planClave: string;
  planNombre: string;
  rol: DashboardAccessRole;
  scope: DashboardAccessScope;
  sucursalNombre: string | null;
  requiredPlanNombre: string;
  restrictedFeature: "sucursales";
};

export type InactiveBranchDashboardContext = {
  user: AccessOk["user"];
  negocio: AccessOk["negocio"];
  planClave: string;
  planNombre: string;
  rol: DashboardAccessRole;
  scope: "sucursal";
  sucursalNombre: string | null;
};

type AccessFail = {
  ok: false;
  reason:
    | "unauthenticated"
    | "platform_owner"
    | "no_access"
    | "inactive_business"
    | "inactive_branch"
    | "plan_required";
  blockedContext?: BlockedBusinessContext;
  planRequiredContext?: PlanRequiredDashboardContext;
  inactiveBranchContext?: InactiveBranchDashboardContext;
};

export type DashboardAccessResult = AccessOk | AccessFail;

type Relacion<T> = T | T[] | null;

type NegocioAcceso = {
  id: string;
  nombre: string;
  slug: string | null;
  logo_url: string | null;
  estado: string;
  motivo_bloqueo: string | null;
  bloqueado_at: string | null;
};

type SucursalAcceso = {
  id: string;
  nombre: string;
  estado: string;
};

type AccesoSucursalRpc = {
  id: string;
  negocio_id: string;
  sucursal_id: string;
  usuario_id: string | null;
  empleado_id: string | null;
  nombre: string | null;
  cargo: string | null;
  avatar_url: string | null;
  email: string | null;
  rol: DashboardAccessRole;
  activo: boolean;
  sucursales: Relacion<SucursalAcceso>;
};

type AccesoDashboardRpc = {
  autenticado: boolean;
  perfil: Record<string, unknown> | null;
  rol_global: string | null;
  membresia_negocio: {
    negocio_id: string;
    rol: string;
    activo: boolean;
    negocio: NegocioAcceso;
  } | null;
  acceso_sucursal: AccesoSucursalRpc | null;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarEmail(email?: string | null) {
  return limpiar(email).toLowerCase();
}

function nombreDesdeUsuario(user: User) {
  const email = normalizarEmail(user?.email);
  const metadata = user?.user_metadata ?? {};

  const nombre =
    limpiar(metadata.nombre) ||
    limpiar(metadata.name) ||
    limpiar(metadata.full_name) ||
    limpiar(metadata.display_name);

  if (nombre) return nombre;
  if (email) return email.split("@")[0];

  return "Usuario";
}

/**
 * Reemplaza la version anterior que consultaba perfiles_usuario por su
 * cuenta (con un fallback de error propio). Ahora el perfil llega como
 * parte del jsonb que devuelve resolver_acceso_dashboard() -- misma logica
 * de defaults, aplicada a los datos ya traidos en esa unica RPC.
 */
function construirPerfilUsuario(
  perfil: Record<string, unknown> | null | undefined,
  user: User
) {
  const nombreAuth = nombreDesdeUsuario(user);
  const email = normalizarEmail(user.email);
  const tema: AccessOk["user"]["tema"] =
    perfil?.tema === "claro" || perfil?.tema === "oscuro"
      ? perfil.tema
      : "sistema";

  return {
    nombre: limpiar(perfil?.nombre) || nombreAuth || email.split("@")[0] || "Usuario",
    telefono: limpiar(perfil?.telefono) || null,
    cargo: limpiar(perfil?.cargo) || limpiar(user.user_metadata?.cargo) || null,
    avatar_url:
      limpiar(perfil?.avatar_url) ||
      limpiar(user.user_metadata?.avatar_url) ||
      null,
    tema,
    color_acento: limpiar(perfil?.color_acento) || null,
    recibir_notificaciones:
      typeof perfil?.recibir_notificaciones === "boolean"
        ? perfil.recibir_notificaciones
        : true,
  };
}

async function obtenerPlanActivo(
  supabase: ReturnType<typeof createServiceRoleClient>,
  negocioId: string
) {
  const { data: suscripcion, error } = await supabase
    .from("suscripciones")
    .select(
      `
      estado,
      planes_saas (
        clave,
        nombre
      )
    `
    )
    .eq("negocio_id", negocioId)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const suscripcionConPlan = suscripcion as {
    planes_saas: Relacion<{ clave: string; nombre: string }>;
  } | null;
  const plan = obtenerObjeto(suscripcionConPlan?.planes_saas ?? null);

  const planClave = plan?.clave ?? "gratis";
  const planNombre = plan?.nombre ?? "Gratis";

  return {
    planClave,
    planNombre,
    planNivel: nivelPlan(planClave),
  };
}

/**
 * Reemplaza la version anterior que hacia hasta 2 consultas propias (por
 * id y por usuario_id). resolver_acceso_dashboard() ya resuelve esa misma
 * busqueda dual dentro de la RPC; aca solo se combina con la env var, que
 * la funcion de Postgres no puede leer.
 */
function esPlatformOwnerDesdeRol(userId: string, rolGlobal: string | null | undefined) {
  const ownerId = process.env.ADMIN_OWNER_USER_ID;

  if (!ownerId || ownerId !== userId) return false;

  return rolGlobal === "super_admin";
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

  const gerente = rol === "gerente_sucursal";
  const recepcionista = rol === "recepcionista_sucursal";
  const personal = rol === "empleado_sucursal";

  return {
    puedeVerTodo: global,
    puedeGestionarPlanes: global,
    puedeGestionarConfiguracion: global,
    puedeGestionarSucursales: global && planNivel >= 3,
    puedeGestionarEmpleados: global || gerente,
    puedeGestionarClientes: global || gerente || recepcionista,
    puedeGestionarCitas: global || gerente || recepcionista || personal,
    puedeGestionarReservas: global || gerente || recepcionista,
    puedeVerReportes: global ? planNivel >= 1 : gerente,
    puedeVerReportesGlobales: global && planNivel >= 1,
    puedeExportar: global ? planNivel >= 2 : gerente && planNivel >= 3,
    puedeUsarRecordatorios: global
      ? planNivel >= 2
      : (gerente || recepcionista) && planNivel >= 3,
  };
}

export const resolveDashboardAccess = cache(async (): Promise<DashboardAccessResult> => {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user?.id) {
    return {
      ok: false,
      reason: "unauthenticated",
    };
  }

  const email = normalizarEmail(user.email);
  const supabase = createServiceRoleClient();

  /**
   * Antes esto eran 4 consultas separadas a la API REST (perfil,
   * rol_global, negocio_usuarios, sucursal_usuarios) -- primero
   * secuenciales, despues paralelizadas con Promise.all. Paralelizar
   * ayudo a la latencia de UNA carga, pero bajo concurrencia real
   * multiplica la cantidad de conexiones simultaneas contra el pool de
   * Supabase: confirmado con una prueba de carga real contra produccion
   * (20 usuarios continuos) que genero errores 522 "Connection timed
   * out" de Supabase (ver docs/load-test-audit-2026-07-22.md y
   * tests/load/results/dashboard-probe20-vercel-real-after-fix.json).
   * resolver_acceso_dashboard() (ver
   * supabase/patches/2026-07-consolidar-acceso-dashboard.sql) hace las
   * mismas 4 lecturas DENTRO de una sola funcion de Postgres -- 1 conexion
   * por carga en vez de 4. Se llama con el cliente de sesion (no service
   * role): la funcion usa auth.uid() internamente, que solo esta
   * disponible en una conexion con el JWT del usuario.
   */
  const { data: accesoRpc, error: accesoRpcError } = await authSupabase.rpc(
    "resolver_acceso_dashboard"
  );

  if (accesoRpcError) throw new Error(accesoRpcError.message);

  const datos = accesoRpc as AccesoDashboardRpc;

  const perfilUsuario = construirPerfilUsuario(datos.perfil, user);
  const esOwner = esPlatformOwnerDesdeRol(user.id, datos.rol_global);

  if (esOwner) {
    return {
      ok: false,
      reason: "platform_owner",
    };
  }

  const negocioGlobal = datos.membresia_negocio?.negocio ?? null;

  if (negocioGlobal) {
    const plan = await obtenerPlanActivo(supabase, negocioGlobal.id);

    if (negocioGlobal.estado !== "activo") {
      return {
        ok: false,
        reason: "inactive_business",
        blockedContext: {
          user: {
            id: user.id,
            email: user.email ?? null,
            ...perfilUsuario,
          },
          negocio: {
            id: negocioGlobal.id,
            nombre: negocioGlobal.nombre,
            slug: negocioGlobal.slug ?? null,
            logo_url: negocioGlobal.logo_url ?? null,
            estado: negocioGlobal.estado,
            motivo_bloqueo: negocioGlobal.motivo_bloqueo ?? null,
            bloqueado_at: negocioGlobal.bloqueado_at ?? null,
          },
          planClave: plan.planClave,
          rol: "admin_global",
          scope: "global",
          sucursalNombre: null,
        },
      };
    }

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
        ...perfilUsuario,
      },
      negocio: {
        id: negocioGlobal.id,
        nombre: negocioGlobal.nombre,
        slug: negocioGlobal.slug ?? null,
        logo_url: negocioGlobal.logo_url ?? null,
      },
      ...plan,
      scope: "global",
      rol: "admin_global",
      sucursalId: null,
      sucursalNombre: null,
      empleadoId: null,
      ...permisos,
    };
  }

  if (!email) {
    return {
      ok: false,
      reason: "no_access",
    };
  }

  let accesoSucursal = datos.acceso_sucursal;

  if (!accesoSucursal) {
    const { data: accesoPorEmail, error: accesoEmailError } = await supabase
      .from("sucursal_usuarios")
      .select(
        `
        id,
        negocio_id,
        sucursal_id,
        usuario_id,
        empleado_id,
        nombre,
        cargo,
        avatar_url,
        email,
        rol,
        activo,
        sucursales (
          id,
          nombre,
          estado
        )
      `
      )
      .eq("email", email)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    if (accesoEmailError) throw new Error(accesoEmailError.message);

    accesoSucursal = accesoPorEmail as AccesoSucursalRpc | null;

    if (accesoSucursal && !accesoSucursal.usuario_id) {
      await supabase
        .from("sucursal_usuarios")
        .update({
          usuario_id: user.id,
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

  const sucursal = obtenerObjeto(accesoSucursal.sucursales ?? null);

  const { data: negocioSucursal, error: negocioError } = await supabase
    .from("negocios")
    .select("id, nombre, slug, logo_url, estado, motivo_bloqueo, bloqueado_at")
    .eq("id", accesoSucursal.negocio_id)
    .maybeSingle();

  if (negocioError) throw new Error(negocioError.message);

  if (!negocioSucursal) {
    return {
      ok: false,
      reason: "no_access",
    };
  }

  const plan = await obtenerPlanActivo(supabase, negocioSucursal.id);
  const rol = accesoSucursal.rol;

  if (!sucursal || sucursal.estado !== "activo") {
    return {
      ok: false,
      reason: "inactive_branch",
      inactiveBranchContext: {
        user: {
          id: user.id,
          email: user.email ?? null,
          ...perfilUsuario,
          nombre:
            perfilUsuario.nombre ||
            limpiar(accesoSucursal.nombre) ||
            email.split("@")[0],
          cargo: perfilUsuario.cargo || limpiar(accesoSucursal.cargo) || null,
          avatar_url:
            perfilUsuario.avatar_url ||
            limpiar(accesoSucursal.avatar_url) ||
            null,
        },
        negocio: {
          id: negocioSucursal.id,
          nombre: negocioSucursal.nombre,
          slug: negocioSucursal.slug ?? null,
          logo_url: negocioSucursal.logo_url ?? null,
        },
        planClave: plan.planClave,
        planNombre: plan.planNombre,
        rol,
        scope: "sucursal",
        sucursalNombre: sucursal?.nombre ?? "Sucursal",
      },
    };
  }

  if (negocioSucursal.estado !== "activo") {
    return {
      ok: false,
      reason: "inactive_business",
      blockedContext: {
        user: {
          id: user.id,
          email: user.email ?? null,
          ...perfilUsuario,
          nombre:
            perfilUsuario.nombre ||
            limpiar(accesoSucursal.nombre) ||
            email.split("@")[0],
          cargo: perfilUsuario.cargo || limpiar(accesoSucursal.cargo) || null,
          avatar_url:
            perfilUsuario.avatar_url ||
            limpiar(accesoSucursal.avatar_url) ||
            null,
        },
        negocio: {
          id: negocioSucursal.id,
          nombre: negocioSucursal.nombre,
          slug: negocioSucursal.slug ?? null,
          logo_url: negocioSucursal.logo_url ?? null,
          estado: negocioSucursal.estado,
          motivo_bloqueo: negocioSucursal.motivo_bloqueo ?? null,
          bloqueado_at: negocioSucursal.bloqueado_at ?? null,
        },
        planClave: plan.planClave,
        rol,
        scope: "sucursal",
        sucursalNombre: sucursal.nombre ?? "Sucursal",
      },
    };
  }

  if (plan.planNivel < 3) {
    return {
      ok: false,
      reason: "plan_required",
      planRequiredContext: {
        user: {
          id: user.id,
          email: user.email ?? null,
          ...perfilUsuario,
          nombre:
            perfilUsuario.nombre ||
            limpiar(accesoSucursal.nombre) ||
            email.split("@")[0],
          cargo: perfilUsuario.cargo || limpiar(accesoSucursal.cargo) || null,
          avatar_url:
            perfilUsuario.avatar_url ||
            limpiar(accesoSucursal.avatar_url) ||
            null,
        },
        negocio: {
          id: negocioSucursal.id,
          nombre: negocioSucursal.nombre,
          slug: negocioSucursal.slug ?? null,
          logo_url: negocioSucursal.logo_url ?? null,
        },
        planClave: plan.planClave,
        planNombre: plan.planNombre,
        rol,
        scope: "sucursal",
        sucursalNombre: sucursal.nombre ?? "Sucursal",
        requiredPlanNombre: "Empresarial",
        restrictedFeature: "sucursales",
      },
    };
  }

  const permisos = permisosPorRol({
    rol,
    scope: "sucursal",
    planNivel: plan.planNivel,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      ...perfilUsuario,
      nombre:
        perfilUsuario.nombre ||
        limpiar(accesoSucursal.nombre) ||
        email.split("@")[0],
      cargo: perfilUsuario.cargo || limpiar(accesoSucursal.cargo) || null,
      avatar_url:
        perfilUsuario.avatar_url ||
        limpiar(accesoSucursal.avatar_url) ||
        null,
    },
    negocio: {
      id: negocioSucursal.id,
      nombre: negocioSucursal.nombre,
      slug: negocioSucursal.slug ?? null,
      logo_url: negocioSucursal.logo_url ?? null,
    },
    ...plan,
    scope: "sucursal",
    rol,
    sucursalId: accesoSucursal.sucursal_id,
    sucursalNombre: sucursal.nombre ?? "Sucursal",
    empleadoId: accesoSucursal.empleado_id ?? null,
    ...permisos,
  };
});

export async function requireDashboardAccess() {
  const access = await resolveDashboardAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login");
    }

    if (access.reason === "platform_owner") {
      redirect("/admin");
    }

    redirect(`/sin-acceso?motivo=${access.reason}`);
  }

  return access;
}

type QueryConFiltro<T> = {
  eq: (columna: string, valor: string) => T;
};

export function aplicarFiltroSucursal<T extends QueryConFiltro<T>>(
  query: T,
  access: Awaited<ReturnType<typeof requireDashboardAccess>>,
  columna = "sucursal_id"
) {
  if (access.scope === "sucursal" && access.sucursalId) {
    return query.eq(columna, access.sucursalId);
  }

  return query;
}
