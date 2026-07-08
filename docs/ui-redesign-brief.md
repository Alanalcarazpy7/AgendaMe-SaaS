# UI Redesign Brief — AgendaMe

## Objetivo

Rediseñar AgendaMe para que se sienta como un SaaS premium, confiable, moderno y comercial.

La interfaz debe vender claramente el producto y también funcionar como dashboard operativo profesional.

## Producto

AgendaMe es un SaaS multi-tenant para reservas, citas, turnos, clientes, servicios, empleados, recordatorios, reportes y planes.

## Público objetivo

Negocios de Paraguay que trabajan con turnos:

- Barberías
- Veterinarias
- Clínicas
- Consultorios
- Estética
- Spa
- Peluquerías
- Profesionales independientes
- Negocios con varias sucursales

## Principios visuales

- Profesional
- Limpio
- Premium
- Claro
- Confiable
- Seguro
- Tecnológico
- Responsive
- No infantil
- Sin sobrecarga visual
- Sin emojis en UI

## Paleta visual oficial

Usar la paleta definida en docs/brand-agendame.md.

Dirección oficial:

- Navy
- Azul
- Cyan
- Teal
- Green
- Blanco
- Slate/grises profesionales

No usar amber, orange, yellow ni dorado como identidad principal.

No usar amarillo/dorado para destacar planes premium.

Para destacar el plan Profesional usar azul, cyan o teal.

## Landing deseada

La landing debe tener:

1. Header premium
2. Hero fuerte
3. Mockup desktop del dashboard
4. Mockup móvil de reserva pública
5. Cómo funciona
6. Beneficios
7. Funciones
8. Nichos
9. Demo visual
10. Resumen de planes
11. Confianza/seguridad
12. Casos de uso
13. FAQ
14. Contacto WhatsApp
15. CTA final
16. Footer

## Hero recomendado

Título:

Reservas, citas y clientes organizados en un solo lugar.

Subtítulo:

AgendaMe te ayuda a recibir reservas online, gestionar turnos, clientes, empleados, servicios y recordatorios desde un panel simple y profesional.

CTAs:

- Crear cuenta gratis -> /auth/registro
- Ver planes -> /planes
- Hablar por WhatsApp

No usar /reservar/barberia como demo comercial principal.

## Planes

Los planes deben venir desde Supabase.

Fuente:

public.vista_planes_publicos

No hardcodear precios ni límites.

Mostrar:

- Mensual
- Anual
- Ahorrás 2 meses
- Ahorrás Gs. X al año
- Pagá anual y usá 12 meses pagando solo 10

Plan destacado:

- Profesional
- Usar destacado = true
- Destacar visualmente con azul/cyan/teal, no amber/yellow.

## Página /planes

Debe tener:

- Hero propio
- Cards de planes
- Toggle mensual/anual
- Comparativa tipo tabla profesional
- FAQ de planes
- CTA final

Comparativa:

- Citas mensuales
- Empleados
- Servicios
- Clientes
- Sucursales
- Página pública de reservas
- Gestión de clientes
- Gestión de empleados
- Gestión de servicios
- Estadísticas básicas
- Reportes avanzados
- Exportación XLSX / CSV
- Recordatorios WhatsApp
- Múltiples sucursales
- Soporte prioritario
- Funcionalidades a medida bajo evaluación

## Dashboard

El dashboard debe sentirse como un CRM/operación premium.

Debe tener:

- Sidebar clara
- Estados activos
- Cards limpias
- Métricas legibles
- Dark mode premium
- Light mode profesional
- Tablas claras
- Formularios limpios
- Focus visible
- Responsive real

No tocar permisos ni lógica crítica.

## Animaciones

Usar animaciones suaves, sin instalar librerías nuevas.

Permitido:

- Reveal on scroll
- Fade-up
- Hover lift
- Scale sutil
- Glow controlado
- Mockup flotante leve

Debe respetar prefers-reduced-motion.

## Reglas estrictas

- UI visible 100% español.
- No textos en inglés.
- No precios hardcodeados.
- No límites hardcodeados.
- No USD.
- No prometer ilimitado.
- No copiar marcas externas.
- No tocar APIs.
- No tocar Supabase.
- No tocar permisos.
- No tocar tests sin aprobación.
- No usar amber/orange/yellow como identidad principal.
