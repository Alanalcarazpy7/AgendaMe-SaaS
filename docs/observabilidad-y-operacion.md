# Observabilidad y operacion de AgendaMe

Esta guia resume que revisar durante el piloto y donde encontrar cada senal.
No contiene credenciales ni debe incluir datos personales de clientes.

## Herramientas integradas

### Sentry

Detecta errores del navegador, Server Components, Route Handlers y errores no
controlados de Next.js. La integracion elimina cuerpos, cookies, encabezados,
correo, IP y tokens de las rutas antes de enviar un evento.

Variables para desarrollo local y Vercel:

```text
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

- El DSN habilita la captura de errores.
- El token, la organizacion y el proyecto habilitan source maps legibles en
  los builds de Vercel.
- `SENTRY_AUTH_TOKEN` es secreto. Nunca debe empezar con `NEXT_PUBLIC_`.
- No habilitar Session Replay durante el piloto: las pantallas manejan datos de
  clientes, reservas y comprobantes.

Alertas iniciales recomendadas:

- Un error nuevo en produccion: correo inmediato.
- El mismo error afecta a 3 usuarios en 10 minutos: prioridad alta.
- Tasa de errores mayor a 1% durante 5 minutos: prioridad critica.
- Transacciones con p95 mayor a 3 segundos durante 10 minutos: advertencia.

### Vercel Web Analytics

Mide visitas y rutas consultadas sin cookies. Debe habilitarse tambien desde
`Vercel > proyecto > Analytics`. En Hobby se usan vistas de pagina; los eventos
personalizados requieren Pro.

### Vercel Speed Insights

Mide Web Vitals reales por ruta y dispositivo. Debe habilitarse desde
`Vercel > proyecto > Speed Insights`.

Objetivos iniciales:

- LCP p75 menor a 2.5 s.
- INP p75 menor a 200 ms.
- CLS p75 menor a 0.1.
- Revisar por separado `/`, `/reservar/[slug]` y `/dashboard`.

## Paneles que revisar

### Diario durante el piloto

1. Sentry: errores nuevos, usuarios afectados y ruta.
2. Vercel: errores 5xx, duracion de funciones y uso.
3. Supabase: API Logs, Auth Logs y conexiones de base de datos.
4. AgendaMe admin: pagos pendientes, negocios bloqueados y auditoria.

### Semanal

1. Confirmar que el workflow `Supabase backup` termino en verde.
2. Descargar un artifact reciente y conservar una copia fuera de GitHub.
3. Revisar consultas lentas y crecimiento de `citas`, `clientes` y auditoria.
4. Revisar limites de Vercel, Supabase, Sentry y correo SMTP.
5. Clasificar reportes del piloto por severidad y negocio afectado.

### Mensual

1. Probar restaurar un `.dump` en una base aislada.
2. Actualizar dependencias sin usar `npm audit fix --force` a ciegas.
3. Ejecutar build, lint, Playwright completo y k6 en staging.
4. Revisar usuarios, roles, invitaciones pendientes y accesos inactivos.

## Respuesta a incidentes

Al recibir un reporte, registrar:

- Hora aproximada y zona horaria.
- Negocio y rol afectado, sin pedir contrasenas.
- Ruta y accion exacta.
- Mensaje visible o referencia del error.
- Navegador y dispositivo.

Orden de diagnostico:

1. Buscar la referencia o la hora en Sentry.
2. Comparar con logs de Vercel.
3. Revisar logs de Supabase sin modificar datos.
4. Reproducir con una cuenta E2E del mismo rol y plan.
5. Corregir en `develop`, ejecutar pruebas y recien despues desplegar.

## Comandos locales

```bash
npm run lint
npm run build
npm run test:full
npm audit --omit=dev
```

Las pruebas de carga deben ejecutarse contra staging o fixtures dedicados,
nunca contra datos reales de clientes.
