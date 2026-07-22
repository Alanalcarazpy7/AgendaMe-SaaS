# Auditoria E2E y checklist de produccion

Fecha: 2026-07-21

## Resultado automatizado

- Suite base: 343 casos en 31 archivos.
- Resultado integral: 338 passed, 5 skipped, 0 failed en Chromium.
- Caso adicional concurrente: 1 passed.
- TypeScript: passed.
- Next.js production build: passed.
- ESLint de 32 archivos nuevos/modificados: 0 errores, 1 warning preexistente por un `<img>`.
- ESLint historico completo: 148 errores y 18 warnings pendientes.

Cobertura incluida:

- Planes Gratis, Basico, Profesional y Empresarial.
- Admin global, gerente, recepcionista, empleado y propietario SaaS.
- Registro/onboarding, login, rutas protegidas y matriz de permisos.
- Clientes, servicios, empleados, citas y asignacion automatica.
- Reservas publicas, seguimiento, validaciones, rate limit y doble reserva concurrente.
- Sucursales, desactivacion/reactivacion, invitaciones y empleado unico por acceso.
- Cambio de plan, limites visibles y acceso restringido dentro del dashboard.
- Comprobante privado, visualizacion del propietario, aprobacion e historial.
- Bloqueo de negocio y sucursal con mensajes segun rol.
- Navegacion repetida, consola, rendimiento, movil y capturas visuales.

## Casos omitidos por volumen

Se valida la misma regla con limites menores, pero no se crean miles de filas en cada corrida:

- Cita 501 del plan Profesional.
- Cita 2001 del plan Empresarial.
- Cliente 301 del plan Basico.
- Cliente 1001 del plan Profesional.
- Cliente 5001 del plan Empresarial.

Antes de una migracion importante conviene ejecutar estos cinco casos en una base temporal dedicada o validar directamente el trigger con datos generados por SQL.

## Datos de prueba

`npm run test:e2e:prepare` solo restaura negocios con slug `e2e-*` y cuentas `e2e.*@agendame.test`. Conserva el historial de citas cancelandolas, porque la base impide eliminarlas.

La limpieza total esta deshabilitada. No debe habilitarse hasta confirmar el UUID/correo exacto del superadmin protegido y preparar una operacion SQL transaccional compatible con el historial inmutable. Nunca se borran `planes_saas`, `permisos`, `roles_negocio` ni `roles_permisos` para preparar E2E.

## Checklist manual por negocio piloto

- Crear cuenta, recibir correo real, confirmar y completar onboarding.
- Recorrer Gratis hasta cada limite visible y confirmar el mensaje al intentar excederlo.
- Subir/bajar de plan y comprobar que los datos permanecen, solo cambia el acceso.
- Desactivar y reactivar sucursales secundarias; la principal nunca debe desactivarse.
- Ingresar como gerente, recepcionista y empleado desde otro navegador/dispositivo.
- Crear, editar, cancelar y reprogramar citas desde calendario Detalle y Panorama.
- Probar dos operadores reservando el mismo horario al mismo tiempo.
- Subir JPG, PNG, WEBP y PDF reales cerca del limite de 5 MB; aprobar y rechazar.
- Probar WhatsApp con la aplicacion instalada y sin instalar, en Android e iPhone.
- Verificar exportaciones descargadas abriendolas en Excel/LibreOffice.
- Probar teclado completo, zoom 200 %, lector de pantalla y textos largos.
- Probar Chrome, Firefox y Safari/WebKit; la matriz automatizada actual usa Chromium.
- Probar zona horaria, cambio de dia y citas alrededor de medianoche.
- Validar deploy HTTPS, cookies, redirects, variables de entorno y dominio final.
- Ejecutar y restaurar un backup real antes de incorporar datos de clientes.

## Comandos

```bash
npm run test:e2e:prepare
npm run test:e2e:complete
npm run build
```
