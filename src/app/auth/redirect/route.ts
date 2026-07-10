import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Relacion<T> = T | T[] | null;

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

async function esPlatformOwner(userId: string) {
  const ownerId = process.env.ADMIN_OWNER_USER_ID;

  if (!ownerId || ownerId !== userId) return false;

  const admin = createServiceRoleClient();

  const { data: perfilPorId } = await admin
    .from("perfiles_usuario")
    .select("rol_global")
    .eq("id", userId)
    .maybeSingle();

  if (perfilPorId?.rol_global === "super_admin") return true;

  const { data: perfilPorUsuarioId } = await admin
    .from("perfiles_usuario")
    .select("rol_global")
    .eq("usuario_id", userId)
    .maybeSingle();

  return perfilPorUsuarioId?.rol_global === "super_admin";
}

async function tieneAccesoDashboard(userId: string, email: string | null) {
  const admin = createServiceRoleClient();

  const { data: membresiaGlobal, error: membresiaError } = await admin
    .from("negocio_usuarios")
    .select("id")
    .eq("usuario_id", userId)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError) throw new Error(membresiaError.message);
  if (membresiaGlobal) return true;

  const { data: accesoSucursal, error: accesoSucursalError } = await admin
    .from("sucursal_usuarios")
    .select("id")
    .eq("usuario_id", userId)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (accesoSucursalError) throw new Error(accesoSucursalError.message);
  if (accesoSucursal) return true;

  if (!email) return false;

  const { data: accesoPorEmail, error: accesoEmailError } = await admin
    .from("sucursal_usuarios")
    .select("id, usuario_id")
    .eq("email", email.toLowerCase())
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (accesoEmailError) throw new Error(accesoEmailError.message);

  const acceso = obtenerObjeto(accesoPorEmail);

  if (acceso && !acceso.usuario_id) {
    await admin
      .from("sucursal_usuarios")
      .update({ usuario_id: userId })
      .eq("id", acceso.id);
  }

  return Boolean(acceso);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const confirmado = requestUrl.searchParams.get("confirmado") === "1";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  if (await esPlatformOwner(user.id)) {
    return NextResponse.redirect(new URL("/admin", requestUrl.origin));
  }

  if (await tieneAccesoDashboard(user.id, user.email ?? null)) {
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  const onboardingPath = confirmado
    ? "/onboarding/negocio?confirmado=1"
    : "/onboarding/negocio";

  return NextResponse.redirect(new URL(onboardingPath, requestUrl.origin));
}
