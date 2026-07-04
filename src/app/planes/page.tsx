import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlanesPublicosSection } from "@/components/planes/planes-publicos-section";

export default function PlanesPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            AgendaMe
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/auth/register"
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Link>
      </div>

      <PlanesPublicosSection />
    </main>
  );
}