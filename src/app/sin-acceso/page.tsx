import Link from "next/link";

type PageProps = {
  searchParams?: Promise<{
    motivo?: string;
  }>;
};

function mensajePorMotivo(motivo?: string) {
  if (motivo === "plan_required") {
    return "Tu acceso pertenece a una sucursal, pero el negocio no está actualmente en Plan Empresarial.";
  }

  if (motivo === "inactive_branch") {
    return "La sucursal asignada a tu usuario está inactiva.";
  }

  if (motivo === "inactive_business") {
    return "El negocio está inactivo o bloqueado.";
  }

  return "Tu usuario no tiene un acceso activo al dashboard.";
}

export default async function SinAccesoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const motivo = params.motivo;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border bg-background p-8 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">AgendaMe</p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Sin acceso al dashboard
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          {mensajePorMotivo(motivo)}
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Ir al login
          </Link>

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition hover:bg-muted"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Si recibiste una invitación, asegurate de abrir el link y crear tu contraseña antes de iniciar sesión.
        </p>
      </section>
    </main>
  );
}