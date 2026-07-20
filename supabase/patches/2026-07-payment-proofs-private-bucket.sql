-- =====================================================================
-- APLICADO: 2026-07-20, por el propietario en Supabase Studio.
-- VERIFICADO: 2026-07-20 via Storage API, payment-proofs public=false.
-- Patch/guia: convertir payment-proofs en bucket privado
-- Fecha: 2026-07
--
-- NO ejecutar hasta validar manualmente en un negocio de prueba:
-- 1. Subir comprobante desde /dashboard/planes.
-- 2. Abrirlo desde /dashboard/planes.
-- 3. Abrirlo desde /admin/pagos y /admin/negocios/[id].
-- 4. Aprobar y rechazar pagos sin alterar el comprobante.
-- 5. Confirmar que comprobantes viejos con URL publica siguen abriendo.
--
-- El codigo local ya debe guardar paths internos nuevos en
-- pagos_manuales.comprobante_url y generar signed URLs server-side.
-- =====================================================================

begin;

-- Pasar el bucket a privado. Los uploads y signed URLs usan service_role
-- desde Route Handlers protegidos, por lo que no se requieren policies
-- publicas para leer estos objetos.
update storage.buckets
set public = false
where id = 'payment-proofs';

-- Opcional para endurecer si existiera alguna policy publica previa sobre
-- storage.objects. Revisar nombres reales antes de ejecutar; no inventar
-- DROP POLICY sin confirmar con pg_policies.
--
-- select schemaname, tablename, policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'storage'
--   and tablename = 'objects'
--   and (
--     qual::text ilike '%payment-proofs%'
--     or with_check::text ilike '%payment-proofs%'
--   );

commit;

-- Validacion posterior:
-- - Una URL publica vieja de /storage/v1/object/public/payment-proofs/... puede
--   dejar de abrir sin sesion cuando el bucket sea privado.
-- - La app debe abrir comprobantes desde:
--   /api/admin/pagos/[pagoId]/comprobante
--   /api/dashboard/pagos/comprobante?pagoId=[pagoId]
-- - Las respuestas deben redirigir a URLs firmadas temporales.

-- Rollback:
-- begin;
-- update storage.buckets
-- set public = true
-- where id = 'payment-proofs';
-- commit;
