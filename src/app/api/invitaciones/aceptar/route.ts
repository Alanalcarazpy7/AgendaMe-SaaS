import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarEmail(valor: unknown) {
  return limpiar(valor).toLowerCase();
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function buscarAuthUserPorEmail(supabase: any, email: string) {
  let page = 1;
  const perPage = 1000;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw new Error(error.message);

    const users = data?.users ?? [];
    const user = users.find(
      (item: any) => String(item.email ?? "").toLowerCase() === email
    );

    if (user) return user;
    if (users.length < perPage) return null;

    page++;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token = limpiar(body.token);
    const password = limpiar(body.password);
    const nombre = limpiar(body.nombre);

    if (!token) {
      return NextResponse.json(
        { error: "Invitación inválida." },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient() as any;
    const tokenHash = hashToken(token);

    const { data: invitacion, error: invitacionError } = await supabase
      .from("sucursal_invitaciones")
      .select(
        `
        id,
        negocio_id,
        sucursal_id,
        empleado_id,
        email,
        rol,
        estado,
        expires_at
      `
      )
      .eq("token_hash", tokenHash)
      .eq("estado", "pendiente")
      .maybeSingle();

    if (invitacionError) throw new Error(invitacionError.message);

    if (!invitacion) {
      return NextResponse.json(
        { error: "La invitación no existe o ya fue utilizada." },
        { status: 404 }
      );
    }

    if (new Date(invitacion.expires_at).getTime() < Date.now()) {
      await supabase
        .from("sucursal_invitaciones")
        .update({
          estado: "expirada",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitacion.id);

      return NextResponse.json(
        { error: "La invitación expiró. Pedí una nueva invitación." },
        { status: 410 }
      );
    }

    const email = normalizarEmail(invitacion.email);
    const nombreFinal = nombre || email.split("@")[0];

    const usuarioExistente = await buscarAuthUserPorEmail(supabase, email);

    let userId = usuarioExistente?.id ?? null;
    let createdAuthUser = false;

    if (userId) {
      const { error: updateAuthError } =
        await supabase.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: {
            source: "agendame_invitation",
            nombre: nombreFinal,
            name: nombreFinal,
            negocio_id: invitacion.negocio_id,
            sucursal_id: invitacion.sucursal_id,
            rol: invitacion.rol,
          },
        });

      if (updateAuthError) throw new Error(updateAuthError.message);
    } else {
      const { data: nuevoUsuario, error: crearUsuarioError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            source: "agendame_invitation",
            nombre: nombreFinal,
            name: nombreFinal,
            negocio_id: invitacion.negocio_id,
            sucursal_id: invitacion.sucursal_id,
            rol: invitacion.rol,
          },
        });

      if (crearUsuarioError) throw new Error(crearUsuarioError.message);

      userId = nuevoUsuario.user?.id ?? null;
      createdAuthUser = true;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "No se pudo crear o resolver el usuario." },
        { status: 500 }
      );
    }

    const { data: accesoExistente, error: accesoExistenteError } = await supabase
      .from("sucursal_usuarios")
      .select("id")
      .eq("negocio_id", invitacion.negocio_id)
      .eq("email", email)
      .maybeSingle();

    if (accesoExistenteError) throw new Error(accesoExistenteError.message);

    if (accesoExistente) {
      const { error } = await supabase
        .from("sucursal_usuarios")
        .update({
          usuario_id: userId,
          nombre: nombreFinal,
          sucursal_id: invitacion.sucursal_id,
          rol: invitacion.rol,
          empleado_id: invitacion.empleado_id ?? null,
          activo: true,
        })
        .eq("id", accesoExistente.id);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("sucursal_usuarios")
        .insert({
          negocio_id: invitacion.negocio_id,
          sucursal_id: invitacion.sucursal_id,
          usuario_id: userId,
          nombre: nombreFinal,
          email,
          rol: invitacion.rol,
          empleado_id: invitacion.empleado_id ?? null,
          activo: true,
        });

      if (error) throw new Error(error.message);
    }

    const { error: aceptarError } = await supabase
      .from("sucursal_invitaciones")
      .update({
        estado: "aceptada",
        accepted_at: new Date().toISOString(),
        accepted_user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitacion.id);

    if (aceptarError) throw new Error(aceptarError.message);

    return NextResponse.json({
      message: "Invitación aceptada correctamente.",
      email,
      nombre: nombreFinal,
      createdAuthUser,
    });
  } catch (error) {
    console.error("Error aceptando invitación:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo aceptar la invitación.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}