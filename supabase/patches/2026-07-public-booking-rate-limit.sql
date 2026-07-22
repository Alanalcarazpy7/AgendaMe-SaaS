-- =====================================================================
-- Patch: rate limit persistente para reservas publicas
-- Fecha: 2026-07
--
-- PENDIENTE DE APLICAR en Supabase Studio > SQL Editor.
-- La app usa esta RPC solamente desde el servidor con service_role.
-- Las claves llegan como HMAC SHA-256; no se guardan IP ni telefonos.
-- =====================================================================

begin;

create table if not exists public.api_rate_limits (
  key_hash text primary key,
  attempts bigint not null default 0 check (attempts >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint api_rate_limits_key_hash_format
    check (key_hash ~ '^[a-f0-9]{64}$')
);

alter table public.api_rate_limits enable row level security;

revoke all on table public.api_rate_limits from public, anon, authenticated;

create index if not exists api_rate_limits_reset_at_idx
  on public.api_rate_limits (reset_at);

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_attempts bigint;
  v_reset_at timestamptz;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'La clave del rate limit no es valida.' using errcode = '22023';
  end if;

  if p_limit is null or p_limit < 1 then
    raise exception 'El limite debe ser mayor a cero.' using errcode = '22023';
  end if;

  if p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'La ventana debe ser mayor a cero.' using errcode = '22023';
  end if;

  insert into public.api_rate_limits as limits (
    key_hash,
    attempts,
    reset_at,
    updated_at
  )
  values (
    p_key_hash,
    1,
    v_now + make_interval(secs => p_window_seconds),
    v_now
  )
  on conflict (key_hash) do update
  set
    attempts = case
      when limits.reset_at <= v_now then 1
      else limits.attempts + 1
    end,
    reset_at = case
      when limits.reset_at <= v_now
        then v_now + make_interval(secs => p_window_seconds)
      else limits.reset_at
    end,
    updated_at = v_now
  returning limits.attempts, limits.reset_at
  into v_attempts, v_reset_at;

  return query
  select
    v_attempts <= p_limit,
    greatest(p_limit - least(v_attempts, p_limit)::integer, 0),
    v_reset_at,
    case
      when v_attempts <= p_limit then 0
      else greatest(ceil(extract(epoch from (v_reset_at - v_now)))::integer, 1)
    end;
end;
$$;

revoke execute on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

comment on table public.api_rate_limits is
  'Contadores de rate limit server-side. Las claves son HMAC y no contienen datos personales legibles.';

comment on function public.consume_api_rate_limit(text, integer, integer) is
  'Consume atomicamente un intento de una ventana fija. Ejecutable solo por service_role.';

commit;

-- Limpieza operativa recomendada (manual o tarea programada diaria):
-- delete from public.api_rate_limits where reset_at < now() - interval '1 day';

-- Validacion posterior:
-- select routine_name
-- from information_schema.routines
-- where routine_schema = 'public'
--   and routine_name = 'consume_api_rate_limit';
--
-- select grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name = 'consume_api_rate_limit';

-- Rollback:
-- begin;
-- drop function if exists public.consume_api_rate_limit(text, integer, integer);
-- drop table if exists public.api_rate_limits;
-- commit;
