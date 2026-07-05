import { requireAdminGlobalApi } from "@/lib/dashboard/api-guards";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type Payload = {
  planClave?: string;
  mensaje?: string;
};

function limpiar(valor: unknown) {
  return String(valor ?? "").trim();
}

export async function POST(request: Request) {
  const guard = await requireAdminGlobalApi();
  if (!guard.ok) return guard.response;


  try {
    const authSupabase = await createClient();

    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as Payload;
    const planClave = limpiar(body.planClave).toLowerCase();
    const mensaje = limpiar(body.mensaje);

    if (!planClave) {
      return NextResponse.json(
        { error: "Seleccioná un plan." },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: membresia, error: membresiaError } = await supabase
      .from("negocio_usuarios")
      .select("negocio_id")
      .eq("usuario_id", user.id)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    if (membresiaError) throw new Error(membresiaError.message);

    if (!membresia) {
      return NextResponse.json(
        { error: "No tenés un negocio activo." },
        { status: 404 }
      );
    }

    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("id, nombre")
      .eq("id", membresia.negocio_id)
      .maybeSingle();

    if (negocioError) throw new Error(negocioError.message);

    if (!negocio) {
      return NextResponse.json(
        { error: "Negocio no encontrado." },
        { status: 404 }
      );
    }

    const { data: planSolicitado, error: planError } = await supabase
      .from("planes_saas")
      .select("id, clave, nombre")
      .eq("clave", planClave)
      .maybeSingle();

    if (planError) throw new Error(planError.message);

    if (!planSolicitado) {
      return NextResponse.json(
        { error: "Plan solicitado no encontrado." },
        { status: 404 }
      );
    }

    const { data: suscripcionActual, error: suscripcionError } = await supabase
      .from("suscripciones")
      .select("plan_id")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "activa")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (suscripcionError) throw new Error(suscripcionError.message);

    const planActualId = suscripcionActual?.plan_id ?? null;

    if (planActualId === planSolicitado.id) {
      return NextResponse.json(
        { error: "Ese ya es tu plan actual." },
        { status: 400 }
      );
    }

    const { data: solicitudPendiente, error: pendienteError } = await supabase
      .from("solicitudes_cambio_plan")
      .select("id")
      .eq("negocio_id", membresia.negocio_id)
      .eq("estado", "pendiente")
      .maybeSingle();

    if (pendienteError) throw new Error(pendienteError.message);

    if (solicitudPendiente?.id) {
      const { error } = await supabase
        .from("solicitudes_cambio_plan")
        .update({
          plan_actual_id: planActualId,
          plan_solicitado_id: planSolicitado.id,
          mensaje: mensaje || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", solicitudPendiente.id);

      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("solicitudes_cambio_plan").insert({
        negocio_id: membresia.negocio_id,
        plan_actual_id: planActualId,
        plan_solicitado_id: planSolicitado.id,
        estado: "pendiente",
        mensaje: mensaje || null,
      });

      if (error) throw new Error(error.message);
    }

    const numero = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? "";
    const texto = encodeURIComponent(
      `Hola, quiero cambiar mi negocio ${negocio.nombre} al Plan ${planSolicitado.nombre} de AgendaMe.`
    );

    const whatsappUrl = numero
      ? `https://wa.me/${numero.replace(/\D/g, "")}?text=${texto}`
      : null;

    return NextResponse.json({
      message: "Solicitud registrada correctamente.",
      whatsappUrl,
      planSolicitado,
    });
  } catch (error) {
    console.error("Error creando solicitud de cambio de plan:", error);

    return NextResponse.json(
      { error: "No se pudo registrar la solicitud." },
      { status: 500 }
    );
  }
}