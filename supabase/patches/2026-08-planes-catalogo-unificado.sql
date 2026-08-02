-- =====================================================================
-- AgendaMe: catalogo unificado de planes
--
-- EJECUTAR SOLO ESTE PATCH para aplicar precios, limites, descripciones,
-- funcionalidades y la vista publica que consume toda la aplicacion.
--
-- Fuente unica de datos: public.planes_saas
-- Lectura publica:       public.vista_planes_publicos
-- Edicion administrativa: public.admin_editar_plan(...)
--
-- No modifica negocios, suscripciones, pagos, citas, usuarios ni archivos.
-- =====================================================================

begin;

-- El patch es autosuficiente respecto del catalogo comercial. No hace
-- falta ejecutar primero 2026-07-agendame-planes-comerciales.sql.
alter table public.planes_saas
  add column if not exists descripcion_corta text,
  add column if not exists texto_destacado text,
  add column if not exists precio_mensual_gs numeric(12,0) not null default 0,
  add column if not exists precio_anual_gs numeric(12,0) not null default 0,
  add column if not exists ahorro_anual_meses integer not null default 0,
  add column if not exists limite_clientes integer,
  add column if not exists limite_sucursales integer,
  add column if not exists visible_publico boolean not null default true,
  add column if not exists destacado boolean not null default false,
  add column if not exists permite_reportes_basicos boolean not null default false,
  add column if not exists permite_reportes_avanzados boolean not null default false,
  add column if not exists permite_personalizacion boolean not null default false,
  add column if not exists permite_exportacion_csv boolean not null default false,
  add column if not exists permite_multiples_sucursales boolean not null default false,
  add column if not exists permite_recordatorios_whatsapp boolean not null default false,
  add column if not exists permite_soporte_prioritario boolean not null default false,
  add column if not exists permite_funcionalidades_a_medida boolean not null default false,
  add column if not exists features jsonb not null default '[]'::jsonb;

comment on column public.planes_saas.precio_gs is
  'Precio mensual legacy, sincronizado con precio_mensual_gs.';
comment on column public.planes_saas.precio_mensual_gs is
  'Precio mensual oficial del plan en guaranies.';
comment on column public.planes_saas.precio_anual_gs is
  'Precio anual oficial del plan en guaranies.';
comment on column public.planes_saas.features is
  'Beneficios comerciales publicados en landing, planes, dashboard y admin.';

do $$
declare
  planes_actualizados integer;
begin
  update public.planes_saas as p
  set
    descripcion_corta = valores.descripcion_corta,
    texto_destacado = valores.texto_destacado,
    precio_gs = valores.precio_mensual_gs,
    precio_mensual_gs = valores.precio_mensual_gs,
    precio_anual_gs = valores.precio_anual_gs,
    ahorro_anual_meses = valores.ahorro_anual_meses,
    limite_citas_mensuales = valores.limite_citas_mensuales,
    limite_empleados = valores.limite_empleados,
    limite_servicios = valores.limite_servicios,
    limite_clientes = valores.limite_clientes,
    limite_sucursales = valores.limite_sucursales,
    visible_publico = valores.visible_publico,
    destacado = valores.destacado,
    permite_reportes_basicos = valores.permite_reportes_basicos,
    permite_reportes_avanzados = valores.permite_reportes_avanzados,
    permite_personalizacion = valores.permite_personalizacion,
    permite_exportacion_csv = valores.permite_exportacion_csv,
    permite_multiples_sucursales = valores.permite_multiples_sucursales,
    permite_recordatorios_whatsapp = valores.permite_recordatorios_whatsapp,
    permite_soporte_prioritario = valores.permite_soporte_prioritario,
    permite_funcionalidades_a_medida = valores.permite_funcionalidades_a_medida,
    features = valores.features,
    updated_at = now()
  from (
    values
      (
        'gratis'::text,
        'Para comenzar sin costo: publicá tu agenda, recibí reservas y ordená la operación básica.'::text,
        'Empezá sin costo'::text,
        0::numeric, 0::numeric, 0,
        20, 1, 5, 50, 1,
        true, false,
        false, false, false, false, false, false, false, false,
        '[
          "Link público de reservas disponible 24/7",
          "Agenda con vistas detallada y compacta",
          "Gestión de citas y estados",
          "Clientes e historial de reservas",
          "Catálogo de servicios con imágenes",
          "Horarios y disponibilidad online",
          "Actualización automática de reservas"
        ]'::jsonb
      ),
      (
        'basico'::text,
        'Para profesionales y equipos pequeños que necesitan más capacidad, identidad propia y métricas esenciales.'::text,
        'Ideal para empezar a crecer'::text,
        129000::numeric, 1290000::numeric, 2,
        80, 3, 10, 300, 1,
        true, false,
        true, false, true, false, false, false, false, false,
        '[
          "Todo lo incluido en Gratis",
          "Reportes básicos de citas e ingresos",
          "Identidad del negocio con logo y banner",
          "Seguimiento de servicios más reservados",
          "Horarios por empleado",
          "Actualización automática de reservas",
          "Soporte estándar"
        ]'::jsonb
      ),
      (
        'profesional'::text,
        'Para negocios en crecimiento que quieren analizar resultados, exportar datos y reducir ausencias.'::text,
        'Más elegido'::text,
        249000::numeric, 2490000::numeric, 2,
        250, 10, 30, 1000, 1,
        true, true,
        true, true, true, true, false, true, true, false,
        '[
          "Todo lo incluido en Básico",
          "Reportes avanzados de ingresos, demanda e inasistencias",
          "Tendencias y rankings de servicios, clientes y equipo",
          "Exportación XLSX y CSV",
          "Recordatorios manuales por WhatsApp",
          "Personalización con logo, banner e imágenes",
          "Soporte prioritario"
        ]'::jsonb
      ),
      (
        'empresarial'::text,
        'Para operar varias sucursales con accesos por rol, control por ubicación y acompañamiento prioritario.'::text,
        'Control para varias sucursales'::text,
        599000::numeric, 5990000::numeric, 2,
        2000, 25, 80, 5000, 3,
        true, false,
        true, true, true, true, true, true, true, true,
        '[
          "Todo lo incluido en Profesional",
          "Hasta 3 sucursales bajo una misma cuenta",
          "Accesos para gerente, recepción y personal",
          "Reportes y filtros por sucursal",
          "Exportación por sucursal",
          "Recordatorios manuales desde cada sucursal",
          "Configuración inicial asistida",
          "Funcionalidades a medida bajo evaluación"
        ]'::jsonb
      )
  ) as valores(
    clave,
    descripcion_corta,
    texto_destacado,
    precio_mensual_gs,
    precio_anual_gs,
    ahorro_anual_meses,
    limite_citas_mensuales,
    limite_empleados,
    limite_servicios,
    limite_clientes,
    limite_sucursales,
    visible_publico,
    destacado,
    permite_reportes_basicos,
    permite_reportes_avanzados,
    permite_personalizacion,
    permite_exportacion_csv,
    permite_multiples_sucursales,
    permite_recordatorios_whatsapp,
    permite_soporte_prioritario,
    permite_funcionalidades_a_medida,
    features
  )
  where p.clave = valores.clave;

  get diagnostics planes_actualizados = row_count;

  if planes_actualizados <> 4 then
    raise exception
      'Se esperaban 4 planes comerciales y se actualizaron %.',
      planes_actualizados;
  end if;
