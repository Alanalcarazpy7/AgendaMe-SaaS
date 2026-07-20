"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  KeyRound,
  Loader2,
  MailPlus,
  MessageCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type Relacion<T> = T | T[] | null | undefined;

type Sucursal = {
  id: string;
  nombre: string;
  estado?: string;
  es_principal?: boolean;
};

type Acceso = {
  id: string;
  negocio_id?: string;
  sucursal_id: string;
  usuario_id?: string | null;
  empleado_id?: string | null;
  email: string;
  rol: string;
  activo: boolean;
  created_at?: string;
  sucursales?: Relacion<{
    id: string;
    nombre: string;
  }>;
};

type Empleado = {
  id: string;
  nombre: string;
  sucursal_id: string;
  estado?: string;
};

type Invitacion = {
  id: string;
  negocio_id?: string;
  sucursal_id: string;
  empleado_id?: string | null;
  email: string;
  rol: string;
  estado: string;
  expires_at: string;
  created_at?: string;
  sucursales?: Relacion<{
    id: string;
    nombre: string;
  }>;
};

type Props = {
  sucursales?: Sucursal[];
  initialSucursales?: Sucursal[];
  accesos?: Acceso[];
  usuarios?: Acceso[];
  invitaciones?: Invitacion[];
  empleados?: Empleado[];
};

const ROLES = [
  {
    value: "gerente_sucursal",
    label: "Gerente de sucursal",
    description: "Reportes, empleados, clientes, citas y reservas de su sucursal.",
  },
  {
    value: "recepcionista_sucursal",
    label: "Recepcionista",
    description: "Reservas, citas y clientes de su sucursal.",
  },
  {
    value: "empleado_sucursal",
    label: "Personal de sucursal",
    description: "Agenda de citas de su sucursal.",
  },
];

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function rolLabel(rol: string) {
  return ROLES.find((item) => item.value === rol)?.label ?? rol;
}

function fechaCorta(valor: string) {
  try {
    return new Intl.DateTimeFormat("es-PY", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(valor));
  } catch {
    return valor;
  }
}

