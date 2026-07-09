-- =====================================================================
-- Patch: vinculo entre accesos de sucursal (login) y plantilla de empleados
-- Fecha: 2026-07
--
-- IMPORTANTE: este patch todavia NO fue aplicado. Ejecutarlo manualmente
-- en el editor SQL de Supabase antes de usar la funcionalidad de
-- "vincular personal a empleado" en el dashboard.
--
-- Contexto: sucursal_usuarios (quien puede iniciar sesion en el panel
-- de una sucursal) y empleados (la plantilla operativa con horarios,
-- servicios y color de calendario) son dos tablas independientes, sin
-- ningun vinculo entre si. Esto agrega una columna opcional empleado_id
-- para que, cuando el rol de acceso sea "empleado_sucursal", se pueda
-- identificar a que fila de empleados corresponde esa cuenta y asi
-- filtrar el calendario de citas a solo lo que le corresponde.
--
-- La columna es NULLABLE en ambas tablas: no afecta ningun registro ni
-- consulta existente que no la use explicitamente. Los roles gerente_sucursal
-- y recepcionista_sucursal no la necesitan y quedan siempre en null.
-- =====================================================================

begin;

alter table public.sucursal_invitaciones
  add column if not exists empleado_id uuid references public.empleados(id) on delete set null;

comment on column public.sucursal_invitaciones.empleado_id is
  'Fila de empleados a la que quedara vinculada la cuenta cuando se acepte la invitacion. Solo aplica para rol empleado_sucursal.';

alter table public.sucursal_usuarios
  add column if not exists empleado_id uuid references public.empleados(id) on delete set null;

comment on column public.sucursal_usuarios.empleado_id is
  'Fila de empleados que corresponde a esta cuenta de acceso. Se usa para filtrar el calendario de citas cuando rol = empleado_sucursal. Null para gerente_sucursal y recepcionista_sucursal.';

create index if not exists idx_sucursal_usuarios_empleado_id
  on public.sucursal_usuarios (empleado_id);

commit;
0