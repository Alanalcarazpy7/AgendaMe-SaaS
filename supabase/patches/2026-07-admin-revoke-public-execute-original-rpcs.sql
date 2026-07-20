-- =====================================================================
-- Patch: revocar EXECUTE público de las 5 RPC administrativas originales
-- Fecha: 2026-07
--
-- APLICADO: NO
--
-- Contexto (auditoría de solo lectura, ver docs/admin-owner-panel-progress.md):
-- Al leer el schema.sql de respaldo (2026-07-09) se confirmó que estas 5
-- funciones tienen `GRANT ALL ... TO anon, authenticated, service_role`.
-- Las 5 validan `es_super_admin()` como primera línea de su cuerpo (también
-- confirmado leyendo el código fuente real), así que hoy un llamado de un
-- usuario `anon` o `authenticated` sin `rol_global = 'super_admin'` es
-- rechazado igual, con un error explícito (`errcode = '42501'`). Este patch
-- no corrige ninguna falla de autorización real: agrega una segunda capa de
-- defensa en profundidad (bloquear también a nivel de GRANT, no solo dentro
-- del cuerpo de la función), tal como pide explícitamente el prompt maestro
-- ("revocar execute de PUBLIC si son sensibles").
--
-- Las 4 RPC administrativas más nuevas (admin_agregar_nota_negocio,
-- admin_editar_plan, admin_registrar_pago_manual, admin_revocar_invitacion,
-- ver supabase/patches/2026-07-admin-rpc-transaccionales.sql) ya fueron
-- creadas revocando EXECUTE de PUBLIC — este patch homologa las 5 originales
-- al mismo estándar.
--
-- Efecto esperado tras aplicar:
-- - anon deja de poder invocar estas 5 funciones (PostgREST devolverá un
--   error de "function not found"/"permission denied" en vez de llegar a
--   ejecutar el cuerpo y recibir el 401/403 de es_super_admin()).
-- - authenticated (cualquier usuario logueado, no solo super_admin) sigue
--   pudiendo *intentar* invocarlas — el chequeo de es_super_admin() sigue
--   siendo la barrera real para ellos, igual que hoy.
-- - El panel admin (que llama estas RPC con el cliente de sesión de un
--   usuario ya autenticado como super_admin) no se ve afectado.
--
-- Verificación previa recomendada antes de aplicar (de solo lectura):
--   select p.proname, p.proacl
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in (
--       'admin_cambiar_plan_negocio', 'admin_bloquear_negocio',
--       'admin_desbloquear_negocio', 'admin_aprobar_pago_manual',
--       'admin_rechazar_pago_manual'
--     );
--
-- Riesgo conocido si se aplica sin verificar lo anterior: si algún flujo no
-- documentado en este audit llama a estas RPC con la clave anon (por
-- ejemplo, un webhook o integración externa que no pasa por el panel admin
-- ni por una sesión autenticada), ese flujo dejaría de funcionar. No se
-- encontró ningún uso de este tipo en el código durante la auditoría
-- (todas las llamadas revisadas usan el cliente de sesión desde
-- src/lib/admin/actions/negocios.ts), pero no se puede garantizar al 100%
-- sin ver también integraciones externas fuera del repo.
-- =====================================================================

revoke execute on function public.admin_cambiar_plan_negocio(
  uuid, text, timestamp with time zone, text
) from public;

revoke execute on function public.admin_cambiar_plan_negocio(
  uuid, text, timestamp with time zone, text
) from anon;

grant execute on function public.admin_cambiar_plan_negocio(
  uuid, text, timestamp with time zone, text
) to authenticated;

revoke execute on function public.admin_bloquear_negocio(
  uuid, text
) from public;

revoke execute on function public.admin_bloquear_negocio(
  uuid, text
) from anon;

grant execute on function public.admin_bloquear_negocio(
  uuid, text
) to authenticated;

revoke execute on function public.admin_desbloquear_negocio(
  uuid
) from public;

revoke execute on function public.admin_desbloquear_negocio(
  uuid
) from anon;

grant execute on function public.admin_desbloquear_negocio(
  uuid
) to authenticated;

revoke execute on function public.admin_aprobar_pago_manual(
  uuid, timestamp with time zone, text
) from public;

revoke execute on function public.admin_aprobar_pago_manual(
  uuid, timestamp with time zone, text
) from anon;

grant execute on function public.admin_aprobar_pago_manual(
  uuid, timestamp with time zone, text
) to authenticated;

revoke execute on function public.admin_rechazar_pago_manual(
  uuid, text
) from public;

revoke execute on function public.admin_rechazar_pago_manual(
  uuid, text
) from anon;

grant execute on function public.admin_rechazar_pago_manual(
  uuid, text
) to authenticated;

-- Nota: no se incluye admin_obtener_negocios_resumen() en este patch porque
-- es de solo lectura (SELECT sobre una vista administrativa) y no estaba
-- explícitamente pedida en el alcance autorizado de esta corrección — si se
-- quiere el mismo hardening para ella, extender este patch después de
-- confirmarlo.
