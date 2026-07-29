import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CalendarCheck2,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { AgendaMeLogo } from "@/components/brand/agendame-logo";
import { ReservaPublicaForm } from "@/components/reservas/reserva-publica-form";
import { nivelPlan } from "@/lib/planes/plan-access";
import { obtenerNegocioPublico } from "@/lib/reservas/negocio-publico";
import { getSiteUrl } from "@/lib/site-url";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Relacion<T> = T | T[] | null;

type PlanRelacion = {
  clave: string;
  nombre: string;
};

type SuscripcionConPlan = {
  planes_saas: Relacion<PlanRelacion>;
};

type EmpleadoServicioRow = {
  servicio_id: string;
  empleados: Relacion<{
    id: string;
    nombre: string;
    estado: string;
    negocio_id: string;
    sucursal_id: string | null;
  }>;
};

function obtenerObjeto<T>(valor: Relacion<T>): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? valor[0] ?? null : valor;
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const negocio = await obtenerNegocioPublico(slug);

  if (!negocio) {
    return {
      title: "Reservas no disponibles | AgendaMe",
      robots: { index: false, follow: false },
    };
  }

  const title = `Reservá en ${negocio.nombre} | AgendaMe`;
  const description =
    negocio.descripcion?.trim() ||
    `Elegí servicio, profesional y horario para reservar online en ${negocio.nombre}.`;
  const canonicalPath = `/reservar/${encodeURIComponent(negocio.slug)}`;

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: "es_PY",
      siteName: "AgendaMe",
      url: canonicalPath,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ReservarPage({ params }: RouteProps) {
  const { slug } = await params;
  const negocio = await obtenerNegocioPublico(slug);

  if (!negocio) notFound();

  const supabase = createServiceRoleClient();

  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select(
      `
      plan_id,
      planes_saas (
        clave,
        nombre
      )
    `,
    )
    .eq("negocio_id", negocio.id)
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const suscripcionConPlan = suscripcion as SuscripcionConPlan | null;
  const plan = obtenerObjeto(suscripcionConPlan?.planes_saas ?? null);
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
    .select(
      "id, nombre, descripcion, duracion_minutos, precio, color, estado, imagen_url",
    )
    .eq("negocio_id", negocio.id)
    .eq("estado", "activo")
    .order("created_at", { ascending: true });

  if (serviciosError) throw new Error(serviciosError.message);

  const { data: empleadoServicios, error: empleadoServiciosError } =
    await supabase.from("empleado_servicios").select(`
      servicio_id,
      empleados (
        id,
        nombre,
        estado,
        negocio_id,
        sucursal_id
      )
    `);

  if (empleadoServiciosError) {
    throw new Error(empleadoServiciosError.message);
  }

  const serviciosDisponibles = new Set<string>();
  const serviciosPorSucursal: Record<string, string[]> = {};

  for (const row of (empleadoServicios ?? []) as EmpleadoServicioRow[]) {
    const empleado = obtenerObjeto(row.empleados);

    if (!empleado) continue;
    if (empleado.negocio_id !== negocio.id) continue;
    if (empleado.estado !== "activo") continue;
    if (!empleado.sucursal_id) continue;

    const servicioId = row.servicio_id;
    const sucursalId = empleado.sucursal_id;

    serviciosDisponibles.add(servicioId);

    if (!serviciosPorSucursal[servicioId]) {
      serviciosPorSucursal[servicioId] = [];
    }

    if (!serviciosPorSucursal[servicioId].includes(sucursalId)) {
      serviciosPorSucursal[servicioId].push(sucursalId);
    }
  }

  const servicios = (serviciosData ?? []).filter((servicio) =>
    serviciosDisponibles.has(servicio.id),
  );

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0 ag-public-booking-bg" />

      <header className="relative z-20 border-b border-border/70 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <AgendaMeLogo size="sm" />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <p className="hidden truncate text-sm font-semibold text-muted-foreground sm:block">
              Reserva online
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">
              Tus datos se usan solo para esta reserva
            </span>
            <span className="sm:hidden">Reserva segura</span>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-5 pt-4 sm:px-6 sm:pt-6">
        <div className="relative min-h-[16rem] overflow-hidden rounded-lg border border-white/15 bg-slate-950 shadow-[0_24px_70px_rgb(15_23_42/0.20)] sm:min-h-[18rem]">
          {negocio.banner_url ? (
            <Image
              src={negocio.banner_url}
              alt={`Portada de ${negocio.nombre}`}
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 ag-bg-dots bg-slate-900" />
          )}

          <div className="absolute inset-0 bg-slate-950/58" />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-slate-950 via-slate-950/72 to-transparent" />

          <div className="relative flex min-h-[16rem] flex-col justify-between p-5 text-white sm:min-h-[18rem] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-slate-950/48 px-3 py-2 text-xs font-semibold backdrop-blur-md">
                <CalendarCheck2
                  className="size-4 text-cyan-300"
                  aria-hidden="true"
                />
                Solicitud sujeta a confirmación
              </span>

              {negocio.telefono && (
                <a
                  href={`tel:${negocio.telefono}`}
                  className="hidden items-center gap-2 rounded-md border border-white/20 bg-slate-950/48 px-3 py-2 text-xs font-semibold outline-none backdrop-blur-md transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70 sm:inline-flex"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {negocio.telefono}
                </a>
              )}
            </div>

            <div className="flex items-end gap-4">
              {negocio.logo_url ? (
                <Image
                  src={negocio.logo_url}
                  alt={`Logo de ${negocio.nombre}`}
                  width={72}
                  height={72}
                  unoptimized
                  className="size-16 shrink-0 rounded-lg border-2 border-white bg-white object-cover shadow-xl sm:size-[4.5rem]"
                />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-lg border-2 border-white bg-white text-2xl font-bold text-slate-950 shadow-xl sm:size-[4.5rem]">
                  {negocio.nombre.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-xs font-semibold text-cyan-200">
                  Agenda disponible
                </p>
                <h1 className="mt-1 text-3xl font-bold leading-tight text-balance sm:text-4xl">
                  {negocio.nombre}
                </h1>
                {negocio.descripcion && (
                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-200">
                    {negocio.descripcion}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-slate-200">
              {negocio.direccion && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="size-4 text-cyan-300" aria-hidden="true" />
                  {negocio.direccion}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 text-cyan-300" aria-hidden="true" />
                Elegí entre los horarios disponibles
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <ReservaPublicaForm
          negocioSlug={negocio.slug}
          servicios={servicios}
          sucursales={sucursales}
          serviciosPorSucursal={serviciosPorSucursal}
        />
      </section>

      <footer className="relative z-10 border-t border-border/70 bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <span>Reservas gestionadas con AgendaMe</span>
          <span>Confirmación según disponibilidad</span>
        </div>
      </footer>
    </main>
  );
}
