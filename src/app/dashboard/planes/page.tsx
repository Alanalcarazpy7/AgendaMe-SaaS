import { requireDashboardAccess } from "@/lib/dashboard/access-context";
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
import {
  formatLimit,
  formatPlanPrice,
  getAhorroAnualLabel,
  getAhorroAnualMontoLabel,
  type PlanPublico,
} from "@/lib/planes/planes-shared";

type SuscripcionRaw = {
  plan_id: string | null;
  fecha_vencimiento: string | null;
};

function formatFechaVencimiento(fecha: string | null) {
  if (!fecha) return "Sin vencimiento";

  return new Date(fecha).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Asuncion",
  });
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
    <div className={`rounded-3xl border p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10 ${activo ? "bg-card" : "bg-muted/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          activo ? "bg-chart-4/10 text-chart-4" : "bg-primary/10 text-primary"
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
  const access = await requireDashboardAccess();
  if (!access.puedeGestionarPlanes) {
    redirect("/dashboard/sin-permiso");
  }

  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
    redirect("/sin-acceso?motivo=no_access");
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
      .select("plan_id, fecha_vencimiento")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase.from("vista_planes_publicos").select("*").order("orden", { ascending: true }),

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
    redirect("/sin-acceso?motivo=no_access");
  }

  const suscripcion = suscripcionData as SuscripcionRaw | null;
  const listaPlanes = (planes ?? []) as PlanPublico[];
  const planActual =
    listaPlanes.find((plan) => plan.id === suscripcion?.plan_id) ??
    listaPlanes.find((plan) => plan.clave === "gratis") ??
    null;
  const planActualClave = planActual?.clave ?? "gratis";
  const nivelActual = nivelPlan(planActualClave);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Planes y suscripciÃ³n</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              GestionÃ¡ tu plan
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
            {planActual && (
              <p className="text-sm text-muted-foreground">
                {formatPlanPrice(planActual, "mensual")} / mes
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Vencimiento: {formatFechaVencimiento(suscripcion?.fecha_vencimiento ?? null)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border bg-card p-4 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
          <p className="text-sm text-muted-foreground">Citas del mes</p>
          <p className="mt-2 text-3xl font-bold">{Number(usoMensual?.citas_creadas ?? 0)}</p>
        </div>

        <div className="rounded-3xl border bg-card p-4 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
          <p className="text-sm text-muted-foreground">Clientes activos</p>
          <p className="mt-2 text-3xl font-bold">{clientesCount ?? 0}</p>
        </div>

        <div className="rounded-3xl border bg-card p-4 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
          <p className="text-sm text-muted-foreground">Empleados activos</p>
          <p className="mt-2 text-3xl font-bold">{empleadosCount ?? 0}</p>
        </div>

        <div className="rounded-3xl border bg-card p-4 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
          <p className="text-sm text-muted-foreground">Servicios activos</p>
          <p className="mt-2 text-3xl font-bold">{serviciosCount ?? 0}</p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Planes disponibles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ElegÃ­ el plan que mejor se adapte al crecimiento de tu negocio.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-4">
          {listaPlanes.map((plan) => {
            const actual = plan.clave === planActualClave;
            const ahorroLabel = getAhorroAnualLabel(plan);
            const ahorroMontoLabel = getAhorroAnualMontoLabel(plan);

            return (
              <article
                key={plan.id}
                className={`relative rounded-3xl border bg-card p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10 ${
                  plan.destacado ? "border-primary ring-2 ring-primary/15" : ""
                }`}
              >
                {plan.destacado && (
                  <span className="absolute right-4 top-4 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                    Recomendado
                  </span>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <Crown className="h-6 w-6 text-primary" />
                </div>

                <h3 className="mt-5 text-2xl font-bold">{plan.nombre}</h3>

                <p className="mt-4 text-3xl font-bold">
                  {formatPlanPrice(plan, "mensual")}
                </p>
                <p className="text-sm text-muted-foreground">/ mes</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPlanPrice(plan, "anual")} / aÃ±o
                </p>

                {ahorroLabel && (
                  <p className="mt-1 text-xs font-semibold text-green-700">
                    {ahorroLabel} Â· {ahorroMontoLabel}
                  </p>
                )}

                <div className="mt-5 space-y-3">
                  <PlanFeature
                    activo
                    texto={formatLimit(plan.limite_citas_mensuales, "cita mensual", "citas mensuales")}
                  />
                  <PlanFeature
                    activo
                    texto={formatLimit(plan.limite_clientes, "cliente activo", "clientes activos")}
                  />
                  <PlanFeature
                    activo
                    texto={formatLimit(plan.limite_empleados, "empleado activo", "empleados activos")}
                  />
                  <PlanFeature
                    activo
                    texto={formatLimit(plan.limite_servicios, "servicio activo", "servicios activos")}
                  />
                  <PlanFeature activo={nivelPlan(plan.clave) >= 1} texto="Reportes bÃ¡sicos" />
                  <PlanFeature activo={!!plan.permite_reportes_avanzados} texto="Reportes avanzados" />
                  <PlanFeature activo={!!plan.permite_exportacion_csv} texto="ExportaciÃ³n XLSX / CSV" />
                  <PlanFeature
                    activo={!!plan.permite_multiples_sucursales}
                    texto={formatLimit(plan.limite_sucursales, "sucursal", "sucursales")}
                  />
                </div>

                <div className="mt-6">
                  <SolicitarPlanButton planClave={plan.clave} planActual={actual} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-slate-950/5 ring-1 ring-foreground/5 dark:shadow-black/20 dark:ring-foreground/10">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Funciones premium</h2>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Estas funciones se activan segÃºn el plan del negocio.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <PremiumCard
            titulo="Reportes bÃ¡sicos"
            descripcion="Ingresos, citas por estado y servicios mÃ¡s reservados."
            desde="BÃ¡sico"
            activo={nivelActual >= 1}
            icon={BarChart3}
          />

          <PremiumCard
            titulo="Exportar XLSX / CSV"
            descripcion="Descargar reportes y datos para anÃ¡lisis externo."
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
            descripcion="GestiÃ³n para negocios con mÃ¡s de una ubicaciÃ³n."
            desde="Empresarial"
            activo={nivelActual >= 3}
            icon={Store}
          />
        </div>
      </section>
    </div>
  );
}

