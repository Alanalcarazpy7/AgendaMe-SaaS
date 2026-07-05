import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

function textoNullable(valor: unknown) {
  const texto = limpiar(valor);
  return texto.length > 0 ? texto : null;
}

function normalizarTema(valor: unknown) {
  const tema = limpiar(valor).toLowerCase();

  if (["sistema", "claro", "oscuro"].includes(tema)) {
    return tema;
  }

  return "sistema";
}

function normalizarColor(valor: unknown) {
  const color = limpiar(valor);

  if (!color) return null;

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color;
  }

  return null;
}

export async function PATCH(request: Request) {
  try {
    const access = await requireDashboardAccess();
    const body = await request.json();

    const nombre = limpiar(body.nombre);

    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre es obligatorio." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient() as any;

    const payload = {
      usuario_id: access.user.id,
      nombre,
      nombre_completo: nombre,
      telefono: textoNullable(body.telefono),
      cargo: textoNullable(body.cargo),
      avatar_url: textoNullable(body.avatar_url) ?? access.user.avatar_url ?? null,
      tema: normalizarTema(body.tema),
      color_acento: normalizarColor(body.color_acento),
      idioma: "es",
      recibir_notificaciones: Boolean(body.recibir_notificaciones ?? true),
      updated_at: new Date().toISOString(),
    };

    const { data: perfil, error } = await supabase
      .from("perfiles_usuario")
      .upsert(payload, {
        onConflict: "usuario_id",
      })
      .select(
        `
        usuario_id,
        nombre,
        nombre_completo,
        telefono,
        cargo,
        avatar_url,
        tema,
        color_acento,
        idioma,
        recibir_notificaciones,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) throw new Error(error.message);

    await supabase
      .from("sucursal_usuarios")
      .update({
        nombre,
        cargo: payload.cargo,
        avatar_url: payload.avatar_url,
      })
      .eq("usuario_id", access.user.id);

    await supabase.auth.admin.updateUserById(access.user.id, {
      user_metadata: {
        nombre,
        name: nombre,
        full_name: nombre,
        cargo: payload.cargo,
        avatar_url: payload.avatar_url,
      },
    });

    return NextResponse.json({
      message: "Cuenta actualizada correctamente.",
      perfil,
    });
  } catch (error) {
    console.error("Error actualizando mi cuenta:", error);

    const message =
      error instanceof Error ? error.message : "No se pudo actualizar tu cuenta.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}