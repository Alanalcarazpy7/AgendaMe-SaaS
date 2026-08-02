-- =====================================================================
-- AgendaMe: datos globales iniciales
--
-- Este archivo es idempotente y solo contiene datos de catalogo.
-- Debe ejecutarse DESPUES de crear el schema, funciones, triggers y RLS.
-- No crea usuarios Auth, negocios, sucursales ni datos de prueba.
--
-- Los roles efectivos actuales no se cargan en roles_negocio:
-- - Plataforma: perfiles_usuario.rol_global = super_admin | usuario
-- - Negocio: negocio_usuarios.rol = admin
-- - Sucursal: gerente_sucursal | recepcionista_sucursal | empleado_sucursal
--
-- roles_negocio y rol_permisos son tablas para roles personalizados por
-- tenant. Actualmente no participan del control de acceso del dashboard.
-- =====================================================================

begin;

insert into public.planes_saas (
  id,
  clave,
  nombre,
  descripcion_corta,
  texto_destacado,
  precio_gs,
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
)
values
  (
    '37c4da46-2f26-4d32-8caa-12971ef0ab43',
    'gratis',
    'Gratis',
    'Para comenzar sin costo: publicá tu agenda, recibí reservas y ordená la operación básica.',
    'Empezá sin costo',
    0,
    0,
    0,
    0,
    20,
    1,
    5,
    50,
    1,
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    '[
      "Link público de reservas disponible 24/7",
      "Agenda con vistas detallada y compacta",
      "Gestión de citas y estados",
      "Clientes e historial de reservas",
      "Catálogo de servicios con imágenes",
      "Horarios y disponibilidad online",
      "Actualización automática de reservas"
    ]'::jsonb,
    1
  ),
  (
    '1c256e89-79b3-4cc4-86d5-48191ec7e978',
    'basico',
    'Básico',
    'Para profesionales y equipos pequeños que necesitan más capacidad, identidad propia y métricas esenciales.',
    'Ideal para empezar a crecer',
    129000,
    129000,
    1290000,
    2,
    80,
    3,
    10,
    300,
    1,
    true,
    false,
    true,
    false,
    true,
    false,
    false,
    false,
    false,
    false,
    '[
      "Todo lo incluido en Gratis",
      "Reportes básicos de citas e ingresos",
      "Identidad del negocio con logo y banner",
      "Seguimiento de servicios más reservados",
      "Horarios por empleado",
      "Actualización automática de reservas",
      "Soporte estándar"
    ]'::jsonb,
    2
  ),
  (
    '5ab71d23-3716-4506-84e9-d8df5511129f',
    'profesional',
    'Profesional',
    'Para negocios en crecimiento que quieren analizar resultados, exportar datos y reducir ausencias.',
    'Más elegido',
    249000,
    249000,
    2490000,
    2,
    250,
    10,
    30,
    1000,
    1,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    true,
    false,
    '[
      "Todo lo incluido en Básico",
      "Reportes avanzados de ingresos, demanda e inasistencias",
      "Tendencias y rankings de servicios, clientes y equipo",
      "Exportación XLSX y CSV",
      "Recordatorios manuales por WhatsApp",
      "Personalización con logo, banner e imágenes",
      "Soporte prioritario"
    ]'::jsonb,
    3
  ),
  (
    '7b0317a9-b585-48bd-959f-29785b784d41',
    'empresarial',
    'Empresarial',
    'Para operar varias sucursales con accesos por rol, control por ubicación y acompañamiento prioritario.',
    'Control para varias sucursales',
    599000,
    599000,
    5990000,
    2,
    2000,
    25,
    80,
    5000,
    3,
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    '[
      "Todo lo incluido en Profesional",
      "Hasta 3 sucursales bajo una misma cuenta",
      "Accesos para gerente, recepción y personal",
      "Reportes y filtros por sucursal",
      "Exportación por sucursal",
      "Recordatorios manuales desde cada sucursal",
      "Configuración inicial asistida",
      "Funcionalidades a medida bajo evaluación"
    ]'::jsonb,
    4
  )
on conflict (clave) do update
set
  nombre = excluded.nombre,
  descripcion_corta = excluded.descripcion_corta,
  texto_destacado = excluded.texto_destacado,
  precio_gs = excluded.precio_gs,
  precio_mensual_gs = excluded.precio_mensual_gs,
  precio_anual_gs = excluded.precio_anual_gs,
  ahorro_anual_meses = excluded.ahorro_anual_meses,
  limite_citas_mensuales = excluded.limite_citas_mensuales,
  limite_empleados = excluded.limite_empleados,
  limite_servicios = excluded.limite_servicios,
  limite_clientes = excluded.limite_clientes,
  limite_sucursales = excluded.limite_sucursales,
  visible_publico = excluded.visible_publico,
  destacado = excluded.destacado,
  permite_reportes_basicos = excluded.permite_reportes_basicos,
  permite_reportes_avanzados = excluded.permite_reportes_avanzados,
  permite_personalizacion = excluded.permite_personalizacion,
  permite_exportacion_csv = excluded.permite_exportacion_csv,
  permite_multiples_sucursales = excluded.permite_multiples_sucursales,
  permite_recordatorios_whatsapp = excluded.permite_recordatorios_whatsapp,
  permite_soporte_prioritario = excluded.permite_soporte_prioritario,
  permite_funcionalidades_a_medida =
    excluded.permite_funcionalidades_a_medida,
  features = excluded.features,
  orden = excluded.orden,
  updated_at = now();

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

insert into public.permisos (id, clave, descripcion)
values
  (
    'd75f8f44-029a-4069-9723-7136a0e58bfc',
    'citas.crear',
    'Crear citas'
  ),
  (
    '6d90763d-2ebf-49dc-900d-9754e905ca3f',
    'citas.editar',
    'Editar o cancelar citas'
  ),
  (
    'f3928072-98ba-4428-bb37-b1203c9f7e36',
    'citas.ver_todas',
    'Ver todas las citas del negocio, no solo las propias'
  ),
  (
    'cda6e6ce-7939-45e6-b0ea-fc7109ecd081',
    'clientes.crear',
    'Registrar clientes'
  ),
  (
    'e1cce509-aa5c-4877-aa71-272e8270ae64',
    'clientes.editar',
    'Editar clientes'
  ),
  (
    'f5d135f5-5a2b-4f4b-98be-364b6aca1711',
    'empleados.administrar',
    'Crear, editar y desactivar empleados'
  ),
  (
    '66dc0849-09fc-4d41-b774-8876129deb21',
    'servicios.administrar',
    'Crear, editar y desactivar servicios'
  ),
  (
    'bab2f0c1-6403-478a-9e8d-44afc3e4dc27',
    'reportes.ver',
    'Ver reportes del negocio'
  ),
  (
    '020b6ac5-d551-492e-a8b1-66c9cb42d0d7',
    'configuracion.editar',
    'Editar configuración del negocio'
  ),
  (
    'c0af1e9f-d5ef-4827-8d06-44916e712bcf',
    'plan.administrar',
    'Cambiar o solicitar cambios de plan'
  )
on conflict (clave) do update
set descripcion = excluded.descripcion;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'logos-negocios',
    'logos-negocios',
    true,
    null,
    null
  ),
  (
    'archivos-negocio',
    'archivos-negocio',
    false,
    null,
    null
  ),
  (
    'service-images',
    'service-images',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'business-branding',
    'business-branding',
    true,
    3145728,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'payment-proofs',
    'payment-proofs',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
