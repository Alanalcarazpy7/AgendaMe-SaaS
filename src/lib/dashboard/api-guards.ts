import { NextResponse } from "next/server";
import { requireApiDashboardAccess } from "@/lib/dashboard/api-access";

export async function requireAdminGlobalApi() {
  const guard = await requireApiDashboardAccess();

  if (!guard.ok) {
    return guard;
  }

  if (!guard.access.puedeVerTodo) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No tenés permiso para realizar esta acción." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    access: guard.access,
  };
}