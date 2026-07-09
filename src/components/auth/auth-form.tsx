"use client";

import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AuthFormProps = {
  mode: "login" | "registro";
};

function traducirErrorLogin(error: AuthError) {
  const mensaje = error.message.toLowerCase();

  if (error.code === "invalid_credentials" || mensaje.includes("invalid login credentials")) {
    return "El correo o la contraseña son incorrectos.";
  }

  if (error.code === "email_not_confirmed" || mensaje.includes("email not confirmed")) {
    return "Todavía no confirmaste tu correo. Revisá tu bandeja de entrada para activar la cuenta.";
  }

  if (error.code === "user_banned" || mensaje.includes("banned")) {
    return "Esta cuenta está bloqueada. Contactanos si creés que es un error.";
  }

  if (
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit" ||
    mensaje.includes("rate limit")
  ) {
    return "Hiciste demasiados intentos. Esperá unos minutos y volvé a intentar.";
  }

  if (mensaje.includes("failed to fetch") || mensaje.includes("network")) {
    return "No pudimos conectar con el servidor. Revisá tu conexión a internet.";
  }

  return "No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo.";
}

function traducirErrorRegistro(error: AuthError) {
  const mensaje = error.message.toLowerCase();

  if (
    error.code === "user_already_exists" ||
    mensaje.includes("already registered") ||
    mensaje.includes("already exists")
  ) {
    return "Ya existe una cuenta con ese correo. Iniciá sesión o recuperá tu contraseña.";
  }

  if (error.code === "weak_password" || mensaje.includes("password")) {
    return "La contraseña es muy corta. Usá al menos 6 caracteres.";
  }

  if (error.code === "email_address_invalid" || mensaje.includes("invalid format") || mensaje.includes("invalid email")) {
    return "El correo ingresado no es válido.";
  }

  if (error.code === "signup_disabled") {
    return "El registro de nuevas cuentas está deshabilitado por ahora.";
  }

  if (
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit" ||
    mensaje.includes("rate limit")
  ) {
    return "Hiciste demasiados intentos. Esperá unos minutos y volvé a intentar.";
  }

  if (mensaje.includes("failed to fetch") || mensaje.includes("network")) {
    return "No pudimos conectar con el servidor. Revisá tu conexión a internet.";
  }

  return "No pudimos crear tu cuenta. Revisá tus datos e intentá de nuevo.";
}

export function AuthForm({ mode }: AuthFormProps) {
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
      return "Ingresá tu nombre completo.";
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!email.trim()) {
      return "Ingresá tu correo electrónico.";
    }

    if (!emailValido) {
      return "El correo ingresado no es válido.";
    }

    if (!password) {
      return "Ingresá tu contraseña.";
    }

    if (isRegistro && password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
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
          email,
          password,
          options: {
            data: {
              nombre,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(traducirErrorRegistro(signUpError));
          return;
        }

        setMensaje(
          "Cuenta creada correctamente. Si te pedimos confirmar tu correo, revisá tu bandeja de entrada. Si no, ya podés iniciar sesión."
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(traducirErrorLogin(signInError));
          return;
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isRegistro ? "Crear cuenta" : "Iniciar sesión"}</CardTitle>
        <CardDescription>
          {isRegistro
            ? "Creá tu cuenta para empezar a usar AgendaMe."
            : "Ingresá a tu cuenta de AgendaMe."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isRegistro && (
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isRegistro ? "Mínimo 6 caracteres" : "Tu contraseña"}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mensaje && (
            <Alert>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Procesando..."
              : isRegistro
                ? "Crear cuenta"
                : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          {isRegistro ? (
            <>
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-medium text-primary">
                Iniciar sesión
              </Link>
            </>
          ) : (
            <>
              ¿No tenés cuenta?{" "}
              <Link href="/registro" className="font-medium text-primary">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
