-- =====================================================================
-- Patch: RPC transaccionales para mutaciones administrativas sin RPC previa
-- Fecha: 2026-07
--
-- APLICADO: 2026-07-10, por el propietario directamente en Supabase Studio
-- (SQL Editor). Confirmado con introspección de solo lectura (OpenAPI de
-- PostgREST) que las 4 funciones existen y están expuestas. El código de
-- src/lib/admin/actions/{negocios,planes,invitaciones}.ts ya fue
-- actualizado para usarlas. Ver docs/admin-owner-panel-progress.md.
--
-- Contexto (auditoría de producción, ver progress.md):
-- Hoy, agregar una nota, registrar un pago manual, editar un plan y
-- revocar una invitación se hacen desde la app con DOS llamadas de red
-- separadas: (1) el insert/update real, (2) un insert en `auditoria`.
-- Si (2) falla después de que (1) ya se aplicó, la mutación queda sin
-- registro de auditoría (la app ya lo detecta y avisa con un toast de
-- advertencia, pero no es una garantía transaccional real).
--
-- Este patch mueve esas 4 operaciones a funciones SECURITY DEFINER que
-- hacen el insert/update Y el insert en auditoria dentro de la MISMA
-- transacción de Postgres: si el insert en auditoria falla, toda la
-- función hace rollback (Postgres revierte también la mutación), así que
-- nunca puede quedar una mutación real sin su fila de auditoría.
--
-- Cada función:
-- - revalida es_super_admin() (reutiliza la función ya existente y
--   verificada en producción, ver Fase 1 y auditoría de producción del
--   progress.md — no se reimplementa el chequeo);
-- - fija search_path explícito (public, pg_temp) como buena práctica para
--   SECURITY DEFINER (evita ataques de search_path hijacking);
-- - revoca EXECUTE de PUBLIC y lo otorga solo a "authenticated" (anon no
--   puede ni intentar llamarla) — más estricto que lo observado en las 5
--   RPC admin_* existentes, que sí son ejecutables por anon (el chequeo
--   interno las protege igual, pero no es defensa en profundidad completa;
--   ver hallazgo en progress.md).
--
-- NO se tocan admin_cambiar_plan_negocio, admin_bloquear_negocio,
-- admin_desbloquear_negocio, admin_aprobar_pago_manual ni
-- admin_rechazar_pago_manual: no se cuenta con su definición actual exacta
-- (no hay acceso de solo lectura a pg_proc desde esta sesión) y
-- reescribirlas a ciegas con CREATE OR REPLACE arriesgaría romper su
-- comportamiento real. Ver checklist en progress.md para la consulta SQL
-- de solo lectura que permitiría confirmar su cuerpo/grants antes de
-- decidir si también necesitan este mismo tratamiento.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. admin_agregar_nota_negocio
-- ---------------------------------------------------------------------

