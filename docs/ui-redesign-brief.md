# AgendaMe - Brief UI/UX Premium

## Producto

AgendaMe es un SaaS multi-tenant para negocios que necesitan gestionar reservas, citas, clientes, empleados, servicios, sucursales, reportes y planes.

No es solo para barberías. Debe servir para varios nichos:

- Barberías
- Veterinarias
- Clínicas
- Consultorios
- Estética y belleza
- Spa
- Peluquerías
- Gimnasios
- Profesionales independientes
- Talleres o servicios por turno
- Negocios que trabajan con agenda y citas

## Estado actual

La funcionalidad ya está validada.

- Build producción OK.
- TypeScript OK.
- Seguridad APIs OK.
- Límites por plan OK.
- Dashboard por roles OK.
- Reserva pública OK.

Ahora el trabajo es SOLO diseño UI/UX.

## Objetivo visual

Rediseñar AgendaMe para que se vea como un SaaS premium, moderno, confiable y comercial.

Debe verse profesional para vender a negocios reales.

No quiero un diseño genérico.
No quiero diseño infantil.
No quiero demasiados emojis.
No quiero sobrecargar.

## Estilo general

Inspiración:

- CRM premium
- Dashboard operativo moderno
- SaaS tipo Linear / Vercel / Stripe / Resend, pero más comercial
- Panel oscuro con métricas fuertes
- Cards con bordes sutiles
- Layout limpio
- Jerarquía visual clara
- Microinteracciones sutiles
- Responsive mobile cuidado

## Modo oscuro

Debe sentirse premium y tecnológico.

Colores sugeridos:

- Fondo principal: navy/black muy oscuro
- Cards: negro azulado / slate oscuro
- Bordes: slate sutil
- Acentos principales: amber, orange, yellow premium
- Acentos secundarios: cyan, teal, blue
- Verde solo para éxito
- Rojo solo para error/peligro
- Glow sutil, no exagerado

## Modo claro

Debe verse profesional, limpio y confiable.

Colores sugeridos:

- Fondo blanco / gris muy suave
- Cards blancas
- Bordes suaves
- Texto fuerte
- Acentos teal, blue y amber
- Ideal para negocios tradicionales

## Landing page

La landing debe vender el SaaS.

Debe incluir:

1. Hero claro:
   - Agenda online para negocios que trabajan con turnos y citas.
   - CTA principal: Crear cuenta / Probar AgendaMe.
   - CTA secundario: Ver planes / Ver demo.

2. Dolores:
   - Clientes escriben a cualquier hora.
   - Turnos desordenados.
   - Doble reserva.
   - No hay seguimiento de clientes.
   - Falta de control de empleados y servicios.

3. Solución:
   - Agenda online.
   - Reserva pública.
   - Panel administrativo.
   - Clientes, empleados y servicios.
   - Reportes.
   - Planes por uso.

4. Nichos:
   - Barberías.
   - Veterinarias.
   - Estética.
   - Clínicas.
   - Consultorios.
   - Profesionales.

5. Módulos:
   - Agenda / Citas.
   - Clientes CRM.
   - Servicios.
   - Empleados.
   - Sucursales.
   - Reportes.
   - Planes.

6. Sección visual:
   - Mockup de dashboard.
   - Tarjetas de métricas.
   - Vista de reservas.
   - Estilo SaaS premium.

7. Planes:
   - Gratis.
   - Básico.
   - Profesional.
   - Empresarial.

8. CTA final:
   - Empezar ahora.
   - Organizar mi agenda.

## Dashboard

El dashboard debe sentirse como panel operativo premium.

Mejorar:

- Sidebar.
- Header/topbar.
- Cards de métricas.
- Tablas.
- Formularios.
- Dialogs.
- Botones.
- Badges.
- Estados vacíos.
- Estados hover/focus.
- Mobile menu.

## Microinteracciones

Usar animaciones sutiles:

- Hover en cards.
- Transiciones en botones.
- Active state en sidebar.
- Focus visible en inputs.
- Aparición suave de dialogs.
- Glow sutil en elementos destacados.
- Nada exagerado.
- No instalar librerías nuevas sin pedir permiso.

## Archivos permitidos

Se puede tocar:

- src/app/globals.css
- src/app/page.tsx
- src/app/planes/page.tsx
- src/app/auth/login/page.tsx
- src/app/auth/registro/page.tsx
- src/app/dashboard/layout.tsx
- src/components/ui/*
- src/components/dashboard/*
- src/components/citas/*
- src/components/clientes/*
- src/components/empleados/*
- src/components/servicios/*

## Archivos prohibidos

NO tocar:

- src/app/api/**
- src/lib/supabase/**
- src/lib/dashboard/**
- src/lib/planes/**
- tests/**
- supabase/**
- SQL
- triggers
- autenticación
- permisos
- queries de Supabase
- lógica de negocio
- inserts
- updates
- deletes

## Reglas

- No cambiar rutas.
- No cambiar lógica.
- No cambiar permisos.
- No tocar Supabase.
- No romper TypeScript.
- No instalar librerías nuevas sin permiso.
- Trabajar por etapas pequeñas.
- Después de cada etapa ejecutar npm run build.
