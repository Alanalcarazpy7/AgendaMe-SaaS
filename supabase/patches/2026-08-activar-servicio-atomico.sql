-- =====================================================================
-- AgendaMe: activacion atomica de servicios respetando el limite del plan
--
-- APLICADO: SI (confirmado en vivo el 2026-08-02: la funcion existe y
-- responde correctamente via /rest/v1/rpc/activar_servicio_con_limite).
--
-- Problema: la validacion de "cupo disponible" se hacia en dos pasos
-- separados (leer conteo actual, despues actualizar el estado) desde la
-- API. Si dos solicitudes de activacion llegaban casi al mismo tiempo
-- (ej: activar dos servicios ocultos en simultaneo), ambas podian leer
-- el mismo conteo "viejo" antes de que la otra confirmara su cambio, y
-- las dos pasaban la validacion aunque juntas superaran el limite del
-- plan. Esto es una condicion de carrera clasica (TOCTOU).
--
-- Solucion: mover el chequeo + la actualizacion a una unica funcion de
-- Postgres que toma un lock exclusivo por negocio (pg_advisory_xact_lock)
-- antes de contar y escribir, todo dentro de una sola transaccion. Una
-- segunda solicitud concurrente queda en espera hasta que la primera
-- termine, y entonces cuenta con datos ya actualizados.
--
-- Seguro para datos existentes: no modifica ninguna tabla ni fila.
-- =====================================================================

begin;

create or replace function public.activar_servicio_con_limite(
  p_servicio_id uuid,
  p_negocio_id uuid
)
returns table (
  ok boolean,
  mensaje text,
  plan_nombre text,
  limite integer,
  usados integer
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
  -- Serializa todas las activaciones de servicios de este negocio: la
  -- segunda llamada concurrente espera a que la primera termine su
  -- transaccion antes de contar y decidir.
  perform pg_advisory_xact_lock(hashtextextended('servicios_activos:' || p_negocio_id::text, 0));

  select s.estado into v_estado_actual
  from public.servicios s
  where s.id = p_servicio_id
    and s.negocio_id = p_negocio_id;

  if v_estado_actual is null then
    return query select false, 'El servicio no existe.'::text, null::text, null::integer, null::integer;
    return;
  end if;

  if v_estado_actual = 'activo' then
    return query select true, null::text, null::text, null::integer, null::integer;
    return;
  end if;

  select p.nombre, p.limite_servicios
  into v_plan_nombre, v_limite
  from public.suscripciones sub
  join public.planes_saas p on p.id = sub.plan_id
  where sub.negocio_id = p_negocio_id
    and sub.estado = 'activa'
  order by sub.created_at desc
  limit 1;

  if v_plan_nombre is null then
    select p.nombre, p.limite_servicios
    into v_plan_nombre, v_limite
    from public.planes_saas p
    where p.clave = 'gratis';
  end if;

  select count(*)::integer into v_usados
  from public.servicios s
  where s.negocio_id = p_negocio_id
    and s.estado = 'activo';

  if v_limite is not null and v_usados >= v_limite then
    return query select
      false,
      format(
        'Tu negocio supera los limites del plan %s. Para activar mas servicios, subi de plan o desactiva otros hasta quedar dentro del limite.',
        v_plan_nombre
      ),
      v_plan_nombre,
      v_limite,
      v_usados;
    return;
  end if;

  update public.servicios
  set estado = 'activo'
  where id = p_servicio_id
    and negocio_id = p_negocio_id;

  return query select true, null::text, v_plan_nombre, v_limite, v_usados + 1;
end;
$$;

revoke all on function public.activar_servicio_con_limite(uuid, uuid) from public, anon, authenticated;

commit;