export function SucursalUsuariosPanel({
  sucursales,
  initialSucursales,
  accesos,
  usuarios,
  invitaciones = [],
  empleados = [],
}: Props) {
  const sucursalesSafe = sucursales ?? initialSucursales ?? [];
  const [items, setItems] = useState<Acceso[]>(accesos ?? usuarios ?? []);
  const [pending, setPending] = useState<Invitacion[]>(invitaciones);
  const [email, setEmail] = useState("");
  const [sucursalId, setSucursalId] = useState(sucursalesSafe[0]?.id ?? "");
  const [rol, setRol] = useState("recepcionista_sucursal");
  const [empleadoId, setEmpleadoId] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState<{
    email: string;
    url: string;
  } | null>(null);
  const [vinculando, setVinculando] = useState<Record<string, string>>({});

  const sucursalesActivas = useMemo(
    () => sucursalesSafe.filter((sucursal) => sucursal.estado !== "inactivo"),
    [sucursalesSafe]
  );

  const empleadosOcupados = useMemo(() => {
    const ocupados = new Set<string>();

    items.forEach((acceso) => {
      if (acceso.activo && acceso.rol === "empleado_sucursal" && acceso.empleado_id) {
        ocupados.add(acceso.empleado_id);
      }
    });

    pending.forEach((invitacion) => {
      if (
        invitacion.estado === "pendiente" &&
        invitacion.rol === "empleado_sucursal" &&
        invitacion.empleado_id
      ) {
        ocupados.add(invitacion.empleado_id);
      }
    });

    return ocupados;
  }, [items, pending]);

  const empleadosDeSucursal = useMemo(
    () =>
      empleados.filter(
        (empleado) =>
          empleado.sucursal_id === sucursalId &&
          empleado.estado !== "inactivo" &&
          !empleadosOcupados.has(empleado.id)
      ),
    [empleados, empleadosOcupados, sucursalId]
  );

  const esRolPersonal = rol === "empleado_sucursal";

  function nombreEmpleado(empleadoId?: string | null) {
    if (!empleadoId) return null;
    return empleados.find((empleado) => empleado.id === empleadoId)?.nombre ?? null;
  }

  function empleadosDe(sucursalIdAcceso: string) {
    return empleados.filter(
      (empleado) =>
        empleado.sucursal_id === sucursalIdAcceso &&
        empleado.estado !== "inactivo" &&
        empleadoDisponible(empleado.id)
    );
  }

  function empleadoDisponible(empleadoId: string, empleadoActualId?: string | null) {
    return empleadoId === empleadoActualId || !empleadosOcupados.has(empleadoId);
  }

  function nombreSucursal(acceso: Acceso | Invitacion) {
    const sucursalRelacionada = obtenerObjeto(acceso.sucursales);

    return (
      sucursalRelacionada?.nombre ??
      sucursalesSafe.find((sucursal) => sucursal.id === acceso.sucursal_id)?.nombre ??
      "Sucursal"
    );
  }

  async function refrescar() {
    const response = await fetch("/api/dashboard/sucursales/usuarios");
    const data = await response.json();

    if (response.ok) {
      setItems(data.accesos ?? []);
      setPending(data.invitaciones ?? []);
    }
  }

  function mensajeInvitacion(url: string, emailDestino: string) {
    return `Hola, te invitaron a AgendaMe.\n\nEntrá desde este link para crear tu contraseña y acceder al dashboard:\n${url}\n\nCorreo: ${emailDestino}`;
  }

  async function copiarMensaje(url: string, emailDestino: string) {
    try {
      await navigator.clipboard.writeText(mensajeInvitacion(url, emailDestino));
      toast.success("Mensaje de invitación copiado");
    } catch {
      toast.error("No se pudo copiar el mensaje");
    }
  }

  function abrirWhatsapp(url: string, emailDestino: string) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(mensajeInvitacion(url, emailDestino))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function crearInvitacion(payload?: {
    email?: string;
    sucursal_id?: string;
    rol?: string;
    empleado_id?: string | null;
    fromActive?: boolean;
  }) {
    try {
      const emailFinal = payload?.email ?? email;
      const sucursalFinal = payload?.sucursal_id ?? sucursalId;
      const rolFinal = payload?.rol ?? rol;
      const empleadoIdFinal =
        payload?.empleado_id !== undefined ? payload.empleado_id : empleadoId;

      if (rolFinal === "empleado_sucursal" && !empleadoIdFinal) {
        setError("Elegí a qué empleado de la plantilla corresponde este acceso.");
        toast.error("Elegí el empleado para este acceso");
        return;
      }

      if (payload?.fromActive) {
        const confirmar = window.confirm(
          "Esto generará un nuevo link de invitación y pasará este usuario a pendiente hasta que acepte. ¿Continuar?"
        );

        if (!confirmar) return;
      }

      setLoading(payload?.fromActive ? `invite-${emailFinal}` : "crear");
      setError("");
      setInviteLink(null);

      const response = await fetch("/api/dashboard/sucursales/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailFinal,
          sucursal_id: sucursalFinal,
          rol: rolFinal,
          empleado_id: rolFinal === "empleado_sucursal" ? empleadoIdFinal : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo crear la invitación.";
        setError(message);
        toast.error("No se pudo crear la invitación", { description: message });
        return;
      }

      setInviteLink({
        email: emailFinal,
        url: data.invitationUrl,
      });

      if (!payload?.fromActive) {
        setEmail("");
        setEmpleadoId("");
      }

      toast.success("Invitación creada", {
        description: "Copiá el link o compartilo por WhatsApp.",
      });
      await refrescar();
    } catch {
      setError("No se pudo crear la invitación.");
      toast.error("No se pudo crear la invitación");
    } finally {
      setLoading("");
    }
  }

  async function regenerarLink(invitacion: Invitacion) {
    try {
      setLoading(`${invitacion.id}-copy`);
      setError("");
      setInviteLink(null);

      const response = await fetch("/api/dashboard/sucursales/usuarios", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invite_id: invitacion.id,
          regenerate_link: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo generar el link.";
        setError(message);
        toast.error("No se pudo generar el link", { description: message });
        return;
      }

      setInviteLink({
        email: invitacion.email,
        url: data.invitationUrl,
      });

      await copiarMensaje(data.invitationUrl, invitacion.email);
      toast.success("Nuevo link generado");
      await refrescar();
    } catch {
      setError("No se pudo generar el link.");
      toast.error("No se pudo generar el link");
    } finally {
      setLoading("");
    }
  }

  async function actualizarAcceso(
    acceso: Acceso,
    payload: Record<string, unknown>
  ) {
    try {
      setLoading(`${acceso.id}-update`);
      setError("");

      const response = await fetch("/api/dashboard/sucursales/usuarios", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: acceso.id,
          ...payload,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo actualizar el acceso.";
        setError(message);
        toast.error("No se pudo actualizar el acceso", { description: message });
        return;
      }

      toast.success("Acceso actualizado");
      await refrescar();
    } catch {
      setError("No se pudo actualizar el acceso.");
      toast.error("No se pudo actualizar el acceso");
    } finally {
      setLoading("");
    }
  }

  async function eliminarAcceso(acceso: Acceso) {
    const confirmar = window.confirm(
      `¿Eliminar el acceso de ${acceso.email}?`
    );

    if (!confirmar) return;

    try {
      setLoading(`${acceso.id}-delete`);
      setError("");

      const response = await fetch(
        `/api/dashboard/sucursales/usuarios?id=${encodeURIComponent(acceso.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo eliminar el acceso.";
        setError(message);
        toast.error("No se pudo eliminar el acceso", { description: message });
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== acceso.id));
      toast.success("Acceso eliminado");
    } catch {
      setError("No se pudo eliminar el acceso.");
      toast.error("No se pudo eliminar el acceso");
    } finally {
      setLoading("");
    }
  }

  async function revocarInvitacion(invitacion: Invitacion) {
    const confirmar = window.confirm(
      `¿Revocar la invitación de ${invitacion.email}?`
    );

    if (!confirmar) return;

    try {
      setLoading(`${invitacion.id}-revoke`);
      setError("");

      const response = await fetch(
        `/api/dashboard/sucursales/usuarios?inviteId=${encodeURIComponent(
          invitacion.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo revocar la invitación.";
        setError(message);
        toast.error("No se pudo revocar la invitación", { description: message });
        return;
      }

      setPending((prev) => prev.filter((item) => item.id !== invitacion.id));
      toast.success("Invitación revocada");
    } catch {
      setError("No se pudo revocar la invitación.");
      toast.error("No se pudo revocar la invitación");
    } finally {
      setLoading("");
    }
  }

  return (
    <section className="rounded-3xl border bg-background p-5 shadow-sm">
      <div>
        <p className="text-sm text-muted-foreground">Accesos empresariales</p>

        <h2 className="mt-1 text-2xl font-bold">
          Usuarios con acceso al dashboard
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Invitá personas para que creen su propia contraseña y entren al dashboard
          de una sucursal. Los usuarios activos ya aceptaron la invitación o ya
          tienen una cuenta lista.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {inviteLink && (
        <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-bold">Link de invitación listo</p>
          <p className="mt-1">
            Copialo y envialo por WhatsApp o email. El link sirve una sola vez:
            cuando la persona crea su contraseña, pasa a Usuario activo.
          </p>

          <div className="mt-3 break-all rounded-xl bg-white/70 p-3 font-mono text-xs">
            {inviteLink.url}
          </div>

          <button
            type="button"
            onClick={() => copiarMensaje(inviteLink.url, inviteLink.email)}
            className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-green-700 px-4 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar mensaje
          </button>
          <button
            type="button"
            onClick={() => abrirWhatsapp(inviteLink.url, inviteLink.email)}
            className="ml-2 mt-3 inline-flex h-10 items-center justify-center rounded-xl border border-green-300 bg-white/70 px-4 text-sm font-semibold text-green-800 transition hover:bg-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </button>
        </div>
      )}

      <div className="mt-5 grid gap-3 rounded-3xl border bg-muted/20 p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <div>
          <label className="text-sm font-medium">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            placeholder="usuario@empresa.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Sucursal</label>
          <select
            value={sucursalId}
            onChange={(event) => setSucursalId(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          >
            {sucursalesActivas.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Rol</label>
          <select
            value={rol}
            onChange={(event) => setRol(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
          >
            {ROLES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {esRolPersonal && (
          <div className="lg:col-span-4">
            <label className="text-sm font-medium">
              ¿A qué empleado de la plantilla corresponde?
            </label>
            <select
              value={empleadoId}
              onChange={(event) => setEmpleadoId(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3"
            >
              <option value="">Elegí un empleado</option>
              {empleadosDeSucursal.map((empleadoItem) => (
                <option key={empleadoItem.id} value={empleadoItem.id}>
                  {empleadoItem.nombre}
                </option>
              ))}
            </select>
            {empleadosDeSucursal.length === 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Esta sucursal no tiene empleados activos disponibles. Creá uno
                nuevo o liberá un vínculo existente.
              </p>
            )}
          </div>
        )}

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => crearInvitacion()}
            disabled={loading === "crear" || (esRolPersonal && !empleadoId)}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {loading === "crear" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MailPlus className="mr-2 h-4 w-4" />
            )}
            Crear invitación
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {ROLES.map((item) => (
          <div key={item.value} className="rounded-2xl border bg-muted/20 p-4">
            <p className="font-bold">{item.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border bg-muted/10 p-4">
        <h3 className="text-lg font-bold">Invitaciones pendientes</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Estos usuarios todavía no crearon su contraseña. Podés copiar un nuevo
          link cuando necesites reenviarlo.
        </p>

        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No hay invitaciones pendientes.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-bold">Correo</th>
                  <th className="px-4 py-3 font-bold">Sucursal</th>
                  <th className="px-4 py-3 font-bold">Rol</th>
                  <th className="px-4 py-3 font-bold">Expira</th>
                  <th className="px-4 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pending.map((invitacion) => (
                  <tr key={invitacion.id} className="border-t">
                    <td className="px-4 py-4 font-semibold">{invitacion.email}</td>
                    <td className="px-4 py-4">{nombreSucursal(invitacion)}</td>
                    <td className="px-4 py-4">{rolLabel(invitacion.rol)}</td>
                    <td className="px-4 py-4">{fechaCorta(invitacion.expires_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => regenerarLink(invitacion)}
                          disabled={loading === `${invitacion.id}-copy`}
                          className="inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-60"
                        >
                          {loading === `${invitacion.id}-copy` ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Copy className="mr-1 h-3.5 w-3.5" />
                          )}
                          Copiar link
                        </button>

                        <button
                          type="button"
                          onClick={() => revocarInvitacion(invitacion)}
                          disabled={loading === `${invitacion.id}-revoke`}
                          className="inline-flex h-9 items-center rounded-xl bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {loading === `${invitacion.id}-revoke` ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                          )}
                          Revocar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border">
        <div className="border-b bg-muted/20 p-4">
          <h3 className="text-lg font-bold">Usuarios activos</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Estos usuarios ya tienen acceso. Si necesitás que creen una nueva
            contraseña, usá “Nuevo link”.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Todavía no hay usuarios activos con acceso al dashboard.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-bold">Usuario</th>
                  <th className="px-4 py-3 font-bold">Sucursal</th>
                  <th className="px-4 py-3 font-bold">Rol</th>
                  <th className="px-4 py-3 font-bold">Empleado</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold">Auth</th>
                  <th className="px-4 py-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {items.map((acceso) => (
                  <tr key={acceso.id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold">{acceso.email}</p>
                    </td>

                    <td className="px-4 py-4">{nombreSucursal(acceso)}</td>

                    <td className="px-4 py-4">
                      <span className="rounded-full border bg-muted/30 px-3 py-1 text-xs font-semibold">
                        {rolLabel(acceso.rol)}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {acceso.rol !== "empleado_sucursal" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : acceso.empleado_id ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {nombreEmpleado(acceso.empleado_id) ?? "Vinculado"}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            Sin vincular
                          </span>
                          <div className="flex gap-1.5">
                            <select
                              value={vinculando[acceso.id] ?? ""}
                              onChange={(event) =>
                                setVinculando((prev) => ({
                                  ...prev,
                                  [acceso.id]: event.target.value,
                                }))
                              }
                              className="h-8 rounded-lg border bg-background px-2 text-xs"
                            >
                              <option value="">Elegí un empleado</option>
                              {empleadosDe(acceso.sucursal_id).map((empleadoItem) => (
                                <option key={empleadoItem.id} value={empleadoItem.id}>
                                  {empleadoItem.nombre}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const empleadoElegido = vinculando[acceso.id];
                                if (!empleadoElegido) return;
                                actualizarAcceso(acceso, { empleado_id: empleadoElegido });
                              }}
                              disabled={
                                !vinculando[acceso.id] || loading === `${acceso.id}-update`
                              }
                              className="inline-flex h-8 items-center rounded-lg bg-foreground px-2 text-xs font-semibold text-background disabled:opacity-60"
                            >
                              Vincular
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Activo
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Usuario listo
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            crearInvitacion({
                              email: acceso.email,
                              sucursal_id: acceso.sucursal_id,
                              rol: acceso.rol,
                              empleado_id: acceso.empleado_id ?? null,
                              fromActive: true,
                            })
                          }
                          disabled={loading === `invite-${acceso.email}`}
                          className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                        >
                          {loading === `invite-${acceso.email}` ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                          )}
                          Nuevo link
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            actualizarAcceso(acceso, {
                              activo: false,
                            })
                          }
                          disabled={loading === `${acceso.id}-update`}
                          className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition hover:bg-muted disabled:opacity-60"
                        >
                          {loading === `${acceso.id}-update` && (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          )}
                          Desactivar
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarAcceso(acceso)}
                          disabled={loading === `${acceso.id}-delete`}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                        >
                          {loading === `${acceso.id}-delete` ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                          )}
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
