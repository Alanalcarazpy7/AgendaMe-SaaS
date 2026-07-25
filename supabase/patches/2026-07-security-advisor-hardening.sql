-- =====================================================================
-- Patch: hardening adicional indicado por Supabase Security Advisor
-- Fecha: 2026-07-22
--
-- APLICADO: SI, por el usuario en Supabase el 2026-07-22
--
-- Alcance:
-- 1. Impide que anon invoque funciones SECURITY DEFINER de public.
-- 2. Conserva los permisos efectivos actuales de authenticated y
--    service_role para no alterar los flujos existentes.
-- 3. Quita EXECUTE directo de funciones trigger a roles API: los
--    triggers siguen ejecutandose normalmente desde Postgres.
-- 4. Fija search_path en las tres funciones marcadas por el Advisor.
-- 5. Quita policies SELECT que permiten listar buckets publicos. Los
--    archivos siguen disponibles mediante sus URLs publicas.
--
-- No mueve btree_gist ni cambia configuracion de Auth. La proteccion de
-- contrasenas filtradas se habilita desde Auth > Password Security y
-- requiere un plan de Supabase compatible.
-- =====================================================================

begin;

-- Revoke PUBLIC tambien es necesario: anon hereda sus permisos. Antes
-- de revocarlo se recuerda si authenticated/service_role tenian acceso
-- efectivo y se lo vuelve explicito, conservando el comportamiento.
do $hardening$
declare
  v_function record;
  v_authenticated_can_execute boolean;
  v_service_role_can_execute boolean;
begin
  for v_function in
    select
      p.oid,
      format(
        '%I.%I(%s)',
        n.nspname,
        p.proname,
        pg_get_function_identity_arguments(p.oid)
      ) as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  loop
    v_authenticated_can_execute :=
      has_function_privilege('authenticated', v_function.oid, 'EXECUTE');
    v_service_role_can_execute :=
      has_function_privilege('service_role', v_function.oid, 'EXECUTE');

    execute format(
      'revoke execute on function %s from public, anon',
      v_function.signature
    );

    if v_authenticated_can_execute then
      execute format(
        'grant execute on function %s to authenticated',
        v_function.signature
      );
    end if;

    if v_service_role_can_execute then
      execute format(
        'grant execute on function %s to service_role',
        v_function.signature
      );
    end if;
  end loop;
end
$hardening$;

-- Las funciones que retornan trigger no son RPC. El motor de Postgres
-- no comprueba EXECUTE del usuario de la fila al disparar un trigger.
do $triggers$
declare
  v_function record;
begin
  for v_function in
    select format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    ) as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.prorettype = 'pg_catalog.trigger'::regtype
  loop
    execute format(
      'revoke execute on function %s from public, anon, authenticated',
      v_function.signature
    );
  end loop;
end
$triggers$;

-- Se usa un path fijo compatible con las definiciones actuales. El
-- bucle cubre de forma segura cualquier sobrecarga existente.
do $search_path$
declare
  v_function record;
begin
  for v_function in
    select format(
      '%I.%I(%s)',
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid)
    ) as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'set_updated_at',
        'storage_negocio_id',
        'cita_cuenta_para_limite'
      )
  loop
    execute format(
      'alter function %s set search_path = public, pg_temp',
      v_function.signature
    );
  end loop;
end
$search_path$;

-- En buckets publicos la descarga por URL no necesita una policy SELECT.
-- Estas policies solo agregaban capacidad de listar storage.objects.
drop policy if exists business_branding_public_select on storage.objects;
drop policy if exists logos_negocios_lectura_publica on storage.objects;
drop policy if exists service_images_public_select on storage.objects;

commit;

-- Verificacion posterior de solo lectura:
-- select n.nspname, p.proname,
--   has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
--   has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_execute,
--   p.proconfig
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.prosecdef
-- order by p.proname;
--
-- select policyname, roles, cmd, qual
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
-- order by policyname;
