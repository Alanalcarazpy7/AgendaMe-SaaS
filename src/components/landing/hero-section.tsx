import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Home,
  MessageSquareText,
  Scissors,
  Settings,
  Store,
  Users,
} from "lucide-react";
import type { PlanPublico } from "@/lib/planes/planes-shared";
import { Reveal } from "@/components/landing/reveal";

function gratisBadge(planes: PlanPublico[]) {
  const gratis = planes.find((plan) => plan.clave === "gratis");
  const limite = gratis?.limite_citas_mensuales;

  if (!limite) return "Proba AgendaMe gratis";

  return `Gratis hasta ${limite.toLocaleString("es-PY")} citas al mes`;
}

const sidebarIcons = [Home, CalendarCheck2, Users, Store, Settings];

function DashboardMockup() {
  return (
    <div className="ag-animate-float relative rounded-[2rem] border bg-card p-2.5 shadow-2xl shadow-slate-950/20 ring-1 ring-foreground/5 dark:shadow-cyan-950/25">
      <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-chart-4/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
        <span className="ml-3 text-[11px] font-medium text-muted-foreground">app.agendame.com.py/dashboard</span>
      </div>

      <div className="flex overflow-hidden rounded-[1.5rem] border bg-background">
        <div className="hidden w-14 shrink-0 flex-col items-center gap-4 border-r bg-muted/30 py-5 sm:flex">
          {sidebarIcons.map((Icon, index) => (
            <div
              key={index}
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                index === 0 ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scissors className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Barberia Central</p>
                <p className="text-sm font-bold">Agenda de hoy</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-chart-4/10 px-3 py-1 text-xs font-semibold text-chart-4">
              <span className="h-1.5 w-1.5 rounded-full bg-chart-4" />
              En vivo
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              ["Citas hoy", "18"],
              ["Recordatorios", "7"],
              ["Clientes", "246"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border bg-card p-3 shadow-sm">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="mt-1.5 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border bg-card p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-sm font-semibold">Proximos turnos</p>
                <CalendarCheck2 className="h-3.5 w-3.5 text-primary" />
              </div>
              {[
                ["09:00", "Corte y barba", true],
                ["10:30", "Coloracion", false],
                ["14:00", "Afeitado clasico", true],
              ].map(([hora, servicio, confirmado]) => (
                <div key={String(hora)} className="flex items-center gap-2.5 border-t py-2 first:border-t-0 first:pt-0">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{String(hora)}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{String(servicio)}</span>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${confirmado ? "bg-chart-4" : "bg-chart-2"}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border bg-card p-3.5">
                <p className="text-sm font-semibold">Progreso semanal</p>
                <div className="mt-2.5 space-y-2">
                  {[76, 58, 88].map((value, index) => (
                    <div key={value}>
                      <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>Sem {index + 1}</span>
                        <span>{value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-[linear-gradient(135deg,var(--primary),var(--ring))] p-3.5 text-primary-foreground">
                <p className="text-[11px] text-primary-foreground/80">Plan actual</p>
                <p className="text-sm font-bold">Profesional</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileBookingMockup() {
  const steps = [
    [CheckCircle2, "Elegir servicio", "Corte y barba"],
    [Users, "Elegir profesional", "Cualquiera disponible"],
    [Clock3, "Elegir horario", "Hoy, 15:30"],
  ] as const;

  return (
    <div className="ag-animate-float-delayed absolute -bottom-12 right-2 hidden w-60 rounded-[2.75rem] border-4 border-foreground/90 bg-card p-2 shadow-2xl shadow-cyan-950/25 ring-1 ring-foreground/5 lg:block dark:border-foreground/70">
      <div className="relative overflow-hidden rounded-[2rem] bg-background">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-2.5 text-[10px] font-semibold text-foreground">
          <span>09:41</span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-foreground/70" />
          </span>
        </div>

        <div className="px-4 pb-5 pt-8">
          <p className="text-[11px] font-medium text-muted-foreground">Reserva publica</p>
          <p className="mt-0.5 text-base font-bold">Elegi tu turno</p>

          <div className="mt-4 space-y-2.5">
            {steps.map(([Icon, label, detail]) => (
              <div key={label} className="rounded-2xl border bg-card p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/30">
            <MessageSquareText className="h-3.5 w-3.5" />
            Confirmar reserva
          </button>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ planes }: { planes: PlanPublico[] }) {
  return (
    <section className="relative overflow-hidden px-4 pb-28 pt-16 sm:px-6 lg:pb-36 lg:pt-24">
      <div className="ag-bg-blobs absolute inset-x-0 top-0 -z-20 h-[42rem]" />
      <div className="ag-bg-dots absolute inset-x-0 top-0 -z-10 h-[42rem] opacity-60" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
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
            <h1 className="mt-7 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl lg:text-[4.5rem] lg:leading-[1.05]">
              Reservas, citas y clientes{" "}
              <span className="bg-[linear-gradient(120deg,var(--primary),var(--ring))] bg-clip-text text-transparent">
                organizados
              </span>{" "}
              en un solo lugar
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              AgendaMe te ayuda a recibir reservas online, gestionar turnos, clientes, empleados, servicios y recordatorios desde un panel simple y profesional.
            </p>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground/80">
              Creado para negocios de Paraguay que necesitan ordenar su agenda, reducir mensajes manuales y dar una mejor experiencia a sus clientes.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/registro" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/35">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/planes" className="inline-flex h-12 items-center justify-center rounded-xl border bg-card px-6 text-sm font-semibold shadow-sm transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md">
                Ver planes
              </Link>
              <a
                href="#contacto"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--whatsapp)] px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--whatsapp)]/25 transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--whatsapp)_88%,black)]"
              >
                <MessageSquareText className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </Reveal>

          <Reveal delay={340}>
            <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground">
              <BriefcaseBusiness className="h-5 w-5 shrink-0 text-primary" />
              <span>Para barberias, veterinarias, clinicas, estetica, spa y profesionales.</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative pb-16">
          <DashboardMockup />
          <MobileBookingMockup />
        </Reveal>
      </div>
    </section>
  );
}
