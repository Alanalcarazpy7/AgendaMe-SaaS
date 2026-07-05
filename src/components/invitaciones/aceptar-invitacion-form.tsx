"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  token: string;
  email: string;
};

export function AceptarInvitacionForm({ token, email }: Props) {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function aceptar() {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      if (!password || password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      if (password !== password2) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      const response = await fetch("/api/invitaciones/aceptar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          nombre,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo aceptar la invitación.");
        return;
      }

      const supabase = createClient();

      await supabase.auth.signOut();

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setSuccessMessage(
          "Invitación aceptada. Ahora iniciá sesión con tu correo y la contraseña que acabás de crear."
        );

        setTimeout(() => {
          router.push("/login");
        }, 1800);

        return;
      }

      setSuccessMessage("Acceso creado correctamente. Entrando al dashboard...");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch {
      setError("No se pudo aceptar la invitación.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
        <p className="text-muted-foreground">Correo invitado</p>
        <p className="mt-1 font-bold">{email}</p>
      </div>

      <div>
        <label className="text-sm font-medium">Nombre opcional</label>
        <input
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Crear contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Repetir contraseña</label>
        <input
          type="password"
          value={password2}
          onChange={(event) => setPassword2(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          placeholder="Repetí tu contraseña"
        />
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="flex items-center rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {successMessage}
        </p>
      )}

      <button
        type="button"
        onClick={aceptar}
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Crear mi acceso
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Después de crear tu contraseña, vas a entrar directamente al dashboard de tu sucursal.
      </p>
    </div>
  );
}