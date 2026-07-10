import type { NegocioResumenRow } from "@/lib/admin/types/negocio";
import type { InvitacionRow } from "@/lib/admin/queries/invitaciones";
import { estadoEfectivoInvitacion } from "@/lib/admin/queries/invitaciones";
import type { UsuarioPlataforma } from "@/lib/admin/queries/usuarios";

export type AlertaOperativa = {
  id: string;
  titulo: string;
  detalle: string;
  href: string;
  severidad: "info" | "warning" | "danger";
};

/**
 * Alertas reales derivadas de datos ya cargados en el dashboard — nunca
 * ficticias. Si una condición no tiene datos, simplemente no genera alerta.
 */
export function calcularAlertas(args: {
  negocios: NegocioResumenRow[];
  invitaciones: InvitacionRow[];
  usuarios: UsuarioPlataforma[];
  pagosPendientes: number;
  solicitudesPendientes: number;
}): AlertaOperativa[] {
  const { negocios, invitaciones, usuarios, pagosPendientes, solicitudesPendientes } = args;
  const alertas: AlertaOperativa[] = [];

  const vencenPronto = negocios.filter(
    (n) => typeof n.dias_para_vencer === "number" && n.dias_para_vencer >= 0 && n.dias_para_vencer <= 7
  );
  if (vencenPronto.length > 0) {
    alertas.push({
      id: "vencimientos",
      titulo: `${vencenPronto.length} suscripción${vencenPronto.length === 1 ? "" : "es"} vence${vencenPronto.length === 1 ? "" : "n"} en 7 días`,
      detalle: "Revisá renovaciones antes de que el negocio quede sin plan activo.",
      href: "/admin/renovaciones",
      severidad: "warning",
    });
  }

  if (pagosPendientes > 0) {
    alertas.push({
      id: "pagos-pendientes",
      titulo: `${pagosPendientes} pago${pagosPendientes === 1 ? "" : "s"} pendiente${pagosPendientes === 1 ? "" : "s"} de aprobar`,
      detalle: "Hay comprobantes esperando revisión.",
      href: "/admin/pagos?estado=pendiente",
      severidad: "warning",
    });
  }

  if (solicitudesPendientes > 0) {
    alertas.push({
      id: "solicitudes-plan",
      titulo: `${solicitudesPendientes} solicitud${solicitudesPendientes === 1 ? "" : "es"} de cambio de plan`,
      detalle: "Negocios esperando una respuesta sobre su plan.",
      href: "/admin/negocios",
      severidad: "info",
    });
  }

  const bloqueados = negocios.filter((n) => n.estado === "bloqueado");
  if (bloqueados.length > 0) {
    alertas.push({
      id: "negocios-bloqueados",
      titulo: `${bloqueados.length} negocio${bloqueados.length === 1 ? "" : "s"} bloqueado${bloqueados.length === 1 ? "" : "s"}`,
      detalle: "Verificá si corresponde desbloquear tras regularizar el pago.",
      href: "/admin/negocios?estado=bloqueado",
      severidad: "danger",
    });
  }

  const sinPlanActivo = negocios.filter((n) => n.estado === "activo" && n.suscripcion_estado !== "activa");
  if (sinPlanActivo.length > 0) {
    alertas.push({
      id: "sin-plan-activo",
      titulo: `${sinPlanActivo.length} negocio${sinPlanActivo.length === 1 ? "" : "s"} activo${sinPlanActivo.length === 1 ? "" : "s"} sin suscripción activa`,
      detalle: "Operan sin un plan vigente registrado.",
      href: "/admin/negocios",
      severidad: "danger",
    });
  }

  const sobreLimite = negocios.filter(
    (n) =>
      typeof n.limite_citas_mensuales === "number" &&
      typeof n.citas_usadas_mes_actual === "number" &&
      n.citas_usadas_mes_actual > n.limite_citas_mensuales
  );
  if (sobreLimite.length > 0) {
    alertas.push({
      id: "sobre-limite",
      titulo: `${sobreLimite.length} negocio${sobreLimite.length === 1 ? "" : "s"} superó su límite de citas del mes`,
      detalle: "Candidatos a ofrecer un upgrade de plan.",
      href: "/admin/negocios",
      severidad: "warning",
    });
  }

  const invitacionesVencidas = invitaciones.filter((inv) => estadoEfectivoInvitacion(inv) === "expirada");
  if (invitacionesVencidas.length > 0) {
    alertas.push({
      id: "invitaciones-vencidas",
      titulo: `${invitacionesVencidas.length} invitación${invitacionesVencidas.length === 1 ? "" : "es"} expirada${invitacionesVencidas.length === 1 ? "" : "s"}`,
      detalle: "Siguen marcadas como pendientes pero ya vencieron.",
      href: "/admin/invitaciones?estado=expirada",
      severidad: "info",
    });
  }

  const usuariosSinPerfil = usuarios.filter((u) => !u.perfilCompleto);
  if (usuariosSinPerfil.length > 0) {
    alertas.push({
      id: "usuarios-sin-perfil",
      titulo: `${usuariosSinPerfil.length} usuario${usuariosSinPerfil.length === 1 ? "" : "s"} sin perfil en perfiles_usuario`,
      detalle: "Cuentas de auth.users sin fila correspondiente en perfiles_usuario.",
      href: "/admin/usuarios",
      severidad: "info",
    });
  }

  const sinAdministrador = negocios.filter(
    (n) => n.estado === "activo" && !usuarios.some((u) => u.negocios.some((ng) => ng.negocioId === n.negocio_id))
  );
  if (sinAdministrador.length > 0) {
    alertas.push({
      id: "sin-administrador",
      titulo: `${sinAdministrador.length} negocio${sinAdministrador.length === 1 ? "" : "s"} activo${sinAdministrador.length === 1 ? "" : "s"} sin usuario admin_global`,
      detalle: "Nadie tiene acceso de administrador global a ese negocio.",
      href: "/admin/negocios",
      severidad: "warning",
    });
  }

  return alertas;
}
