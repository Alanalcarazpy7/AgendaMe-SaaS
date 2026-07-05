import { NextResponse } from "next/server";
import { resolveDashboardAccess } from "@/lib/dashboard/access-context";

export async function requireAdminGlobalApi() {
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

  if (!access.puedeVerTodo) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Esta acción solo está permitida para el admin global del negocio." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    access,
  };
}