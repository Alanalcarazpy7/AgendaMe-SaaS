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

El build de produccion y el typecheck pasan. Un smoke autenticado local posterior
a estas correcciones devolvio 9/9 respuestas 200 y ninguna redireccion a login.
La capacidad real posterior a la mejora debe medirse nuevamente en Vercel,
porque una ejecucion local no reproduce la infraestructura de produccion.

## Lectura de capacidad

- El flujo publico soporta con margen el piloto previsto de 3 o 4 negocios.
- Diez personas navegando de forma continua y simultanea por el dashboard pasan
  con buen margen en el deployment actual.
- No se debe interpretar el fallo de 20 VU como un limite de 20 negocios. La
  carga simula recargas completas y continuas, mas agresivas que la navegacion
  normal de Next.js, que reutiliza layouts en transiciones del cliente.
- Antes de un lanzamiento masivo conviene lograr p95 menor a 3 s con 20 VU y
  luego probar 30 VU. No corresponde ejecutar todavia 100 o 200 VU.

## Siguiente ronda

1. Desplegar las optimizaciones en Vercel.
2. Repetir `probe20` con las mismas cuatro sesiones y comparar ruta por ruta.
3. Ejecutar `supabase/diagnostics/dashboard-performance.sql` en modo lectura y
   revisar indices y escaneos secuenciales.
4. Si 20 VU sigue por encima de 3 s, medir por separado acceso, limites del plan
   y consultas de cada pagina antes de agregar cache entre solicitudes.
5. Solo cuando 20 y 30 VU pasen, ejecutar una prueba de pico corta. El soak de
   una hora queda para un staging separado y con presupuesto de ancho de banda.

## Pendientes manuales antes del piloto

- Confirmar entrega real de alta, confirmacion y recuperacion de correo.
- Completar una compra y revision manual de comprobante con archivos JPG y PDF.
- Probar responsive en al menos un telefono Android real.
- Revisar Vercel Functions y Supabase durante una prueba para correlacionar
  latencia, errores 5xx, CPU, conexiones y consumo de ancho de banda.
- Confirmar backup y restauracion antes de limpiar los datos de prueba.

