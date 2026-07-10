-- Bucket para comprobantes de pagos manuales del panel admin.
-- Requerido por /api/admin/pagos/[pagoId]/comprobante.
-- El endpoint sube con service role y guarda la URL publica en pagos_manuales.comprobante_url.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
