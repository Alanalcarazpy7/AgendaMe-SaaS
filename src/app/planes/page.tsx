import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { PlanesPublicosSection } from "@/components/planes/planes-publicos-section";
import { PlanComparisonTable } from "@/components/planes/plan-comparison-table";
import { getPlanesPublicos } from "@/lib/planes/planes-publicos";

export const revalidate = 60;

const faq = [
  ["Puedo empezar gratis?", "Si. Podes crear una cuenta y probar AgendaMe con el plan gratis disponible."],
  ["Puedo cambiar de plan despues?", "Si. Desde el dashboard podes revisar el uso y solicitar un cambio de plan."],
  ["Los precios vienen de Supabase?", "Si. Esta pagina lee los planes publicos desde la vista oficial configurada en Supabase."],
  ["Puedo pedir funcionalidades a medida?", "Si. Las funcionalidades a medida se evaluan segun la necesidad del negocio."],
];

export default async function PlanesPage() {
  const planes = await getPlanesPublicos();

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/88 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:bg-background/82">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="AgendaMe">
            <AgendaMeLogo size="lg" />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/#como-funciona" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Como funciona</Link>
            <Link href="/#funciones" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Funciones</Link>
            <Link href="/#nichos" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Nichos</Link>
            <Link href="/planes" className="text-sm font-semibold text-primary">Planes</Link>
            <Link href="/#contacto" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Contacto</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden h-10 items-center justify-center rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-accent hover:text-accent-foreground sm:inline-flex">
              Iniciar sesion
            </Link>
            <Link href="/auth/registro" className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90">
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
        <div className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_30rem),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--ring)_18%,transparent),transparent_28rem)]" />
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="mt-10 max-w-4xl">
            <p className="text-sm font-semibold text-primary">Planes de AgendaMe</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
              Empeza gratis y elegi el plan cuando tu agenda crezca
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Compara limites, funciones y precios actualizados desde Supabase. El plan Profesional se destaca automaticamente cuando esta marcado como recomendado.
            </p>
          </div>
        </div>
      </section>

      <PlanesPublicosSection planes={planes} />

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border bg-card p-5 shadow-sm ring-1 ring-foreground/5 dark:shadow-black/20">
            <h2 className="text-2xl font-bold">Comparativa completa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisa en detalle que incluye cada plan antes de elegir.
            </p>

            <div className="mt-6">
              <PlanComparisonTable planes={planes} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Preguntas sobre planes</h2>
          </div>

          <div className="mt-10 divide-y rounded-[2rem] border bg-card px-6 shadow-sm ring-1 ring-foreground/5">
            {faq.map(([question, answer]) => (
              <div key={question} className="py-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-bold">{question}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto rounded-[2rem] border bg-[linear-gradient(135deg,var(--primary),var(--ring))] p-8 text-primary-foreground shadow-2xl shadow-primary/20 lg:max-w-7xl lg:p-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Proba AgendaMe con el plan gratis</h2>
              <p className="mt-4 max-w-2xl text-primary-foreground/82">Crea tu cuenta, configura tu negocio y solicita un plan pago cuando necesites mas capacidad.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/auth/registro" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-slate-950">Crear cuenta gratis</Link>
              <Link href="/#contacto" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-5 text-sm font-bold text-white">Hablar por WhatsApp</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
