import Link from "next/link";
import { ArrowRight, Layers3 } from "lucide-react";
import { PlanPricingCards } from "@/components/planes/plan-pricing-cards";
import { Reveal } from "@/components/landing/reveal";
import type { PlanPublico } from "@/lib/planes/planes-shared";

export type PlanesPublicosSectionProps = {
  planes: PlanPublico[];
};

export function PlanesPublicosSection({ planes }: PlanesPublicosSectionProps) {
  return (
    <section id="planes-resumen" className="relative overflow-hidden bg-muted/40 px-4 py-20 sm:px-6">
      <div className="ag-bg-blobs-soft absolute inset-0 -z-10" />

      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm">
            <Layers3 className="mr-2 h-4 w-4 text-primary" />
            Planes para cada etapa de tu negocio
          </div>

          <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Empeza gratis y mejora cuando tu negocio crezca
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            AgendaMe te permite gestionar reservas, clientes, empleados,
            servicios, horarios y reportes segun el plan que elijas.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <PlanPricingCards planes={planes} />
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-10 text-center">
            <Link
              href="/planes"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
            >
              Ver planes completos y comparativa
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
