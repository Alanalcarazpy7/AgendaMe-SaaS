import { AgendaStatusPage, statusActions } from "@/components/status/agenda-status-page";

export default function SinPermisoPage() {
  return (
    <AgendaStatusPage
      code="403"
      tone="amber"
      eyebrow="Permiso pendiente"
      title="Esta seccion esta cerrada por ahora"
      description="Tu cuenta puede entrar al panel, pero este modulo no esta habilitado para tu rol actual."
      note="Si necesitas usar esta herramienta, pedi al responsable del negocio que revise tus permisos."
      actions={[statusActions.dashboard, statusActions.home]}
    />
  );
}
