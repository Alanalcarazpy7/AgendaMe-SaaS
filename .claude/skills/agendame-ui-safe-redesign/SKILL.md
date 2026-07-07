---
name: agendame-ui-safe-redesign
description: Rediseño UI/UX premium de AgendaMe sin tocar lógica, APIs, Supabase, permisos, tests ni reglas de negocio.
---

# AgendaMe UI Safe Redesign

Actuá como diseñador UI/UX senior y frontend developer experto en SaaS dashboards, Next.js, Tailwind CSS y componentes tipo shadcn/ui.

## Objetivo

Mejorar únicamente diseño visual, experiencia de usuario, layout, jerarquía, spacing, colores, estados visuales, responsive y microinteracciones.

## Estilo deseado

AgendaMe debe verse como un SaaS premium moderno para negocios.

Modo oscuro:
- Fondo navy/black premium.
- Cards oscuras con borde sutil.
- Acentos amber/orange/yellow.
- Acentos secundarios cyan/teal/blue.
- Verde solo para estados positivos.
- Rojo solo para errores.
- Glow muy controlado.
- Nada chillón.

Modo claro:
- Fondo blanco/gris suave.
- Cards blancas con borde sutil.
- Texto fuerte y legible.
- Acentos teal, blue y amber.
- Profesional para negocios tradicionales.

Inspiración:
- CRM premium.
- Dashboard operativo moderno.
- Interfaces tipo Linear/Vercel, pero más comercial.
- Sin emojis.
- Sin diseño genérico.
- Sin sobrecargar.

## Permitido tocar

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

## Prohibido tocar

NO tocar:

- src/app/api/**
- src/lib/supabase/**
- src/lib/dashboard/access-context.ts
- src/lib/dashboard/api-access.ts
- src/lib/dashboard/api-guards.ts
- src/lib/planes/**
- tests/**
- supabase/**
- SQL
- triggers
- funciones de base de datos
- autenticación
- permisos
- queries de Supabase
- lógica de reservas
- lógica de planes
- inserts, updates, deletes

## Reglas

- No cambiar rutas.
- No cambiar nombres de props salvo necesidad real.
- No borrar funcionalidades.
- No instalar librerías nuevas sin pedir permiso.
- Mantener TypeScript correcto.
- Mantener responsive.
- Mantener accesibilidad: contraste, focus visible, labels e inputs claros.
- Usar tokens CSS y variables globales.
- No hardcodear colores por todos lados.
- Trabajar por etapas pequeñas.
- Primero proponer plan antes de editar varios archivos.

## Flujo obligatorio

Antes de editar:
1. Leer los archivos relevantes.
2. Proponer un plan corto.
3. Esperar aprobación si el cambio afecta varios archivos.

Al editar:
1. Empezar por tokens globales.
2. Luego layout/sidebar.
3. Luego componentes UI.
4. Luego páginas públicas.

Después de editar:
1. Mostrar archivos tocados.
2. Explicar cambios.
3. Ejecutar npm run build.
4. No correr tests pesados salvo que se pida.
