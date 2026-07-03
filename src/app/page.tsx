import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          AgendaMe SaaS
        </p>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Turnos y citas online para negocios en Paraguay
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          AgendaMe ayuda a odontólogos, peluquerías, barberías, veterinarias,
          estéticas y profesionales a gestionar reservas de forma simple.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/registro"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Crear cuenta
          </Link>

          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-md border bg-background px-8 text-sm font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground"
          >
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}
