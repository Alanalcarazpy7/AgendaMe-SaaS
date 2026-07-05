import crypto from "node:crypto";
import Link from "next/link";
import { AceptarInvitacionForm } from "@/components/invitaciones/aceptar-invitacion-form";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

type Relacion<T> = T | T[] | null;

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function rolLabel(rol: string) {
  const labels: Record<string, string> = {
    gerente_sucursal: "Gerente de sucursal",
    recepcionista_sucursal: "Recepcionista",
    empleado_sucursal: "Personal de sucursal",
  };

  return labels[rol] ?? rol;
}

export default async function InvitacionPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  const tokenHash = hashToken(token);

  const { data: invitacion } = await supabase
    .from("sucursal_invitaciones")
    .select(
      `
      id,
      email,
      rol,
      estado,
      expires_at,
      negocios (
        nombre,
        logo_url
      ),
      sucursales (
        nombre
      )
    `
    )
    .eq("token_hash", tokenHash)
    .eq("estado", "pendiente")
    .maybeSingle();

  const negocio = obtenerObjeto((invitacion as any)?.negocios ?? null);
  const sucursal = obtenerObjeto((invitacion as any)?.sucursales ?? null);

  const invalida =
    !invitacion ||
    !negocio ||
    !sucursal ||
    new Date((invitacion as any).expires_at).getTime() < Date.now();

  if (invalida) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <section className="w-full max-w-lg rounded-3xl border bg-background p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold">Invitación no disponible</h1>

          <p className="mt-3 text-muted-foreground">
            Esta invitación no existe, ya fue utilizada o expiró.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background"
          >
            Ir al login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <section className="mx-auto w-full max-w-xl rounded-3xl border bg-background p-6 shadow-sm">
        <div className="text-center">
          {(negocio as any).logo_url && (
            <img
              src={(negocio as any).logo_url}
              alt={(negocio as any).nombre}
              className="mx-auto h-20 w-20 rounded-3xl border object-cover"
            />
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            Te invitaron a AgendaMe
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            {(negocio as any).nombre}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Vas a tener acceso al dashboard de{" "}
            <strong>{(sucursal as any).nombre}</strong> como{" "}
            <strong>{rolLabel((invitacion as any).rol)}</strong>.
          </p>
        </div>

        <AceptarInvitacionForm
          token={token}
          email={(invitacion as any).email}
        />
      </section>
    </main>
  );
}