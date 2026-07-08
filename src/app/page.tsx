import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileText,
  Globe,
  LockKeyhole,
  MessageCircle,
  MessageSquareText,
  Quote,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Store,
  Users,
} from "lucide-react";
import { SiteNavbar } from "@/components/landing/site-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { RubrosMarquee } from "@/components/landing/rubros-marquee";
import { AntesDespues } from "@/components/landing/antes-despues";
import { ContactWhatsappForm } from "@/components/landing/contact-whatsapp-form";
import { Reveal } from "@/components/landing/reveal";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { PlanesPublicosSection } from "@/components/planes/planes-publicos-section";
import { getPlanesPublicos } from "@/lib/planes/planes-publicos";
import { getWhatsappNumber } from "@/lib/contact/whatsapp";

export const revalidate = 60;

const pasos = [
  "Crea tu cuenta y configura tu negocio",
  "Comparte tu enlace de reservas",
  "Recibi citas y gestiona todo desde el panel",
];

const funciones = [
  [CalendarCheck2, "Agenda online", "Organiza turnos por fecha, horario, servicio y profesional."],
  [Clock3, "Citas y reservas", "Revisa solicitudes, estados y proximos turnos desde un solo panel."],
  [Users, "Clientes", "Centraliza datos de clientes y su historial de reservas."],
  [Store, "Servicios", "Configura servicios, duracion, precios de referencia e imagenes."],
  [BriefcaseBusiness, "Empleados", "Gestiona equipo, disponibilidad y asignaciones."],
  [MessageSquareText, "Recordatorios", "Prepara comunicaciones para reducir olvidos y ausencias."],
  [BarChart3, "Reportes", "Visualiza movimiento mensual, citas e ingresos estimados."],
  [ShieldCheck, "Planes y limites", "Controla capacidad y crecimiento por plan contratado."],
  [Building2, "Sucursales", "Suma ubicaciones a medida que tu negocio crece."],
  [FileText, "Exportacion", "Descarga datos de citas y clientes para analizarlos."],
  [Globe, "Pagina publica de reservas", "Un enlace propio para que tus clientes reserven solos."],
  [LockKeyhole, "Panel administrativo", "Acceso por roles para vos y tu equipo."],
] as const;

const nichos = [
  [Scissors, "Barberias", "Turnos que se pisan y clientes que esperan sin saber cuanto.", "Agenda diaria clara por profesional, sin dobles reservas."],
  [Stethoscope, "Veterinarias", "Controles y revisiones que se mezclan en la misma agenda.", "Reservas organizadas por horario y seguimiento de cada mascota."],
  [Building2, "Clinicas", "Varios profesionales, una sola agenda dificil de coordinar.", "Cada profesional con su disponibilidad y sus propios turnos."],
  [FileText, "Consultorios", "Seguimiento de pacientes disperso entre planillas y mensajes.", "Historial simple de citas y datos de contacto en un panel."],
  [Sparkles, "Estetica", "Servicios de distinta duracion dificiles de encajar en el dia.", "Disponibilidad real segun la duracion de cada servicio."],
  [BadgeCheck, "Spa", "Paquetes y experiencias que se reservan por telefono.", "Reservas online con horarios y disponibilidad siempre al dia."],
  [Scissors, "Peluquerias", "Estilistas con agendas separadas y clientes confundidos.", "Turnos visibles por estilista, sin cruces de horario."],
  [Users, "Profesionales independientes", "Todo el trabajo de agenda cae en vos, a mano.", "Una agenda digital propia para trabajar con mas orden."],
] as const;

const confianza = [
  "Datos organizados",
  "Acceso por roles",
  "Limites claros por plan",
  "Panel administrativo",
  "Diseno responsive",
  "Pensado para negocios de Paraguay",
];

