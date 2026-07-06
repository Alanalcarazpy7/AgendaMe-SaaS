import { NextResponse } from "next/server";
import { resolveDashboardAccess } from "@/lib/dashboard/access-context";

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
        { error: "No tenés acceso a este recurso." },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    access,
  };
}