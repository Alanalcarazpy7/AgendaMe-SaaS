import type { Metadata } from "next";
import {
  Baby,
  Building2,
  Clock3,
  Cookie,
  Database,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  ShieldQuestion,
  Share2,
  Target,
  UserCheck,
} from "lucide-react";
import { SiteNavbar } from "@/components/landing/site-navbar";
import { SiteFooter } from "@/components/landing/site-footer";
import { LegalToc } from "@/components/legal/legal-toc";
import { getWhatsappNumber } from "@/lib/contact/whatsapp";

export const metadata: Metadata = {
  title: "Política de Privacidad | AgendaMe",
  description: "Cómo AgendaMe recopila, usa y protege los datos de los negocios y sus clientes en Paraguay.",
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
  "No vendemos ni alquilamos tus datos a nadie.",
  "Los recordatorios de WhatsApp los enviás vos, manualmente.",
  "Podés pedir la eliminación de tus datos cuando quieras.",
  "El acceso dentro de tu negocio está limitado por rol.",
];

const secciones = [
  {
    id: "alcance",
    icon: ShieldQuestion,
    titulo: "Alcance de esta política",
    parrafos: [
      "Esta política explica qué datos recopila AgendaMe, para qué los usa y qué derechos tenés sobre ellos, tanto si sos el titular de un negocio que usa la plataforma como si sos cliente final de uno de esos negocios y reservaste un turno a través de un link de AgendaMe.",
    ],
  },
  {
    id: "datos",
    icon: Database,
    titulo: "Qué datos recopilamos",
    parrafos: [
      "Del negocio que se registra: nombre del negocio, nombre de la persona responsable, correo electrónico, número de teléfono y la información de configuración que cargue (horarios, servicios, empleados, sucursales).",
      "De los clientes finales que reservan un turno: nombre, número de teléfono y, si lo cargan, correo electrónico. Estos datos los carga el negocio o los ingresa el propio cliente al reservar por el link público.",
      "También registramos datos técnicos básicos (como la dirección IP) únicamente para prevenir abuso del sistema de reservas, por ejemplo, evitar que se saturen los turnos con solicitudes automatizadas.",
    ],
  },
  {
    id: "uso",
    icon: Target,
    titulo: "Para qué usamos estos datos",
    parrafos: [
      "Para que el negocio pueda gestionar su agenda: crear, confirmar y organizar citas, administrar clientes y empleados, y generar reportes de su propia actividad.",
      "Para permitir que los clientes finales reserven turnos por el link público de un negocio y reciban la confirmación correspondiente.",
      "No usamos los datos de contacto de los clientes finales para enviarles publicidad de AgendaMe ni los compartimos con otros negocios de la plataforma.",
    ],
  },
  {
    id: "compartimos",
    icon: Share2,
    titulo: "Con quién compartimos los datos",
    parrafos: [
      "No vendemos ni alquilamos datos a terceros. La información se aloja en proveedores de infraestructura en la nube con estándares de seguridad de la industria, que la procesan únicamente para que AgendaMe funcione.",
      "Los recordatorios de citas se arman como un mensaje prellenado de WhatsApp que el propio negocio (o su empleado) decide enviar manualmente desde su teléfono. AgendaMe no envía mensajes automáticos ni accede al contenido de esas conversaciones de WhatsApp.",
    ],
  },
  {
    id: "responsabilidad-negocio",
    icon: Building2,
    titulo: "Responsabilidad del negocio sobre los datos de sus clientes",
    parrafos: [
      "El negocio que usa AgendaMe es responsable de contar con el consentimiento de sus propios clientes para guardar sus datos de contacto y de usarlos únicamente para gestionar la relación comercial con ellos.",
    ],
  },
  {
    id: "seguridad",
    icon: ShieldCheck,
    titulo: "Cómo protegemos la información",
    parrafos: [
      "Las contraseñas se almacenan de forma encriptada y nunca se guardan en texto plano. El acceso a los datos dentro de un negocio está restringido según el rol de cada usuario (administrador, gerente, recepción o personal), de modo que cada persona ve solo lo que le corresponde.",
      "Realizamos copias de seguridad periódicas de la información para reducir el riesgo de pérdida de datos.",
    ],
  },
  {
    id: "conservacion",
    icon: Clock3,
    titulo: "Cuánto tiempo conservamos los datos",
    parrafos: [
      "Conservamos los datos mientras la cuenta del negocio esté activa. Si un negocio cancela su cuenta y solicita la eliminación de sus datos, procesamos ese pedido dentro de un plazo razonable.",
    ],
  },
  {
    id: "derechos",
    icon: UserCheck,
    titulo: "Tus derechos",
    parrafos: [
      "Podés solicitar acceso, corrección o eliminación de tus datos (o de los datos de tu negocio) escribiéndonos por WhatsApp. Si sos cliente final de un negocio que usa AgendaMe y querés que se elimine tu información, también podés pedirlo directamente a ese negocio, que es quien administra tus datos dentro de la plataforma.",
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    titulo: "Cookies y almacenamiento local",
    parrafos: [
      "Usamos almacenamiento local del navegador únicamente para mantener tu sesión iniciada mientras usás el dashboard. No usamos cookies de rastreo publicitario.",
    ],
  },
  {
    id: "menores",
    icon: Baby,
    titulo: "Uso por menores de edad",
    parrafos: [
      "AgendaMe está pensado para ser usado por negocios y sus responsables, no está dirigido a menores de edad como titulares de cuenta.",
    ],
  },
  {
    id: "cambios",
    icon: RefreshCw,
    titulo: "Cambios a esta política",
    parrafos: [
      "Si actualizamos esta política de forma significativa, lo vamos a comunicar dentro del dashboard o por el medio de contacto que tengamos registrado.",
    ],
  },
];

export default function PrivacidadPage() {
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
            <ShieldCheck className="h-4 w-4" />
            Legal
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            Política de <AccentWord>Privacidad</AccentWord>
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
            <div className="rounded-[1.75rem] border border-primary/15 bg-primary/4 p-6 sm:p-7">
              <p className="flex items-center gap-2 text-sm font-bold text-primary">
                <ShieldCheck className="h-4 w-4" />
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
                    ¿Querés ejercer alguno de tus derechos o tenés una consulta sobre tus datos? Escribinos por WhatsApp.
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
