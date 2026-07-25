import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import type { PlanPublico } from "@/lib/planes/planes-shared";
import { Reveal } from "@/components/landing/reveal";
import { HeroShape } from "@/components/landing/hero-shape";
import { WhatsAppIcon } from "@/components/landing/social-icons";
import dashboardPreview from "../../../public/marketing/dashboard-preview.png";
import reservaPreview from "../../../public/marketing/reserva-preview.png";

function gratisBadge(planes: PlanPublico[]) {
  const gratis = planes.find((plan) => plan.clave === "gratis");
  const limite = gratis?.limite_citas_mensuales;

  if (!limite) return "Probá AgendaMe gratis";

  return `Gratis hasta ${limite.toLocaleString("es-PY")} citas al mes`;
}

function DashboardMockup() {
  return (
    <div className="ag-animate-float relative overflow-hidden rounded-[2rem] border bg-card p-2.5 shadow-2xl shadow-slate-950/20 ring-1 ring-foreground/5 dark:shadow-cyan-950/25">
      <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-chart-4/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
        <span className="ml-3 text-[11px] font-medium text-muted-foreground">app.agendame.com.py/dashboard</span>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border bg-background">
        <Image
          src={dashboardPreview}
          alt="Panel de AgendaMe mostrando el calendario de citas de un negocio"
          className="h-auto w-full"
          placeholder="blur"
          priority
        />
      </div>
    </div>
  );
}

function MobileBookingMockup() {
  return (
    <div className="ag-animate-float-delayed absolute -bottom-6 -right-2 w-28 rounded-[1.5rem] border-4 border-foreground/90 bg-card p-1.5 shadow-2xl shadow-cyan-950/25 ring-1 ring-foreground/5 sm:w-32 lg:-bottom-10 lg:-right-6 lg:w-48 lg:rounded-[2.25rem] lg:p-2 xl:w-56 2xl:-bottom-14 2xl:-right-10 2xl:w-64 dark:border-foreground/70">
      <div className="relative aspect-9/19 overflow-hidden rounded-[1.6rem] bg-background">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3.5 pt-2 text-[10px] font-semibold text-foreground">
          <span>09:41</span>
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-foreground/70" />
            <span className="h-1 w-1 rounded-full bg-foreground/70" />
            <span className="h-1 w-1 rounded-full bg-foreground/70" />
          </span>
        </div>

        <div className="absolute inset-x-0 top-5 overflow-hidden">
          <Image
            src={reservaPreview}
            alt="Pantalla de reserva pública mostrando la elección de servicio"
            className="h-auto w-full"
            placeholder="blur"
          />
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ planes }: { planes: PlanPublico[] }) {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:min-h-[calc(100dvh-4.5rem)] lg:py-8 2xl:py-12">
      <div className="absolute inset-x-0 top-0 z-0 h-[42rem] bg-[radial-gradient(circle_at_12%_18%,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_32rem)]" />
      <div className="ag-bg-dots absolute inset-x-0 top-0 z-0 h-[42rem] opacity-60" />
      <HeroShape />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 2xl:max-w-[100rem] 2xl:grid-cols-[0.82fr_1.18fr] 2xl:gap-20">
        <div>
          <Reveal>
            <div className="flex flex-wrap gap-2">
              {[gratisBadge(planes), "Sin tarjeta requerida", "Para negocios con turnos y citas"].map((badge) => (
                <span key={badge} className="rounded-full border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
                  {badge}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-balance sm:mt-5 sm:text-5xl lg:text-6xl 2xl:mt-7 2xl:text-[4.75rem] 2xl:leading-[1.05]">
              Reservas, citas y clientes{" "}
              <span className="bg-[linear-gradient(120deg,var(--primary),var(--ring))] bg-clip-text text-transparent">
                organizados
              </span>{" "}
              en un solo lugar
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-4 2xl:mt-6 2xl:text-lg 2xl:leading-8">
              AgendaMe te ayuda a recibir reservas online, gestionar turnos, clientes, empleados, servicios y recordatorios desde un panel simple y profesional.
            </p>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-3 hidden max-w-xl text-sm leading-6 text-muted-foreground/80 2xl:block">
              Creado para negocios de Paraguay que necesitan ordenar su agenda, reducir mensajes manuales y dar una mejor experiencia a sus clientes.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row 2xl:mt-8">
              <Link href="/auth/registro" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/35 2xl:h-12">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/planes" className="inline-flex h-11 items-center justify-center rounded-xl border bg-card px-6 text-sm font-semibold shadow-sm transition-[background-color,color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md 2xl:h-12">
                Ver planes
              </Link>
              <a
                href="#contacto"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp px-5 text-sm font-semibold text-white shadow-lg shadow-whatsapp/25 transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)] 2xl:h-12"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-4 hidden items-center gap-4 text-sm text-muted-foreground sm:flex 2xl:mt-8">
              <BriefcaseBusiness className="h-5 w-5 shrink-0 text-primary" />
              <span>Para barberías, veterinarias, clínicas, estética, spa y profesionales.</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative mt-8 pb-6 sm:mt-10 lg:mt-0 lg:pb-10 2xl:pb-16">
          <DashboardMockup />
          <MobileBookingMockup />

          <div className="ag-animate-float absolute -left-4 top-6 hidden -rotate-6 items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 shadow-xl shadow-slate-950/10 2xl:flex" style={{ animationDelay: "0.6s" }}>
            <span className="flex h-2 w-2 rounded-full bg-chart-4" />
            <span className="text-xs font-bold">Panel siempre al día</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

