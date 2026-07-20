import { NextResponse } from "next/server";
import { resolveDashboardAccess } from "@/lib/dashboard/access-context";

function mensajeAccesoDenegado(reason: string) {
  const mensajes: Record<string, string> = {
    platform_owner: "El super admin debe usar el panel /admin.",
    no_access: "No encontramos un acceso activo para este dashboard.",
    inactive_business:
      "El negocio no está habilitado. Contactá al responsable de la cuenta o a soporte.",
    inactive_branch:
      "La sucursal asignada no está activa. Pedí al responsable del negocio que revise tu acceso.",
    plan_required:
      "Esta acción requiere una función que no está incluida en el plan actual.",
  };

  return mensajes[reason] ?? "No tenés acceso a este recurso.";
}

export async function requireApiDashboardAccess() {
  const access = await resolveDashboardAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      return {
        ok: false as const,
        response: NextResponse.json(
          { error: "No autorizado." },
          { status: 401 }
        ),
      };
    }

    return {
      ok: false as const,
      response: NextResponse.json(
        { error: mensajeAccesoDenegado(access.reason) },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    access,
  };
}
