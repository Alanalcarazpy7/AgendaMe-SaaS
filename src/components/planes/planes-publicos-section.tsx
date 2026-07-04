import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

type PlanPublico = {
  clave: string;
  nombre: string;
  descripcion: string;
  precio: string;
  destacado?: boolean;
  etiqueta?: string;
  features: string[];
};

const planes: PlanPublico[] = [
  {
    clave: "gratis",
    nombre: "Gratis",
    descripcion: "Ideal para probar AgendaMe y empezar a ordenar tus turnos.",
    precio: "Gs. 0",
    features: [
      "Reservas online básicas",
      "Clientes limitados",
      "Servicios limitados",
      "Empleados limitados",
      "Link público de reservas",
    ],
  },
  {
    clave: "basico",
    nombre: "Básico",
    descripcion: "Para negocios que ya quieren usar AgendaMe de forma diaria.",
    precio: "Desde Gs. 49.000",
    destacado: true,
    etiqueta: "Recomendado",
    features: [
      "Más citas mensuales",
      "Más clientes activos",
      "Reportes básicos",
      "Logo y banner del negocio",
      "Servicios con imágenes",
      "Soporte por WhatsApp",
    ],
  },
  {
    clave: "profesional",
    nombre: "Profesional",
    descripcion: "Para negocios con más movimiento, equipo y necesidad de análisis.",
    precio: "Desde Gs. 99.000",
    etiqueta: "Premium",
    features: [
      "Reportes avanzados",
      "Más empleados",
      "Más servicios",
      "Recordatorios y mejoras futuras",
      "Exportación de datos futura",
      "Funciones premium",
    ],
  },
  {
    clave: "empresarial",
    nombre: "Empresarial",
    descripcion: "Para negocios grandes o con necesidades especiales.",
    precio: "A medida",
    features: [
      "Límites personalizados",
      "Múltiples sucursales futuras",
      "Soporte prioritario",
      "Configuración asistida",
      "Funciones avanzadas",
      "Atención personalizada",
    ],
  },
];

function whatsappHref(planNombre: string) {
  const numero = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "";
  const mensaje = encodeURIComponent(
    `Hola, quiero más información sobre el Plan ${planNombre} de AgendaMe.`
  );

  if (!numero) return "/auth/register";

  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${mensaje}`;
}

export function PlanesPublicosSection() {
  return (
    <section id="planes" className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm">
            <Crown className="mr-2 h-4 w-4 text-yellow-600" />
            Planes para cada etapa de tu negocio
          </div>

          <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Empezá gratis y mejorá cuando tu negocio crezca
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            AgendaMe te permite gestionar reservas, clientes, empleados,
            servicios, horarios y reportes según el plan que elijas.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {planes.map((plan) => (
            <article
              key={plan.clave}
              className={`relative rounded-3xl border bg-background p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                plan.destacado ? "border-yellow-300 ring-2 ring-yellow-100" : ""
              }`}
            >
              {plan.etiqueta && (
                <div className="absolute right-5 top-5 inline-flex items-center rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                  {plan.destacado ? (
                    <Star className="mr-1 h-3 w-3" />
                  ) : (
                    <Sparkles className="mr-1 h-3 w-3" />
                  )}
                  {plan.etiqueta}
                </div>
              )}

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                {plan.clave === "gratis" ? (
                  <Zap className="h-6 w-6" />
                ) : (
                  <Crown className="h-6 w-6 text-yellow-600" />
                )}
              </div>

              <h3 className="mt-5 text-2xl font-bold">{plan.nombre}</h3>

              <p className="mt-2 min-h-[72px] text-sm text-muted-foreground">
                {plan.descripcion}
              </p>

              <p className="mt-5 text-3xl font-bold">{plan.precio}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.clave === "empresarial" ? "Consultá disponibilidad" : "/ mes"}
              </p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                {plan.clave === "gratis" ? (
                  <Link
                    href="/auth/register"
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted"
                  >
                    Comenzar gratis
                  </Link>
                ) : (
                  <a
                    href={whatsappHref(plan.nombre)}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                      plan.destacado
                        ? "bg-foreground text-background hover:opacity-90"
                        : "border hover:bg-muted"
                    }`}
                  >
                    Solicitar plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}