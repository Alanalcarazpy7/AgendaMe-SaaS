-- Diagnostico de solo lectura para ejecutar en Supabase SQL Editor.
-- No crea, modifica ni elimina objetos o datos.

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'citas',
    'clientes',
    'cliente_sucursales',
    'empleados',
    'empleado_servicios',
    'horarios_empleado',
    'servicios',
    'sucursales',
    'suscripciones',
    'negocio_usuarios',
    'sucursal_usuarios',
    'pagos_manuales'
  )
order by tablename, indexname;

select
  relname as tabla,
  seq_scan,
  idx_scan,
  n_live_tup as filas_estimadas,
  n_dead_tup as filas_muertas,
  last_analyze,
  last_autoanalyze
from pg_stat_user_tables
where schemaname = 'public'
  and relname in (
    'citas',
    'clientes',
    'cliente_sucursales',
    'empleados',
    'empleado_servicios',
    'horarios_empleado',
    'servicios',
    'sucursales',
    'suscripciones',
    'negocio_usuarios',
    'sucursal_usuarios',
    'pagos_manuales'
  )
order by seq_scan desc, relname;

select
  relname as tabla,
  indexrelname as indice,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
from pg_stat_user_indexes
where schemaname = 'public'
  and relname in (
    'citas',
    'clientes',
    'cliente_sucursales',
    'empleados',
    'empleado_servicios',
    'horarios_empleado',
    'servicios',
    'sucursales',
    'suscripciones',
    'negocio_usuarios',
    'sucursal_usuarios',
    'pagos_manuales'
  )
order by idx_scan asc, relname, indexrelname;

-- Foto del uso actual del pool. Durante una prueba de carga interesan en
-- especial muchas conexiones active, wait_event_type = 'Lock' o esperas de IO.
select
  backend_type,
  state,
  wait_event_type,
  wait_event,
  count(*) as conexiones
from pg_stat_activity
where datname = current_database()
group by backend_type, state, wait_event_type, wait_event
order by conexiones desc, backend_type, state;

-- Consultas que mas tiempo total consumieron desde el ultimo reset de las
-- estadisticas. Ejecutar despues de k6 y compartir las primeras filas.
select
  queryid,
  calls,
  round(total_exec_time::numeric, 2) as tiempo_total_ms,
  round(mean_exec_time::numeric, 2) as promedio_ms,
  round(max_exec_time::numeric, 2) as maximo_ms,
  rows,
  shared_blks_hit,
  shared_blks_read,
  temp_blks_written,
  left(regexp_replace(query, E'[\\n\\r\\t ]+', ' ', 'g'), 500) as consulta
from pg_stat_statements
where dbid = (select oid from pg_database where datname = current_database())
order by total_exec_time desc
limit 30;
