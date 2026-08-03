-- =====================================================================
-- AgendaMe: corrige vista_admin_negocios_resumen para contar solo
-- recursos ACTIVOS de clientes, empleados y servicios.
--
-- APLICADO: pendiente de ejecutar en el SQL Editor de Supabase.
--
-- Bug encontrado: clientes_total, empleados_total y servicios_total
-- contaban TODAS las filas del negocio (activas e inactivas), mientras
-- que el limite del plan (y el conteo que usa el propio dashboard del
-- negocio en src/lib/planes/plan-limits.ts) solo cuenta las ACTIVAS.
-- Resultado: un negocio con, por ejemplo, 6 servicios creados pero solo
-- 4 activos (2 ocultos) aparecia en /admin/negocios/[id] como "6/5,
-- sobre el limite" en rojo, cuando en la practica seguia dentro del
-- limite (4/5). Esto tambien inflaba artificialmente la tarjeta
-- "Consumo alto del plan" del panel admin.
--
-- Cambio: agrega "and estado = 'activo'" a las tres subconsultas de
-- conteo. No cambia ninguna otra columna ni logica de la vista (incluida
-- la optimizacion sargable de fechas de citas_mes_actual, ya aplicada).
--
-- Seguro para datos existentes: es un create or replace view, no borra
-- ni modifica ninguna fila.
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
  (select count(*) from public.clientes c where c.negocio_id = n.id and c.estado = 'activo') as clientes_total,
  (select count(*) from public.empleados e where e.negocio_id = n.id and e.estado = 'activo') as empleados_total,
  (select count(*) from public.servicios sv where sv.negocio_id = n.id and sv.estado = 'activo') as servicios_total,
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

commit;
