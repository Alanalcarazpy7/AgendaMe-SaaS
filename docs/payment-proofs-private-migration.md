# Payment Proofs - migracion a bucket privado

Estado: codigo preparado localmente y bucket `payment-proofs` confirmado como privado el 2026-07-20 via Storage API (`public=false`).

## Como funciona ahora

- Los comprobantes nuevos de `payment-proofs` se suben con `service_role`.
- `pagos_manuales.comprobante_url` guarda el path interno del objeto, no una URL publica permanente.
- El propietario abre comprobantes desde `/api/admin/pagos/[pagoId]/comprobante`.
- El admin del negocio abre comprobantes desde `/api/dashboard/pagos/comprobante?pagoId=[pagoId]`.
- Ambas rutas validan permisos antes de generar una signed URL temporal.

## Compatibilidad

`src/lib/payment-proofs.ts` acepta:

- paths internos nuevos;
- URLs publicas antiguas de Supabase Storage;
- URLs firmadas de Supabase Storage;
- fallback HTTP(S) historico si no se puede extraer path, siempre detras de un Route Handler protegido.

## Checklist de produccion

El bucket ya esta privado. Antes de manejar pagos reales, probar manualmente:

1. Subir comprobante desde `/dashboard/planes`.
2. Abrir comprobante desde `/dashboard/planes`.
3. Abrir comprobante desde `/admin/pagos`.
4. Abrir comprobante desde `/admin/negocios/[id]`.
5. Aprobar/rechazar pagos sin perder el comprobante.
6. Confirmar que comprobantes viejos siguen abriendo desde las rutas protegidas.
