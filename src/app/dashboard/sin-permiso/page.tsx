import { AgendaStatusPage, statusActions } from "@/components/status/agenda-status-page";

export default function SinPermisoPage() {
  return (
    <AgendaStatusPage
      code="403"
      tone="amber"
      eyebrow="Permiso pendiente"
      title="Esta sección está cerrada por ahora"
      description="Tu cuenta puede entrar al panel, pero este módulo no está habilitado para tu rol actual."
      note="Si necesitás usar esta herramienta, pedí al responsable del negocio que revise tus permisos."
      actions={[statusActions.dashboard, statusActions.home]}
      embedded
    />
  );
}
