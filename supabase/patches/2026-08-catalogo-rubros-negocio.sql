-- =====================================================================
-- AgendaMe: catalogo normalizado de rubros para onboarding y analitica
--
-- Seguro para datos existentes:
-- - conserva negocios.rubro para las vistas y codigo actuales;
-- - agrega negocios.rubro_id como relacion opcional;
-- - intenta asociar registros historicos por nombre normalizado;
-- - no elimina ni modifica negocios, usuarios, citas o suscripciones.
-- =====================================================================

begin;

create table if not exists public.rubros_negocio (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nombre text not null unique,
  descripcion text not null default '',
  icono text not null default 'store',
  orden integer not null default 100,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rubros_negocio_clave_formato_check
    check (clave ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint rubros_negocio_nombre_no_vacio_check
    check (length(btrim(nombre)) >= 2),
  constraint rubros_negocio_orden_check
    check (orden >= 0)
);

alter table public.rubros_negocio enable row level security;

drop policy if exists rubros_negocio_lectura on public.rubros_negocio;
create policy rubros_negocio_lectura
on public.rubros_negocio
for select
to anon, authenticated
using (activo = true);

grant select on table public.rubros_negocio to anon, authenticated;

insert into public.rubros_negocio (
  id, clave, nombre, descripcion, icono, orden, activo
)
values
  ('a1000000-0000-4000-8000-000000000001', 'barberia', 'Barbería', 'Barberías, grooming y cuidado masculino.', 'scissors', 10, true),
  ('a1000000-0000-4000-8000-000000000002', 'peluqueria', 'Peluquería', 'Salones de cabello, color y peinado.', 'sparkles', 20, true),
  ('a1000000-0000-4000-8000-000000000003', 'estetica-belleza', 'Estética y belleza', 'Centros de estética, maquillaje y cuidado personal.', 'wand-sparkles', 30, true),
  ('a1000000-0000-4000-8000-000000000004', 'unas-manicura', 'Uñas y manicura', 'Manicura, pedicura y nail art.', 'hand', 40, true),
  ('a1000000-0000-4000-8000-000000000005', 'spa-masajes', 'Spa y masajes', 'Spa, masajes, relajación y bienestar corporal.', 'flower-2', 50, true),
  ('a1000000-0000-4000-8000-000000000006', 'salud-bienestar', 'Salud y bienestar', 'Consultorios, nutrición, fisioterapia y terapias.', 'heart-pulse', 60, true),
  ('a1000000-0000-4000-8000-000000000007', 'odontologia', 'Odontología', 'Clínicas y consultorios odontológicos.', 'badge-plus', 70, true),
  ('a1000000-0000-4000-8000-000000000008', 'psicologia-terapias', 'Psicología y terapias', 'Psicología, coaching y acompañamiento profesional.', 'brain', 80, true),
  ('a1000000-0000-4000-8000-000000000009', 'fitness-deporte', 'Fitness y deporte', 'Gimnasios, entrenadores, yoga y clases deportivas.', 'dumbbell', 90, true),
  ('a1000000-0000-4000-8000-000000000010', 'tatuajes-piercing', 'Tatuajes y piercing', 'Estudios de tatuajes, piercing y arte corporal.', 'pen-tool', 100, true),
  ('a1000000-0000-4000-8000-000000000011', 'veterinaria-mascotas', 'Veterinaria y mascotas', 'Veterinarias, peluquería y cuidado de mascotas.', 'paw-print', 110, true),
  ('a1000000-0000-4000-8000-000000000012', 'educacion-clases', 'Educación y clases', 'Academias, docentes, tutorías y clases particulares.', 'graduation-cap', 120, true),
  ('a1000000-0000-4000-8000-000000000013', 'servicios-profesionales', 'Servicios profesionales', 'Asesorías, consultorías y atención profesional.', 'briefcase-business', 130, true),
  ('a1000000-0000-4000-8000-000000000014', 'fotografia-eventos', 'Fotografía y eventos', 'Fotografía, producción y servicios para eventos.', 'camera', 140, true),
  ('a1000000-0000-4000-8000-000000000015', 'automotor-taller', 'Automotor y taller', 'Talleres, detailing y servicios para vehículos.', 'car-front', 150, true),
  ('a1000000-0000-4000-8000-000000000016', 'otro', 'Otro tipo de negocio', 'Para actividades que todavía no figuran en el catálogo.', 'shapes', 999, true)
on conflict (clave) do update
set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  icono = excluded.icono,
  orden = excluded.orden,
  activo = excluded.activo,
  updated_at = now();

alter table public.negocios
  add column if not exists rubro_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'negocios_rubro_id_fkey'
      and conrelid = 'public.negocios'::regclass
  ) then
    alter table public.negocios
      add constraint negocios_rubro_id_fkey
      foreign key (rubro_id)
      references public.rubros_negocio(id)
      on delete set null
      not valid;
  end if;
end;
$$;

alter table public.negocios
  validate constraint negocios_rubro_id_fkey;

create index if not exists idx_negocios_rubro_id
  on public.negocios (rubro_id)
  where rubro_id is not null;

update public.negocios n
set rubro_id = r.id
from public.rubros_negocio r
where n.rubro_id is null
  and n.rubro is not null
  and regexp_replace(
    translate(lower(btrim(n.rubro)), 'áéíóúüñ', 'aeiouun'),
    '[^a-z0-9]+',
    '-',
    'g'
  ) = r.clave;

create or replace function public.sincronizar_nombre_rubro_negocio()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_nombre text;
begin
  if new.rubro_id is null then
    return new;
  end if;

  select r.nombre
  into v_nombre
  from public.rubros_negocio r
  where r.id = new.rubro_id
    and r.activo = true;

  if v_nombre is null then
    raise exception 'El rubro seleccionado no existe o está inactivo.';
  end if;

  new.rubro := v_nombre;
  return new;
end;
$$;

drop trigger if exists trg_sincronizar_nombre_rubro_negocio on public.negocios;
create trigger trg_sincronizar_nombre_rubro_negocio
before insert or update of rubro_id
on public.negocios
for each row
execute function public.sincronizar_nombre_rubro_negocio();

revoke execute on function public.sincronizar_nombre_rubro_negocio() from public;

commit;
