# AgendaMe - Contexto para Claude Code

AgendaMe es un SaaS de reservas y citas multi-tenant creado con Next.js App Router, TypeScript, Tailwind CSS y Supabase.

## Estado actual

El proyecto ya tiene:

- npm run build OK.
- Seguridad de APIs OK.
- Límites por plan OK.
- Dashboard por roles OK.
- Reserva pública OK.

## Objetivo actual

Trabajar SOLO en UI/UX y rediseño visual premium.

No tocar lógica, APIs, Supabase, permisos, tests ni reglas de negocio.

## Archivos seguros para diseño

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

## Estilo visual

Modo oscuro premium:
- navy/black
- cards oscuras
- amber/orange/yellow
- cyan/teal/blue
- glow sutil

Modo claro profesional:
- blanco/gris suave
- cards blancas
- acentos teal/blue/amber

## Reglas

- No cambiar rutas.
- No cambiar lógica.
- No tocar queries.
- No tocar inserts, updates o deletes.
- No instalar librerías sin permiso.
- Mantener build OK.
- Trabajar por etapas pequeñas.

## Marca AgendaMe

Antes de rediseñar la interfaz, leer también:

- docs/brand-agendame.md

La marca oficial es AgendaMe.

Usar la identidad:
- calendario + check
- reservas confirmadas
- SaaS premium multi-nicho
- gratis hasta 20 citas al mes

No copiar marcas externas como AgendaPro o Agendi.
