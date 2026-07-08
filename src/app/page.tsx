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
  MessageSquareText,
  Quote,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Store,
  Users,
} from "lucide-react";
import { SiteNavbar } from "@/components/landing/site-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { RubrosMarquee } from "@/components/landing/rubros-marquee";
import { AntesDespues } from "@/components/landing/antes-despues";
import { SectionWave } from "@/components/landing/section-wave";
import { ContactWhatsappForm } from "@/components/landing/contact-whatsapp-form";
import { Reveal } from "@/components/landing/reveal";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { SiteFooter } from "@/components/landing/site-footer";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/landing/social-icons";
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
  [
    "B",
    "Dueno de barberia",
    "Antes perdia turnos por WhatsApp todo el tiempo. Desde que uso AgendaMe mis clientes reservan solos y llego al local con la agenda del dia ya ordenada.",
  ],
  [
    "V",
    "Encargada de veterinaria",
    "Mis clientes reservan las consultas desde el celular sin escribirme a cada rato. Se lo recomiendo a cualquier veterinaria que todavia use WhatsApp como agenda.",
  ],
  [
    "E",
    "Responsable de estetica",
    "Puedo ver cuantas citas tengo en el mes de un vistazo y organizar los servicios segun su duracion. Cambio por completo como manejo el dia a dia del local.",
  ],
  [
    "P",
    "Profesional independiente",
    "Organizo servicios, horarios y clientes desde un solo panel. Deje de depender de cuadernos y mensajes sueltos para llevar mi agenda.",
  ],
] as const;

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
      <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">{title}</h2>
      {children ? <p className="mt-5 text-lg leading-8 text-muted-foreground">{children}</p> : null}
    </Reveal>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: typeof CalendarCheck2; title: string; text: string }) {
  return (
    <article className="group relative h-full overflow-hidden rounded-3xl border bg-card p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:scale-[1.03] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/15 hover:z-10 dark:shadow-black/20">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-none transition-all duration-300 ease-[var(--ease-out)] group-hover:rotate-12 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30">
        <Icon className="h-5 w-5 transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-110" />
      </div>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}

function NichoCard({ icon: Icon, title, problema, beneficio }: { icon: typeof Scissors; title: string; problema: string; beneficio: string }) {
  return (
    <article className="group relative h-full overflow-hidden rounded-3xl border bg-[linear-gradient(160deg,var(--card),color-mix(in_srgb,var(--primary)_4%,var(--card)))] p-5 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/15 hover:z-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 ease-[var(--ease-out)] group-hover:rotate-12 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30">
        <Icon className="h-5 w-5 transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-110" />
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

      <section id="funciones" className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="pointer-events-none absolute -left-32 top-1/3 -z-10 h-72 w-72 rounded-full bg-chart-3/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
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

      <section className="relative overflow-hidden bg-[#0B1120] px-4 pb-20 text-slate-300 sm:px-6">
        <div className="text-background">
          <SectionWave flip />
        </div>
        <div className="ag-bg-dots pointer-events-none absolute inset-0 -z-10 opacity-[0.06]" />

        <div className="relative mx-auto max-w-7xl pt-8">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-cyan-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
              Confianza y seguridad
            </span>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-balance text-white sm:text-6xl">Un panel preparado para operar de verdad</h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {confianza.map((item, index) => (
              <Reveal key={item} delay={(index % 3) * 90}>
                <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white shadow-sm backdrop-blur transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 transition-all duration-300 ease-[var(--ease-out)] group-hover:scale-110 group-hover:bg-cyan-400/20">
                    <LockKeyhole className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="relative mt-16 text-background">
          <SectionWave />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Casos de uso" title="Casos donde AgendaMe puede ayudarte" />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {casosDeUso.map(([title, text], index) => {
              const accent = ["bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-primary", "bg-chart-2"][index];

              return (
                <Reveal key={title} delay={(index % 3) * 90}>
                  <article className="group h-full overflow-hidden rounded-3xl border bg-card shadow-sm ring-1 ring-foreground/5 transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
                    <div className={`h-1.5 w-full transition-all duration-300 group-hover:h-2.5 ${accent}`} />
                    <div className="p-6">
                      <h3 className="text-xl font-bold">{title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="testimonios" className="bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Testimonios" title="Asi usan AgendaMe distintos negocios">
            Ejemplos de como negocios como el tuyo ordenaron su agenda con AgendaMe.
          </SectionHeader>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {comentarios.map(([inicial, rol, texto], index) => (
              <Reveal key={rol} delay={(index % 4) * 90}>
                <article className="group h-full rounded-3xl border bg-card p-6 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 ease-[var(--ease-out)] hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--ring))] text-base font-bold text-white shadow-sm shadow-primary/30 ring-4 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
                      {inicial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{rol}</p>
                      <div className="mt-0.5 flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star key={starIndex} className="h-3 w-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <Quote className="mt-4 h-5 w-5 text-primary/40" />
                  <p className="mt-2 text-base leading-7 text-foreground/90">{texto}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="ag-bg-dots-soft absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto max-w-4xl">
          <SectionHeader eyebrow="FAQ" title="Preguntas frecuentes">
            Toca una pregunta para ver la respuesta.
          </SectionHeader>
          <Reveal className="mt-10">
            <FaqAccordion items={faq} />
          </Reveal>

          <Reveal delay={120} className="mt-8 flex justify-center">
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-6 py-5 text-center shadow-sm ring-1 ring-foreground/5 sm:flex-row sm:gap-5">
              <p className="text-sm text-muted-foreground">No encontras lo que buscas?</p>
              <a
                href="#contacto"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <MessageSquareText className="h-4 w-4" />
                Contactanos directamente
              </a>
            </div>
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
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] border bg-[linear-gradient(160deg,var(--foreground),color-mix(in_srgb,var(--foreground)_85%,var(--primary)))] p-7 text-background">
                <div className="ag-bg-dots pointer-events-none absolute inset-0 opacity-[0.08]" />

                <div className="relative">
                  <p className="text-sm font-semibold text-background/70">Atencion directa</p>
                  <h3 className="mt-2 text-2xl font-bold">Te respondemos por WhatsApp</h3>
                  <p className="mt-3 text-sm leading-6 text-background/75">
                    Contanos tu negocio y coordinamos el alta o resolvemos tus dudas sobre planes y funciones.
                  </p>

                  <a
                    href={`https://wa.me/${whatsappNumero}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 text-sm font-bold text-white shadow-lg shadow-whatsapp/30 transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    {whatsappVisible}
                  </a>

                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-background/60">Seguinos</p>
                    <div className="mt-3 flex gap-3">
                      <a
                        href="https://www.instagram.com/alandev_py/"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Instagram"
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-background/20 bg-background/10 transition hover:-translate-y-0.5 hover:bg-background/20"
                      >
                        <InstagramIcon className="h-5 w-5" />
                      </a>
                      <a
                        href="https://www.facebook.com/profile.php?id=61590114310700&locale=es_LA"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Facebook"
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-background/20 bg-background/10 transition hover:-translate-y-0.5 hover:bg-background/20"
                      >
                        <FacebookIcon className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href="https://solvatech.com.py/"
                  target="_blank"
                  rel="noreferrer"
                  className="relative mt-8 inline-flex items-center gap-1.5 border-t border-background/15 pt-5 text-xs text-background/60 transition hover:text-background"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Sitio desarrollado por SolvaTech
                </a>
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
              <a href="#contacto" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 text-sm font-bold text-white shadow-md shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]">
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
