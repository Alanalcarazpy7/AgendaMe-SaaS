import "server-only";
import { NextResponse } from "next/server";
import { getPlatformOwnerOrNull, type PlatformOwner } from "@/lib/admin/guard";

type ApiGuardOk = { ok: true; owner: PlatformOwner };
type ApiGuardFail = { ok: false; response: NextResponse };

/**
 * Equivalente a requirePlatformOwner() pero para Route Handlers / Server
 * Actions que necesitan devolver una respuesta HTTP en vez de redirigir.
 * Debe llamarse al inicio de TODA operación administrativa (mutaciones,
 * exportaciones, consultas privilegiadas): nunca confiar en que la llamada
 * viene desde /admin.
 */
export async function requirePlatformOwnerApi(): Promise<ApiGuardOk | ApiGuardFail> {
  const result = await getPlatformOwnerOrNull();

  if (result.ok) {
    return { ok: true, owner: result.owner };
  }

  if (result.reason === "unauthenticated") {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado." }, { status: 401 }),
    };
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "No autorizado." }, { status: 403 }),
  };
}
