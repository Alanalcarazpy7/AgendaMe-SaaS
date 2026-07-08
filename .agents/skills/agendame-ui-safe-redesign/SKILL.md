# AgendaMe UI Safe Redesign Skill

## Cuándo usar esta skill

Usar esta skill para cualquier rediseño visual de AgendaMe:

- Landing pública
- Página de planes
- Login
- Registro
- Dashboard
- Sidebar
- Cards
- Tablas
- Formularios
- Estados vacíos
- Pricing
- Contacto
- Animaciones

## Objetivo

Mejorar la interfaz para que AgendaMe se sienta como un SaaS premium, confiable, moderno y comercial, sin romper lógica de negocio.

## Reglas de seguridad

Nunca ejecutar comandos destructivos sin aprobación explícita.

Prohibido:

- rm -rf
- git clean
- git reset --hard
- Remove-Item -Recurse
- del
- rmdir
- borrar carpetas
- mover carpetas completas

Antes de editar:

1. Inspeccionar archivos.
2. Mostrar plan de archivos a tocar.
3. Esperar aprobación.
4. Editar solo archivos permitidos.
5. Ejecutar npm run build.
6. Esperar aprobación antes de avanzar.

## Archivos permitidos para diseño

Según etapa:

- src/app/globals.css
- src/app/page.tsx
- src/app/planes/page.tsx
- src/app/auth/login/page.tsx
- src/app/auth/registro/page.tsx
- src/app/dashboard/layout.tsx
- src/app/dashboard/page.tsx
- src/app/dashboard/planes/page.tsx
- src/components/brand/*
- src/components/landing/*
- src/components/planes/*
- src/components/ui/*
- src/components/dashboard/*

## Archivos prohibidos salvo autorización explícita

- src/app/api/**
- src/lib/supabase/**
- src/lib/dashboard/access-context.ts
- src/lib/dashboard/api-access.ts
- src/lib/dashboard/api-guards.ts
- tests/**
- supabase/** salvo patch SQL aprobado
- lógica de reservas
- lógica de auth
- permisos y roles
- queries críticas

## Principios visuales

La UI debe ser:

- SaaS premium
- Moderna
- Profesional
- Confiable
- Clara
- Tecnológica
- Limpia
- Responsive
- Accesible
- No infantil

## Idioma

Toda la UI visible debe estar en español.

## Paleta oficial

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

No usar dorado/yellow/amber para premium o plan destacado.

Para destacar usar azul/cyan/teal.

Rojo solo para errores o acciones destructivas.

## Logo

Los logos ya existen en public/brand.

No crear logos nuevos.

No rediseñar SVG.

Crear o usar:

src/components/brand/agendame-logo.tsx

Debe usar los SVG existentes.

## Planes

Los planes deben salir desde Supabase.

Fuente:

public.vista_planes_publicos

No hardcodear:

- Precios
- Límites
- Features
- Ahorro anual

Usar helpers:

- src/lib/planes/planes-shared.ts
- src/lib/planes/planes-publicos.ts

## WhatsApp

Usar:

src/lib/contact/whatsapp.ts

No hardcodear mensajes comerciales de planes.

Los mensajes de planes deben generarse desde:

generarMensajeWhatsAppPlan(plan, periodo)

## Landing

La landing debe explicar:

- Qué es AgendaMe
- Para quién sirve
- Cómo funciona
- Qué problema resuelve
- Qué funciones tiene
- Planes
- Contacto

No usar /reservar/barberia como demo comercial.

El navbar Planes debe ir a /planes.

## Build

Después de cada etapa:

npm run build

Si falla, detenerse y explicar el error.
