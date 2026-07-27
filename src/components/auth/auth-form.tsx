"use client";

import { useState, type ReactNode } from "react";
import type { AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  LockKeyhole,
  Mail,
  UserPlus,
  UserRound,
} from "lucide-react";

import { AuthProductPanel } from "@/components/auth/auth-product-panel";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { GoogleIcon } from "@/components/landing/social-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "registro";
  authErrorMessage?: string | null;
};

type AuthField = "nombre" | "email" | "password" | "confirmarPassword";

type ValidationError = {
  field: AuthField;
  message: string;
};

function traducirErrorLogin(error: AuthError) {
  const mensaje = error.message.toLowerCase();

  if (error.code === "invalid_credentials" || mensaje.includes("invalid login credentials")) {
    return "El correo o la contraseña no coinciden. Revisá los datos e intentá de nuevo.";
  }

  if (error.code === "email_not_confirmed" || mensaje.includes("email not confirmed")) {
    return "Todavía falta confirmar tu correo. Abrí el enlace que te enviamos para activar la cuenta.";
  }

  if (error.code === "user_banned" || mensaje.includes("banned")) {
    return "Esta cuenta está bloqueada. Contactá al soporte si creés que es un error.";
  }

  if (
    error.code === "over_request_rate_limit" ||
    error.code === "over_email_send_rate_limit" ||
    mensaje.includes("rate limit")
  ) {
    return "Hay demasiados intentos seguidos. Esperá unos minutos y volvé a probar.";
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
    return "Ya existe una cuenta con ese correo. Iniciá sesión con esa cuenta.";
  }

  if (error.code === "weak_password" || mensaje.includes("password")) {
    return "La contraseña no cumple con la política de seguridad. Revisá los requisitos e intentá de nuevo.";
  }

  if (
    error.code === "email_address_invalid" ||
    mensaje.includes("invalid format") ||
    mensaje.includes("invalid email")
  ) {
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
    return "Hay demasiados intentos seguidos. Esperá unos minutos y volvé a probar.";
  }

  if (mensaje.includes("failed to fetch") || mensaje.includes("network")) {
    return "No pudimos conectar con el servidor. Revisá tu conexión a internet.";
  }

  return "No pudimos crear tu cuenta. Revisá tus datos e intentá de nuevo.";
}

function AuthFieldShell({
  invalid,
  valid = false,
  children,
}: {
  invalid: boolean;
  valid?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/auth-field flex h-11 items-center gap-3 rounded-md border-2 bg-background px-3 shadow-sm transition-[border-color,box-shadow,background-color]",
        "focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15",
        invalid
          ? "border-destructive ring-3 ring-destructive/15"
          : valid
            ? "border-emerald-500/60"
            : "border-border hover:border-primary/45",
      )}
    >
      {children}
    </div>
  );
}

function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      aria-pressed={visible}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md outline-none transition-[background-color,color,box-shadow]",
        "hover:bg-primary/10 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40",
        visible ? "bg-primary/10 text-primary" : "text-muted-foreground",
      )}
    >
      {visible ? (
        <EyeOff className="size-4" aria-hidden="true" />
      ) : (
        <Eye className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}

const PASSWORD_REQUIREMENTS = [
  {
    key: "length",
    label: "8 caracteres",
    test: (password: string) => password.length >= 8,
  },
  {
    key: "uppercase",
    label: "Una mayúscula",
    test: (password: string) => /[A-ZÁÉÍÓÚÑ]/.test(password),
  },
  {
    key: "lowercase",
    label: "Una minúscula",
    test: (password: string) => /[a-záéíóúñ]/.test(password),
  },
  {
    key: "number",
    label: "Un número",
    test: (password: string) => /\d/.test(password),
  },
] as const;

function PasswordRequirements({ password }: { password: string }) {
  return (
    <div
      aria-label="Requisitos de la contraseña"
      className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-4"
    >
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const complete = requirement.test(password);

        return (
          <p
            key={requirement.key}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              complete
                ? "font-medium text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {complete ? (
              <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="size-2.5" strokeWidth={3} aria-hidden="true" />
              </span>
            ) : (
              <Circle className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            {requirement.label}
          </p>
        );
      })}
    </div>
  );
}

