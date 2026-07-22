# Proteccion de reservas publicas

## Comportamiento

- IP: 8 intentos por negocio cada 10 minutos.
- Telefono: 3 intentos por negocio cada 30 minutos.
- El exceso responde HTTP 429 con `Retry-After`.
- Las claves se protegen con HMAC SHA-256. La tabla no almacena IP ni telefono
  legibles.
- En produccion la app falla cerrado con HTTP 503 si la RPC no esta disponible.
- En desarrollo existe un fallback en memoria para no bloquear el trabajo local.

## Aplicar en Supabase

1. Abrir el proyecto correcto en Supabase.
2. Entrar en `SQL Editor > New query`.
3. Ejecutar el contenido completo de
   `supabase/patches/2026-07-public-booking-rate-limit.sql`.
4. Ejecutar las consultas de validacion incluidas al final del archivo.
5. Confirmar que `consume_api_rate_limit` solo tenga permiso para
   `service_role`, nunca para `anon` o `authenticated`.

El parche crea datos operativos descartables y no modifica citas, clientes,
usuarios, planes ni negocios existentes.

## Secreto en Vercel

Generar un valor aleatorio de al menos 32 bytes, por ejemplo:

```powershell
openssl rand -hex 32
```

En `Vercel > Project > Settings > Environment Variables`, crear
`RATE_LIMIT_SECRET` para Production y Preview, y luego redeployar. No guardar el
valor en Git. Si la variable falta, el servidor utiliza temporalmente la clave
service role como secreto HMAC de respaldo.

## Verificacion

```powershell
npx playwright test tests/public-booking-rate-limit.spec.ts
```

El resultado esperado es 3 pruebas aprobadas: IP, telefono y concurrencia.

## Mantenimiento

La tabla reutiliza las claves cuando vuelven a aparecer. Para eliminar claves
antiguas se puede ejecutar diariamente:

```sql
delete from public.api_rate_limits
where reset_at < now() - interval '1 day';
```
