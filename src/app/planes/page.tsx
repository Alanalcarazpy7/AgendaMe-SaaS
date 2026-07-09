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
  ["¿Puedo empezar gratis?", "Sí. Podés crear una cuenta y probar AgendaMe con el plan gratis disponible."],
  ["¿Puedo cambiar de plan después?", "Sí. Desde el dashboard podés revisar tu uso y solicitar un cambio de plan."],
  ["¿Los precios se actualizan automáticamente?", "Sí. Los precios, límites y funciones de cada plan siempre están al día en esta página."],
  ["¿Qué significa el plan anual?", "Pagás 10 meses y usás el servicio los 12 meses del año, según el ahorro de cada plan."],
  ["¿Qué pasa si necesito más capacidad que el plan Empresarial?", "Las funcionalidades a medida se evalúan según la necesidad puntual del negocio."],
  ["¿Puedo solicitar un plan por WhatsApp?", "Sí. Cada card tiene un botón que arma el mensaje con el plan y período elegidos."],
] as const;

function AccentWord({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[linear-gradient(120deg,var(--primary),var(--ring))] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export default async function PlanesPage() {
  const planes = await getPlanesPublicos();
  const whatsappNumero = getWhatsappNumber();

  return (
    <main className="min-h-screen overflow-x-clip bg-background">
      <SiteNavbar />

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:py-20">
        <div className="ag-bg-blobs absolute inset-x-0 top-0 -z-20 h-[34rem]" />
        <div className="ag-bg-dots absolute inset-x-0 top-0 -z-10 h-[34rem] opacity-50" />

        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Planes de AgendaMe
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-7 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
              Un plan para cada <AccentWord>etapa</AccentWord> de tu negocio
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Límites, funciones y precios siempre actualizados. El plan Profesional se destaca automáticamente cuando está marcado como recomendado.
            </p>
          </Reveal>
        </div>
      </section>

      <PlanesPublicosSection planes={planes} />

      <section className="relative overflow-hidden bg-[#0B1120] px-4 py-20 text-slate-300 sm:px-6">
        <div className="ag-bg-dots pointer-events-none absolute inset-0 -z-10 opacity-[0.06]" />
        <div className="pointer-events-none absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-5 py-2 text-sm font-bold uppercase tracking-wider text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Comparativa
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-balance text-white sm:text-6xl">
              Compara cada plan en <AccentWord>detalle</AccentWord>
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Revisá qué incluye cada plan antes de elegir.
            </p>
          </Reveal>

          <Reveal delay={100} className="mt-12">
            <div className="rounded-[2rem] border border-white/10 bg-white/4 p-5 text-foreground shadow-2xl shadow-black/30 backdrop-blur sm:p-7">
              <PlanComparisonTable planes={planes} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-muted/40 px-4 py-20 sm:px-6">
        <div className="ag-bg-dots-soft absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto max-w-4xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              FAQ
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
              Preguntas sobre <AccentWord>planes</AccentWord>
            </h2>
          </Reveal>

          <Reveal delay={100} className="mt-10">
            <FaqAccordion items={faq} />
          </Reveal>

          <Reveal delay={200} className="mt-8 flex justify-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 text-center shadow-sm ring-1 ring-foreground/5 sm:flex-row sm:gap-5">
              <p className="text-sm text-muted-foreground">¿No encontrás lo que buscás?</p>
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

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--primary),var(--ring))] px-4 py-20 text-primary-foreground sm:px-6">
        <div className="ag-bg-dots pointer-events-none absolute inset-0 opacity-10" />
        <Reveal className="relative mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">Probá AgendaMe con el plan gratis</h2>
            <p className="mt-4 max-w-2xl text-lg text-primary-foreground/85">
              Creá tu cuenta, configurá tu negocio y solicitá un plan pago cuando necesites más capacidad.
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
        </Reveal>
      </section>

      <SiteFooter />
    </main>
  );
}
