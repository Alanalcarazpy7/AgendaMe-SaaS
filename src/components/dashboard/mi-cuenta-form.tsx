"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  KeyRound,
  Loader2,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

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
  const [seccion, setSeccion] = useState<
    "perfil" | "preferencias" | "seguridad"
  >("perfil");

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
    <div className="space-y-5">
      <nav
        aria-label="Secciones de mi cuenta"
        className="flex overflow-x-auto border-b border-border/70"
      >
        {[
          { id: "perfil", label: "Perfil", icon: UserRound },
          { id: "preferencias", label: "Apariencia", icon: Palette },
          { id: "seguridad", label: "Seguridad", icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          const active = seccion === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() =>
                setSeccion(
                  item.id as "perfil" | "preferencias" | "seguridad",
                )
              }
              className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3.5 text-sm font-semibold outline-none transition focus-visible:ring-3 focus-visible:ring-ring/40 ${
                active
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {avatarUrl ? (
              <Image
                  src={avatarUrl}
                  alt={nombre}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-24 w-24 rounded-lg border object-cover shadow-sm"
                />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-lg text-2xl font-bold text-white shadow-sm"
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
              className="mt-4 inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-semibold transition hover:bg-muted active:scale-[0.98] disabled:opacity-60"
            >
              {loadingAvatar ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Cambiar avatar
            </button>

            <div className="mt-5 w-full border-t pt-4 text-left text-xs">
              <p className="font-semibold">{rolLabel(contexto.rol)}</p>
              <p className="mt-1 text-muted-foreground">
                {contexto.scope === "global"
                  ? "Todas las sucursales"
                  : contexto.sucursalNombre ?? "Sucursal"}
              </p>
              <p className="mt-1 truncate text-muted-foreground">
                {contexto.negocioNombre}
              </p>
            </div>
          </div>
        </aside>

        <div>
          {seccion === "perfil" ? (
          <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold">Datos personales</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Información visible dentro del equipo.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="perfil-nombre" className="text-sm font-medium">Nombre visible</label>
                <input
                  id="perfil-nombre"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label htmlFor="perfil-telefono" className="text-sm font-medium">Teléfono</label>
                <input
                  id="perfil-telefono"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Ej: 0981 000 000"
                />
              </div>

              <div>
                <label htmlFor="perfil-cargo" className="text-sm font-medium">Cargo / título</label>
                <input
                  id="perfil-cargo"
                  value={cargo}
                  onChange={(event) => setCargo(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Ej: Recepcionista, Gerente, Barbero"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={guardarPerfil}
              disabled={loadingPerfil}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {loadingPerfil ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar perfil
            </button>
          </section>
          ) : null}

          {seccion === "preferencias" ? (
          <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-bold">Apariencia y avisos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalizá cómo se ve y se comporta tu panel.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="perfil-tema" className="text-sm font-medium">Tema</label>
                <select
                  id="perfil-tema"
                  value={tema}
                  onChange={(event) =>
                    setTema(event.target.value as "sistema" | "claro" | "oscuro")
                  }
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                >
                  <option value="sistema">Sistema</option>
                  <option value="claro">Claro</option>
                  <option value="oscuro">Oscuro</option>
                </select>
              </div>

              <div>
                <label htmlFor="perfil-color" className="text-sm font-medium">Color personal</label>
                <input
                  id="perfil-color"
                  type="color"
                  value={colorAcento}
                  onChange={(event) => setColorAcento(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-2"
                />
              </div>

              <label className="md:col-span-2 flex items-center gap-3 rounded-lg border bg-muted/20 p-3 text-sm font-medium">
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
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {loadingPerfil ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </section>
          ) : null}

          {seccion === "seguridad" ? (
          <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                Mínimo 8 caracteres
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="cuenta-password" className="text-sm font-semibold">Nueva contraseña</label>
                <input
                  id="cuenta-password"
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
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Escribí la nueva contraseña"
                  spellCheck={false}
                />
              </div>

              <div>
                <label htmlFor="cuenta-password-confirmar" className="text-sm font-semibold">Confirmar contraseña</label>
                <input
                  id="cuenta-password-confirmar"
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
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
                  placeholder="Repetí la nueva contraseña"
                  spellCheck={false}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={cambiarPassword}
              disabled={loadingPassword}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold transition hover:bg-muted active:scale-[0.98] disabled:opacity-60"
            >
              {loadingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Cambiar contraseña
            </button>
          </section>
          ) : null}
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
