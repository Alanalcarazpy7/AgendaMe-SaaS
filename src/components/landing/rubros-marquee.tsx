import {
  BadgeCheck,
  Building2,
  FileText,
  Scissors,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

const rubros = [
  [Scissors, "Barberias"],
  [Stethoscope, "Veterinarias"],
  [Building2, "Clinicas"],
  [FileText, "Consultorios"],
  [Sparkles, "Estetica"],
  [BadgeCheck, "Spa"],
  [Scissors, "Peluquerias"],
  [Users, "Profesionales independientes"],
] as const;

export function RubrosMarquee() {
  const items = [...rubros, ...rubros];

  return (
    <section className="border-y bg-muted/40 py-8">
      <p className="mx-auto mb-5 max-w-7xl px-4 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
        Ejemplos de negocios que pueden usar AgendaMe
      </p>

      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="ag-marquee-track gap-3">
          {items.map(([Icon, label], index) => (
            <div
              key={`${label}-${index}`}
              className="flex shrink-0 items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-sm"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
