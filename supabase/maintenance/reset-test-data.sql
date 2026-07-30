-- =====================================================================
-- AgendaMe: limpieza total de datos operativos para volver a probar
--
-- DESTRUCTIVO. No ejecutar sin:
-- 1. un backup .dump reciente y validado;
-- 2. ejecutar antes scripts/clear-supabase-test-storage.mjs;
-- 3. reemplazar el UUID cero por cada owner que se deba conservar;
-- 4. revisar el resumen de scripts/audit-supabase-bootstrap.mjs.
--
-- Conserva:
-- - los usuarios Auth incluidos en _agendame_keep_users;
-- - sus perfiles, obligatoriamente con rol_global = super_admin;
-- - planes_saas y permisos;
-- - definiciones del schema, vistas, funciones, triggers, RLS y buckets.
--
-- Elimina:
-- - todos los negocios y datos dependientes;
-- - auditoria y contadores de rate limit;
-- - perfiles y usuarios Auth que no esten en la lista protegida.
--
-- El script aborta completo ante cualquier validacion fallida.
-- =====================================================================

begin;

set local lock_timeout = '10s';
set local statement_timeout = '5min';

create temporary table _agendame_keep_users (
  user_id uuid primary key
) on commit drop;

-- REEMPLAZAR. Se puede agregar mas de una fila si la aplicacion fue
-- configurada expresamente para aceptar varios platform owners.
insert into _agendame_keep_users (user_id)
values ('00000000-0000-0000-0000-000000000000');

do $preflight$
declare
  v_storage_pendiente bigint;
  v_planes_base integer;
begin
  if exists (
    select 1
    from _agendame_keep_users
    where user_id = '00000000-0000-0000-0000-000000000000'
  ) then
    raise exception
      'Reemplaza el UUID cero por el auth.users.id real del owner protegido.';
  end if;

  if exists (
    select 1
    from _agendame_keep_users keep
    left join auth.users users on users.id = keep.user_id
    where users.id is null
  ) then
    raise exception
      'Al menos un UUID protegido no existe en auth.users.';
  end if;

  if exists (
    select 1
    from _agendame_keep_users keep
    where not exists (
      select 1
      from public.perfiles_usuario profiles
      where (
          profiles.id = keep.user_id
          or profiles.usuario_id = keep.user_id
        )
        and profiles.rol_global = 'super_admin'
    )
  ) then
    raise exception
      'Cada owner protegido debe tener un perfil con rol_global=super_admin.';
  end if;

  select count(*)
  into v_storage_pendiente
  from storage.objects objects
  where not (
    objects.bucket_id = 'avatars'
    and exists (
      select 1
      from _agendame_keep_users keep
      where split_part(objects.name, '/', 1) = keep.user_id::text
    )
  );

  if v_storage_pendiente > 0 then
    raise exception
      'Quedan % archivos no protegidos en Storage. Ejecuta primero el limpiador por API.',
      v_storage_pendiente;
  end if;

  select count(distinct clave)
  into v_planes_base
  from public.planes_saas
  where clave in ('gratis', 'basico', 'profesional', 'empresarial');

  if v_planes_base <> 4 then
    raise exception
      'Faltan planes base. Ejecuta y verifica supabase/seed.sql antes de limpiar.';
  end if;
end
$preflight$;

-- negocios es la raiz del tenant. CASCADE incluye citas, clientes,
-- sucursales, accesos, suscripciones, pagos, historial y demas hijos.
truncate table
  public.negocios,
  public.auditoria,
  public.api_rate_limits
restart identity cascade;

delete from public.perfiles_usuario profiles
where not exists (
  select 1
  from _agendame_keep_users keep
  where profiles.id = keep.user_id
     or profiles.usuario_id = keep.user_id
);

update public.perfiles_usuario profiles
set
  rol_global = 'super_admin',
  updated_at = now()
where exists (
  select 1
  from _agendame_keep_users keep
  where profiles.id = keep.user_id
     or profiles.usuario_id = keep.user_id
);

-- auth.users administra sus propias identidades y sesiones mediante FK.
delete from auth.users users
where not exists (
  select 1
  from _agendame_keep_users keep
  where keep.user_id = users.id
);

do $verification$
begin
  if exists (select 1 from public.negocios) then
    raise exception 'La verificacion final encontro negocios remanentes.';
  end if;

  if exists (
    select 1
    from auth.users users
    where not exists (
      select 1
      from _agendame_keep_users keep
      where keep.user_id = users.id
    )
  ) then
    raise exception 'La verificacion final encontro usuarios no protegidos.';
  end if;

  if exists (
    select 1
    from public.perfiles_usuario profiles
    where not exists (
      select 1
      from _agendame_keep_users keep
      where profiles.id = keep.user_id
         or profiles.usuario_id = keep.user_id
    )
  ) then
    raise exception 'La verificacion final encontro perfiles no protegidos.';
  end if;

  if (
    select count(distinct clave)
    from public.planes_saas
    where clave in ('gratis', 'basico', 'profesional', 'empresarial')
  ) <> 4 then
    raise exception 'Los cuatro planes base no quedaron disponibles.';
  end if;

  if (
    select count(distinct clave)
    from public.permisos
    where clave in (
      'citas.crear',
      'citas.editar',
      'citas.ver_todas',
      'clientes.crear',
      'clientes.editar',
      'empleados.administrar',
      'servicios.administrar',
      'reportes.ver',
      'configuracion.editar',
      'plan.administrar'
    )
  ) <> 10 then
    raise exception 'Los diez permisos base no quedaron disponibles.';
  end if;
end
$verification$;

commit;

-- Resultado esperado:
-- - auth.users: solo owners protegidos
-- - perfiles_usuario: solo owners protegidos, todos super_admin
-- - negocios: 0
-- - planes_saas: 4 catalogos base
-- - permisos: 10 catalogos base
