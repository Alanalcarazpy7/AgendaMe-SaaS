import type { Metadata } from "next";
import {
  BadgeCheck,
  Ban,
  ClipboardList,
  Gauge,
  Landmark,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Scale,
  ScrollText,
  UserCircle,
  Wifi,
} from "lucide-react";
import { SiteNavbar } from "@/components/landing/site-navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { LegalToc } from "@/components/legal/legal-toc";
import { getWhatsappNumber } from "@/lib/contact/whatsapp";

export const metadata: Metadata = {
  title: "Términos de Servicio | AgendaMe",
  description: "Términos y condiciones de uso de AgendaMe, la plataforma de reservas y citas para negocios de Paraguay.",
};

export const revalidate = 3600;

function AccentWord({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[linear-gradient(120deg,var(--primary),var(--ring))] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

const resumen = [
  "Podés empezar gratis, sin tarjeta de crédito.",
  "Vos sos responsable de tener el consentimiento de tus propios clientes.",
  "No garantizamos disponibilidad 100% ininterrumpida.",
  "Podés cancelar tu cuenta cuando quieras.",
];

const secciones = [
  {
    id: "aceptacion",
    icon: ScrollText,
    titulo: "Aceptación de estos términos",
    parrafos: [
      "Al crear una cuenta o usar AgendaMe, vos (como titular del negocio) aceptás estos Términos de Servicio. Si no estás de acuerdo, no debés usar la plataforma.",
      "Estos términos aplican al negocio que se registra en AgendaMe y a las personas que ese negocio autoriza a usar el sistema (gerentes, recepcionistas y empleados con acceso).",
    ],
  },
  {
    id: "que-es",
    icon: LayoutGrid,
    titulo: "Qué es AgendaMe",
    parrafos: [
      "AgendaMe es una plataforma que le permite a un negocio administrar su agenda de citas, servicios, empleados, clientes y sucursales, y ofrecer a sus propios clientes un link público para reservar turnos en línea.",
      "AgendaMe no es una agencia de tu negocio ni interviene en las citas, los pagos que cobrés por tus servicios o la relación con tus clientes: es una herramienta de gestión.",
    ],
  },
  {
    id: "cuenta",
    icon: UserCircle,
    titulo: "Tu cuenta",
    parrafos: [
      "Sos responsable de la información que cargás al crear tu cuenta y de mantener tu contraseña segura. Si detectás un uso no autorizado de tu cuenta, avisanos lo antes posible.",
      "Cada negocio administra sus propios accesos: quién puede ver clientes, gestionar citas, ver reportes o exportar información. Es tu responsabilidad otorgar accesos solo a personas de confianza dentro de tu equipo.",
    ],
  },
  {
    id: "datos-clientes",
    icon: ClipboardList,
    titulo: "Datos de tus clientes",
    parrafos: [
      "Cuando cargás datos de tus propios clientes (nombre, teléfono, historial de citas), sos responsable de contar con su consentimiento para guardarlos y contactarlos. AgendaMe solo almacena esa información para que puedas gestionar tu agenda.",
      "No uses AgendaMe para cargar datos de personas que no sean clientes reales de tu negocio, ni para fines distintos a la gestión de reservas.",
    ],
  },
  {
    id: "planes",
    icon: Gauge,
    titulo: "Planes y límites de uso",
    parrafos: [
      "AgendaMe ofrece distintos planes con límites de citas, clientes, empleados y sucursales según lo publicado en la página de planes. El plan gratuito tiene un límite mensual de citas.",
      "Si tu negocio necesita más capacidad, podés solicitar un cambio de plan desde el dashboard o por WhatsApp. La coordinación de pagos por planes superiores al gratuito se realiza directamente con nuestro equipo, fuera de la plataforma.",
    ],
  },
  {
    id: "disponibilidad",
    icon: Wifi,
    titulo: "Disponibilidad del servicio",
    parrafos: [
      "Trabajamos para que AgendaMe esté disponible de forma continua, pero no podemos garantizar un funcionamiento ininterrumpido al 100%. Puede haber mantenimientos programados o interrupciones fuera de nuestro control.",
      "Te recomendamos no depender exclusivamente de AgendaMe para comunicaciones urgentes con tus clientes; el link de WhatsApp que genera la plataforma para recordatorios es un apoyo, no un sistema de mensajería garantizado.",
    ],
  },
  {
    id: "uso-aceptable",
    icon: Ban,
    titulo: "Uso aceptable",
    parrafos: [
      "No está permitido usar AgendaMe para actividades ilegales, enviar spam, intentar acceder a datos de otros negocios, sobrecargar el sistema con solicitudes automatizadas, ni realizar ingeniería inversa de la plataforma.",
      "Nos reservamos el derecho de suspender cuentas que incumplan estas reglas o que pongan en riesgo la seguridad de otros negocios que usan AgendaMe.",
    ],
  },
  {
    id: "cancelacion",
    icon: LogOut,
    titulo: "Cancelación de cuenta",
    parrafos: [
      "Podés dejar de usar AgendaMe cuando quieras. Si querés que eliminemos los datos de tu negocio de forma definitiva, escribinos por WhatsApp y procesamos la solicitud.",
      "Podemos suspender o cerrar una cuenta que incumpla estos términos, avisando previamente salvo en casos de riesgo de seguridad.",
    ],
  },
  {
    id: "responsabilidad",
    icon: Scale,
    titulo: "Límite de responsabilidad",
    parrafos: [
      "AgendaMe es una herramienta de gestión. No somos responsables por decisiones comerciales de tu negocio, por la calidad de los servicios que vos ofrecés a tus clientes, ni por pérdidas derivadas de una interrupción temporal del servicio.",
    ],
  },
  {
    id: "cambios",
    icon: RefreshCw,
    titulo: "Cambios a estos términos",
    parrafos: [
      "Podemos actualizar estos términos para reflejar cambios en la plataforma. Si el cambio es significativo, lo vamos a comunicar dentro del dashboard o por el medio de contacto que tengamos registrado.",
    ],
  },
  {
    id: "ley",
    icon: Landmark,
    titulo: "Ley aplicable",
    parrafos: [
      "Estos términos se rigen por las leyes de la República del Paraguay. Cualquier controversia se resolverá según la jurisdicción paraguaya correspondiente.",
    ],
  },
];

export default function TerminosPage() {
  const whatsappNumero = getWhatsappNumber();
  const whatsappVisible = whatsappNumero.replace(/^595/, "0").replace(/(\d{4})(\d{6})/, "$1 $2");

  return (
    <main className="min-h-screen overflow-x-clip bg-background">
      <SiteNavbar />

      <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:px-6 sm:pt-20">
        <div className="ag-bg-dots-soft pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <div className="pointer-events-none absolute -right-24 top-10 -z-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary shadow-sm">
            <ScrollText className="h-4 w-4" />
            Legal
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Términos de <AccentWord>Servicio</AccentWord>
          </h1>
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Última actualización: 24 de julio de 2026
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <LegalToc items={secciones.map((seccion) => ({ id: seccion.id, titulo: seccion.titulo }))} />

          <div className="min-w-0 space-y-5">
            <div className="rounded-[1.75rem] border border-primary/15 bg-primary/[0.04] p-6 sm:p-7">
              <p className="flex items-center gap-2 text-sm font-bold text-primary">
                <BadgeCheck className="h-4 w-4" />
                En resumen
              </p>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {resumen.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-6 text-foreground/85">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {secciones.map((seccion, index) => {
              const Icon = seccion.icon;

              return (
                <div
                  key={seccion.id}
                  id={seccion.id}
                  className="scroll-mt-28 rounded-[1.75rem] border bg-card p-6 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10 sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight">{seccion.titulo}</h2>
                      <div className="mt-3 space-y-3">
                        {seccion.parrafos.map((parrafo, i) => (
                          <p key={i} className="text-sm leading-6 text-muted-foreground">
                            {parrafo}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="rounded-[1.75rem] border bg-[linear-gradient(135deg,var(--primary),var(--ring))] p-6 text-primary-foreground shadow-lg shadow-primary/20 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <MessageSquareText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Contacto</h2>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/90">
                    ¿Tenés dudas sobre estos términos? Escribinos por WhatsApp.
                  </p>
                  <a
                    href={`https://wa.me/${whatsappNumero}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {whatsappVisible}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
