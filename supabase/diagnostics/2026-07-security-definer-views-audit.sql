-- =====================================================================
-- Diagnostico de solo lectura (no modifica nada).
-- Objetivo: el Advisor de Supabase marca 9 vistas publicas como
-- "Security Definer View" (corren con los privilegios del dueno de la
-- vista y por lo tanto se saltan RLS de las tablas base, en vez de
-- correr con los privilegios de quien consulta -- anon/authenticated).
--
-- El fix estandar es "alter view public.<vista> set (security_invoker
-- = true);" para cada una. El codigo actual de /reservar/[slug] y sus
-- APIs consulta las tablas base en el servidor con service_role; ya no
-- consume estas ocho vistas de negocio. Por eso pueden obedecer RLS sin
-- romper la reserva publica. vista_planes_publicos si se usa y su tabla
-- base ya tiene lectura publica mediante una policy para anon.
--
-- Este script solo lee el catalogo de Postgres para confirmar, antes
-- de tocar nada, si eso pasaria. Correlo en el SQL Editor de Supabase
-- y pegame el resultado completo (no expone datos de negocios, solo
-- metadata de estructura).
-- =====================================================================

-- 1. RLS activado/forzado en las tablas base de las 9 vistas
select
  c.relname as tabla,
  c.relrowsecurity as rls_activado,
  c.relforcerowsecurity as rls_forzado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'planes_saas',
    'negocios',
    'servicios',
    'empleados',
    'horarios_negocio',
    'horarios_empleado',
    'bloqueos_horario',
    'configuracion_negocio',
    'empleado_servicios'
  )
order by c.relname;

-- 2. Policies existentes en esas mismas tablas (por rol y comando)
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'planes_saas',
    'negocios',
    'servicios',
    'empleados',
    'horarios_negocio',
    'horarios_empleado',
    'bloqueos_horario',
    'configuracion_negocio',
    'empleado_servicios'
  )
order by tablename, policyname;

-- 3. Definicion actual de las 9 vistas marcadas por el Advisor
--    (para confirmar el WHERE que ya usan como filtro "publico")
select
  viewname,
  definition
from pg_views
where schemaname = 'public'
  and viewname in (
    'vista_horarios_negocio_publicos',
    'vista_horarios_empleado_publicos',
    'vista_negocios_publicos',
    'vista_servicios_publicos',
    'vista_empleados_publicos',
    'vista_bloqueos_publicos',
    'vista_configuracion_publica',
    'vista_empleado_servicios_publicos',
    'vista_planes_publicos'
  )
order by viewname;

-- 4. Dueno actual de cada vista (confirma que corren con permisos
--    elevados del creador, no de anon/authenticated)
select
  c.relname as vista,
  pg_get_userbyid(c.relowner) as dueno
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'v'
  and c.relname in (
    'vista_horarios_negocio_publicos',
    'vista_horarios_empleado_publicos',
    'vista_negocios_publicos',
    'vista_servicios_publicos',
    'vista_empleados_publicos',
    'vista_bloqueos_publicos',
    'vista_configuracion_publica',
    'vista_empleado_servicios_publicos',
    'vista_planes_publicos'
  )
order by vista;
