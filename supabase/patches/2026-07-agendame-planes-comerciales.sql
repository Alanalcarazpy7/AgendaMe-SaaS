-- =====================================================================
-- Patch: planes comerciales (precios mensual/anual, limites, vista publica)
-- Fecha: 2026-07
--
-- IMPORTANTE: este patch ya fue aplicado manualmente en el proyecto de
-- Supabase de produccion. Este archivo queda en el repo solo como
-- respaldo/documentacion y para poder reproducir el estado en otro
-- entorno (staging, entorno local nuevo, etc). NO se ejecuta
-- automaticamente.
--
-- Contexto: el esquema base (AGENDAPRO_FASE1_v3_2_COMPLETA_FINAL_REVISADA.sql)
-- solo define planes_saas con precio_gs (mensual, legacy) y limites de
-- citas/empleados/servicios. Este patch agrega precio mensual/anual
-- explicitos, limites de clientes/sucursales, flags de UI publica y la
-- vista public.vista_planes_publicos como fuente unica de verdad para
-- landing, /planes, /dashboard/planes, WhatsApp y comparativas.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Columnas nuevas en planes_saas
-- ---------------------------------------------------------------------

alter table public.planes_saas
  add column if not exists precio_mensual_gs numeric(12,0) not null default 0,
  add column if not exists precio_anual_gs numeric(12,0) not null default 0,
  add column if not exists ahorro_anual_meses integer not null default 0,
  add column if not exists limite_clientes integer,
  add column if not exists limite_sucursales integer,
  add column if not exists destacado boolean not null default false,
  add column if not exists visible_publico boolean not null default true;

comment on column public.planes_saas.precio_gs is
  'Legacy: precio mensual antiguo. No usar en UI nueva; usar precio_mensual_gs.';
comment on column public.planes_saas.precio_mensual_gs is
  'Precio oficial mensual del plan, en guaranies.';
comment on column public.planes_saas.precio_anual_gs is
  'Precio anual del plan, en guaranies. Equivale a precio_mensual_gs x 10 (2 meses de bonificacion / ahorro_anual_meses).';
comment on column public.planes_saas.ahorro_anual_meses is
  'Cantidad de meses de bonificacion al pagar el plan de forma anual (ej: 2 = "pagas 10, usas 12").';
comment on column public.planes_saas.limite_clientes is
  'Limite de clientes activos para el plan. Null = a evaluar segun necesidad del negocio (no ofrecer como "ilimitado").';
comment on column public.planes_saas.limite_sucursales is
  'Limite de sucursales activas para el plan. Null = a evaluar segun necesidad del negocio (no ofrecer como "ilimitado").';
comment on column public.planes_saas.destacado is
  'Si el plan se resalta como recomendado/destacado en la UI publica.';
comment on column public.planes_saas.visible_publico is
  'Si el plan debe mostrarse en landing, /planes y comparativas publicas.';

-- ---------------------------------------------------------------------
-- 2. Actualizacion de los 4 planes comerciales
-- ---------------------------------------------------------------------

update public.planes_saas set
  precio_mensual_gs = 0,
  precio_anual_gs = 0,
  ahorro_anual_meses = 0,
  limite_citas_mensuales = 20,
  limite_empleados = 1,
  limite_servicios = 3,
  limite_clientes = 50,
  limite_sucursales = 1,
  destacado = false,
  visible_publico = true
where clave = 'gratis';

update public.planes_saas set
  precio_mensual_gs = 99000,
  precio_anual_gs = 990000,
  ahorro_anual_meses = 2,
  limite_citas_mensuales = 100,
  limite_empleados = 3,
  limite_servicios = 10,
  limite_clientes = 300,
  limite_sucursales = 1,
  destacado = false,
  visible_publico = true
where clave = 'basico';

update public.planes_saas set
  precio_mensual_gs = 199000,
  precio_anual_gs = 1990000,
  ahorro_anual_meses = 2,
  limite_citas_mensuales = 500,
  limite_empleados = 10,
  limite_servicios = 30,
  limite_clientes = 1000,
  limite_sucursales = 1,
  destacado = true,
  visible_publico = true
where clave = 'profesional';

update public.planes_saas set
  precio_mensual_gs = 499000,
  precio_anual_gs = 4990000,
  ahorro_anual_meses = 2,
  limite_citas_mensuales = 2000,
  limite_empleados = 25,
  limite_servicios = 80,
  limite_clientes = 5000,
  limite_sucursales = 3,
  destacado = false,
  visible_publico = true
where clave = 'empresarial';

-- ---------------------------------------------------------------------
-- 3. Vista publica: fuente unica de verdad para UI y WhatsApp
-- ---------------------------------------------------------------------

create or replace view public.vista_planes_publicos as
select
  id,
  clave,
  nombre,
  precio_mensual_gs,
  precio_anual_gs,
  ahorro_anual_meses,
  limite_citas_mensuales,
  limite_empleados,
  limite_servicios,
  limite_clientes,
  limite_sucursales,
  permite_reportes_avanzados,
  permite_personalizacion,
  permite_exportacion_csv,
  permite_multiples_sucursales,
  destacado,
  orden
from public.planes_saas
where visible_publico = true
order by orden asc;

comment on view public.vista_planes_publicos is
  'Fuente unica de verdad para precios y limites visibles publicamente: landing, /planes, /dashboard/planes, cards de pricing, comparativas y mensajes de WhatsApp. No hardcodear precios ni limites fuera de esta vista.';

-- ---------------------------------------------------------------------
-- 4. Permisos de lectura
-- ---------------------------------------------------------------------

grant select on public.vista_planes_publicos to anon, authenticated;

commit;
