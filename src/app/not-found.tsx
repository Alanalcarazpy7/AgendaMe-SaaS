import { AgendaStatusPage, statusActions } from "@/components/status/agenda-status-page";

export default function NotFound() {
  return (
    <AgendaStatusPage
      code="404"
      eyebrow="Pagina no encontrada"
      title="Este turno se escapo del calendario"
      description="Buscamos en la agenda, revisamos la sala de espera y hasta miramos debajo del mostrador. Esta pagina no existe o cambio de lugar."
      note="Proba volver al inicio o entrar de nuevo desde el enlace correcto."
      actions={[statusActions.home, statusActions.login]}
    />
  );
}
