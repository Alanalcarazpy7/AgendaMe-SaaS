import { IntervaloReservaCard } from "@/components/configuracion/intervalo-reserva-card";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  HorariosNegocioForm,
  type HorarioNegocioItem,
} from "@/components/configuracion/horarios-negocio-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ConfiguracionPage() {
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
    <div className="mx-auto max-w-5xl space-y-6">
      <IntervaloReservaCard />
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="mt-1 text-muted-foreground">
          Ajustá la información básica y los horarios de atención.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Negocio</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
          <div>
            <p className="font-medium text-foreground">Nombre</p>
            <p>{negocio?.nombre ?? "Sin nombre"}</p>
          </div>

          <div>
            <p className="font-medium text-foreground">Estado</p>
            <p>{negocio?.estado ?? "Sin estado"}</p>
          </div>

          <div>
            <p className="font-medium text-foreground">Link público</p>
            <p>/reservar/{negocio?.slug ?? ""}</p>
          </div>

          <div>
            <p className="font-medium text-foreground">Rol actual</p>
            <p>{membresia.rol}</p>
          </div>
        </CardContent>
      </Card>

      <HorariosNegocioForm horariosIniciales={horarios} />
    </div>
  );
}