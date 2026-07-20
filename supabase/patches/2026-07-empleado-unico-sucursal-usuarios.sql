-- =====================================================================
-- Patch: empleado vinculado a un solo acceso de sucursal
-- Fecha: 2026-07
--
-- IMPORTANTE: ejecutar manualmente en Supabase cuando se haya limpiado
-- cualquier duplicado existente. Si ya hay dos accesos activos o dos
-- invitaciones pendientes apuntando al mismo empleado_id, estos indices
-- fallaran hasta resolver esos registros.
--
-- Regla de negocio:
-- - Un empleado operativo puede estar vinculado como maximo a un usuario
--   activo con rol empleado_sucursal.
-- - Un empleado operativo puede tener como maximo una invitacion pendiente
--   con rol empleado_sucursal.
-- =====================================================================

begin;

create unique index if not exists uq_sucursal_usuarios_empleado_activo
  on public.sucursal_usuarios (empleado_id)
  where empleado_id is not null
    and rol = 'empleado_sucursal'
    and activo = true;

create unique index if not exists uq_sucursal_invitaciones_empleado_pendiente
  on public.sucursal_invitaciones (empleado_id)
  where empleado_id is not null
    and rol = 'empleado_sucursal'
    and estado = 'pendiente';

commit;