const casosDeUso = [
  ["Barberia con agenda llena", "Ordena turnos por profesional y reduce conversaciones repetidas por WhatsApp."],
  ["Veterinaria con revisiones y controles", "Centraliza citas, clientes y seguimiento de cada mascota por horario."],
  ["Estetica con servicios por horario", "Muestra disponibilidad real y organiza servicios segun su duracion."],
  ["Clinica con varios profesionales", "Coordina agenda de varios profesionales sin cruzar horarios."],
  ["Consultorio con seguimiento de pacientes", "Lleva un historial simple de citas y datos de contacto."],
  ["Spa con paquetes y servicios", "Ordena paquetes, duracion y disponibilidad por dia."],
] as const;

const comentarios = [
  "Quiero dejar de perder turnos por WhatsApp",
  "Necesito que mis clientes reserven desde el celular",
  "Quiero saber cuantas citas tengo cada mes",
  "Necesito organizar servicios, empleados y horarios",
];

const faq = [
  ["Puedo empezar gratis?", "Si. Podes crear tu cuenta y probar AgendaMe con el plan gratis disponible."],
  ["Necesito tarjeta para registrarme?", "No. La cuenta gratis no requiere tarjeta para empezar."],
  ["Puedo cambiar de plan despues?", "Si. Desde el panel podes revisar planes y solicitar el cambio cuando tu negocio crezca."],
  ["Puedo usar AgendaMe para barberia, veterinaria o estetica?", "Si. AgendaMe esta pensado para negocios que trabajan con turnos y citas."],
  ["Los clientes pueden reservar desde el celular?", "Si. El enlace publico de reservas funciona desde celular, tablet o computadora."],
  ["Que pasa si llego al limite de citas?", "El panel te muestra tu uso actual y te ayuda a evaluar el siguiente plan disponible."],
  ["Puedo pedir adaptaciones a medida?", "Si. Las funcionalidades a medida se evaluan segun la necesidad del negocio."],
  ["Los precios se actualizan automaticamente?", "Si. Las secciones de planes leen la informacion publica actualizada desde Supabase."],
  ["AgendaMe funciona desde el celular?", "Si. El panel administrativo es responsive y se puede usar desde el celular."],
  ["Puedo usarlo con varios empleados?", "Si. Cada plan define cuantos empleados activos podes tener en tu equipo."],
] as const;

function SectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{title}</h2>
      {children ? <p className="mt-4 text-lg text-muted-foreground">{children}</p> : null}
    </Reveal>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: typeof CalendarCheck2; title: string; text: string }) {
  return (
    <article className="group relative h-full overflow-hidden rounded-3xl border bg-card p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 dark:shadow-black/20">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}

function NichoCard({ icon: Icon, title, problema, beneficio }: { icon: typeof Scissors; title: string; problema: string; beneficio: string }) {
  return (
    <article className="group relative h-full overflow-hidden rounded-3xl border bg-[linear-gradient(160deg,var(--card),color-mix(in_srgb,var(--primary)_4%,var(--card)))] p-5 shadow-sm ring-1 ring-foreground/5 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">El problema</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{problema}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary/70">Con AgendaMe</p>
      <p className="mt-1 text-sm font-medium leading-6">{beneficio}</p>
    </article>
  );
}

export default async function HomePage() {
  const planes = await getPlanesPublicos();
  const planNames = planes.map((plan) => plan.nombre);
  const whatsappNumero = getWhatsappNumber();
  const whatsappVisible = whatsappNumero.replace(/^595/, "0").replace(/(\d{4})(\d{6})/, "$1 $2");

  return (
    <main className="min-h-screen overflow-x-clip bg-background">
      <SiteNavbar />
      <HeroSection planes={planes} />
      <RubrosMarquee />

      <section id="como-funciona" className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="ag-bg-dots-soft absolute inset-0 -z-10 opacity-50" />
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Como funciona" title="Tu agenda online en tres pasos" />
          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-[linear-gradient(90deg,transparent,var(--border)_15%,var(--border)_85%,transparent)] md:block" />
            {pasos.map((paso, index) => (
              <Reveal key={paso} delay={index * 120}>
                <article className="group relative h-full rounded-3xl border bg-card p-6 shadow-sm ring-1 ring-foreground/5 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-md shadow-primary/30">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{paso}</h3>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Beneficios" title="Pensado para el negocio y para el cliente" />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {[
              ["Para el negocio", ["Mas organizacion", "Menos mensajes manuales", "Mejor control de clientes", "Seguimiento del movimiento mensual"], ShieldCheck],
              ["Para los clientes", ["Reservan mas rapido", "Ven servicios disponibles", "Reciben confirmacion", "Menos olvidos con recordatorios"], CheckCircle2],
            ].map(([title, items, HeaderIcon], index) => (
              <Reveal key={String(title)} delay={index * 120}>
                <article className="h-full rounded-[2rem] border bg-card p-7 shadow-sm ring-1 ring-foreground/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {(() => {
                        const Icon = HeaderIcon as typeof ShieldCheck;
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                    <h3 className="text-2xl font-bold">{String(title)}</h3>
                  </div>
                  <div className="mt-6 grid gap-3">
                    {(items as string[]).map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="funciones" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Funciones" title="Todo lo que tu operacion necesita">
            Modulos claros para organizar reservas, clientes, equipo, servicios y crecimiento.
          </SectionHeader>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {funciones.map(([Icon, title, text], index) => (
              <Reveal key={title} delay={(index % 4) * 80}>
                <FeatureCard icon={Icon} title={title} text={text} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="nichos" className="relative overflow-hidden bg-muted/40 px-4 py-20 sm:px-6">
        <div className="ag-bg-dots absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Nichos" title="Pensado para negocios que trabajan con turnos" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {nichos.map(([Icon, title, problema, beneficio], index) => (
              <Reveal key={title} delay={(index % 4) * 80}>
                <NichoCard icon={Icon} title={title} problema={problema} beneficio={beneficio} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <AntesDespues />
      <PlanesPublicosSection planes={planes} />

      <section className="bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Confianza y seguridad" title="Un panel preparado para operar de verdad" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {confianza.map((item, index) => (
              <Reveal key={item} delay={(index % 3) * 90}>
                <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-primary" />
                  {item}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Casos de uso" title="Casos donde AgendaMe puede ayudarte" />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {casosDeUso.map(([title, text], index) => (
              <Reveal key={title} delay={(index % 3) * 90}>
                <article className="h-full rounded-3xl border bg-card p-6 shadow-sm ring-1 ring-foreground/5 transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/10">
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonios" className="bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Antes de empezar" title="Lo que escuchamos de negocios que quieren ordenar su agenda">
            Situaciones frecuentes que nos cuentan negocios reales, presentadas como ejemplos, no como resenas.
          </SectionHeader>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {comentarios.map((texto, index) => (
              <Reveal key={texto} delay={(index % 4) * 90}>
                <article className="h-full rounded-3xl border bg-card p-6 shadow-sm ring-1 ring-foreground/5">
                  <Quote className="h-5 w-5 text-primary/60" />
                  <p className="mt-4 text-base font-medium leading-7">{texto}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <SectionHeader eyebrow="FAQ" title="Preguntas frecuentes" />
          <Reveal className="mt-10 divide-y rounded-[2rem] border bg-card px-6 shadow-sm ring-1 ring-foreground/5">
            {faq.map(([question, answer]) => (
              <div key={question} className="py-5">
                <h3 className="font-bold">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section id="contacto" className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="ag-bg-blobs-soft absolute inset-0 -z-10" />
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Contacto" title="Hablemos de tu negocio">
            Contanos tu rubro y el plan que te interesa. Se abre WhatsApp con el mensaje listo.
          </SectionHeader>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <Reveal>
              <div className="flex h-full flex-col justify-between rounded-[2rem] border bg-[linear-gradient(160deg,var(--foreground),color-mix(in_srgb,var(--foreground)_85%,var(--primary)))] p-7 text-background">
                <div>
                  <p className="text-sm font-semibold text-background/70">Atencion directa</p>
                  <h3 className="mt-2 text-2xl font-bold">Te respondemos por WhatsApp</h3>
                  <p className="mt-3 text-sm leading-6 text-background/75">
                    Contanos tu negocio y coordinamos el alta o resolvemos tus dudas sobre planes y funciones.
                  </p>

                  <a
                    href={`https://wa.me/${whatsappNumero}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-5 text-sm font-bold text-white shadow-lg shadow-[var(--whatsapp)]/30 transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {whatsappVisible}
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap gap-4 border-t border-background/15 pt-5 text-sm text-background/75">
                  <a href="https://www.instagram.com/alandev_py/" target="_blank" rel="noreferrer" className="transition hover:text-background">
                    Instagram
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=61590114310700&locale=es_LA" target="_blank" rel="noreferrer" className="transition hover:text-background">
                    Facebook
                  </a>
                  <a href="https://solvatech.com.py/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-background">
                    <Globe className="h-3.5 w-3.5" />
                    SolvaTech
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <ContactWhatsappForm planes={planNames.length ? planNames : ["Gratis", "Basico", "Profesional", "Empresarial"]} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <Reveal className="relative mx-auto overflow-hidden rounded-[2rem] border bg-[linear-gradient(135deg,var(--primary),var(--ring))] p-8 text-primary-foreground shadow-2xl shadow-primary/20 lg:max-w-7xl lg:p-12">
          <div className="ag-bg-dots pointer-events-none absolute inset-0 opacity-10" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Empeza a organizar tu negocio con AgendaMe</h2>
              <p className="mt-4 max-w-2xl text-primary-foreground/85">
                Proba gratis hasta 20 citas al mes y pasa de mensajes desordenados a una agenda profesional.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/auth/registro" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg">
                Crear cuenta gratis
              </Link>
              <Link href="/planes" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
                Ver planes
              </Link>
              <a href="#contacto" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-5 text-sm font-bold text-white shadow-md shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]">
                <MessageCircle className="h-4 w-4" />
                Hablar por WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative overflow-hidden border-t border-white/10 bg-[#0B1120] px-4 py-14 text-slate-300 sm:px-6">
        <div className="ag-bg-blobs-soft absolute inset-0 -z-10 opacity-40" />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div>
              <AgendaMeLogo theme="dark" size="lg" />
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                Reservas, citas y clientes organizados en un solo lugar para negocios de Paraguay.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Producto</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link href="#como-funciona" className="transition hover:text-white">Como funciona</Link>
                <Link href="#funciones" className="transition hover:text-white">Funciones</Link>
                <Link href="#nichos" className="transition hover:text-white">Nichos</Link>
                <Link href="/planes" className="transition hover:text-white">Planes</Link>
                <Link href="#faq" className="transition hover:text-white">FAQ</Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Cuenta</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <Link href="#contacto" className="transition hover:text-white">Contacto</Link>
                <Link href="/auth/login" className="transition hover:text-white">Iniciar sesion</Link>
                <Link href="/auth/registro" className="transition hover:text-white">Crear cuenta</Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Redes y contacto</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a href={`https://wa.me/${whatsappNumero}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-white">
                  <MessageCircle className="h-4 w-4 text-[var(--whatsapp)]" />
                  {whatsappVisible}
                </a>
                <a href="https://www.instagram.com/alandev_py/" target="_blank" rel="noreferrer" className="transition hover:text-white">
                  Instagram
                </a>
                <a href="https://www.facebook.com/profile.php?id=61590114310700&locale=es_LA" target="_blank" rel="noreferrer" className="transition hover:text-white">
                  Facebook
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row">
            <p>
              © 2026 AgendaMe. Desarrollado por{" "}
              <a
                href="https://solvatech.com.py/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-white transition hover:text-primary"
              >
                SolvaTech
                <Globe className="h-3.5 w-3.5" />
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
