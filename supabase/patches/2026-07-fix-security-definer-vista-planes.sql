-- =====================================================================
-- Patch: vistas publicas con permisos del invocador
-- Fecha: 2026-07-22
--
-- APLICADO: SI, por el usuario en Supabase el 2026-07-22
--
-- El Advisor marca estas vistas porque, al pertenecer a postgres, una
-- vista SECURITY DEFINER omite el RLS de sus tablas base. La reserva
-- publica actual NO consume estas ocho vistas de negocio: page.tsx y
-- las APIs /api/public consultan las tablas desde el servidor mediante
-- service_role. Por eso ya no es necesario conservar ese bypass.
--
-- No se agregan policies SELECT para anon sobre las tablas base. Luego
-- del cambio, un visitante anonimo no obtiene acceso a los datos de esas
-- ocho vistas y tampoco puede usarlas para saltarse RLS. La vista de planes
-- sigue funcionando porque planes_saas ya permite SELECT publico.
-- =====================================================================

begin;

alter view public.vista_bloqueos_publicos
  set (security_invoker = true);
alter view public.vista_configuracion_publica
  set (security_invoker = true);
alter view public.vista_empleado_servicios_publicos
  set (security_invoker = true);
alter view public.vista_empleados_publicos
  set (security_invoker = true);
alter view public.vista_horarios_empleado_publicos
  set (security_invoker = true);
alter view public.vista_horarios_negocio_publicos
  set (security_invoker = true);
alter view public.vista_negocios_publicos
  set (security_invoker = true);
alter view public.vista_planes_publicos
  set (security_invoker = true);
alter view public.vista_servicios_publicos
  set (security_invoker = true);

commit;

-- Verificacion posterior:
-- select c.relname, coalesce(c.reloptions, array[]::text[]) as opciones
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relname like 'vista_%public%'
-- order by c.relname;
