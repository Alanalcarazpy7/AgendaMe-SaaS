import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  ReservaPublicaForm,
  type ServicioReservaPublica,
} from "@/components/reservas/reserva-publica-form";

type ReservarPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type RelacionServicioEmpleado = {
  empleado_id: string;
  servicio_id: string;
};

export default async function ReservarPage({ params }: ReservarPageProps) {
  const { slug } = await params;
  const supabase = createServiceRoleClient();

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select(
      "id, nombre, slug, descripcion, telefono, direccion, logo_url, color_primario, color_secundario, color_acento, estado"
    )
    .eq("slug", slug)
    .eq("estado", "activo")
    .maybeSingle();

  if (negocioError || !negocio) {
    notFound();
  }

  const { data: serviciosData, error: serviciosError } = await supabase
    .from("servicios")
    .select(
      "id, nombre, descripcion, duracion_minutos, precio, color, imagen_url"
    )
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo")
    .order("nombre", { ascending: true });

  if (serviciosError) {
    throw new Error(serviciosError.message);
  }

  const serviciosBase = (serviciosData ?? []) as ServicioReservaPublica[];

  const { data: empleadosActivosData, error: empleadosError } = await supabase
    .from("empleados")
    .select("id")
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo");

  if (empleadosError) {
    throw new Error(empleadosError.message);
  }

  const empleadosActivosIds = (empleadosActivosData ?? []).map(
    (empleado) => empleado.id
  );

  let serviciosReservables = serviciosBase;

  if (empleadosActivosIds.length === 0) {
    serviciosReservables = [];
  } else {
    const { data: relaciones, error: relacionesError } = await supabase
      .from("empleado_servicios")
      .select("empleado_id, servicio_id")
      .in("empleado_id", empleadosActivosIds);

    if (relacionesError) {
      throw new Error(relacionesError.message);
    }

    const relacionesReservables = (relaciones ?? []) as RelacionServicioEmpleado[];

    const serviciosConEmpleado = new Set(
      relacionesReservables.map((relacion) => relacion.servicio_id)
    );

    serviciosReservables = serviciosBase.filter((servicio) =>
      serviciosConEmpleado.has(servicio.id)
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-3xl border bg-background shadow-sm">
          <div
            className="h-2"
            style={{
              background:
                negocio.color_primario ??
                negocio.color_acento ??
                "hsl(var(--primary))",
            }}
          />

          <div className="p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {negocio.logo_url ? (
                <img
                  src={negocio.logo_url}
                  alt={negocio.nombre}
                  className="h-20 w-20 rounded-3xl border object-cover"
                />
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white"
                  style={{
                    background:
                      negocio.color_primario ??
                      negocio.color_acento ??
                      "hsl(var(--primary))",
                  }}
                >
                  {negocio.nombre.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Reservas online
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">
                  {negocio.nombre}
                </h1>

                {negocio.descripcion && (
                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    {negocio.descripcion}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {negocio.telefono && (
                    <span className="rounded-full bg-muted px-3 py-1">
                      {negocio.telefono}
                    </span>
                  )}

                  {negocio.direccion && (
                    <span className="rounded-full bg-muted px-3 py-1">
                      {negocio.direccion}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6">
          <ReservaPublicaForm
            negocioNombre={negocio.nombre}
            negocioSlug={negocio.slug}
            negocioTelefono={negocio.telefono}
            colorPrimario={negocio.color_primario}
            colorAcento={negocio.color_acento}
            servicios={serviciosReservables}
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Reservas gestionadas con AgendaMe.
        </p>
      </div>
    </main>
  );
}