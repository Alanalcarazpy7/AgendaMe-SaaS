import { MessageCircle } from "lucide-react";
import { AgendaStatusPage, statusActions } from "@/components/status/agenda-status-page";
import { buildWhatsappUrl } from "@/lib/contact/whatsapp";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type PageProps = {
  searchParams?: Promise<{
    motivo?: string;
  }>;
};

function contenidoPorMotivo(motivo?: string) {
  if (motivo === "plan_required") {
    return {
      title: "Este pase todavia no abre esa puerta",
      description:
        "La cuenta esta bien, pero esta seccion necesita un plan o permiso que ahora mismo no esta activo.",
      note: "Pedi al responsable del negocio que revise el plan contratado o tu nivel de acceso.",
    };
  }

  if (motivo === "inactive_branch") {
    return {
      title: "La sucursal esta tomando una pausa",
      description:
        "Tu usuario esta vinculado a una sucursal que figura como inactiva. Por eso frenamos el acceso antes de entrar.",
      note: "Cuando la sucursal vuelva a estar activa, este acceso deberia funcionar normalmente.",
    };
  }

  if (motivo === "inactive_business") {
    return {
      title: "El negocio esta fuera de agenda",
      description:
        "La cuenta del negocio no esta disponible en este momento. Puede estar pausada, bloqueada o pendiente de revision.",
      note: "Si crees que esto es un error, contacta al responsable de la cuenta para revisar el estado.",
    };
  }

  return {
    title: "Tu llave no encaja en esta agenda",
    description:
      "Iniciaste sesion correctamente, pero no encontramos un acceso activo para este panel.",
    note: "Puede faltar una invitacion, una asignacion al negocio o una configuracion pendiente.",
  };
}

async function obtenerBloqueoNegocioActual() {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user?.id) return null;

  const email = String(user.email ?? "").trim().toLowerCase();
  const supabase = createServiceRoleClient();

  const { data: membresiaGlobal } = await supabase
    .from("negocio_usuarios")
    .select(
      `
      negocios (
        id,
        nombre,
        estado,
        motivo_bloqueo,
        bloqueado_at
      )
    `
    )
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();

  const negocioGlobal = Array.isArray((membresiaGlobal as any)?.negocios)
    ? (membresiaGlobal as any).negocios[0]
    : (membresiaGlobal as any)?.negocios;

  if (negocioGlobal?.estado && negocioGlobal.estado !== "activo") {
    return {
      ...negocioGlobal,
      puedeVerMotivoReal: true,
    };
  }

  let accesoQuery = supabase
    .from("sucursal_usuarios")
    .select("negocio_id, rol")
    .eq("usuario_id", user.id)
    .eq("activo", true)
    .limit(1);

  let { data: accesoSucursal } = await accesoQuery.maybeSingle();

  if (!accesoSucursal && email) {
    const result = await supabase
      .from("sucursal_usuarios")
      .select("negocio_id, rol")
      .eq("email", email)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    accesoSucursal = result.data;
  }

  if (!(accesoSucursal as any)?.negocio_id) return null;

  const { data: negocioSucursal } = await supabase
    .from("negocios")
    .select("id, nombre, estado, motivo_bloqueo, bloqueado_at")
    .eq("id", (accesoSucursal as any).negocio_id)
    .maybeSingle();

  if (!negocioSucursal || negocioSucursal.estado === "activo") return null;

  return {
    ...negocioSucursal,
    puedeVerMotivoReal: (accesoSucursal as any).rol === "gerente_sucursal",
  };
}

export default async function SinAccesoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const bloqueo =
    params.motivo === "inactive_business"
      ? await obtenerBloqueoNegocioActual()
      : null;
  const puedeVerMotivoReal = Boolean(bloqueo?.puedeVerMotivoReal);
  const contenido = bloqueo
    ? {
        title: puedeVerMotivoReal
          ? `${bloqueo.nombre} esta bloqueado temporalmente`
          : "Acceso temporalmente no disponible",
        description: puedeVerMotivoReal
          ? "El panel queda en pausa para proteger los datos y evitar nuevas operaciones mientras se resuelve el estado de la cuenta."
          : "No podemos abrir este panel con tu usuario en este momento.",
        note: puedeVerMotivoReal
          ? bloqueo.motivo_bloqueo
            ? `Motivo informado: ${bloqueo.motivo_bloqueo}`
            : "No hay un motivo detallado cargado. Contacta a AgendaMe para revisar el estado de la cuenta."
          : "Contacta al responsable del negocio o a soporte de AgendaMe para revisar tu acceso.",
      }
    : contenidoPorMotivo(params.motivo);

  const actions = bloqueo
    ? [
        {
          href: buildWhatsappUrl(
            puedeVerMotivoReal
              ? `Hola, quiero revisar el bloqueo del negocio ${bloqueo.nombre}. Motivo mostrado: ${
                  bloqueo.motivo_bloqueo ?? "sin motivo detallado"
                }`
              : `Hola, necesito ayuda para revisar mi acceso al negocio ${bloqueo.nombre}.`
          ),
          label: "Contactar soporte",
          icon: MessageCircle,
        },
        statusActions.login,
        statusActions.home,
      ]
    : [statusActions.retry, statusActions.login, statusActions.home];

  return (
    <AgendaStatusPage
      code="403"
      tone="amber"
      eyebrow={bloqueo && puedeVerMotivoReal ? "Negocio bloqueado" : "Acceso no habilitado"}
      title={contenido.title}
      description={contenido.description}
      note={contenido.note}
      actions={actions}
    />
  );
}
