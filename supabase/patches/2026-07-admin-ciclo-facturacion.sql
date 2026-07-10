-- =====================================================================
-- Patch: ciclo de facturación para suscripciones y pagos manuales
-- Fecha: 2026-07
--
-- APLICADO: 2026-07-10, por el propietario directamente en Supabase Studio
-- (SQL Editor). Confirmado con introspección de solo lectura (OpenAPI de
-- PostgREST) que ambas columnas existen en producción. Ver
-- docs/admin-owner-panel-progress.md para el registro completo.
--
-- Contexto: el panel /admin (docs/admin-owner-panel.md) necesita distinguir
-- si una suscripción/pago es mensual, anual o manual/ad-hoc para calcular
-- MRR/ARR reales y mostrar el ciclo correcto en Suscripciones/Renovaciones.
-- Se verificó (Fase 1, introspección de solo lectura contra producción,
-- 2026-07-09) que NINGUNA de las dos tablas tiene hoy esta columna.
--
-- Valor por defecto conservador: 'mensual' para suscripciones (la mayoría
-- de los planes comerciales actuales son mensuales, ver
-- supabase/patches/2026-07-agendame-planes-comerciales.sql) y 'manual'
-- para pagos_manuales (un pago histórico registrado a mano no implica
-- necesariamente un ciclo mensual o anual claro; 'manual' documenta la
-- ambigüedad en vez de asumir un valor que podría ser incorrecto).
--
-- No se sobrescribe ni se borra ningún dato existente: es aditiva y
-- retrocompatible. Las filas históricas quedan con el valor por defecto,
-- editable manualmente desde el panel si el propietario conoce el ciclo
-- real de un caso puntual.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. suscripciones.ciclo_facturacion
-- ---------------------------------------------------------------------

alter table public.suscripciones
  add column if not exists ciclo_facturacion text not null default 'mensual';

alter table public.suscripciones
  drop constraint if exists suscripciones_ciclo_facturacion_check;

alter table public.suscripciones
  add constraint suscripciones_ciclo_facturacion_check
  check (ciclo_facturacion in ('mensual', 'anual', 'manual'));

comment on column public.suscripciones.ciclo_facturacion is
  'Ciclo de facturación de la suscripción: mensual, anual o manual (ad-hoc, sin ciclo fijo). Default conservador "mensual" para filas históricas creadas antes de este patch: no se debe asumir que refleja el ciclo real pagado, solo un valor por defecto documentado.';

-- ---------------------------------------------------------------------
-- 2. pagos_manuales.ciclo_facturacion
-- ---------------------------------------------------------------------

alter table public.pagos_manuales
  add column if not exists ciclo_facturacion text not null default 'manual';

alter table public.pagos_manuales
  drop constraint if exists pagos_manuales_ciclo_facturacion_check;

alter table public.pagos_manuales
  add constraint pagos_manuales_ciclo_facturacion_check
  check (ciclo_facturacion in ('mensual', 'anual', 'manual'));

comment on column public.pagos_manuales.ciclo_facturacion is
  'Ciclo de facturación que cubre este pago: mensual, anual o manual (sin ciclo fijo / ajuste puntual). Default conservador "manual" para pagos históricos: no se asume mensual ni anual sin evidencia (ver periodo_inicio/periodo_fin del propio pago si están cargados).';

-- ---------------------------------------------------------------------
-- 3. Índices de apoyo para filtros del panel admin
-- ---------------------------------------------------------------------

create index if not exists idx_suscripciones_ciclo_facturacion
  on public.suscripciones (ciclo_facturacion);

create index if not exists idx_pagos_manuales_ciclo_facturacion
  on public.pagos_manuales (ciclo_facturacion);

commit;