export function AuthForm({ mode, authErrorMessage = null }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isRegistro = mode === "registro";

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<AuthField | null>(null);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValida = PASSWORD_REQUIREMENTS.every((requirement) =>
    requirement.test(password),
  );
  const passwordsCoinciden =
    confirmarPassword.length > 0 && password === confirmarPassword;

  function validarFormulario(): ValidationError | null {
    if (isRegistro && nombre.trim().length < 2) {
      return { field: "nombre", message: "Ingresá tu nombre completo." };
    }

    if (!email.trim()) {
      return { field: "email", message: "Ingresá tu correo electrónico." };
    }

    if (!emailValido) {
      return { field: "email", message: "El correo ingresado no es válido." };
    }

    if (!password) {
      return { field: "password", message: "Ingresá tu contraseña." };
    }

    if (isRegistro && password.length < 8) {
      return {
        field: "password",
        message: "La contraseña debe tener al menos 8 caracteres.",
      };
    }

    if (isRegistro && !/[A-ZÁÉÍÓÚÑ]/.test(password)) {
      return {
        field: "password",
        message: "La contraseña debe incluir al menos una letra mayúscula.",
      };
    }

    if (isRegistro && !/[a-záéíóúñ]/.test(password)) {
      return {
        field: "password",
        message: "La contraseña debe incluir al menos una letra minúscula.",
      };
    }

    if (isRegistro && !/\d/.test(password)) {
      return {
        field: "password",
        message: "La contraseña debe incluir al menos un número.",
      };
    }

    if (isRegistro && password !== confirmarPassword) {
      return {
        field: "confirmarPassword",
        message: "Las contraseñas no coinciden.",
      };
    }

    return null;
  }

  function clearFieldError(field: AuthField) {
    if (errorField === field) {
      setError(null);
      setErrorField(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setError(errorValidacion.message);
      setErrorField(errorValidacion.field);
      setMensaje(null);
      return;
    }

    setLoading(true);
    setError(null);
    setErrorField(null);
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
              "/auth/redirect?confirmado=1",
            )}`,
          },
        });

        if (signUpError) {
          setError(traducirErrorRegistro(signUpError));
          return;
        }

        setMensaje(
          "Te enviamos un correo para activar tu cuenta. Abrí el enlace y después vas a configurar tu negocio con el plan gratis.",
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
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoadingGoogle(true);
    setError(null);
    setErrorField(null);
    setMensaje(null);

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            "/auth/redirect",
          )}`,
        },
      });

      if (googleError) {
        setError("No pudimos conectar con Google. Intentá de nuevo o usá tu correo.");
        setLoadingGoogle(false);
      }
    } catch {
      setError("No pudimos conectar con Google. Revisá tu conexión e intentá de nuevo.");
      setLoadingGoogle(false);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[68rem] overflow-hidden rounded-xl border-2 border-white bg-card shadow-[0_32px_90px_rgb(15_23_42/0.24),0_4px_18px_rgb(37_99_235/0.12)] ring-1 ring-primary/15 dark:border-slate-700 dark:shadow-black/50 lg:h-[min(44rem,calc(100dvh-4rem))] lg:min-h-[40rem] lg:grid-cols-[minmax(26rem,0.95fr)_minmax(0,1.05fr)]">
      <div className="flex min-w-0 bg-card">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[29rem] flex-col justify-center px-5 sm:px-8 sm:py-7 lg:px-9 lg:py-8 [@media(max-height:820px)]:py-4 [@media(max-height:740px)]:py-2",
            isRegistro ? "py-5" : "py-7",
          )}
        >
          <Link
            href="/"
            aria-label="Volver al inicio de AgendaMe"
            className={cn(
              "w-fit rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50",
              isRegistro
                ? "mb-3 [@media(max-height:820px)]:mb-2"
                : "mb-5",
            )}
          >
            <AgendaMeLogo
              size="lg"
              className="h-11 sm:h-14 [@media(max-height:740px)]:h-10"
            />
          </Link>

          <nav
            aria-label="Elegir acceso o registro"
            className={cn(
              "grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/70 p-1 shadow-inner",
              isRegistro
                ? "mb-3 [@media(max-height:820px)]:mb-2"
                : "mb-5",
            )}
          >
            <Link
              href="/login"
              aria-current={!isRegistro ? "page" : undefined}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold outline-none transition-[background-color,color,box-shadow,transform] sm:h-9 sm:px-3 sm:text-sm [@media(max-height:740px)]:h-8 [@media(max-height:740px)]:text-xs",
                "focus-visible:ring-3 focus-visible:ring-ring/40",
                !isRegistro
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-primary active:scale-[0.98]"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <LogIn className="size-3.5 sm:size-4" aria-hidden="true" />
              Iniciar sesión
            </Link>
            <Link
              href="/auth/registro"
              aria-current={isRegistro ? "page" : undefined}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold outline-none transition-[background-color,color,box-shadow,transform] sm:h-9 sm:px-3 sm:text-sm [@media(max-height:740px)]:h-8 [@media(max-height:740px)]:text-xs",
                "focus-visible:ring-3 focus-visible:ring-ring/40",
                isRegistro
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-primary active:scale-[0.98]"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <UserPlus className="size-3.5 sm:size-4" aria-hidden="true" />
              Crear cuenta
            </Link>
          </nav>

          <header
            className={
              isRegistro
                ? "mb-3 [@media(max-height:820px)]:mb-2"
                : "mb-5"
            }
          >
            <h1 className="text-3xl font-bold leading-tight text-balance sm:text-[2rem] [@media(max-height:740px)]:text-[1.75rem]">
              {isRegistro ? "Creá tu cuenta" : "Bienvenido de nuevo"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isRegistro
                ? "Organizá las reservas de tu negocio con AgendaMe."
                : "Ingresá con los datos asociados a tu negocio."}
            </p>
          </header>

          {authErrorMessage && (
            <Alert
              variant="destructive"
              role="alert"
              className="mb-3 rounded-md border-destructive/30 bg-destructive/10"
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              <AlertDescription className="font-medium text-destructive">
                {authErrorMessage}
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3 [@media(max-height:740px)]:space-y-2.5"
            noValidate
          >
            {isRegistro && (
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <AuthFieldShell
                  invalid={errorField === "nombre"}
                  valid={nombre.trim().length >= 2}
                >
                  <UserRound
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within/auth-field:text-primary"
                    aria-hidden="true"
                  />
                  <Input
                    id="nombre"
                    name="name"
                    type="text"
                    value={nombre}
                    onChange={(event) => {
                      setNombre(event.target.value);
                      clearFieldError("nombre");
                    }}
                    placeholder="Ej.: Alan Silva"
                    autoComplete="name"
                    autoCapitalize="words"
                    required
                    aria-invalid={errorField === "nombre"}
                    aria-describedby={errorField === "nombre" ? "auth-form-error" : undefined}
                    className="h-10 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                  {nombre.trim().length >= 2 && (
                    <CheckCircle2
                      className="size-4 shrink-0 text-emerald-500"
                      aria-label="Nombre válido"
                    />
                  )}
                </AuthFieldShell>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <AuthFieldShell
                invalid={errorField === "email"}
                valid={email.length > 0 && emailValido}
              >
                <Mail
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within/auth-field:text-primary"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    clearFieldError("email");
                  }}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  aria-invalid={errorField === "email"}
                  aria-describedby={errorField === "email" ? "auth-form-error" : undefined}
                  className="h-10 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                {email.length > 0 && emailValido && (
                  <CheckCircle2
                    className="size-4 shrink-0 text-emerald-500"
                    aria-label="Correo válido"
                  />
                )}
              </AuthFieldShell>
            </div>

            <div className={cn("grid gap-3", isRegistro && "sm:grid-cols-2")}>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <AuthFieldShell
                  invalid={errorField === "password"}
                  valid={isRegistro && passwordValida}
                >
                  <LockKeyhole
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within/auth-field:text-primary"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    name="password"
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearFieldError("password");
                    }}
                    placeholder="Tu contraseña"
                    autoComplete={isRegistro ? "new-password" : "current-password"}
                    minLength={isRegistro ? 8 : undefined}
                    required
                    aria-invalid={errorField === "password"}
                    aria-describedby={errorField === "password" ? "auth-form-error" : undefined}
                    className="h-10 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                  <PasswordToggle
                    visible={mostrarPassword}
                    onToggle={() => setMostrarPassword((visible) => !visible)}
                  />
                </AuthFieldShell>
              </div>

              {isRegistro && (
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="confirmar-password">Repetir contraseña</Label>
                  <AuthFieldShell
                    invalid={errorField === "confirmarPassword"}
                    valid={passwordsCoinciden}
                  >
                    <LockKeyhole
                      className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within/auth-field:text-primary"
                      aria-hidden="true"
                    />
                    <Input
                      id="confirmar-password"
                      name="confirm-password"
                      type={mostrarConfirmarPassword ? "text" : "password"}
                      value={confirmarPassword}
                      onChange={(event) => {
                        setConfirmarPassword(event.target.value);
                        clearFieldError("confirmarPassword");
                      }}
                      placeholder="Repetila"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      aria-invalid={errorField === "confirmarPassword"}
                      aria-describedby={
                        errorField === "confirmarPassword" ? "auth-form-error" : undefined
                      }
                      className="h-10 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                    {passwordsCoinciden && (
                      <CheckCircle2
                        className="size-4 shrink-0 text-emerald-500"
                        aria-label="Las contraseñas coinciden"
                      />
                    )}
                    <PasswordToggle
                      visible={mostrarConfirmarPassword}
                      onToggle={() =>
                        setMostrarConfirmarPassword((visible) => !visible)
                      }
                    />
                  </AuthFieldShell>
                </div>
              )}
            </div>

            {isRegistro && <PasswordRequirements password={password} />}

            {error && (
              <Alert
                id="auth-form-error"
                variant="destructive"
                role="alert"
                className="rounded-md border-destructive/30 bg-destructive/10 py-2.5"
              >
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription className="font-medium text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {mensaje && (
              <Alert
                role="status"
                aria-live="polite"
                className="rounded-md border-emerald-500/30 bg-emerald-500/10 py-2.5 text-emerald-900 dark:text-emerald-200"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                <AlertDescription className="font-medium text-emerald-800 dark:text-emerald-200">
                  {mensaje}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-md text-sm font-bold shadow-md shadow-primary/20"
              disabled={loading || loadingGoogle}
            >
              {loading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  Procesando
                </>
              ) : (
                <>
                  {isRegistro ? "Crear cuenta" : "Iniciar sesión"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <div
            className="my-3 flex items-center gap-3 [@media(max-height:740px)]:my-2"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">o</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={loading || loadingGoogle}
            className="h-11 w-full rounded-md border-2 text-sm font-bold shadow-sm [@media(max-height:740px)]:h-10"
          >
            {loadingGoogle ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon className="size-4" />
            )}
            {loadingGoogle ? "Conectando con Google" : "Continuar con Google"}
          </Button>

          {isRegistro && (
            <p className="mt-3 pb-3 text-center text-[11px] leading-4 text-muted-foreground [@media(max-height:820px)]:mt-2">
              Al crear tu cuenta aceptás los{" "}
              <Link
                href="/terminos"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-foreground underline underline-offset-2 hover:text-primary"
              >
                Términos de Servicio
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacidad"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-foreground underline underline-offset-2 hover:text-primary"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <AuthProductPanel mode={mode} />
    </section>
  );
}
