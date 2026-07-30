# Bootstrap y reinicio seguro de Supabase

## Objetivo

Este procedimiento deja AgendaMe sin negocios ni usuarios de prueba, pero
conserva el propietario de plataforma y los catalogos necesarios para volver
a probar desde el plan Gratis hasta Profesional.

No se ejecuta automaticamente contra Supabase. La limpieza es deliberadamente
manual porque elimina datos de forma irreversible.

## Las cuatro capas

1. **Backup completo `.dump`**

   Es la recuperacion real ante perdida total. Incluye schema y datos de
   PostgreSQL, pero no los archivos fisicos de Storage. El workflow
   `.github/workflows/supabase-backup.yml` lo genera semanalmente.

2. **Migraciones y patches**

   Crean tablas, funciones, triggers, vistas, grants y RLS. El repositorio
   contiene los patches recientes, pero todavia no contiene la migracion base
   historica completa. Por eso `supabase/seed.sql` por si solo no reconstruye
   una base vacia.

3. **`supabase/seed.sql`**

   Repone idempotentemente los cuatro planes, los diez permisos globales y la
   configuracion de los seis buckets. No crea usuarios Auth, negocios ni datos
   ficticios.

4. **Scripts de mantenimiento**

   - `scripts/audit-supabase-bootstrap.mjs`: auditoria remota de solo lectura.
   - `scripts/clear-supabase-test-storage.mjs`: limpia archivos mediante la API
     de Storage y conserva el avatar del owner.
   - `supabase/maintenance/reset-test-data.sql`: limpia PostgreSQL/Auth dentro
     de una transaccion y conserva los UUID indicados.
   - `supabase/maintenance/set-platform-owner.sql`: promueve una cuenta Auth
     existente a `super_admin`.

## Datos globales obligatorios

- Planes: `gratis`, `basico`, `profesional`, `empresarial`.
- Permisos: diez claves de `permisos` incluidas en el seed.
- Una cuenta en `auth.users`.
- Un perfil de esa cuenta en `perfiles_usuario` con
  `rol_global = 'super_admin'`.
- La variable server-only `ADMIN_OWNER_USER_ID` con el UUID de esa cuenta.
- Los seis buckets validados por la auditoria.

El plan Empresarial se conserva aunque las primeras pruebas lleguen solo hasta
Profesional: el codigo, los limites y los tests reconocen los cuatro niveles.
Conservar el catalogo no obliga a vender ni probar Empresarial ahora.

## Roles actuales

La autorizacion efectiva no depende hoy de filas globales en
`roles_negocio`/`rol_permisos`.

- `perfiles_usuario.rol_global`: `super_admin` o `usuario`.
- `negocio_usuarios.rol = 'admin'`: se mapea a `admin_global` en el dashboard.
- `sucursal_usuarios.rol`: `gerente_sucursal`,
  `recepcionista_sucursal` o `empleado_sucursal`.

`roles_negocio` es tenant-scoped y queda reservado para roles personalizados
futuros. Que esa tabla este vacia es correcto.

## Estado auditado el 30/07/2026

- 23 negocios.
- 16 usuarios Auth, de los cuales 10 son E2E.
- 1.556 citas.
- 4 planes.
- 10 permisos.
- 2 perfiles `super_admin`: el owner protegido y un fixture E2E.
- `roles_negocio` y `rol_permisos` vacios.
- `payment-proofs` privado.

La limpieza propuesta debe dejar un solo owner si se configura un solo UUID.

## Orden obligatorio para reiniciar

1. Ejecutar manualmente el workflow `Supabase backup`.
2. Descargar el `.dump` y comprobar que el artifact no esta vacio.
3. Auditar:

   ```bash
   npm run audit:supabase-bootstrap
   ```

4. Ver previamente que archivos se eliminarian:

   ```bash
   node scripts/clear-supabase-test-storage.mjs
   ```

5. Limpiar Storage fisicamente:

   ```bash
   node scripts/clear-supabase-test-storage.mjs --execute --confirm=DELETE_TEST_STORAGE
   ```

6. Abrir `supabase/maintenance/reset-test-data.sql`, reemplazar el UUID cero
   por `ADMIN_OWNER_USER_ID` y ejecutarlo completo en Supabase SQL Editor.
7. Ejecutar `supabase/seed.sql`.
8. Repetir la auditoria. El resultado esperado es:

   - Auth: un owner.
   - `perfiles_usuario`: un `super_admin`.
   - `negocios`: cero.
   - `planes_saas`: cuatro.
   - `permisos`: diez.

9. Registrarse desde la UI como el primer negocio Gratis y comenzar el
   checklist funcional.

## Crear o recuperar el owner

1. Crear la cuenta desde Supabase Authentication, con un correo real y
   confirmado.
2. Editar el correo/nombre de
   `supabase/maintenance/set-platform-owner.sql`.
3. Ejecutarlo en SQL Editor.
4. Copiar el UUID de Auth a `ADMIN_OWNER_USER_ID` en `.env.local` y Vercel.
5. Reiniciar localmente y redeployar Vercel.

La aplicacion actual permite un solo platform owner por allowlist de entorno.
Una segunda fila `super_admin` no obtiene acceso a `/admin` automaticamente.
Para soportar dos correos debe ampliarse primero el guard a una lista explicita
de UUID y agregar pruebas de seguridad.

## Recuperacion de una base completamente vacia

El orden es diferente:

1. Restaurar el `.dump` completo en un proyecto nuevo.
2. Restaurar los archivos de Storage desde un respaldo separado.
3. Rotar/configurar las variables de entorno del nuevo proyecto.
4. Ejecutar la auditoria.
5. Solo si los catalogos faltan, ejecutar `supabase/seed.sql`.

No ejecutar los patches sueltos en orden aleatorio sobre una base vacia. Hasta
que exista una migracion base consolidada, el `.dump` validado es la fuente de
recuperacion completa.
