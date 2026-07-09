import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

export async function PATCH(request: Request) {
  try {
    const accessGuard = await requireApiDashboardAccess();
    if (!accessGuard.ok) return accessGuard.response;
    const access = accessGuard.access;
    const body = await request.json();

    const password = limpiar(body.password);
    const confirmPassword = limpiar(body.confirmPassword);

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient() as any;

    const { error } = await supabase.auth.admin.updateUserById(access.user.id, {
      password,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      message: "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error cambiando contraseña:", error);

    const mensaje =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo cambiar la contraseña.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}