end
$$;

-- La recreacion es atomica dentro de esta transaccion. Si existiera una
-- dependencia no prevista, PostgreSQL aborta y revierte todo el patch.
drop view if exists public.vista_planes_publicos;

create view public.vista_planes_publicos
with (security_invoker = true)
as
select
  id,
  clave,
  nombre,
  descripcion_corta,
  texto_destacado,
  precio_mensual_gs,
  precio_anual_gs,
  ahorro_anual_meses,
  limite_citas_mensuales,
  limite_empleados,
  limite_servicios,
  limite_clientes,
  limite_sucursales,
  visible_publico,
  destacado,
  permite_reportes_basicos,
  permite_reportes_avanzados,
  permite_personalizacion,
  permite_exportacion_csv,
  permite_multiples_sucursales,
  permite_recordatorios_whatsapp,
  permite_soporte_prioritario,
  permite_funcionalidades_a_medida,
  features,
  orden
from public.planes_saas
where visible_publico = true;

grant select on public.planes_saas to anon, authenticated;
grant select on public.vista_planes_publicos to anon, authenticated;

comment on view public.vista_planes_publicos is
  'Catalogo publico derivado de planes_saas. Fuente para landing, /planes y /dashboard/planes.';

-- Elimina la firma anterior para evitar dos RPC con el mismo nombre.
drop function if exists public.admin_editar_plan(
  uuid, text, text, text, numeric, numeric,
  integer, integer, integer, integer, integer, boolean, boolean
);

