import { AgendaStatusPage, statusActions } from "@/components/status/agenda-status-page";

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

export default async function SinAccesoPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const contenido = contenidoPorMotivo(params.motivo);

  return (
    <AgendaStatusPage
      code="403"
      tone="amber"
      eyebrow="Acceso no habilitado"
      title={contenido.title}
      description={contenido.description}
      note={contenido.note}
      actions={[statusActions.retry, statusActions.login, statusActions.home]}
    />
  );
}
