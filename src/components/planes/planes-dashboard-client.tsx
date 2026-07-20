"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CheckCircle2,
  Crown,
  FileDown,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nivelPlan } from "@/lib/planes/plan-access";
import {
  formatLimit,
  formatPlanPrice,
  getAhorroAnualLabel,
  getAhorroAnualMontoLabel,
  type PlanPublico,
} from "@/lib/planes/planes-shared";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";

export type PlanDashboardItem = PlanPublico;

type PlanesDashboardClientProps = {
  negocioNombre: string;
  planActualClave: string;
  planActualNombre: string;
  planActual: PlanPublico | null;
  uso: {
    citas: number;
    clientes: number;
    empleados: number;
    servicios: number;
  };
  planes: PlanDashboardItem[];
};

function descripcionPlan(clave: string) {
  const descripciones: Record<string, string> = {
    gratis: "Para probar AgendaMe y empezar con una agenda básica.",
    basico: "Para negocios que ya quieren usar reportes y más capacidad.",
    profesional: "Para negocios con más equipo, análisis y funciones premium.",
    empresarial: "Para negocios grandes o con necesidades especiales.",
  };

  return descripciones[clave] ?? "Plan para gestionar tu negocio con AgendaMe.";
}

function featuresPlan(plan: PlanDashboardItem) {
  const features = [
    formatLimit(plan.limite_citas_mensuales, "cita mensual", "citas mensuales"),
    formatLimit(plan.limite_clientes, "cliente activo", "clientes activos"),
    formatLimit(plan.limite_empleados, "empleado activo", "empleados activos"),
    formatLimit(plan.limite_servicios, "servicio activo", "servicios activos"),
  ];

  if (nivelPlan(plan.clave) >= 1) {
    features.push("Reportes básicos");
  }

  if (plan.permite_personalizacion) {
    features.push("Logo, banner e imágenes de servicios");
  }

  if (plan.permite_reportes_avanzados) {
    features.push("Reportes avanzados");
  }

  if (plan.permite_exportacion_csv) {
    features.push("Exportación XLSX / CSV");
  }

  if (plan.permite_multiples_sucursales) {
    features.push(formatLimit(plan.limite_sucursales, "sucursal", "sucursales"));
  }

  return features;
}

