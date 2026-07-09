import { notFound } from "next/navigation";
import { CalendarCheck2, MapPin, Phone, Sparkles } from "lucide-react";
import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { ReservaPublicaForm } from "@/components/reservas/reserva-publica-form";
import { nivelPlan } from "@/lib/planes/plan-access";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Relacion<T> = T | T[] | null;

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

export default async function ReservarPage({ params }: RouteProps) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select(
      "id, nombre, slug, descripcion, telefono, direccion, logo_url, banner_url, estado"
    )
    .eq("slug", slug)
    .eq("estado", "activo")
    .maybeSingle();

  if (negocioError) throw new Error(negocioError.message);
  if (!negocio) notFound();

  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select(
      `
      plan_id,
      planes_saas (
        clave,
        nombre
      )
    `
    )
    .eq("negocio_id", negocio.id)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = obtenerObjeto((suscripcion as any)?.planes_saas ?? null);
  const esEmpresarial = nivelPlan(plan?.clave ?? "gratis") >= 3;

  await supabase.rpc("obtener_o_crear_sucursal_principal", {
    p_negocio_id: negocio.id,
  });

  const { data: sucursalesData, error: sucursalesError } = await supabase
    .from("sucursales")
    .select("id, nombre, direccion, telefono, es_principal, estado, created_at")
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo")
    .order("es_principal", { ascending: false })
    .order("created_at", { ascending: true });

  if (sucursalesError) throw new Error(sucursalesError.message);

  const sucursalesActivas = sucursalesData ?? [];

  const sucursales = esEmpresarial
    ? sucursalesActivas
    : sucursalesActivas.slice(0, 1);

  const { data: serviciosData, error: serviciosError } = await supabase
    .from("servicios")
    .select("id, nombre, descripcion, duracion_minutos, precio, color, estado, imagen_url")
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo")
    .order("created_at", { ascending: true });

  if (serviciosError) throw new Error(serviciosError.message);

  const { data: empleadoServicios, error: empleadoServiciosError } =
    await supabase
      .from("empleado_servicios")
      .select(
        `
        servicio_id,
        empleados (
          id,
          nombre,
          estado,
          negocio_id,
          sucursal_id
        )
      `
      );

  if (empleadoServiciosError) {
    throw new Error(empleadoServiciosError.message);
  }

  const serviciosDisponibles = new Set<string>();
  const serviciosPorSucursal: Record<string, string[]> = {};

  for (const row of empleadoServicios ?? []) {
    const empleado = obtenerObjeto((row as any).empleados);

    if (!empleado) continue;
    if ((empleado as any).negocio_id !== negocio.id) continue;
    if ((empleado as any).estado !== "activo") continue;
    if (!(empleado as any).sucursal_id) continue;

    const servicioId = (row as any).servicio_id as string;
    const sucursalId = (empleado as any).sucursal_id as string;

    serviciosDisponibles.add(servicioId);

    if (!serviciosPorSucursal[servicioId]) {
      serviciosPorSucursal[servicioId] = [];
    }

    if (!serviciosPorSucursal[servicioId].includes(sucursalId)) {
      serviciosPorSucursal[servicioId].push(sucursalId);
    }
  }

  const servicios = (serviciosData ?? []).filter((servicio) =>
    serviciosDisponibles.has(servicio.id)
  );

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 ag-public-booking-bg" />

      <section className="relative z-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded-2xl border bg-card/90 px-3 py-2 shadow-sm ring-1 ring-white/60 backdrop-blur-xl dark:bg-card/80 dark:ring-white/5">
              <AgendaMeLogo size="sm" />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{negocio.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">Reservas online</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <CalendarCheck2 className="h-4 w-4 text-primary" />
            Confirmación según disponibilidad
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 shadow-[0_28px_90px_rgb(15_23_42/0.10)] ring-1 ring-white/70 backdrop-blur-xl dark:bg-card/80 dark:shadow-black/30 dark:ring-white/5">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="relative flex min-h-[26rem] flex-col justify-end p-6 sm:p-8 lg:p-10">
              <div className="absolute inset-0">
                {negocio.banner_url ? (
                  <>
                    <img
                      src={negocio.banner_url}
                      alt={`Portada de ${negocio.nombre}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/32 to-slate-950/8" />
                  </>
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(135deg,#0f172a,#0b1120_58%,#0e7490)]" />
                )}
              </div>

              <div className="relative max-w-3xl text-white">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50 backdrop-blur-xl">
                  <Sparkles className="h-3.5 w-3.5" />
                  Reserva tu turno en minutos
                </span>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                  {negocio.logo_url ? (
                    <img
                      src={negocio.logo_url}
                      alt={`Logo de ${negocio.nombre}`}
                      className="h-20 w-20 rounded-[1.35rem] border-4 border-white/90 bg-white object-cover shadow-2xl shadow-slate-950/30"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.35rem] border-4 border-white/90 bg-white text-3xl font-bold text-slate-950 shadow-2xl shadow-slate-950/30">
                      {negocio.nombre.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                      {negocio.nombre}
                    </h1>
                    {negocio.descripcion && (
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-100/90 sm:text-base">
                        {negocio.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside className="border-t border-border/70 bg-background/72 p-5 dark:bg-white/[0.03] lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between gap-5 rounded-[1.5rem] border bg-card/80 p-5 shadow-sm ring-1 ring-white/60 dark:bg-card/70 dark:ring-white/5">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Información del negocio</p>

                  <div className="mt-5 space-y-3">
                    {negocio.direccion && (
                      <div className="flex gap-3 rounded-2xl border bg-muted/35 p-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm leading-6">{negocio.direccion}</p>
                      </div>
                    )}

                    {negocio.telefono && (
                      <div className="flex gap-3 rounded-2xl border bg-muted/35 p-3">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-sm leading-6">{negocio.telefono}</p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-cyan-300/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_92%,#0b1120),color-mix(in_srgb,var(--ring)_72%,#0b1120))] p-4 text-white shadow-lg shadow-cyan-950/15">
                      <p className="font-bold">Reservá tu turno</p>
                      <p className="mt-1 text-sm leading-6 text-cyan-50/90">
                        Elegí servicio, fecha y horario. El negocio revisará tu solicitud.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                  Al enviar la reserva, tus datos se usan solo para gestionar este turno.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <ReservaPublicaForm
          negocioSlug={negocio.slug}
          servicios={servicios}
          sucursales={sucursales}
          serviciosPorSucursal={serviciosPorSucursal}
        />
      </section>
    </main>
  );
}
