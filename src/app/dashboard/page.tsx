import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardUsageCard } from "@/components/dashboard/dashboard-usage-card";

type NegocioData = {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
};

type PlanData = {
  nombre: string;
  clave: string;
  precio_gs: number | string | null;
  limite_citas_mensuales: number | null;
  limite_empleados: number | null;
  limite_servicios: number | null;
  limite_clientes: number | null;
};

type CitaPendiente = {
  id: string;
  fecha: string;
  hora_inicio: string;
  created_at: string;
  clientes:
    | {
        nombre_completo: string;
        telefono: string | null;
      }
    | {
        nombre_completo: string;
        telefono: string | null;
      }[]
    | null;
  servicios:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

function obtenerObjeto<T>(valor: T | T[] | null): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

function formatearPrecio(precio: number | string | null) {
  const numero = Number(precio ?? 0);

  if (numero <= 0) return "Gs. 0";

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(numero);
}

const primaryLinkClass =
  "inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90";

const outlineLinkClass =
  "inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membresias, error: membresiaError } = await supabase
    .from("negocio_usuarios")
    .select(
      `
      negocio_id,
      rol,
      negocios (
        id,
        nombre,
        slug,
        estado
      )
    `
    )
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (membresiaError) {
    throw new Error(membresiaError.message);
  }

  const membresia = membresias?.[0];

  if (!membresia) {
    redirect("/onboarding/negocio");
  }

  const negocio = obtenerObjeto(membresia.negocios) as NegocioData | null;

  const now = new Date();
  const anio = now.getFullYear();
  const mes = now.getMonth() + 1;

  const [
    { count: empleadosCount, error: empleadosError },
    { count: serviciosCount, error: serviciosError },
    { count: clientesCount, error: clientesError },
    { data: usoPlan, error: usoPlanError },
    { data: suscripciones, error: suscripcionError },
    { data: citasPendientes, count: pendientesCount, error: pendientesError },
  ] = await Promise.all([
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

    supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activo"),

    supabase
      .from("uso_plan_mensual")
      .select("citas_creadas")
      .eq("negocio_id", membresia.negocio_id)
      .eq("anio", anio)
      .eq("mes", mes)
      .maybeSingle(),

    supabase
      .from("suscripciones")
      .select(
        `
        id,
        estado,
        fecha_vencimiento,
        planes_saas (
          nombre,
          clave,
          precio_gs,
          limite_citas_mensuales,
          limite_empleados,
          limite_servicios,
          limite_clientes
        )
      `
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .limit(1),

    supabase
      .from("citas")
      .select(
        `
        id,
        fecha,
        hora_inicio,
        created_at,
        clientes (
          nombre_completo,
          telefono
        ),
        servicios (
          nombre
        )
      `,
        { count: "exact" }
      )
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (empleadosError) throw new Error(empleadosError.message);
  if (serviciosError) throw new Error(serviciosError.message);
  if (clientesError) throw new Error(clientesError.message);
  if (usoPlanError) throw new Error(usoPlanError.message);
  if (suscripcionError) throw new Error(suscripcionError.message);
  if (pendientesError) throw new Error(pendientesError.message);

  const suscripcion = suscripciones?.[0];
  const plan = obtenerObjeto(suscripcion?.planes_saas ?? null) as PlanData | null;

  const planName = plan?.nombre ?? "Gratis";
  const citasUsadas = Number(usoPlan?.citas_creadas ?? 0);
  const empleadosUsados = empleadosCount ?? 0;
  const serviciosUsados = serviciosCount ?? 0;
  const clientesUsados = clientesCount ?? 0;
  const totalPendientes = pendientesCount ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-muted-foreground">Panel del negocio</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              {negocio?.nombre ?? "Tu negocio"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Rol: {membresia.rol} · Estado: {negocio?.estado ?? "activo"}
            </p>
          </div>

          {negocio?.slug && (
            <Link
              href={`/reservar/${negocio.slug}`}
              target="_blank"
              className={primaryLinkClass}
            >
              Ver link público
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {totalPendientes > 0 && (
        <section className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-yellow-700">
                  Reservas pendientes
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  Tenés {totalPendientes} reserva
                  {totalPendientes === 1 ? "" : "s"} pendiente
                  {totalPendientes === 1 ? "" : "s"} de confirmar
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Revisá estas solicitudes para confirmar, reprogramar o cancelar.
                </p>
              </div>
            </div>

            <Link href="/dashboard/reservas" className={primaryLinkClass}>Ver pendientes
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {((citasPendientes ?? []) as CitaPendiente[]).map((cita) => {
              const cliente = obtenerObjeto(cita.clientes);
              const servicio = obtenerObjeto(cita.servicios);

              return (
                <div
                  key={cita.id}
                  className="rounded-2xl border bg-background p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold">
                    {cliente?.nombre_completo ?? "Cliente"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {servicio?.nombre ?? "Servicio"}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {cita.fecha} · {cita.hora_inicio.slice(0, 5)}
                  </p>
                  {cliente?.telefono && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {cliente.telefono}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardUsageCard
          title="Citas del mes"
          description="Uso mensual incluido en tu plan."
          used={citasUsadas}
          limit={plan?.limite_citas_mensuales ?? 20}
          planName={planName}
          limitType="citas"
        />

        <DashboardUsageCard
          title="Clientes"
          description="Clientes activos incluidos en tu plan."
          used={clientesUsados}
          limit={plan?.limite_clientes ?? 50}
          planName={planName}
          limitType="clientes"
        />

        <DashboardUsageCard
          title="Empleados"
          description="Empleados activos incluidos en tu plan."
          used={empleadosUsados}
          limit={plan?.limite_empleados ?? 1}
          planName={planName}
          limitType="empleados"
        />

        <DashboardUsageCard
          title="Servicios"
          description="Servicios activos incluidos en tu plan."
          used={serviciosUsados}
          limit={plan?.limite_servicios ?? 5}
          planName={planName}
          limitType="servicios"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <h2 className="text-xl font-bold">Plan actual</h2>

          <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
            <p className="text-2xl font-bold">{planName}</p>
            <p className="mt-1 text-muted-foreground">
              {formatearPrecio(plan?.precio_gs ?? 0)} / mes
            </p>
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-6 shadow-sm">
          <h2 className="text-xl font-bold">Accesos rápidos</h2>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/dashboard/clientes" className={outlineLinkClass}>
              Clientes
            </Link>

            <Link href="/dashboard/servicios" className={outlineLinkClass}>
              Servicios
            </Link>

            <Link href="/dashboard/empleados" className={outlineLinkClass}>
              Empleados
            </Link>

            <Link href="/dashboard/citas" className={outlineLinkClass}>
              Calendario
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}