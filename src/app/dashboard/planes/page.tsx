import { redirect } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Crown,
  FileDown,
  MessageSquareText,
  Store,
} from "lucide-react";
import { SolicitarPlanButton } from "@/components/planes/solicitar-plan-button";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { nivelPlan } from "@/lib/planes/plan-access";

type Relacion<T> = T | T[] | null;

type PlanRaw = {
  id: string;
  clave: string;
  nombre: string;
  precio_gs: number | string | null;
  limite_citas_mensuales: number | null;
  limite_clientes: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  permite_reportes_avanzados: boolean | null;
  permite_exportacion_csv: boolean | null;
  permite_personalizacion: boolean | null;
  permite_multiples_sucursales: boolean | null;
};

type SuscripcionRaw = {
  plan_id: string | null;
  planes_saas: Relacion<PlanRaw>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function formatGs(valor: number | string | null) {
  const numero = Number(valor ?? 0);
  if (!numero) return "Gs. 0";
  return `Gs. ${numero.toLocaleString("es-PY")}`;
}

function limite(valor: number | null) {
  return valor === null ? "Ilimitado" : valor.toString();
}

function PlanFeature({
  activo,
  texto,
}: {
  activo: boolean;
  texto: string;
}) {
  return (
    <div className="flex gap-2 text-sm">
      <CheckCircle2
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          activo ? "text-green-600" : "text-muted-foreground"
        }`}
      />
      <span className={activo ? "" : "text-muted-foreground"}>{texto}</span>
    </div>
  );
}

function PremiumCard({
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
    <div className={`rounded-3xl border p-5 shadow-sm ${activo ? "bg-background" : "bg-muted/30"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-700">
          <Icon className="h-5 w-5" />
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          activo ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
        }`}>
          {activo ? "Activo" : `Desde ${desde}`}
        </span>
      </div>

      <h3 className="mt-4 font-bold">{titulo}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
    </div>
  );
}

function parteFechaAsuncion(tipo: Intl.DateTimeFormatPartTypes) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Asuncion",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  return parts.find((part) => part.type === tipo)?.value ?? "";
}

export default async function DashboardPlanesPage() {
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const supabase = createServiceRoleClient();

  const { data: membresia, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select("negocio_id")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  if (membresiaError || !membresia) {
    redirect("/onboarding/negocio");
  }

  const anio = Number(parteFechaAsuncion("year"));
  const mes = Number(parteFechaAsuncion("month"));

  const [
    { data: negocio },
    { data: suscripcionData },
    { data: planes },
    { data: usoMensual },
    { count: clientesCount },
    { count: empleadosCount },
    { count: serviciosCount },
  ] = await Promise.all([
    supabase.from("negocios").select("id, nombre").eq("id", membresia.negocio_id).maybeSingle(),

    supabase
      .from("suscripciones")
      .select(
        `
        plan_id,
        planes_saas (
          id,
          clave,
          nombre,
          precio_gs,
          limite_citas_mensuales,
          limite_clientes,
          limite_empleados,
          limite_servicios,
          permite_reportes_avanzados,
          permite_exportacion_csv,
          permite_personalizacion,
          permite_multiples_sucursales
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("planes_saas")
      .select(
        `
        id,
        clave,
        nombre,
        precio_gs,
        limite_citas_mensuales,
        limite_clientes,
        limite_empleados,
        limite_servicios,
        permite_reportes_avanzados,
        permite_exportacion_csv,
        permite_personalizacion,
        permite_multiples_sucursales
      `
      )
      .order("orden", { ascending: true }),

    supabase
      .from("uso_plan_mensual")
      .select("citas_creadas")
      .eq("negocio_id", membresia.negocio_id)
      .eq("anio", anio)
      .eq("mes", mes)
      .maybeSingle(),

    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo"),

    supabase
      .from("empleados")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo"),

    supabase
      .from("servicios")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo"),
  ]);

  if (!negocio) {
    redirect("/onboarding/negocio");
  }

  const suscripcion = suscripcionData as SuscripcionRaw | null;
  const planActual = obtenerObjeto(suscripcion?.planes_saas ?? null);
  const planActualClave = planActual?.clave ?? "gratis";
  const nivelActual = nivelPlan(planActualClave);

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
              Negocio: {negocio.nombre}
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/30 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan actual
            </p>
            <p className="mt-1 text-xl font-bold">{planActual?.nombre ?? "Gratis"}</p>
            <p className="text-sm text-muted-foreground">
              {formatGs(planActual?.precio_gs ?? 0)} / mes
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Citas del mes</p>
          <p className="mt-2 text-3xl font-bold">{Number(usoMensual?.citas_creadas ?? 0)}</p>
        </div>

        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Clientes activos</p>
          <p className="mt-2 text-3xl font-bold">{clientesCount ?? 0}</p>
        </div>

        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Empleados activos</p>
          <p className="mt-2 text-3xl font-bold">{empleadosCount ?? 0}</p>
        </div>

        <div className="rounded-3xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Servicios activos</p>
          <p className="mt-2 text-3xl font-bold">{serviciosCount ?? 0}</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Planes disponibles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elegí el plan que mejor se adapte al crecimiento de tu negocio.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-4">
          {((planes ?? []) as PlanRaw[]).map((plan) => {
            const actual = plan.clave === planActualClave;
            const recomendado = plan.clave === "basico";

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
                  <Crown className="h-6 w-6 text-yellow-600" />
                </div>

                <h3 className="mt-5 text-2xl font-bold">{plan.nombre}</h3>
                <p className="mt-4 text-3xl font-bold">{formatGs(plan.precio_gs)}</p>
                <p className="text-sm text-muted-foreground">/ mes</p>

                <div className="mt-5 space-y-3">
                  <PlanFeature activo texto={`${limite(plan.limite_citas_mensuales)} citas mensuales`} />
                  <PlanFeature activo texto={`${limite(plan.limite_clientes)} clientes activos`} />
                  <PlanFeature activo texto={`${limite(plan.limite_empleados)} empleados activos`} />
                  <PlanFeature activo texto={`${limite(plan.limite_servicios)} servicios activos`} />
                  <PlanFeature activo={nivelPlan(plan.clave) >= 1} texto="Reportes básicos" />
                  <PlanFeature activo={!!plan.permite_reportes_avanzados} texto="Reportes avanzados" />
                  <PlanFeature activo={!!plan.permite_exportacion_csv} texto="Exportar CSV" />
                  <PlanFeature activo={!!plan.permite_multiples_sucursales} texto="Múltiples sucursales" />
                </div>

                <div className="mt-6">
                  <SolicitarPlanButton planClave={plan.clave} planActual={actual} />
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
          <PremiumCard
            titulo="Reportes básicos"
            descripcion="Ingresos, citas por estado y servicios más reservados."
            desde="Básico"
            activo={nivelActual >= 1}
            icon={BarChart3}
          />

          <PremiumCard
            titulo="Exportar CSV"
            descripcion="Descargar reportes y datos para análisis externo."
            desde="Profesional"
            activo={nivelActual >= 2}
            icon={FileDown}
          />

          <PremiumCard
            titulo="Recordatorios"
            descripcion="Reducir ausencias enviando recordatorios al cliente."
            desde="Profesional"
            activo={nivelActual >= 2}
            icon={MessageSquareText}
          />

          <PremiumCard
            titulo="Sucursales"
            descripcion="Gestión para negocios con más de una ubicación."
            desde="Empresarial"
            activo={nivelActual >= 3}
            icon={Store}
          />
        </div>
      </section>
    </div>
  );
}