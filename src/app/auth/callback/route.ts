import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/auth/redirect?confirmado=1";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?estado=confirmacion_error&mensaje=${encodeURIComponent(
            "No pudimos confirmar el enlace. Inicia sesion o solicita un nuevo correo."
          )}`,
          requestUrl.origin
        )
      );
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
