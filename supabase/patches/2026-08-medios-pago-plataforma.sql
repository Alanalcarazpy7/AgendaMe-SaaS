-- =====================================================================
-- AgendaMe: catalogo de medios de pago de la plataforma (para que los
-- negocios sepan a donde transferir al pagar/renovar su plan).
--
-- APLICADO: pendiente de ejecutar en el SQL Editor de Supabase.
--
-- Contexto: el formulario "Enviar comprobante" (/dashboard/planes) no
-- mostraba ningun dato de pago (cuenta bancaria, QR, billeteras). Este
-- catalogo lo resuelve: el dueño de la plataforma lo administra desde
-- /admin/planes y cada negocio lo ve de forma directa antes de pagar,
-- sin depender de coordinar primero por WhatsApp.
--
-- Seguro para datos existentes: crea una tabla y un bucket nuevos, no
-- modifica ninguna tabla existente.
-- =====================================================================

begin;

create table if not exists public.medios_pago_plataforma (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'otro',
  nombre text not null,
  titular text,
  banco text,
  identificador_principal text,
  identificador_secundario text,
  qr_url text,
  notas text,
  activo boolean not null default true,
  orden integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medios_pago_plataforma_tipo_check
    check (tipo in ('transferencia', 'billetera', 'qr', 'otro')),
  constraint medios_pago_plataforma_nombre_no_vacio_check
    check (length(btrim(nombre)) >= 2)
);

alter table public.medios_pago_plataforma enable row level security;

drop policy if exists medios_pago_plataforma_lectura on public.medios_pago_plataforma;
create policy medios_pago_plataforma_lectura
on public.medios_pago_plataforma
for select
to authenticated
using (activo = true);

grant select on table public.medios_pago_plataforma to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medios-pago-plataforma',
  'medios-pago-plataforma',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
