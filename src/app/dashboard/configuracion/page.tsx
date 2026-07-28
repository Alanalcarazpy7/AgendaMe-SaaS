import { requireDashboardAccess } from "@/lib/dashboard/access-context";
import { redirect } from "next/navigation";
import { Building2, Settings2 } from "lucide-react";
import { BrandingNegocioCard } from "@/components/configuracion/branding-negocio-card";
import { IntervaloReservaCard } from "@/components/configuracion/intervalo-reserva-card";
import { DashboardModuleHeader } from "@/components/dashboard/dashboard-module-header";
import { DashboardWorkspaceTabs } from "@/components/dashboard/dashboard-workspace-tabs";
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
            content: <BrandingNegocioCard />,
          },
          {
            id: "reservas",
            label: "Reservas y horarios",
            description:
              "Controlá la frecuencia de los turnos y los días de atención.",
            content: (
              <div className="space-y-4">
                <IntervaloReservaCard />
                <HorariosNegocioForm horariosIniciales={horarios} />
              </div>
            ),
          },
          {
            id: "informacion",
            label: "Información",
            description:
              "Consultá los datos internos y el enlace público del negocio.",
            content: (
              <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="border-b px-4 py-3">
                  <h2 className="font-bold">Datos del negocio</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta información identifica el espacio que estás administrando.
                  </p>
                </div>

                <dl className="grid text-sm md:grid-cols-2">
                  {[
                    ["Nombre", negocio?.nombre ?? "Sin nombre"],
                    ["Estado", negocio?.estado ?? "Sin estado"],
                    ["Link público", `/reservar/${negocio?.slug ?? ""}`],
                    ["Rol actual", membresia.rol],
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      className={`px-4 py-3 ${
                        index > 0 ? "border-t md:border-t-0" : ""
                      } ${index % 2 ? "md:border-l" : ""} ${
                        index >= 2 ? "md:border-t" : ""
                      }`}
                    >
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 break-all font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}
