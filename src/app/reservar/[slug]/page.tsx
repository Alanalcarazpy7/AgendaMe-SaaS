import { notFound } from "next/navigation";
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
    <main className="min-h-screen bg-muted/30">
      <section className="relative border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="overflow-hidden rounded-[2rem] border bg-background shadow-sm">
            <div className="relative h-56 bg-muted sm:h-72">
              {negocio.banner_url ? (
                <>
                  <img
                    src={negocio.banner_url}
                    alt={negocio.nombre}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
              )}

              <div className="absolute bottom-5 left-5 right-5 flex items-end gap-4">
                {negocio.logo_url ? (
                  <img
                    src={negocio.logo_url}
                    alt={negocio.nombre}
                    className="h-20 w-20 rounded-3xl border-4 border-background bg-background object-cover shadow-xl"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-background bg-foreground text-3xl font-bold text-background shadow-xl">
                    {negocio.nombre.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 pb-1 text-white">
                  <p className="text-sm font-medium opacity-90">Reserva online</p>
                  <h1 className="truncate text-3xl font-bold tracking-tight sm:text-4xl">
                    {negocio.nombre}
                  </h1>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                {negocio.descripcion && (
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    {negocio.descripcion}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {negocio.direccion && <span>{negocio.direccion}</span>}
                  {negocio.telefono && <span>· {negocio.telefono}</span>}
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-semibold">Reservá tu turno</p>
                <p className="text-muted-foreground">Elegí servicio, fecha y hora.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <ReservaPublicaForm
          negocioSlug={negocio.slug}
          servicios={servicios}
          sucursales={sucursales}
          serviciosPorSucursal={serviciosPorSucursal}
        />
      </div>
    </main>
  );
}