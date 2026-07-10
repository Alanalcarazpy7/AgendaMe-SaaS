"use client";

import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AuthFormProps = {
  mode: "login" | "registro";
  authErrorMessage?: string | null;
};

function traducirErrorLogin(error: AuthError) {
  const mensaje = error.message.toLowerCase();

  if (error.code === "invalid_credentials" || mensaje.includes("invalid login credentials")) {
    return "El correo o la contrasena no coinciden. Revisa los datos e intenta de nuevo.";
  }

  if (error.code === "email_not_confirmed" || mensaje.includes("email not confirmed")) {
    return "Todavia falta confirmar tu correo. Abri el enlace que te enviamos para activar la cuenta.";
  }

  if (error.code === "user_banned" || mensaje.includes("banned")) {
    return "Esta cuenta esta bloqueada. Contacta al soporte si crees que es un error.";
  }

  if (
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit" ||
    mensaje.includes("rate limit")
  ) {
    return "Hay demasiados intentos seguidos. Espera unos minutos y volve a probar.";
  }

  if (mensaje.includes("failed to fetch") || mensaje.includes("network")) {
    return "No pudimos conectar con el servidor. Revisa tu conexion a internet.";
  }

  return "No pudimos iniciar sesion. Revisa tus datos e intenta de nuevo.";
}

function traducirErrorRegistro(error: AuthError) {
  const mensaje = error.message.toLowerCase();

  if (
    error.code === "user_already_exists" ||
    mensaje.includes("already registered") ||
    mensaje.includes("already exists")
  ) {
    return "Ya existe una cuenta con ese correo. Inicia sesion con esa cuenta.";
  }

  if (error.code === "weak_password" || mensaje.includes("password")) {
    return "La contrasena es muy corta. Usa al menos 6 caracteres.";
  }

  if (
    error.code === "email_address_invalid" ||
    mensaje.includes("invalid format") ||
    mensaje.includes("invalid email")
  ) {
    return "El correo ingresado no es valido.";
  }

  if (error.code === "signup_disabled") {
    return "El registro de nuevas cuentas esta deshabilitado por ahora.";
  }

  if (
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit" ||
    mensaje.includes("rate limit")
  ) {
    return "Hay demasiados intentos seguidos. Espera unos minutos y volve a probar.";
  }

  if (mensaje.includes("failed to fetch") || mensaje.includes("network")) {
    return "No pudimos conectar con el servidor. Revisa tu conexion a internet.";
  }

  return "No pudimos crear tu cuenta. Revisa tus datos e intenta de nuevo.";
}

export function AuthForm({ mode, authErrorMessage = null }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRegistro = mode === "registro";

  function validarFormulario() {
    if (isRegistro && nombre.trim().length < 2) {
      return "Ingresa tu nombre completo.";
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!email.trim()) {
      return "Ingresa tu correo electronico.";
    }

    if (!emailValido) {
      return "El correo ingresado no es valido.";
    }

    if (!password) {
      return "Ingresa tu contrasena.";
    }

    if (isRegistro && password.length < 6) {
      return "La contrasena debe tener al menos 6 caracteres.";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setError(errorValidacion);
      setMensaje(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMensaje(null);

    try {
      if (isRegistro) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nombre: nombre.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              "/auth/redirect?confirmado=1"
            )}`,
          },
        });

        if (signUpError) {
          setError(traducirErrorRegistro(signUpError));
          return;
        }

        setMensaje(
          "Te enviamos un correo para activar tu cuenta. Abri el enlace y despues vas a configurar tu negocio con el plan gratis."
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(traducirErrorLogin(signInError));
          return;
        }

        router.push("/auth/redirect");
        router.refresh();
      }
    } catch {
      setError("Ocurrio un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-[0_24px_70px_rgb(15_23_42/0.12)] ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/30 dark:ring-white/5 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden min-h-[34rem] overflow-hidden bg-[radial-gradient(circle_at_20%_15%,rgb(34_211_238/0.28),transparent_32%),linear-gradient(145deg,#07111f,#0f766e_55%,#0b1120)] p-8 text-white lg:block">
        <div className="absolute inset-x-8 bottom-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-cyan-50">
            <Clock3 className="h-3.5 w-3.5" />
            AgendaMe
          </p>
          <h2 className="mt-5 max-w-sm text-3xl font-bold leading-tight tracking-tight">
            Tu agenda online empieza con una cuenta verificada.
          </h2>
          <div className="mt-6 grid gap-3 text-sm text-cyan-50/85">
            <p className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
              Confirmas el correo para proteger el acceso.
            </p>
            <p className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
              Configuras tu negocio y quedas en el plan gratis.
            </p>
            <p className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
              Luego podes activar funciones premium desde planes.
            </p>
          </div>
        </div>
      </aside>

      <div className="p-5 sm:p-8">
        <div className="mb-7">
          <p className="inline-flex items-center gap-2 rounded-2xl border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {isRegistro ? (
              <UserRound className="h-3.5 w-3.5 text-primary" />
            ) : (
              <LockKeyhole className="h-3.5 w-3.5 text-primary" />
            )}
            {isRegistro ? "Nuevo negocio" : "Acceso seguro"}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance">
            {isRegistro ? "Crea tu cuenta" : "Inicia sesion"}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {isRegistro
              ? "Despues de confirmar tu correo, vas a crear tu negocio y AgendaMe activara el plan gratis."
              : "Entra con el correo de tu negocio. Si sos usuario nuevo, primero confirma el correo que recibiste."}
          </p>
        </div>

        {authErrorMessage && (
          <Alert
            variant="destructive"
            className="mb-4 border-destructive/25 bg-destructive/10"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium text-destructive">
              {authErrorMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isRegistro && (
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  placeholder="Ej: Alan Silva"
                  className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electronico</Label>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-background/70 px-3 focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
              <LockKeyhole className="h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isRegistro ? "Minimo 6 caracteres" : "Tu contrasena"}
                className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            {isRegistro && (
              <p className="text-xs text-muted-foreground">
                Usa una contrasena que puedas recordar. No la compartas con empleados.
              </p>
            )}
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="border-destructive/25 bg-destructive/10"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-medium text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {mensaje && (
            <Alert className="border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="font-medium text-emerald-800 dark:text-emerald-200">
                {mensaje}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-11 w-full rounded-2xl text-sm font-bold"
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : isRegistro
                ? "Crear cuenta"
                : "Iniciar sesion"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          {isRegistro ? (
            <>
              Ya tenes cuenta?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Iniciar sesion
              </Link>
            </>
          ) : (
            <>
              No tenes cuenta?{" "}
              <Link href="/registro" className="font-semibold text-primary hover:underline">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