function PremiumFeature({
  titulo,
  descripcion,
  desde,
  activo,
  icon: Icon,
}: {
  titulo: string;
  descripcion: string;
  desde: string;
  activo: boolean;
  icon: typeof Crown;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        activo ? "bg-background" : "bg-muted/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
          <Icon className="h-5 w-5" />
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            activo
              ? "bg-green-50 text-green-700"
              : "bg-yellow-50 text-yellow-700"
          }`}
        >
          {activo ? "Activo" : `Desde ${desde}`}
        </span>
      </div>

      <h3 className="mt-4 font-bold">{titulo}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
    </div>
  );
}

export function PlanesDashboardClient({
  negocioNombre,
  planActualClave,
  planActualNombre,
  planActual,
  uso,
  planes,
}: PlanesDashboardClientProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const nivelActual = nivelPlan(planActualClave);

  async function solicitarPlan(plan: PlanDashboardItem) {
    try {
      setLoadingPlan(plan.clave);
      setMessage("");
      setError("");

      const response = await fetch("/api/dashboard/planes/solicitudes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planClave: plan.clave,
          mensaje: `Solicitud desde panel interno para ${negocioNombre}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error ?? "No se pudo solicitar el plan.";
        setError(message);
        toast.error("No se pudo solicitar el plan", { description: message });
        return;
      }

      setMessage("Solicitud registrada. También podés continuar por WhatsApp.");
      toast.success("Solicitud registrada", {
        description: `${plan.nombre} quedó pendiente de revisión.`,
      });

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("No se pudo solicitar el plan.");
      toast.error("No se pudo solicitar el plan");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Planes y suscripción</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Gestioná tu plan
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revisá tu plan actual, límites y funciones premium disponibles.
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/30 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan actual
            </p>
            <p className="mt-1 text-xl font-bold">{planActualNombre}</p>
            {planActual && (
              <p className="text-sm text-muted-foreground">
                {formatPlanPrice(planActual, "mensual")} / mes
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Citas del mes</p>
          <p className="mt-2 text-3xl font-bold">{uso.citas}</p>
        </div>

        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Clientes activos</p>
          <p className="mt-2 text-3xl font-bold">{uso.clientes}</p>
        </div>

        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Empleados activos</p>
          <p className="mt-2 text-3xl font-bold">{uso.empleados}</p>
        </div>

        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Servicios activos</p>
          <p className="mt-2 text-3xl font-bold">{uso.servicios}</p>
        </div>
      </section>

      {message && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Planes disponibles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Elegí el plan que mejor se adapte al crecimiento de tu negocio.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-4">
          {planes.map((plan) => {
            const actual = plan.clave === planActualClave;
            const recomendado = plan.destacado;
            const loading = loadingPlan === plan.clave;
            const ahorroLabel = getAhorroAnualLabel(plan);
            const ahorroMontoLabel = getAhorroAnualMontoLabel(plan);

            return (
              <article
                key={plan.id}
                className={`relative rounded-3xl border bg-background p-5 shadow-sm ${
                  recomendado ? "border-yellow-300 ring-2 ring-yellow-100" : ""
                }`}
              >
                {recomendado && (
                  <span className="absolute right-4 top-4 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    Recomendado
                  </span>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  {plan.clave === "gratis" ? (
                    <Zap className="h-6 w-6" />
                  ) : (
                    <Crown className="h-6 w-6 text-yellow-600" />
                  )}
                </div>

                <h3 className="mt-5 text-2xl font-bold">{plan.nombre}</h3>
                <p className="mt-2 min-h-[64px] text-sm text-muted-foreground">
                  {descripcionPlan(plan.clave)}
                </p>

                <p className="mt-4 text-3xl font-bold">
                  {formatPlanPrice(plan, "mensual")}
                </p>
                <p className="text-sm text-muted-foreground">/ mes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPlanPrice(plan, "anual")} / año
                </p>

                {ahorroLabel && (
                  <p className="mt-1 text-xs font-semibold text-green-700">
                    {ahorroLabel} · {ahorroMontoLabel}
                  </p>
                )}

                <div className="mt-5 space-y-3">
                  {featuresPlan(plan).map((feature) => (
                    <div key={feature} className="flex gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  {actual ? (
                    <Button disabled className="w-full">
                      Plan actual
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      variant={nivelPlan(plan.clave) > nivelActual ? "default" : "outline"}
                      disabled={loading}
                      onClick={() => solicitarPlan(plan)}
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : nivelPlan(plan.clave) > nivelActual ? (
                        <Sparkles className="mr-2 h-4 w-4" />
                      ) : (
                        <RefreshCcw className="mr-2 h-4 w-4" />
                      )}
                      {nivelPlan(plan.clave) > nivelActual
                        ? "Solicitar mejora"
                        : "Solicitar cambio"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border bg-background p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <h2 className="text-2xl font-bold">Funciones premium</h2>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Estas funciones se activan según el plan del negocio.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PremiumFeature
            titulo="Reportes básicos"
            descripcion="Ingresos estimados, citas por estado y servicios más reservados."
            desde="Básico"
            activo={nivelActual >= 1}
            icon={BarChart3}
          />

          <PremiumFeature
            titulo="Reportes avanzados"
            descripcion="Comparativas, tendencias, horarios con más demanda y análisis profundo."
            desde="Profesional"
            activo={nivelActual >= 2}
            icon={Sparkles}
          />

          <PremiumFeature
            titulo="Exportar XLSX / CSV"
            descripcion="Descargar reportes y datos para análisis externo."
            desde="Profesional"
            activo={nivelActual >= 2}
            icon={FileDown}
          />

          <PremiumFeature
            titulo="Múltiples sucursales"
            descripcion="Gestión avanzada para negocios con más de una ubicación."
            desde="Empresarial"
            activo={nivelActual >= 3}
            icon={Store}
          />
        </div>
      </section>

      <section className="rounded-3xl border bg-muted/30 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">¿Necesitás ayuda para elegir?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Podés solicitar un cambio de plan y continuar la conversación por WhatsApp.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const url = buildWhatsappUrl(
                `Hola, necesito ayuda para elegir un plan para mi negocio ${negocioNombre}.`
              );
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Consultar
          </Button>
        </div>
      </section>
    </div>
  );
}
