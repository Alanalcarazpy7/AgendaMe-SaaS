# Auditoria de carga - 22/07/2026

## Alcance

- Ambiente: `https://agendame-saas.vercel.app`
- Datos: exclusivamente negocios y usuarios E2E.
- Perfiles: lectura publica, navegacion autenticada y abuso de reservas.
- Herramientas: k6 2.1.0 y Playwright 1.61.1.
- Los secretos, sesiones, fixtures y resultados crudos quedan ignorados por Git.

Un VU representa una persona que navega continuamente. No equivale a un negocio
registrado ni a una persona que deja el dashboard abierto sin hacer acciones.

## Resultados confirmados

| Escenario | Resultado | Errores | p95 |
| --- | --- | ---: | ---: |
| Publico, smoke en frio | Advertencia de arranque | 0 | disponibilidad 1.28 s |
| Publico, smoke caliente | Pasa | 0 | disponibilidad 508 ms |
| Publico, 5 VU durante 3 min | Pasa | 0 | 659 ms global |
| Publico, 30 VU durante 13 min | Pasa | 0/18.008 | 645 ms global |
| Dashboard, 1 VU | Pasa | 0/11 | 1.19 s |
| Dashboard, 5 VU durante 3 min | Pasa | 0/265 | 1.22 s |
| Dashboard, 10 VU durante 6 min | Pasa | 0/1.072 | 1.04 s |
| Dashboard, 20 VU durante 6 min | Falla por latencia | 1/1.466 | 6.97 s |
| Dashboard, 30 VU durante 13 min | Falla por latencia | 15/3.585 | 11.73 s |
| Dashboard mixto, 10 VU despues de RPC | Pasa | 0/1.061 | 1.10 s |
| Dashboard mixto, 20 VU despues de RPC | Pasa | 0/1.965 | 2.59 s |
| Dashboard mixto, 30 VU despues de RPC | Falla | 38/2.199 | 7.76 s |
| Dashboard mixto, 30 VU con cache | Pasa | 0/3.252 | 980 ms |
| Dashboard mixto, 40 VU con cache | Pasa | 0/4.389 | 920 ms |
| Dashboard mixto, 50 VU con cache | Pasa | 0/5.178 | 1.27 s |
| Publico + disponibilidad, 50 VU | Pasa | 0/12.956 | 681 ms / 400 ms |
| Abuso de reserva, 6 intentos | Pasa | 3 respuestas 429 | aplica `Retry-After` |

En la prueba de 20 VU, la mediana fue 930 ms pero el p95 subio a 6.97 s. Esto
indica cola en rafagas, no lentitud constante. La ruta mas afectada fue
`/dashboard/empleados` con p95 de 9.66 s y una respuesta 500. Las otras rutas
tambien se degradaron, por lo que el costo comun del layout y del control de
acceso era parte importante del problema.

## Correcciones posteriores a la medicion

- El acceso del dashboard se memoiza por render con `React.cache`.
- El banner y la portada comparten el mismo calculo de uso del plan.
- Servicios reutiliza el negocio ya autorizado y evita autenticar y consultar
  la membresia por segunda vez.
- Citas carga clientes en paralelo con citas, empleados y servicios.
- Empleados carga sucursales en paralelo con empleados y servicios.

La RPC consolidada mejoro de forma importante el nivel de 20 VU: paso de p95
6.97 s con un 500 a p95 2.59 s sin errores. A 30 VU vuelve a aparecer cola:
mediana 886 ms, p90 4.79 s, p95 7.76 s, maximo 36.45 s y 1.73% de respuestas
fallidas. Los 500 afectaron varias rutas, por lo que el costo comun del layout
sigue siendo el principal sospechoso.

La siguiente optimizacion comparte entre solicitudes durante 30 segundos el
resumen visual de limites (1 lectura de plan + 5 conteos) y durante 60 segundos
el aviso de vencimiento (2 lecturas). Las validaciones de escritura conservan
consultas sin cache, por lo que no se relajan limites ni reglas de negocio. El
build de produccion y ESLint pasan. Desplegada en `b6f5ff5`, la prueba de 30 VU
paso de 38 errores y p95 7.76 s a cero errores y p95 980 ms.

## Lectura de capacidad

- El flujo publico soporta con margen el piloto previsto de 3 o 4 negocios.
- Cincuenta personas navegando de forma continua y simultanea por el dashboard
  pasan en el deployment actual: p95 1.27 s y cero errores en 5.178 respuestas.
- Cincuenta personas consultando pagina publica y disponibilidad tambien pasan:
  p95 681 ms para la pagina y 400 ms para slots, sin errores en 12.956 requests.
- No se debe interpretar el fallo de 20 VU como un limite de 20 negocios. La
  carga simula recargas completas y continuas, mas agresivas que la navegacion
  normal de Next.js, que reutiliza layouts en transiciones del cliente.
- La meta de 50 VU queda demostrada para lectura autenticada y disponibilidad
  publica sobre 7 usuarios y 4 negocios E2E. No equivale todavia a 50 tenants
  independientes ni a 50 escrituras simultaneas.

## Siguiente ronda

1. Ejecutar `supabase/diagnostics/dashboard-performance.sql` en modo lectura y
   revisar indices, conexiones y `pg_stat_statements`.
2. Diseñar en staging una prueba mixta con pocas escrituras validas y datos
   unicos; el rate limit hace correctamente que una sola IP no pueda crear una
   rafaga masiva en produccion.
3. Crear 50 tenants independientes solo cuando haga falta medir aislamiento y
   crecimiento del volumen de datos, no para el piloto inicial.
4. Ejecutar una prueba de pico corta. El soak de
   una hora queda para un staging separado y con presupuesto de ancho de banda.

## Pendientes manuales antes del piloto

- Confirmar entrega real de alta, confirmacion y recuperacion de correo.
- Completar una compra y revision manual de comprobante con archivos JPG y PDF.
- Probar responsive en al menos un telefono Android real.
- Revisar Vercel Functions y Supabase durante una prueba para correlacionar
  latencia, errores 5xx, CPU, conexiones y consumo de ancho de banda.
- Confirmar backup y restauracion antes de limpiar los datos de prueba.
