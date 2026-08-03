-- =====================================================================
-- AgendaMe: activacion atomica de empleados y clientes respetando el
-- limite del plan (misma condicion de carrera ya cerrada para servicios
-- en supabase/patches/2026-08-activar-servicio-atomico.sql).
--
-- APLICADO: SI (confirmado en vivo el 2026-08-02: activar_empleado_con_limite
-- y activar_cliente_con_limite existen y responden via /rest/v1/rpc/...).
--
-- Empleados y clientes usaban el mismo chequeo en dos pasos (leer
-- conteo, despues actualizar) que servicios. Si dos activaciones
-- llegaban casi al mismo tiempo, ambas podian pasar la validacion
-- aunque juntas superaran el limite del plan. Se cierra con un lock
-- exclusivo por negocio y recurso (pg_advisory_xact_lock) dentro de
-- una unica transaccion.
--
-- Seguro para datos existentes: no modifica ninguna tabla ni fila.
-- =====================================================================

begin;

create or replace function public.activar_empleado_con_limite(
  p_empleado_id uuid,
  p_negocio_id uuid
)
returns table (
  ok boolean,
  mensaje text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_estado_actual text;
  v_plan_nombre text;
  v_limite integer;
  v_usados integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('empleados_activos:' || p_negocio_id::text, 0));

  select e.estado into v_estado_actual
  from public.empleados e
  where e.id = p_empleado_id
    and e.negocio_id = p_negocio_id;

  if v_estado_actual is null then
    return query select false, 'El empleado no existe.'::text;
    return;
  end if;

  if v_estado_actual = 'activo' then
    return query select true, null::text;
    return;
  end if;

  select p.nombre, p.limite_empleados
  into v_plan_nombre, v_limite
  from public.suscripciones sub
  join public.planes_saas p on p.id = sub.plan_id
  where sub.negocio_id = p_negocio_id
    and sub.estado = 'activa'
  order by sub.created_at desc
  limit 1;

  if v_plan_nombre is null then
    select p.nombre, p.limite_empleados
    into v_plan_nombre, v_limite
    from public.planes_saas p
    where p.clave = 'gratis';
  end if;

  select count(*)::integer into v_usados
  from public.empleados e
  where e.negocio_id = p_negocio_id
    and e.estado = 'activo';

  if v_limite is not null and v_usados >= v_limite then
    return query select
      false,
      format(
        'Tu negocio supera los limites del plan %s. Para activar mas empleados, subi de plan o desactiva otros hasta quedar dentro del limite.',
        v_plan_nombre
      );
    return;
  end if;

  update public.empleados
  set estado = 'activo'
  where id = p_empleado_id
    and negocio_id = p_negocio_id;

  return query select true, null::text;
end;
$$;

revoke all on function public.activar_empleado_con_limite(uuid, uuid) from public, anon, authenticated;

create or replace function public.activar_cliente_con_limite(
  p_cliente_id uuid,
  p_negocio_id uuid
)
returns table (
  ok boolean,
  mensaje text
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_estado_actual text;
  v_plan_nombre text;
  v_limite integer;
  v_usados integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('clientes_activos:' || p_negocio_id::text, 0));

  select c.estado into v_estado_actual
  from public.clientes c
  where c.id = p_cliente_id
    and c.negocio_id = p_negocio_id;

  if v_estado_actual is null then
    return query select false, 'El cliente no existe.'::text;
    return;
  end if;

  if v_estado_actual = 'activo' then
    return query select true, null::text;
    return;
  end if;

  select p.nombre, p.limite_clientes
  into v_plan_nombre, v_limite
  from public.suscripciones sub
  join public.planes_saas p on p.id = sub.plan_id
  where sub.negocio_id = p_negocio_id
    and sub.estado = 'activa'
  order by sub.created_at desc
  limit 1;

  if v_plan_nombre is null then
    select p.nombre, p.limite_clientes
    into v_plan_nombre, v_limite
    from public.planes_saas p
    where p.clave = 'gratis';
  end if;

  select count(*)::integer into v_usados
  from public.clientes c
  where c.negocio_id = p_negocio_id
    and c.estado = 'activo';

  if v_limite is not null and v_usados >= v_limite then
    return query select
      false,
      format(
        'Tu negocio supera los limites del plan %s. Para activar mas clientes, subi de plan o desactiva otros hasta quedar dentro del limite.',
        v_plan_nombre
      );
    return;
  end if;

  update public.clientes
  set estado = 'activo'
  where id = p_cliente_id
    and negocio_id = p_negocio_id;

  return query select true, null::text;
end;
$$;

revoke all on function public.activar_cliente_con_limite(uuid, uuid) from public, anon, authenticated;

commit;
