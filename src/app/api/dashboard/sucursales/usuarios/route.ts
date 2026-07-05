import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { resolveDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const ROLES_VALIDOS = [
  "gerente_sucursal",
  "recepcionista_sucursal",
  "empleado_sucursal",
] as const;

type RolSucursal = (typeof ROLES_VALIDOS)[number];

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarEmail(valor: unknown) {
  return limpiar(valor).toLowerCase();
}

function esRolValido(rol: string): rol is RolSucursal {
  return ROLES_VALIDOS.includes(rol as RolSucursal);
}

function crearToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function construirInvitationUrl(request: Request, token: string) {
  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(request.url).origin;

  return `${origin}/invitacion/${token}`;
}

async function requireGestionSucursalesApi() {
  const access = await resolveDashboardAccess();

  if (!access.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No autenticado o sin acceso al negocio." },
        { status: 401 }
      ),
    };
  }

  if (!access.puedeGestionarSucursales || !access.puedeVerTodo) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Solo el admin empresarial puede gestionar accesos por sucursal." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    access,
  };
}

async function validarSucursal({
  supabase,
  negocioId,
  sucursalId,
}: {
  supabase: any;
  negocioId: string;
  sucursalId: string;
}) {
  const { data, error } = await supabase
    .from("sucursales")
    .select("id, nombre")
    .eq("id", sucursalId)
    .eq("negocio_id", negocioId)
    .eq("estado", "activo")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data;
}

