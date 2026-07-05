import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

export async function PATCH(request: Request) {
  try {
    const access = await requireDashboardAccess();
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

    return NextResponse.json(
      { error: "No se pudo cambiar la contraseña." },
      { status: 500 }
    );
  }
}