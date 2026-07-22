-- =====================================================================
-- APLICADO: 2026-07-22, por el propietario en Supabase Studio.
-- Patch/propuesta: filtros de fecha "sargables" para citas_mes_actual
-- Fecha: 2026-07-22
--
-- Contexto (auditoria de carga, ver docs/load-test-audit-2026-07-22.md y
-- tests/load/results/): con datos de prueba (decenas de filas por tabla)
-- esto NO es el cuello de botella medido hoy -- el problema real de
-- latencia esta en la cantidad de viajes de ida y vuelta a Supabase por
-- request del dashboard de negocio (ver commit de optimizacion de
-- src/lib/dashboard/access-context.ts). Este patch es preventivo: a medida
-- que "citas" crezca con datos reales (el objetivo es soportar 100
-- negocios), el patron actual se vuelve cada vez mas costoso.
--
-- Hallazgo: tanto la vista vista_admin_negocios_resumen (columna
-- citas_mes_actual) como la funcion recalcular_uso_plan_mensual_citas(
-- negocio_id, fecha) filtran citas con:
--   extract(year from fecha) = extract(year from now())
--   and extract(month from fecha) = extract(month from now())
-- Envolver la columna en extract() impide que Postgres use el indice
-- idx_citas_negocio_fecha (negocio_id, fecha) como un rango -- tiene que
-- revisar fila por fila dentro del negocio en vez de saltar directo al
-- rango del mes. Con pocas citas por negocio no se nota; con miles de
-- citas historicas por negocio (esperable tras meses de uso real en 100
-- negocios) si.
--
-- Cambio propuesto: reemplazar por un rango [inicio_mes, inicio_mes +
-- 1 mes) usando date_trunc(), que si es "sargable" (usa el indice como
-- rango). No cambia ningun resultado -- es la misma condicion logica
-- expresada de forma que el planner puede optimizar.
--
-- Verificacion previa recomendada antes de aplicar (de solo lectura):
--   explain analyze select count(*) from citas
--   where negocio_id = '<uuid de un negocio de prueba>'
--     and extract(year from fecha) = extract(year from now())
--     and extract(month from fecha) = extract(month from now());
-- Comparar el plan contra:
--   explain analyze select count(*) from citas
--   where negocio_id = '<mismo uuid>'
--     and fecha >= date_trunc('month', now())
--     and fecha < date_trunc('month', now()) + interval '1 month';
-- Si el segundo plan usa "Index Scan using idx_citas_negocio_fecha" con un
-- rango en vez de revisar todas las filas del negocio, confirma la mejora.
--
-- No se ejecuto ningun EXPLAIN ni ningun cambio real contra produccion.
-- Requiere autorizacion explicita para aplicarse.
-- =====================================================================

begin;

create or replace view public.vista_admin_negocios_resumen
with (security_invoker = true) as
select
  n.id as negocio_id,
  n.nombre,
  n.rubro,
  n.slug,
  n.telefono,
  n.email,
  n.estado,
  n.created_at,
  p.nombre as plan_nombre,
  p.clave as plan_clave,
  p.precio_gs,
  s.estado as suscripcion_estado,
  s.fecha_inicio,
  s.fecha_vencimiento,
  coalesce(u.citas_creadas, 0) as citas_usadas_mes_actual,
  p.limite_citas_mensuales,
  (select count(*) from public.clientes c where c.negocio_id = n.id) as clientes_total,
  (select count(*) from public.empleados e where e.negocio_id = n.id) as empleados_total,
  (select count(*) from public.servicios sv where sv.negocio_id = n.id) as servicios_total,
  (select count(*) from public.citas ci where ci.negocio_id = n.id) as citas_total,
  (
    select count(*) from public.citas ci
    where ci.negocio_id = n.id
      and ci.fecha >= date_trunc('month', now())
      and ci.fecha < date_trunc('month', now()) + interval '1 month'
  ) as citas_mes_actual,
  pm.estado as ultimo_pago_estado,
  pm.fecha_pago as ultimo_pago_fecha,
  case
    when s.fecha_vencimiento is null then null::integer
    else floor(extract(epoch from (s.fecha_vencimiento - now())) / 86400)::integer
  end as dias_para_vencer
from public.negocios n
left join lateral (
  select s2.*
  from public.suscripciones s2
  where s2.negocio_id = n.id and s2.estado = 'activa'
  order by s2.created_at desc
  limit 1
) s on true
left join public.planes_saas p on p.id = s.plan_id
left join public.uso_plan_mensual u
  on u.negocio_id = n.id
 and u.anio = extract(year from now())::integer
 and u.mes = extract(month from now())::integer
left join lateral (
  select pm2.*
  from public.pagos_manuales pm2
  where pm2.negocio_id = n.id
  order by pm2.created_at desc
  limit 1
) pm on true;

-- recalcular_uso_plan_mensual_citas(negocio_id, fecha): misma correccion,
-- ahora recibe el mes objetivo y arma el rango explicito en vez de
-- extract(). Firma identica, sin cambios de comportamiento.
create or replace function public.recalcular_uso_plan_mensual_citas(
  p_negocio_id uuid,
  p_fecha date
) returns void
    language plpgsql security definer
    set search_path to 'public'
    as $$
declare
  v_anio integer := extract(year from p_fecha)::integer;
  v_mes integer := extract(month from p_fecha)::integer;
  v_inicio date := date_trunc('month', p_fecha)::date;
  v_fin date := (date_trunc('month', p_fecha) + interval '1 month')::date;
  v_total integer;
begin
  select count(*)
  into v_total
  from public.citas c
  where c.negocio_id = p_negocio_id
    and c.fecha >= v_inicio
    and c.fecha < v_fin
    and public.cita_cuenta_para_limite(c.estado);

  insert into public.uso_plan_mensual (
    negocio_id, anio, mes, citas_creadas
  )
  values (
    p_negocio_id, v_anio, v_mes, v_total
  )
  on conflict (negocio_id, anio, mes)
  do update set
    citas_creadas = excluded.citas_creadas,
    updated_at = now();
end;
$$;

commit;

-- Rollback: restaurar la version anterior de la vista y la funcion desde
-- el schema.sql de respaldo si algo sale mal (mismo resultado logico,
-- rollback es solo por seguridad operativa, no porque se espere una falla).
