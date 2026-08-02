import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { redirect } from "next/navigation";
import { Building2, Settings2 } from "lucide-react";
import { BrandingNegocioCard } from "@/components/configuracion/branding-negocio-card";
import { InformacionNegocioCard } from "@/components/configuracion/informacion-negocio-card";
import { IntervaloReservaCard } from "@/components/configuracion/intervalo-reserva-card";
import { DashboardModuleHeader } from "@/components/dashboard/dashboard-module-header";
import { DashboardWorkspaceTabs } from "@/components/dashboard/dashboard-workspace-tabs";
import { PremiumFeaturePage } from "@/components/premium/premium-feature-page";
import { createClient } from "@/lib/supabase/server";
import {
  HorariosNegocioForm,
  type HorarioNegocioItem,
} from "@/components/configuracion/horarios-negocio-form";

export default async function ConfiguracionPage() {
  const access = await requireDashboardAccess();
  if (!access.puedeGestionarConfiguracion) {
    redirect("/dashboard/sin-permiso");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
        estado,
        intervalo_reserva_minutos,
        telefono,
        direccion,
        descripcion
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
    redirect("/sin-acceso?motivo=no_access");
  }

  const negocio = Array.isArray(membresia.negocios)
    ? membresia.negocios[0]
    : membresia.negocios;

  const { data: horariosData, error: horariosError } = await supabase
    .from("horarios_negocio")
    .select("dia_semana, activo, hora_apertura, hora_cierre")
    .eq("negocio_id", membresia.negocio_id)
    .order("dia_semana", { ascending: true });

  if (horariosError) {
    throw new Error(horariosError.message);
  }

  const horarios = (horariosData ?? []) as HorarioNegocioItem[];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <DashboardModuleHeader
        eyebrow="Preferencias del negocio"
        title="Configuración"
        description="Definí cómo se presenta el negocio, cuándo atiende y qué horarios ofrece en el link público de reservas."
        icon={<Settings2 className="size-5" />}
        aside={
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3.5 py-2.5 text-sm shadow-sm">
            <Building2 className="size-4 text-primary" />
            <span className="max-w-44 truncate font-semibold">
              {negocio?.nombre ?? "Negocio"}
            </span>
          </div>
        }
      />

      <DashboardWorkspaceTabs
        ariaLabel="Secciones de configuración"
        tabs={[
          {
            id: "identidad",
            label: "Identidad visual",
            description:
              "Actualizá el logo y el banner que verán tus clientes.",
            content:
              access.planNivel >= 1 ? (
                <BrandingNegocioCard />
              ) : (
                <PremiumFeaturePage
                  titulo="Identidad visual del negocio"
                  descripcion="Personalizá el link público con tu logo y un banner propio. Tus imágenes actuales se conservan si cambiás de plan."
                  desde="Plan Básico"
                  activo={false}
                  estadoActivoTitulo=""
                  estadoActivoDescripcion=""
                />
              ),
          },
          {
            id: "reservas",
            label: "Reservas y horarios",
            description:
              "Controlá la frecuencia de los turnos y los días de atención.",
            content: (
              <div className="space-y-4">
                <IntervaloReservaCard
                  intervaloInicial={Number(
                    negocio?.intervalo_reserva_minutos ?? 30,
                  )}
                />
                <HorariosNegocioForm horariosIniciales={horarios} />
              </div>
            ),
          },
          {
            id: "informacion",
            label: "Información",
            description:
              "Completá los datos que verán tus clientes al reservar.",
            content: (
              <InformacionNegocioCard
                negocio={{
                  nombre: negocio?.nombre ?? "Negocio",
                  slug: negocio?.slug ?? "",
                  estado: negocio?.estado ?? "Sin estado",
                  rol: membresia.rol,
                  telefono: negocio?.telefono ?? null,
                  direccion: negocio?.direccion ?? null,
                  descripcion: negocio?.descripcion ?? null,
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
