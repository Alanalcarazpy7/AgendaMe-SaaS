import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquareOff, XCircle } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

const antes = [
  "Mensajes sueltos en WhatsApp",
  "Turnos que se olvidan o se pisan",
  "Doble reserva en el mismo horario",
  "Poca visibilidad de lo que pasa en el mes",
  "Clientes que preguntan disponibilidad uno por uno",
  "Datos de clientes dispersos entre chats y papeles",
];

const despues = [
  "Reservas organizadas en un panel",
  "Clientes registrados con su historial",
  "Agenda clara por dia y por empleado",
  "Seguimiento del movimiento mensual",
  "Clientes reservan solos desde su celular",
  "Datos de clientes centralizados en un solo lugar",
];

export function AntesDespues() {
  return (
    <section className="relative overflow-hidden bg-[#0B1120] px-4 py-24 text-slate-300 sm:px-6">
      <div className="ag-bg-dots pointer-events-none absolute inset-0 -z-10 opacity-[0.06]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 -z-10 h-72 w-72 rounded-full bg-destructive/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-5 py-2 text-sm font-bold uppercase tracking-wider text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            De mensajes sueltos a agenda profesional
          </span>
          <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-balance text-white sm:text-6xl">
            Pasa de WhatsApp desordenado a una agenda profesional
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            El mismo negocio, dos formas muy distintas de llevar la agenda del dia a dia.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[2rem] border border-destructive/25 bg-white/4 p-7 shadow-lg shadow-black/20 backdrop-blur sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                  <MessageSquareOff className="h-4 w-4" />
                </span>
                <p className="text-lg font-bold text-white">Antes</p>
              </div>
              <div className="mt-6 space-y-3.5">
                {antes.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/80" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="h-full rounded-[2rem] border border-cyan-400/25 bg-white/4 p-7 shadow-lg shadow-black/20 backdrop-blur sm:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <p className="text-lg font-bold text-white">Con AgendaMe</p>
              </div>
              <div className="mt-6 space-y-3.5">
                {despues.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm font-medium text-white">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="mt-10 flex justify-center">
          <Link
            href="/auth/registro"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/35"
          >
            Empeza a ordenar tu agenda hoy
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