create or replace function public.admin_agregar_nota_negocio(
  p_negocio_id uuid,
  p_nota text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_nota_id uuid;
begin
  if not public.es_super_admin() then
    raise exception 'Solo un super_admin puede agregar notas administrativas.' using errcode = '42501';
  end if;

  if p_nota is null or length(trim(p_nota)) = 0 then
    raise exception 'La nota no puede estar vacía.' using errcode = '22023';
  end if;

  insert into public.notas_admin_negocio (negocio_id, admin_id, nota)
  values (p_negocio_id, auth.uid(), p_nota)
  returning id into v_nota_id;

  insert into public.auditoria (usuario_id, negocio_id, accion, tabla_afectada, registro_id, detalles, origen)
  values (auth.uid(), p_negocio_id, 'agregar_nota', 'notas_admin_negocio', v_nota_id,
          jsonb_build_object('nota', p_nota), 'admin_panel_rpc');

  return v_nota_id;
end;
$$;

revoke execute on function public.admin_agregar_nota_negocio(uuid, text) from public;
grant execute on function public.admin_agregar_nota_negocio(uuid, text) to authenticated;

comment on function public.admin_agregar_nota_negocio(uuid, text) is
  'Agrega una nota administrativa y su registro de auditoría en una sola transacción. Solo super_admin.';

-- ---------------------------------------------------------------------
-- 2. admin_registrar_pago_manual
-- ---------------------------------------------------------------------

create or replace function public.admin_registrar_pago_manual(
  p_negocio_id uuid,
  p_suscripcion_id uuid,
  p_plan_id uuid,
  p_monto_gs numeric,
  p_metodo text,
  p_periodo_inicio timestamptz,
  p_periodo_fin timestamptz,
  p_notas_cliente text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pago_id uuid;
begin
  if not public.es_super_admin() then
    raise exception 'Solo un super_admin puede registrar pagos manuales.' using errcode = '42501';
  end if;

  if p_monto_gs is null or p_monto_gs <= 0 then
    raise exception 'El monto debe ser mayor a cero.' using errcode = '22023';
  end if;

  insert into public.pagos_manuales (
    negocio_id, suscripcion_id, plan_id, monto_gs, metodo, estado,
    fecha_pago, periodo_inicio, periodo_fin, notas_cliente
  )
  values (
    p_negocio_id, p_suscripcion_id, p_plan_id, p_monto_gs, p_metodo, 'pendiente',
    now(), p_periodo_inicio, p_periodo_fin, p_notas_cliente
  )
  returning id into v_pago_id;

  insert into public.auditoria (usuario_id, negocio_id, accion, tabla_afectada, registro_id, detalles, origen)
  values (auth.uid(), p_negocio_id, 'registrar_pago', 'pagos_manuales', v_pago_id,
          jsonb_build_object('monto_gs', p_monto_gs, 'metodo', p_metodo), 'admin_panel_rpc');

  return v_pago_id;
end;
$$;

revoke execute on function public.admin_registrar_pago_manual(uuid, uuid, uuid, numeric, text, timestamptz, timestamptz, text) from public;
grant execute on function public.admin_registrar_pago_manual(uuid, uuid, uuid, numeric, text, timestamptz, timestamptz, text) to authenticated;

comment on function public.admin_registrar_pago_manual(uuid, uuid, uuid, numeric, text, timestamptz, timestamptz, text) is
  'Registra un pago manual (estado pendiente) y su auditoría en una sola transacción. Solo super_admin. La aprobación real sigue a cargo de admin_aprobar_pago_manual().';

-- ---------------------------------------------------------------------
-- 3. admin_editar_plan
-- ---------------------------------------------------------------------

create or replace function public.admin_editar_plan(
  p_plan_id uuid,
  p_nombre text,
  p_descripcion_corta text,
  p_texto_destacado text,
  p_precio_mensual_gs numeric,
  p_precio_anual_gs numeric,
  p_limite_citas_mensuales integer,
  p_limite_empleados integer,
  p_limite_servicios integer,
  p_limite_clientes integer,
  p_limite_sucursales integer,
  p_visible_publico boolean,
  p_destacado boolean
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

  select to_jsonb(p) into v_antes from public.planes_saas p where p.id = p_plan_id;

  if v_antes is null then
    raise exception 'El plan no existe.' using errcode = 'P0002';
  end if;

  update public.planes_saas set
    nombre = p_nombre,
    descripcion_corta = p_descripcion_corta,
    texto_destacado = p_texto_destacado,
    precio_mensual_gs = p_precio_mensual_gs,
    precio_anual_gs = p_precio_anual_gs,
    limite_citas_mensuales = p_limite_citas_mensuales,
    limite_empleados = p_limite_empleados,
    limite_servicios = p_limite_servicios,
    limite_clientes = p_limite_clientes,
    limite_sucursales = p_limite_sucursales,
    visible_publico = p_visible_publico,
    destacado = p_destacado
  where id = p_plan_id;

  insert into public.auditoria (usuario_id, negocio_id, accion, tabla_afectada, registro_id, detalles, origen)
  values (
    auth.uid(), null, 'editar_plan', 'planes_saas', p_plan_id,
    jsonb_build_object(
      'antes', v_antes,
      'despues', jsonb_build_object(
        'nombre', p_nombre,
        'precio_mensual_gs', p_precio_mensual_gs,
        'precio_anual_gs', p_precio_anual_gs,
        'limite_citas_mensuales', p_limite_citas_mensuales,
        'limite_empleados', p_limite_empleados,
        'limite_servicios', p_limite_servicios,
        'limite_clientes', p_limite_clientes,
        'limite_sucursales', p_limite_sucursales,
        'visible_publico', p_visible_publico,
        'destacado', p_destacado
      )
    ),
    'admin_panel_rpc'
  );
end;
$$;

revoke execute on function public.admin_editar_plan(uuid, text, text, text, numeric, numeric, integer, integer, integer, integer, integer, boolean, boolean) from public;
grant execute on function public.admin_editar_plan(uuid, text, text, text, numeric, numeric, integer, integer, integer, integer, integer, boolean, boolean) to authenticated;

comment on function public.admin_editar_plan(uuid, text, text, text, numeric, numeric, integer, integer, integer, integer, integer, boolean, boolean) is
  'Edita planes_saas y registra auditoría (antes/después) en una sola transacción. Solo super_admin. No borra planes.';

-- ---------------------------------------------------------------------
-- 4. admin_revocar_invitacion
-- ---------------------------------------------------------------------

create or replace function public.admin_revocar_invitacion(
  p_invitacion_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_negocio_id uuid;
begin
  if not public.es_super_admin() then
    raise exception 'Solo un super_admin puede revocar invitaciones.' using errcode = '42501';
  end if;

  update public.sucursal_invitaciones
  set estado = 'revocada', updated_at = now()
  where id = p_invitacion_id
    and estado = 'pendiente'
  returning negocio_id into v_negocio_id;

  if v_negocio_id is null then
    raise exception 'La invitación ya no está pendiente o no existe.' using errcode = 'P0002';
  end if;

  insert into public.auditoria (usuario_id, negocio_id, accion, tabla_afectada, registro_id, detalles, origen)
  values (auth.uid(), v_negocio_id, 'revocar_invitacion', 'sucursal_invitaciones', p_invitacion_id, null, 'admin_panel_rpc');

  return v_negocio_id;
end;
$$;

revoke execute on function public.admin_revocar_invitacion(uuid) from public;
grant execute on function public.admin_revocar_invitacion(uuid) to authenticated;

comment on function public.admin_revocar_invitacion(uuid) is
  'Revoca una invitación pendiente y registra auditoría en una sola transacción. Solo super_admin.';

commit;

-- =====================================================================
-- HECHO (2026-07-10): el código de la app ya fue actualizado para usar
-- estas 4 funciones:
--   src/lib/admin/actions/negocios.ts   -> agregarNotaAction, registrarPagoAction
--   src/lib/admin/actions/planes.ts     -> editarPlanAction
--   src/lib/admin/actions/invitaciones.ts -> revocarInvitacionAction
-- Todas llaman supabase.rpc('admin_agregar_nota_negocio', ...) etc. con el
-- cliente de sesión (no service role, mismo patrón que las RPC admin_*
-- existentes) en vez de hacer el insert/update + registrarAuditoria()
-- como dos pasos separados.
-- =====================================================================
