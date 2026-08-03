-- =====================================================================
-- AgendaMe: agrega el tipo de alias (telefono, cedula/RUC, alias
-- bancario, etc.) a cada medio de pago, para que el negocio sepa QUE es
-- el numero que ve, no solo el numero en si.
--
-- APLICADO: pendiente de ejecutar en el SQL Editor de Supabase.
--
-- Seguro para datos existentes: solo agrega una columna nueva
-- (nullable), no toca filas existentes.
-- =====================================================================

begin;

alter table public.medios_pago_plataforma
  add column if not exists alias_tipo text;

commit;
