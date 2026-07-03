import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatearPrecio(precio?: number | string | null) {
  const numero = Number(precio ?? 0);

  if (numero <= 0) {
    return "Gs. 0";
  }

  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(numero);
}

function mostrarLimite(valor?: number | null) {
  if (valor === null || valor === undefined) {
    return "Ilimitado";
  }

  return String(valor);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: membresias, error } = await supabase
    .from("negocio_usuarios")
    .select(
      `
      id,
      rol,
      negocios (
        id,
        nombre,
        slug,
        rubro,
        estado
      )
    `
    )
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!membresias || membresias.length === 0) {
    redirect("/onboarding/negocio");
  }

  const membresia = membresias[0];

  const negocio = Array.isArray(membresia.negocios)
    ? membresia.negocios[0]
    : membresia.negocios;

  if (!negocio) {
    redirect("/onboarding/negocio");
  }

  const fechaActual = new Date();
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth() + 1;

  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select(
      `
      id,
      estado,
      fecha_inicio,
      fecha_vencimiento,
      planes_saas (
        clave,
        nombre,
        precio_gs,
        limite_citas_mensuales,
        limite_empleados,
        limite_servicios
      )
    `
    )
    .eq("negocio_id", negocio.id)
    .eq("estado", "activa")
    .maybeSingle();

  const plan = Array.isArray(suscripcion?.planes_saas)
    ? suscripcion?.planes_saas[0]
    : suscripcion?.planes_saas;

  const { data: usoMensual } = await supabase
    .from("uso_plan_mensual")
    .select("citas_creadas")
    .eq("negocio_id", negocio.id)
    .eq("anio", anio)
    .eq("mes", mes)
    .maybeSingle();

  const citasUsadas = usoMensual?.citas_creadas ?? 0;
  const limiteCitas = plan?.limite_citas_mensuales ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border bg-background p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Panel del negocio
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {negocio.nombre}
            </h1>

            <p className="mt-2 text-muted-foreground">
              Rol: {membresia.rol} · Estado: {negocio.estado}
            </p>
          </div>

          <Link
            href={`/reservar/${negocio.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Ver link público
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Plan actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p className="text-2xl font-bold text-foreground">
              {plan?.nombre ?? "Sin plan"}
            </p>
            <p>{formatearPrecio(plan?.precio_gs)} / mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Citas del mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p className="text-2xl font-bold text-foreground">
              {citasUsadas} / {mostrarLimite(limiteCitas)}
            </p>
            <p>Uso mensual del plan actual.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empleados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p className="text-2xl font-bold text-foreground">
              {mostrarLimite(plan?.limite_empleados)}
            </p>
            <p>Límite incluido en tu plan.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servicios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p className="text-2xl font-bold text-foreground">
              {mostrarLimite(plan?.limite_servicios)}
            </p>
            <p>Límite incluido en tu plan.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen del negocio</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <p className="font-medium text-foreground">Nombre</p>
              <p>{negocio.nombre}</p>
            </div>

            <div>
              <p className="font-medium text-foreground">Rubro</p>
              <p>{negocio.rubro ?? "Sin rubro"}</p>
            </div>

            <div>
              <p className="font-medium text-foreground">Link público</p>
              <p>/reservar/{negocio.slug}</p>
            </div>

            <div>
              <p className="font-medium text-foreground">Estado</p>
              <p>{negocio.estado}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos pasos</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Crear módulo de clientes.</p>
            <p>2. Crear módulo de servicios.</p>
            <p>3. Crear módulo de empleados.</p>
            <p>4. Configurar horarios.</p>
            <p>5. Crear citas.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
