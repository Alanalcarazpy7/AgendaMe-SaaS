import Link from "next/link";
import { Lock } from "lucide-react";

export default function SinPermisoPage() {
  return (
    <section className="rounded-3xl border bg-background p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <Lock className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        No tenés permiso para ver esta sección
      </h1>

      <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
        Tu usuario tiene acceso limitado a una sucursal o a ciertos módulos del negocio.
      </p>

      <div className="mt-7">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}