import { CheckCircle2, MessageSquareOff, XCircle } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";

const antes = [
  "Mensajes sueltos en WhatsApp",
  "Turnos que se olvidan o se pisan",
  "Doble reserva en el mismo horario",
  "Poca visibilidad de lo que pasa en el mes",
];

const despues = [
  "Reservas organizadas en un panel",
  "Clientes registrados con su historial",
  "Agenda clara por dia y por empleado",
  "Seguimiento del movimiento mensual",
];

export function AntesDespues() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-primary">De mensajes sueltos a agenda profesional</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Pasa de WhatsApp desordenado a una agenda profesional
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-[2rem] border border-destructive/20 bg-destructive/5 p-7">
              <div className="flex items-center gap-2.5">
                <MessageSquareOff className="h-5 w-5 text-destructive" />
                <p className="text-lg font-bold">Antes</p>
              </div>
              <div className="mt-5 space-y-3">
                {antes.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="h-full rounded-[2rem] border border-primary/25 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--primary)_8%,var(--card)),var(--card))] p-7 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-lg font-bold">Con AgendaMe</p>
              </div>
              <div className="mt-5 space-y-3">
                {despues.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm font-medium">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
