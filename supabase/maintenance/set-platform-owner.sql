-- =====================================================================
-- AgendaMe: promover una cuenta Auth existente a platform owner
--
-- La cuenta y su contrasena se crean primero desde Supabase Auth.
-- Este archivo no contiene ni genera credenciales.
--
-- IMPORTANTE: la aplicacion actual permite un solo platform owner,
-- definido por ADMIN_OWNER_USER_ID. Crear otro perfil super_admin no le
-- dara acceso a /admin mientras su UUID no este en la configuracion de
-- servidor correspondiente.
-- =====================================================================

begin;

create temporary table _agendame_owner_config (
  email text primary key,
  nombre text not null
) on commit drop;

-- REEMPLAZAR ambos valores antes de ejecutar.
insert into _agendame_owner_config (email, nombre)
values ('reemplazar@correo.com', 'Propietario AgendaMe');

do $promote$
declare
  v_user auth.users%rowtype;
  v_nombre text;
  v_profile_count integer;
begin
  select users.*
  into v_user
  from auth.users users
  join _agendame_owner_config config
    on lower(users.email) = lower(config.email)
  limit 1;

  select config.nombre
  into v_nombre
  from _agendame_owner_config config
  limit 1;

  if v_user.id is null then
    raise exception
      'No existe una cuenta Auth con el correo configurado.';
  end if;

  if lower(coalesce(v_user.email, '')) = 'reemplazar@correo.com' then
    raise exception 'Reemplaza el correo de ejemplo antes de ejecutar.';
  end if;

  select count(*)
  into v_profile_count
  from public.perfiles_usuario profiles
  where profiles.id = v_user.id
     or profiles.usuario_id = v_user.id;

  if v_profile_count > 1 then
    raise exception
      'Hay mas de un perfil para este usuario. Resuelve la duplicidad antes de promoverlo.';
  end if;

  if v_profile_count = 0 then
    insert into public.perfiles_usuario (
      id,
      usuario_id,
      nombre_completo,
      nombre,
      email,
      rol_global,
      tipo_cuenta
    )
    values (
      v_user.id,
      v_user.id,
      v_nombre,
      v_nombre,
      v_user.email,
      'super_admin',
      'negocio'
    );
  else
    update public.perfiles_usuario profiles
    set
      usuario_id = v_user.id,
      nombre_completo = coalesce(nullif(profiles.nombre_completo, ''), v_nombre),
      nombre = coalesce(nullif(profiles.nombre, ''), v_nombre),
      email = v_user.email,
      rol_global = 'super_admin',
      updated_at = now()
    where profiles.id = v_user.id
       or profiles.usuario_id = v_user.id;
  end if;
end
$promote$;

commit;

-- Despues de ejecutar:
-- 1. Copiar auth.users.id de esta cuenta.
-- 2. Configurarlo como ADMIN_OWNER_USER_ID en .env.local y Vercel.
-- 3. Reiniciar/redeployar la aplicacion.
