# Pruebas de carga

Estas pruebas usan k6 y deben apuntar solamente a un deployment de staging con
datos descartables. No ejecutar `stress`, `spike` o `soak` contra produccion.

## Preparacion

1. Instalar k6 en Windows: `winget install k6.k6`.
2. Copiar `fixtures.example.json` como `fixtures.local.json`.
3. Completar un registro por negocio de staging. El archivo local esta ignorado
   por Git.
4. Usar una fecha futura con horarios configurados.

## Lectura publica

```powershell
$env:BASE_URL="https://staging.example.com"
$env:FIXTURES_FILE="./fixtures.local.json"
$env:LOAD_DATE="2026-08-10"
$env:PROFILE="smoke"
npm run test:load:public
```

Perfiles disponibles: `smoke`, `load`, `stress`, `spike` y `soak`. Ejecutarlos
en ese orden y detenerse si los umbrales fallan.

## Dashboard

Usar una cuenta creada exclusivamente para staging. Copiar el encabezado Cookie
de una sesion iniciada y mantenerlo solo en la terminal actual:

```powershell
$env:BASE_URL="https://staging.example.com"
$env:DASHBOARD_COOKIE="sb-...=..."
$env:PROFILE="smoke"
npm run test:load:dashboard
```

Tambien se puede reutilizar un storage state local de Playwright sin mostrar sus
cookies en la terminal:

```powershell
$env:BASE_URL="http://localhost:3000"
$env:DASHBOARD_STORAGE_STATE="../.auth/admin.json"
$env:PROFILE="smoke"
npm run test:load:dashboard
```

Una sola sesion sirve como referencia del costo de renderizado. La prueba final
multinegocio debe usar varias sesiones y negocios con volumen realista.

## Proteccion de reservas

Esta prueba crea como maximo una reserva valida y despues fuerza el limite por
telefono. Usar un horario descartable de staging y limpiar la cita al terminar.

```powershell
$env:BASE_URL="https://staging.example.com"
$env:PUBLIC_SLUG="negocio-staging"
$env:SERVICE_ID="uuid"
$env:BRANCH_ID="uuid"
$env:BOOKING_DATE="2026-08-10"
$env:BOOKING_TIME="10:00"
npm run test:load:booking-abuse
```

## Lectura de resultados

- `http_req_failed` debe quedar por debajo de 1%.
- El p95 publico debe quedar debajo de 2.5 s.
- El p95 de disponibilidad debe quedar debajo de 1.2 s.
- El p95 del dashboard debe quedar debajo de 3 s.
- Los 429 de `booking-abuse` son esperados; los 500/503 no.
- Revisar al mismo tiempo Vercel Logs y Supabase Reports/Performance Advisor.

La capacidad util es el ultimo escalon que mantiene los umbrales, no el punto
en el que la aplicacion finalmente deja de responder.