-- Mantiene todo el catalogo editable desde /admin/planes: contenido,
-- precios, ahorro, limites, permisos y beneficios comunicados.
create function public.admin_editar_plan(
  p_plan_id uuid,
  p_nombre text,
  p_descripcion_corta text,
  p_texto_destacado text,
  p_precio_mensual_gs numeric,
  p_precio_anual_gs numeric,
  p_ahorro_anual_meses integer,
  p_limite_citas_mensuales integer,
  p_limite_empleados integer,
  p_limite_servicios integer,
  p_limite_clientes integer,
  p_limite_sucursales integer,
  p_visible_publico boolean,
  p_destacado boolean,
  p_permite_reportes_basicos boolean,
  p_permite_reportes_avanzados boolean,
  p_permite_personalizacion boolean,
  p_permite_exportacion_csv boolean,
  p_permite_multiples_sucursales boolean,
  p_permite_recordatorios_whatsapp boolean,
  p_permite_soporte_prioritario boolean,
  p_permite_funcionalidades_a_medida boolean,
  p_features jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_antes jsonb;
begin
  if not public.es_super_admin() then
    raise exception 'Solo un super_admin puede editar planes.' using errcode = '42501';
  end if;

  if p_precio_mensual_gs < 0 or p_precio_anual_gs < 0 then
    raise exception 'Los precios no pueden ser negativos.' using errcode = '22023';
  end if;

  if p_ahorro_anual_meses < 0 or p_ahorro_anual_meses > 12 then
    raise exception 'Los meses bonificados deben estar entre 0 y 12.' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_features, '[]'::jsonb)) <> 'array' then
    raise exception 'Las funciones comunicadas deben ser una lista.' using errcode = '22023';
  end if;

  select to_jsonb(p)
  into v_antes
  from public.planes_saas p
  where p.id = p_plan_id;

  if v_antes is null then
    raise exception 'El plan no existe.' using errcode = 'P0002';
  end if;

  update public.planes_saas
  set
    nombre = p_nombre,
    descripcion_corta = p_descripcion_corta,
    texto_destacado = p_texto_destacado,
    precio_gs = p_precio_mensual_gs,
    precio_mensual_gs = p_precio_mensual_gs,
    precio_anual_gs = p_precio_anual_gs,
    ahorro_anual_meses = p_ahorro_anual_meses,
    limite_citas_mensuales = p_limite_citas_mensuales,
    limite_empleados = p_limite_empleados,
    limite_servicios = p_limite_servicios,
    limite_clientes = p_limite_clientes,
    limite_sucursales = p_limite_sucursales,
    visible_publico = p_visible_publico,
    destacado = p_destacado,
    permite_reportes_basicos = p_permite_reportes_basicos,
    permite_reportes_avanzados = p_permite_reportes_avanzados,
    permite_personalizacion = p_permite_personalizacion,
    permite_exportacion_csv = p_permite_exportacion_csv,
    permite_multiples_sucursales = p_permite_multiples_sucursales,
    permite_recordatorios_whatsapp = p_permite_recordatorios_whatsapp,
    permite_soporte_prioritario = p_permite_soporte_prioritario,
    permite_funcionalidades_a_medida = p_permite_funcionalidades_a_medida,
    features = coalesce(p_features, '[]'::jsonb),
    updated_at = now()
  where id = p_plan_id;

  insert into public.auditoria (
    usuario_id,
    negocio_id,
    accion,
    tabla_afectada,
    registro_id,
    detalles,
    origen
  )
  values (
    auth.uid(),
    null,
    'editar_plan',
    'planes_saas',
    p_plan_id,
    jsonb_build_object(
      'antes', v_antes,
      'despues', jsonb_build_object(
        'nombre', p_nombre,
        'descripcion_corta', p_descripcion_corta,
        'texto_destacado', p_texto_destacado,
        'precio_mensual_gs', p_precio_mensual_gs,
        'precio_anual_gs', p_precio_anual_gs,
        'ahorro_anual_meses', p_ahorro_anual_meses,
        'limite_citas_mensuales', p_limite_citas_mensuales,
        'limite_empleados', p_limite_empleados,
        'limite_servicios', p_limite_servicios,
        'limite_clientes', p_limite_clientes,
        'limite_sucursales', p_limite_sucursales,
        'visible_publico', p_visible_publico,
        'destacado', p_destacado,
        'permite_reportes_basicos', p_permite_reportes_basicos,
        'permite_reportes_avanzados', p_permite_reportes_avanzados,
        'permite_personalizacion', p_permite_personalizacion,
        'permite_exportacion_csv', p_permite_exportacion_csv,
        'permite_multiples_sucursales', p_permite_multiples_sucursales,
        'permite_recordatorios_whatsapp', p_permite_recordatorios_whatsapp,
        'permite_soporte_prioritario', p_permite_soporte_prioritario,
        'permite_funcionalidades_a_medida', p_permite_funcionalidades_a_medida,
        'features', coalesce(p_features, '[]'::jsonb)
      )
    ),
    'admin_panel_rpc'
  );
end;
$$;

revoke execute on function public.admin_editar_plan(
  uuid, text, text, text, numeric, numeric,
  integer, integer, integer, integer, integer, integer, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, jsonb
) from public;

grant execute on function public.admin_editar_plan(
  uuid, text, text, text, numeric, numeric,
  integer, integer, integer, integer, integer, integer, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, jsonb
) to authenticated;

comment on function public.admin_editar_plan(
  uuid, text, text, text, numeric, numeric,
  integer, integer, integer, integer, integer, integer, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, jsonb
) is
  'Edita el catalogo planes_saas y registra auditoria. Solo super_admin.';

commit;

select
  clave,
  nombre,
  descripcion_corta,
  texto_destacado,
  precio_mensual_gs,
  precio_anual_gs,
  ahorro_anual_meses,
  limite_citas_mensuales,
  limite_empleados,
  limite_servicios,
  limite_clientes,
  limite_sucursales,
  visible_publico,
  destacado,
  permite_reportes_basicos,
  permite_reportes_avanzados,
  permite_personalizacion,
  permite_exportacion_csv,
  permite_multiples_sucursales,
  permite_recordatorios_whatsapp,
  permite_soporte_prioritario,
  permite_funcionalidades_a_medida,
  features
from public.planes_saas
where clave in ('gratis', 'basico', 'profesional', 'empresarial')
order by orden;
