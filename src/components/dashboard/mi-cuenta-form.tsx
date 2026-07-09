"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, KeyRound, Loader2, Save, ShieldCheck } from "lucide-react";

type Perfil = {
  usuario_id: string;
  nombre: string | null;
  telefono: string | null;
  cargo: string | null;
  avatar_url: string | null;
  tema: "sistema" | "claro" | "oscuro";
  color_acento: string | null;
  idioma: string;
  recibir_notificaciones: boolean;
};

type Contexto = {
  negocioNombre: string;
  planClave: string;
  rol: string;
  scope: string;
  sucursalNombre: string | null;
  email: string | null;
};

type Props = {
  perfil: Perfil;
  contexto: Contexto;
};

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    admin_global: "Admin global",
    gerente_sucursal: "Gerente de sucursal",
    recepcionista_sucursal: "Recepcionista",
    empleado_sucursal: "Personal de sucursal",
  };

  return labels[rol] ?? rol;
}

function iniciales(nombre?: string | null, email?: string | null) {
  const base = (nombre || email || "Usuario").trim();
  const partes = base.replace(/@.*/, "").split(/\s+/).filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  return base.slice(0, 2).toUpperCase();
}

export function MiCuentaForm({ perfil, contexto }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nombre, setNombre] = useState(perfil.nombre ?? "");
  const [telefono, setTelefono] = useState(perfil.telefono ?? "");
  const [cargo, setCargo] = useState(perfil.cargo ?? "");
  const [avatarUrl, setAvatarUrl] = useState(perfil.avatar_url ?? "");
  const [tema, setTema] = useState(perfil.tema ?? "sistema");
  const [colorAcento, setColorAcento] = useState(perfil.color_acento ?? "#2563eb");
  const [recibirNotificaciones, setRecibirNotificaciones] = useState(
    perfil.recibir_notificaciones ?? true
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFieldsUnlocked, setPasswordFieldsUnlocked] = useState(false);

  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const root = document.documentElement;

    if (tema === "oscuro") {
      root.classList.add("dark");
    } else if (tema === "claro") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }

    if (colorAcento) {
      root.style.setProperty("--agendame-accent", colorAcento);
    }
  }, [tema, colorAcento]);

  async function guardarPerfil() {
    try {
      setLoadingPerfil(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/mi-cuenta", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          telefono,
          cargo,
          avatar_url: avatarUrl,
          tema,
          color_acento: colorAcento,
          recibir_notificaciones: recibirNotificaciones,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }

      setMensaje("Cuenta actualizada correctamente.");

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch {
      setError("No se pudo guardar.");
    } finally {
      setLoadingPerfil(false);
    }
  }

  async function subirAvatar(file: File) {
    try {
      setLoadingAvatar(true);
      setMensaje("");
      setError("");

      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/dashboard/mi-cuenta/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo subir el avatar.");
        return;
      }

      setAvatarUrl(data.avatar_url);
      setMensaje("Avatar actualizado correctamente.");

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch {
      setError("No se pudo subir el avatar.");
    } finally {
      setLoadingAvatar(false);
    }
  }

  async function cambiarPassword() {
    try {
      setLoadingPassword(true);
      setMensaje("");
      setError("");

      const response = await fetch("/api/dashboard/mi-cuenta/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo cambiar la contraseña.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setPasswordFieldsUnlocked(false);
      setMensaje("Contraseña actualizada correctamente.");
    } catch {
      setError("No se pudo cambiar la contraseña.");
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Configuración individual</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Mi cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Editá solo los datos de tu usuario. No modifica la configuración global del negocio.
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
            <p className="font-bold">{rolLabel(contexto.rol)}</p>
            <p className="text-xs text-muted-foreground">
              {contexto.scope === "global"
                ? "Todas las sucursales"
                : contexto.sucursalNombre ?? "Sucursal"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border bg-background p-5 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nombre}
                className="h-28 w-28 rounded-full border object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold text-white shadow-sm"
                style={{ backgroundColor: colorAcento }}
              >
                {iniciales(nombre, contexto.email)}
              </div>
            )}

            <h2 className="mt-4 text-lg font-bold">{nombre || "Usuario"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{contexto.email}</p>
            {cargo && <p className="mt-1 text-xs font-medium">{cargo}</p>}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) subirAvatar(file);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingAvatar}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
            >
              {loadingAvatar ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Cambiar avatar
            </button>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="rounded-3xl border bg-background p-5 shadow-sm">
            <h2 className="text-lg font-bold">Datos personales</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Nombre visible</label>
                <input
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                  placeholder="Ej: 0981 000 000"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cargo / título</label>
                <input
                  value={cargo}
                  onChange={(event) => setCargo(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                  placeholder="Ej: Recepcionista, Gerente, Barbero"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border bg-background p-5 shadow-sm">
            <h2 className="text-lg font-bold">Preferencias</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Tema</label>
                <select
                  value={tema}
                  onChange={(event) =>
                    setTema(event.target.value as "sistema" | "claro" | "oscuro")
                  }
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                >
                  <option value="sistema">Sistema</option>
                  <option value="claro">Claro</option>
                  <option value="oscuro">Oscuro</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Color personal</label>
                <input
                  type="color"
                  value={colorAcento}
                  onChange={(event) => setColorAcento(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border bg-muted/20 p-4 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={recibirNotificaciones}
                  onChange={(event) => setRecibirNotificaciones(event.target.checked)}
                  className="h-4 w-4"
                />
                Recibir notificaciones y recordatorios
              </label>
            </div>

            <button
              type="button"
              onClick={guardarPerfil}
              disabled={loadingPerfil}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
            >
              {loadingPerfil ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </section>

          <section className="rounded-3xl border bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Acceso</p>
                    <h2 className="text-lg font-bold">Seguridad</h2>
                  </div>
                </div>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  La contraseña no se muestra ni se precarga. Escribi una nueva solo cuando quieras cambiarla.
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-xs font-medium text-muted-foreground">
                Minimo 8 caracteres
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border bg-muted/20 p-3">
                <label className="text-sm font-semibold">Nueva contraseña</label>
                <input
                  type="password"
                  name="agendame_password_new"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  readOnly={!passwordFieldsUnlocked}
                  value={password}
                  onFocus={() => setPasswordFieldsUnlocked(true)}
                  onMouseDown={() => setPasswordFieldsUnlocked(true)}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                  placeholder="Escribi la nueva contraseña"
                  spellCheck={false}
                />
              </div>

              <div className="rounded-2xl border bg-muted/20 p-3">
                <label className="text-sm font-semibold">Confirmar contraseña</label>
                <input
                  type="password"
                  name="agendame_password_confirm"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  readOnly={!passwordFieldsUnlocked}
                  value={confirmPassword}
                  onFocus={() => setPasswordFieldsUnlocked(true)}
                  onMouseDown={() => setPasswordFieldsUnlocked(true)}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm"
                  placeholder="Repeti la nueva contraseña"
                  spellCheck={false}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={cambiarPassword}
              disabled={loadingPassword}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition hover:bg-muted disabled:opacity-60"
            >
              {loadingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Cambiar contraseña
            </button>
          </section>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {mensaje && (
        <p className="rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {mensaje}
        </p>
      )}
    </div>
  );
}