export async function GET() {
  try {
    const guard = await requireGestionSucursalesApi();

    if (!guard.ok) return guard.response;

    const supabase = createServiceRoleClient();

    const [
      { data: accesos, error: accesosError },
      { data: invitaciones, error: invitacionesError },
    ] = await Promise.all([
      supabase
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
          created_at,
          sucursales (
            id,
            nombre
          )
        `
        )
        .eq("negocio_id", guard.access.negocio.id)
        .eq("activo", true)
        .order("created_at", { ascending: false }),

      supabase
        .from("sucursal_invitaciones")
        .select(
          `
          id,
          negocio_id,
          sucursal_id,
          email,
          rol,
          estado,
          expires_at,
          created_at,
          sucursales (
            id,
            nombre
          )
        `
        )
        .eq("negocio_id", guard.access.negocio.id)
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false }),
    ]);

    if (accesosError) throw new Error(accesosError.message);
    if (invitacionesError) throw new Error(invitacionesError.message);

    return NextResponse.json({
      accesos: accesos ?? [],
      invitaciones: invitaciones ?? [],
    });
  } catch (error) {
    console.error("Error listando accesos de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar los accesos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireGestionSucursalesApi();

    if (!guard.ok) return guard.response;

    const body = await request.json();

    const email = normalizarEmail(body.email);
    const sucursalId = limpiar(body.sucursal_id);
    const rol = limpiar(body.rol);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Ingresá un correo válido." },
        { status: 400 }
      );
    }

    if (!sucursalId) {
      return NextResponse.json(
        { error: "Seleccioná una sucursal." },
        { status: 400 }
      );
    }

    if (!esRolValido(rol)) {
      return NextResponse.json(
        { error: "Rol inválido." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient() as any;

    const sucursal = await validarSucursal({
      supabase,
      negocioId: guard.access.negocio.id,
      sucursalId,
    });

    if (!sucursal) {
      return NextResponse.json(
        { error: "La sucursal no existe o no pertenece a este negocio." },
        { status: 400 }
      );
    }

    // Si ya tenía acceso activo, lo pasamos a inactivo mientras acepta la nueva invitación.
    // Esto sirve para migrar usuarios viejos creados con contraseña temporal.
    await supabase
      .from("sucursal_usuarios")
      .update({
        activo: false,
        sucursal_id: sucursalId,
        rol,
      })
      .eq("negocio_id", guard.access.negocio.id)
      .eq("email", email);

    // Revocar invitaciones pendientes anteriores de ese correo.
    await supabase
      .from("sucursal_invitaciones")
      .update({
        estado: "revocada",
        updated_at: new Date().toISOString(),
      })
      .eq("negocio_id", guard.access.negocio.id)
      .eq("email", email)
      .eq("estado", "pendiente");

    const token = crearToken();
    const tokenHash = hashToken(token);

    const { data: invitacion, error } = await supabase
      .from("sucursal_invitaciones")
      .insert({
        negocio_id: guard.access.negocio.id,
        sucursal_id: sucursalId,
        email,
        rol,
        token_hash: tokenHash,
        estado: "pendiente",
        created_by: guard.access.user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select(
        `
        id,
        negocio_id,
        sucursal_id,
        email,
        rol,
        estado,
        expires_at,
        created_at,
        sucursales (
          id,
          nombre
        )
      `
      )
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Invitación creada correctamente.",
      invitacion,
      invitationUrl: construirInvitationUrl(request, token),
    });
  } catch (error) {
    console.error("Error creando invitación de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo crear la invitación." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireGestionSucursalesApi();

    if (!guard.ok) return guard.response;

    const body = await request.json();

    const inviteId = limpiar(body.invite_id);
    const regenerateLink = Boolean(body.regenerate_link);

    const id = limpiar(body.id);
    const sucursalId = limpiar(body.sucursal_id);
    const rol = limpiar(body.rol);
    const activo =
      typeof body.activo === "boolean" ? body.activo : undefined;

    const supabase = createServiceRoleClient() as any;

    // Regenerar link de una invitación pendiente.
    if (inviteId && regenerateLink) {
      const { data: invitacionActual, error: invitacionActualError } =
        await supabase
          .from("sucursal_invitaciones")
          .select("id, estado")
          .eq("id", inviteId)
          .eq("negocio_id", guard.access.negocio.id)
          .eq("estado", "pendiente")
          .maybeSingle();

      if (invitacionActualError) {
        throw new Error(invitacionActualError.message);
      }

      if (!invitacionActual) {
        return NextResponse.json(
          { error: "La invitación no existe o ya fue utilizada." },
          { status: 404 }
        );
      }

      const token = crearToken();
      const tokenHash = hashToken(token);

      const { error } = await supabase
        .from("sucursal_invitaciones")
        .update({
          token_hash: tokenHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", inviteId)
        .eq("negocio_id", guard.access.negocio.id)
        .eq("estado", "pendiente");

      if (error) throw new Error(error.message);

      return NextResponse.json({
        message: "Link regenerado correctamente.",
        invitationUrl: construirInvitationUrl(request, token),
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del acceso." },
        { status: 400 }
      );
    }

    if (rol && !esRolValido(rol)) {
      return NextResponse.json(
        { error: "Rol inválido." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (sucursalId) {
      const sucursal = await validarSucursal({
        supabase,
        negocioId: guard.access.negocio.id,
        sucursalId,
      });

      if (!sucursal) {
        return NextResponse.json(
          { error: "La sucursal no existe o no pertenece a este negocio." },
          { status: 400 }
        );
      }

      updateData.sucursal_id = sucursalId;
    }

    if (rol) updateData.rol = rol;
    if (typeof activo === "boolean") updateData.activo = activo;

    const { data, error } = await supabase
      .from("sucursal_usuarios")
      .update(updateData)
      .eq("id", id)
      .eq("negocio_id", guard.access.negocio.id)
      .select(
        `
        id,
        negocio_id,
        sucursal_id,
        usuario_id,
        email,
        rol,
        activo,
        created_at,
        sucursales (
          id,
          nombre
        )
      `
      )
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Acceso actualizado correctamente.",
      acceso: data,
    });
  } catch (error) {
    console.error("Error actualizando acceso de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el acceso." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const guard = await requireGestionSucursalesApi();

    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const id = limpiar(searchParams.get("id"));
    const inviteId = limpiar(searchParams.get("inviteId"));

    if (!id && !inviteId) {
      return NextResponse.json(
        { error: "Falta el ID." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    if (inviteId) {
      const { error } = await supabase
        .from("sucursal_invitaciones")
        .update({
          estado: "revocada",
          updated_at: new Date().toISOString(),
        })
        .eq("id", inviteId)
        .eq("negocio_id", guard.access.negocio.id)
        .eq("estado", "pendiente");

      if (error) throw new Error(error.message);

      return NextResponse.json({
        message: "Invitación revocada correctamente.",
      });
    }

    const { error } = await supabase
      .from("sucursal_usuarios")
      .delete()
      .eq("id", id)
      .eq("negocio_id", guard.access.negocio.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Acceso eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando acceso de sucursal:", error);

    return NextResponse.json(
      { error: "No se pudo eliminar." },
      { status: 500 }
    );
  }
}