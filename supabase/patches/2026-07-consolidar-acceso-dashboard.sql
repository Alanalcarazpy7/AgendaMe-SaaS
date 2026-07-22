-- =====================================================================
-- APLICADO: NO
-- Patch: consolidar la resolucion de acceso del dashboard en 1 sola RPC
-- Fecha: 2026-07-22
--
-- Contexto (ver docs/load-test-audit-2026-07-22.md y tests/load/results/):
-- resolveDashboardAccess() (src/lib/dashboard/access-context.ts) hace 4
-- consultas independientes a la API REST de Supabase en cada carga del
-- dashboard: perfil, rol_global (chequeo de propietario), negocio_usuarios
-- y sucursal_usuarios. Se paralelizaron con Promise.all en la vuelta
-- anterior (reduce la latencia de UNA carga), pero bajo concurrencia real
-- eso significa hasta 4 conexiones simultaneas a Postgres por carga (mas
-- las 3-5 propias de cada pagina). Con el pool de 15 conexiones del tier
-- Nano de Supabase, 20 usuarios concurrentes generan facil 100+ intentos
-- de conexion simultaneos -- confirmado con logs reales de Vercel: 6
-- errores 500 durante la prueba de carga, con el error real de Supabase
-- "522: Connection timed out" (Cloudflare no pudo conectar a tiempo con
-- el origen).
--
-- Esta funcion devuelve en un solo viaje de ida y vuelta (1 conexion) todo
-- lo que resolveDashboardAccess() necesita para el camino mas comun:
-- perfil, rol_global, membresia de negocio (con el negocio embebido) y
-- acceso de sucursal por usuario_id (con la sucursal embebida). El
-- fallback por email (cuando sucursal_usuarios.usuario_id todavia no esta
-- vinculado) sigue siendo una consulta aparte en la aplicacion -- es un
-- camino raro (solo la primera vez que un empleado invitado inicia
-- sesion), no vale la pena complicar esta funcion por eso.
--
-- No cambia ningun resultado ni regla de negocio: son las mismas 4
-- consultas, en la misma funcion de Postgres, en vez de 4 llamados HTTP
-- separados desde la aplicacion.
--
-- IMPORTANTE: NO aplicar sin haber probado antes en un entorno de prueba
-- si es posible, y sin actualizar el codigo de
-- src/lib/dashboard/access-context.ts en el mismo momento (el codigo que
-- llama a esta RPC se entrega en un commit aparte, listo para activar
-- justo despues de aplicar esto). Si se aplica esta funcion pero el
-- codigo sigue sin usarla, no pasa nada -- la funcion queda ahi sin uso,
-- no rompe nada existente.
-- =====================================================================

begin;

create or replace function public.resolver_acceso_dashboard()
returns jsonb
    language plpgsql stable security definer
    set search_path to 'public'
    as $$
declare
  v_user_id uuid := auth.uid();
  v_perfil jsonb;
  v_rol_global text;
  v_membresia jsonb;
  v_acceso_sucursal jsonb;
begin
  if v_user_id is null then
    return jsonb_build_object('autenticado', false);
  end if;

  select jsonb_build_object(
    'nombre', p.nombre,
    'telefono', p.telefono,
    'cargo', p.cargo,
    'avatar_url', p.avatar_url,
    'tema', p.tema,
    'color_acento', p.color_acento,
    'recibir_notificaciones', p.recibir_notificaciones
  )
  into v_perfil
  from public.perfiles_usuario p
  where p.usuario_id = v_user_id
  limit 1;

  -- Mismo criterio que esPlatformOwner()/requirePlatformOwner(): buscar
  -- rol_global por id O por usuario_id, por la inconsistencia de claves
  -- conocida en perfiles_usuario (ver docs/admin-owner-panel-progress.md).
  select rol_global
  into v_rol_global
  from public.perfiles_usuario
  where id = v_user_id or usuario_id = v_user_id
  order by (usuario_id = v_user_id) desc
  limit 1;

  select jsonb_build_object(
    'negocio_id', nu.negocio_id,
    'rol', nu.rol,
    'activo', nu.activo,
    'negocio', jsonb_build_object(
      'id', n.id,
      'nombre', n.nombre,
      'slug', n.slug,
      'logo_url', n.logo_url,
      'estado', n.estado,
      'motivo_bloqueo', n.motivo_bloqueo,
      'bloqueado_at', n.bloqueado_at
    )
  )
  into v_membresia
  from public.negocio_usuarios nu
  join public.negocios n on n.id = nu.negocio_id
  where nu.usuario_id = v_user_id and nu.activo = true
  limit 1;

  select jsonb_build_object(
    'id', su.id,
    'negocio_id', su.negocio_id,
    'sucursal_id', su.sucursal_id,
    'usuario_id', su.usuario_id,
    'empleado_id', su.empleado_id,
    'nombre', su.nombre,
    'cargo', su.cargo,
    'avatar_url', su.avatar_url,
    'email', su.email,
    'rol', su.rol,
    'activo', su.activo,
    'sucursales', jsonb_build_object(
      'id', s.id,
      'nombre', s.nombre,
      'estado', s.estado
    )
  )
  into v_acceso_sucursal
  from public.sucursal_usuarios su
  join public.sucursales s on s.id = su.sucursal_id
  where su.usuario_id = v_user_id and su.activo = true
  limit 1;

  return jsonb_build_object(
    'autenticado', true,
    'perfil', v_perfil,
    'rol_global', v_rol_global,
    'membresia_negocio', v_membresia,
    'acceso_sucursal', v_acceso_sucursal
  );
end;
$$;

revoke execute on function public.resolver_acceso_dashboard() from public;
revoke execute on function public.resolver_acceso_dashboard() from anon;
grant execute on function public.resolver_acceso_dashboard() to authenticated;

commit;

-- Verificacion posterior sugerida (solo lectura, con una sesion real):
--   select resolver_acceso_dashboard();
-- Debe devolver un jsonb con la misma informacion que hoy arman las 4
-- consultas separadas para ese mismo usuario.

-- Rollback: la funcion no se usa hasta que access-context.ts la llame
-- (ver commit aparte). Si hace falta revertir, alcanza con no actualizar
-- ese archivo -- la funcion puede quedar creada sin uso sin ningun
-- efecto. Si se quiere eliminarla del todo:
-- drop function if exists public.resolver_acceso_dashboard();
