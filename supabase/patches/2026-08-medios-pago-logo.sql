-- =====================================================================
-- AgendaMe: agrega logo propio a cada medio de pago (Tigo Money, Ueno,
-- Itau, etc.) para que el negocio lo reconozca de un vistazo, aparte
-- del QR opcional que ya existia.
--
-- APLICADO: pendiente de ejecutar en el SQL Editor de Supabase.
--
-- Seguro para datos existentes: solo agrega una columna nueva
-- (nullable), no toca filas existentes.
-- =====================================================================

begin;

alter table public.medios_pago_plataforma
  add column if not exists logo_url text;

commit;
