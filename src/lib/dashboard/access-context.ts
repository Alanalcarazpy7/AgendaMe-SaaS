import { redirect } from "next/navigation";
import { nivelPlan } from "@/lib/planes/plan-access";
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

function nombreDesdeUsuario(user: any) {
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

async function obtenerPerfilUsuario(
  supabase: ReturnType<typeof createServiceRoleClient>,
  user: any
) {
  const nombreAuth = nombreDesdeUsuario(user);
  const email = normalizarEmail(user.email);

  const { data: perfil, error } = await supabase
    .from("perfiles_usuario")
    .select(
      `
      usuario_id,
      nombre,
      telefono,
      cargo,
      avatar_url,
      tema,
      color_acento,
      recibir_notificaciones
    `
    )
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (error) {
    return {
      nombre: nombreAuth,
      telefono: null,
      cargo: limpiar(user?.user_metadata?.cargo) || null,
      avatar_url: limpiar(user?.user_metadata?.avatar_url) || null,
      tema: "sistema" as const,
      color_acento: null,
      recibir_notificaciones: true,
    };
  }

  return {
    nombre: limpiar((perfil as any)?.nombre) || nombreAuth || email.split("@")[0] || "Usuario",
    telefono: limpiar((perfil as any)?.telefono) || null,
    cargo: limpiar((perfil as any)?.cargo) || limpiar(user?.user_metadata?.cargo) || null,
    avatar_url:
      limpiar((perfil as any)?.avatar_url) ||
      limpiar(user?.user_metadata?.avatar_url) ||
      null,
    tema: ((perfil as any)?.tema ?? "sistema") as "sistema" | "claro" | "oscuro",
    color_acento: limpiar((perfil as any)?.color_acento) || null,
    recibir_notificaciones:
      typeof (perfil as any)?.recibir_notificaciones === "boolean"
        ? (perfil as any).recibir_notificaciones
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

  const plan = obtenerObjeto((suscripcion as any)?.planes_saas ?? null);

  const planClave = plan?.clave ?? "gratis";
  const planNombre = plan?.nombre ?? "Gratis";

  return {
    planClave,
    planNombre,
    planNivel: nivelPlan(planClave),
  };
}

async function esPlatformOwner(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string
) {
  const ownerId = process.env.ADMIN_OWNER_USER_ID;

  if (!ownerId || ownerId !== userId) return false;

  const { data: perfilPorId } = await supabase
    .from("perfiles_usuario")
    .select("rol_global")
    .eq("id", userId)
    .maybeSingle();

  if (perfilPorId?.rol_global === "super_admin") return true;

  const { data: perfilPorUsuarioId } = await supabase
    .from("perfiles_usuario")
    .select("rol_global")
    .eq("usuario_id", userId)
    .maybeSingle();

  return perfilPorUsuarioId?.rol_global === "super_admin";
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

export async function resolveDashboardAccess(): Promise<DashboardAccessResult> {
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
  const perfilUsuario = await obtenerPerfilUsuario(supabase, user);

  if (await esPlatformOwner(supabase, user.id)) {
    return {
      ok: false,
      reason: "platform_owner",
    };
  }

  const { data: membresiaGlobal, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select(
      `
      negocio_id,
      rol,
      activo,
      negocios (
        id,
        nombre,
        slug,
        logo_url,
        estado,
        motivo_bloqueo,
        bloqueado_at
      )
    `
    )
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError) throw new Error(membresiaError.message);

  const negocioGlobal = obtenerObjeto((membresiaGlobal as any)?.negocios ?? null);

  if (negocioGlobal) {
    const plan = await obtenerPlanActivo(supabase, (negocioGlobal as any).id);

    if ((negocioGlobal as any).estado !== "activo") {
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
            id: (negocioGlobal as any).id,
            nombre: (negocioGlobal as any).nombre,
            slug: (negocioGlobal as any).slug ?? null,
            logo_url: (negocioGlobal as any).logo_url ?? null,
            estado: (negocioGlobal as any).estado,
            motivo_bloqueo: (negocioGlobal as any).motivo_bloqueo ?? null,
            bloqueado_at: (negocioGlobal as any).bloqueado_at ?? null,
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
        id: (negocioGlobal as any).id,
        nombre: (negocioGlobal as any).nombre,
        slug: (negocioGlobal as any).slug ?? null,
        logo_url: (negocioGlobal as any).logo_url ?? null,
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

  const accesoSucursalResult = await supabase
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
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  let accesoSucursal = accesoSucursalResult.data;
  const accesoUsuarioError = accesoSucursalResult.error;

  if (accesoUsuarioError) throw new Error(accesoUsuarioError.message);

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

    accesoSucursal = accesoPorEmail;

    if (accesoSucursal && !(accesoSucursal as any).usuario_id) {
      await supabase
        .from("sucursal_usuarios")
        .update({
          usuario_id: user.id,
        })
        .eq("id", (accesoSucursal as any).id);
    }
  }

  if (!accesoSucursal) {
    return {
      ok: false,
      reason: "no_access",
    };
  }

  const sucursal = obtenerObjeto((accesoSucursal as any).sucursales ?? null);

  const { data: negocioSucursal, error: negocioError } = await supabase
    .from("negocios")
    .select("id, nombre, slug, logo_url, estado, motivo_bloqueo, bloqueado_at")
    .eq("id", (accesoSucursal as any).negocio_id)
    .maybeSingle();

  if (negocioError) throw new Error(negocioError.message);

  if (!negocioSucursal) {
    return {
      ok: false,
      reason: "no_access",
    };
  }

  const plan = await obtenerPlanActivo(supabase, negocioSucursal.id);
  const rol = (accesoSucursal as any).rol as DashboardAccessRole;

  if (!sucursal || (sucursal as any).estado !== "activo") {
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
            limpiar((accesoSucursal as any).nombre) ||
            email.split("@")[0],
          cargo: perfilUsuario.cargo || limpiar((accesoSucursal as any).cargo) || null,
          avatar_url:
            perfilUsuario.avatar_url ||
            limpiar((accesoSucursal as any).avatar_url) ||
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
        sucursalNombre: (sucursal as any)?.nombre ?? "Sucursal",
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
            limpiar((accesoSucursal as any).nombre) ||
            email.split("@")[0],
          cargo: perfilUsuario.cargo || limpiar((accesoSucursal as any).cargo) || null,
          avatar_url:
            perfilUsuario.avatar_url ||
            limpiar((accesoSucursal as any).avatar_url) ||
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
        sucursalNombre: (sucursal as any).nombre ?? "Sucursal",
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
            limpiar((accesoSucursal as any).nombre) ||
            email.split("@")[0],
          cargo: perfilUsuario.cargo || limpiar((accesoSucursal as any).cargo) || null,
          avatar_url:
            perfilUsuario.avatar_url ||
            limpiar((accesoSucursal as any).avatar_url) ||
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
        sucursalNombre: (sucursal as any).nombre ?? "Sucursal",
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
        limpiar((accesoSucursal as any).nombre) ||
        email.split("@")[0],
      cargo: perfilUsuario.cargo || limpiar((accesoSucursal as any).cargo) || null,
      avatar_url:
        perfilUsuario.avatar_url ||
        limpiar((accesoSucursal as any).avatar_url) ||
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
    sucursalId: (accesoSucursal as any).sucursal_id,
    sucursalNombre: (sucursal as any).nombre ?? "Sucursal",
    empleadoId: (accesoSucursal as any).empleado_id ?? null,
    ...permisos,
  };
}

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
