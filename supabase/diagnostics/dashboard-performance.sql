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
