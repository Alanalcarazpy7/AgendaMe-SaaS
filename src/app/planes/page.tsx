import Link from "next/link";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { SiteNavbar } from "@/components/landing/site-navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { Reveal } from "@/components/landing/reveal";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { WhatsAppIcon } from "@/components/landing/social-icons";
import { PlanesPublicosSection } from "@/components/planes/planes-publicos-section";
import { PlanComparisonTable } from "@/components/planes/plan-comparison-table";
import { getPlanesPublicos } from "@/lib/planes/planes-publicos";
import { getWhatsappNumber } from "@/lib/contact/whatsapp";

export const revalidate = 60;

const faq = [
  ["Puedo empezar gratis?", "Si. Podes crear una cuenta y probar AgendaMe con el plan gratis disponible."],
  ["Puedo cambiar de plan despues?", "Si. Desde el dashboard podes revisar tu uso y solicitar un cambio de plan."],
  ["Los precios vienen de Supabase?", "Si. Esta pagina lee los planes publicos desde la vista oficial configurada en Supabase, siempre actualizada."],
  ["Que significa el plan anual?", "Pagas 10 meses y usas el servicio los 12 meses del año, segun el ahorro de cada plan."],
  ["Que pasa si necesito mas capacidad que el plan Empresarial?", "Las funcionalidades a medida se evaluan segun la necesidad puntual del negocio."],
  ["Puedo solicitar un plan por WhatsApp?", "Si. Cada card tiene un boton que arma el mensaje con el plan y periodo elegidos."],
] as const;

export default async function PlanesPage() {
  const planes = await getPlanesPublicos();
  const whatsappNumero = getWhatsappNumber();

  return (
    <main className="min-h-screen overflow-x-clip bg-background">
      <SiteNavbar />

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
        <div className="ag-bg-blobs absolute inset-x-0 top-0 -z-20 h-[34rem]" />
        <div className="ag-bg-dots absolute inset-x-0 top-0 -z-10 h-[34rem] opacity-50" />

        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="mx-auto inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              Planes de AgendaMe
            </div>
          </Reveal>

          <Reveal delay={80} className="mt-8 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Empeza gratis y elegi el plan cuando tu agenda crezca
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Compara limites, funciones y precios actualizados desde Supabase. El plan Profesional se destaca automaticamente cuando esta marcado como recomendado.
            </p>
          </Reveal>
        </div>
      </section>

      <PlanesPublicosSection planes={planes} />

      <section className="relative px-4 pb-20 sm:px-6">
        <Reveal className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border bg-card p-5 shadow-sm ring-1 ring-foreground/5 dark:shadow-black/20 sm:p-7">
            <h2 className="text-2xl font-bold">Comparativa completa</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisa en detalle que incluye cada plan antes de elegir.
            </p>

            <div className="mt-6">
              <PlanComparisonTable planes={planes} />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="relative overflow-hidden bg-muted/40 px-4 py-20 sm:px-6">
        <div className="ag-bg-dots-soft absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto max-w-4xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              FAQ
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">Preguntas sobre planes</h2>
          </Reveal>

          <Reveal delay={100} className="mt-10">
            <FaqAccordion items={faq} />
          </Reveal>

          <Reveal delay={200} className="mt-8 flex justify-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 text-center shadow-sm ring-1 ring-foreground/5 sm:flex-row sm:gap-5">
              <p className="text-sm text-muted-foreground">No encontras lo que buscas?</p>
              <a
                href={`https://wa.me/${whatsappNumero}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 text-sm font-bold text-white shadow-sm shadow-whatsapp/25 transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]"
              >
                <MessageSquareText className="h-4 w-4" />
                Contactanos directamente
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <Reveal className="relative mx-auto overflow-hidden rounded-[2rem] border bg-[linear-gradient(135deg,var(--primary),var(--ring))] p-8 text-primary-foreground shadow-2xl shadow-primary/20 lg:max-w-7xl lg:p-12">
          <div className="ag-bg-dots pointer-events-none absolute inset-0 opacity-10" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Proba AgendaMe con el plan gratis</h2>
              <p className="mt-4 max-w-2xl text-primary-foreground/85">
                Crea tu cuenta, configura tu negocio y solicita un plan pago cuando necesites mas capacidad.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/auth/registro" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a href="/#contacto" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 text-sm font-bold text-white shadow-md shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]">
                <WhatsAppIcon className="h-4 w-4" />
                Hablar por WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
