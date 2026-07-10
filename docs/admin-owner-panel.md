# Panel privado del propietario — `/admin`

Documentación técnica del panel administrativo privado de AgendaMe, exclusivo para el propietario de la plataforma (no confundir con el dashboard multi-tenant de negocios). Ver el historial de trabajo y decisiones en [`docs/admin-owner-panel-progress.md`](./admin-owner-panel-progress.md) y la especificación original en `AGENDAME_ADMIN_PANEL_PROMPT_MAESTRO.txt` (raíz del repo).

## 1. Arquitectura

```
src/app/admin/                     rutas del panel (App Router, Server Components)
  layout.tsx                       guard + AdminShell (sidebar/topbar)
  page.tsx                         Vista general (KPIs, alertas, gráficos)
  negocios/page.tsx                lista de negocios (filtros, paginación en memoria, export)
  negocios/[id]/page.tsx           detalle de negocio + acciones
  suscripciones/page.tsx           vistas por estado de suscripción
  renovaciones/page.tsx            vencimientos próximos y vencidos
  pagos/page.tsx                   pagos de todos los negocios + aprobar/rechazar
  usuarios/page.tsx                usuarios de la plataforma (auth.users + perfiles + accesos)
  planes/page.tsx                  edición de planes_saas
  invitaciones/page.tsx            sucursal_invitaciones (sin tokens)
  auditoria/page.tsx               solo lectura, paginación real en servidor
  analitica/page.tsx               series temporales, uso, retención condicional
  loading.tsx, error.tsx           estados compartidos por todas las rutas anidadas

src/app/api/admin/                 Route Handlers privilegiados (exportaciones)
  negocios/exportar/route.ts
  pagos/exportar/route.ts

src/lib/admin/
  guard.ts                         requirePlatformOwner() / getPlatformOwnerOrNull()
  api-guard.ts                     requirePlatformOwnerApi() (para Route Handlers/Server Actions)
  audit.ts                         registrarAuditoria()
  alertas.ts                       calcularAlertas() (pura)
  kpis.ts                          calcularKpis() y series para gráficos (pura)
  negocios-table.ts                filtros/paginación de la lista de negocios (pura)
  nav.ts                           configuración del sidebar
  queries/                         lecturas privilegiadas (negocios-resumen, planes, pagos,
                                    negocio-detalle, usuarios, invitaciones, auditoria, solicitudes)
  actions/                         Server Actions ("use server"): negocios.ts, planes.ts,
                                    invitaciones.ts
  schemas/                         Zod: negocios.ts, planes.ts, invitaciones.ts
  formatters/                      currency.ts (Gs., es-PY), date.ts (America/Asuncion)
  types/negocio.ts                 tipo NegocioResumenRow

src/components/admin/              componentes propios del panel (no reutiliza DashboardShell)
  admin-shell.tsx, kpi-card.tsx, alertas-panel.tsx
  charts/admin-charts.tsx          Recharts (mismo lenguaje visual que src/components/reportes)
  negocios/, pagos/, planes/, invitaciones/, auditoria/, usuarios/
```

Convenciones seguidas (heredadas del resto del proyecto, ver Fase 1 del progress.md):
- Server Components para todo lo que lee datos sensibles; Client Components solo para interacción (filtros, diálogos, formularios).
- Server Actions para mutaciones, llamadas directamente desde Client Components (patrón estándar de Next.js App Router).
- `export const dynamic = "force-dynamic"` y `revalidate = 0` en layout y páginas — nada de `/admin` se cachea ni se genera estáticamente.
- Todas las tablas grandes evitan bajar datos innecesarios al cliente: las consultas corren enteramente en Server Components/Route Handlers, y solo el HTML/props ya filtrados llegan al navegador.

## 2. Rutas

| Ruta | Contenido |
|---|---|
| `/admin` | Vista general: 16 KPIs, alertas operativas, 4 gráficos |
| `/admin/negocios` | Lista con búsqueda, filtros (plan/estado/vencimiento/orden), paginación, export XLSX |
| `/admin/negocios/[id]` | Detalle: datos, plan/suscripción, límites, historial, pagos, solicitudes, notas, auditoría |
| `/admin/suscripciones` | Pestañas: todas/activas/vencen 7-15-30/vencidas/sin vencimiento |
| `/admin/renovaciones` | KPIs de vencimiento + tabla de próximos 30 días + vencidas |
| `/admin/pagos` | Todos los pagos, resumen, filtro por estado, aprobar/rechazar, export XLSX |
| `/admin/usuarios` | auth.users + perfiles_usuario + accesos, DTO seguro |
| `/admin/planes` | Edición de precios/límites/visibilidad de planes_saas |
| `/admin/invitaciones` | sucursal_invitaciones por estado efectivo, revocar |
| `/admin/auditoria` | Solo lectura, paginación real en servidor, filtros, detalle en dialog |
| `/admin/analitica` | Rango configurable (6/12/24 meses), uso, retención condicional |

No existe `/admin/configuracion` todavía (listada como sugerida en el prompt maestro, no se identificó contenido real y específico que agregar sin inventar funcionalidad — queda pendiente para cuando haya un requerimiento concreto).

## 3. Seguridad

### 3.1 Identidad del propietario

Variable de servidor **`ADMIN_OWNER_USER_ID`** (UUID de `auth.users`). Sin esta variable, el panel falla cerrado. Nunca se sube el valor real a git — solo la clave, en `.env.example`.

### 3.2 Guard central — `src/lib/admin/guard.ts`

```ts
requirePlatformOwner(): Promise<PlatformOwner>   // Server Components/Actions: redirect o notFound()
getPlatformOwnerOrNull(): Promise<Result>         // no lanza, para lógica condicional
requirePlatformOwnerApi(): Promise<...>           // src/lib/admin/api-guard.ts, para Route Handlers
```

Condiciones, **ambas** requeridas:
1. `auth.users.id === ADMIN_OWNER_USER_ID`
2. `perfiles_usuario.rol_global === 'super_admin'` para ese mismo usuario (se busca por `id` y, si no aparece, por `usuario_id` — ver nota sobre inconsistencia de claves en el progress.md, Fase 1)

Comportamiento al fallar:
- No autenticado → `redirect("/login?next=/admin")`
- Autenticado pero no autorizado (por cualquier motivo: env no configurada, no es el owner, no es super_admin) → `notFound()`. Nunca se distingue el motivo exacto en la respuesta, para no filtrar que `/admin` existe como panel restringido.

### 3.3 Capas de protección

1. **Middleware** (`src/proxy.ts`): exige sesión autenticada en cualquier ruta bajo `/admin` (defensa en profundidad, solo autenticación, no autorización).
2. **Layout** (`src/app/admin/layout.tsx`): `await requirePlatformOwner()` antes de renderizar cualquier hijo.
3. **Cada página**: vuelve a llamar `requirePlatformOwner()` (no asume el contexto del layout).
4. **Cada Server Action / Route Handler**: vuelve a llamar `requirePlatformOwner()` / `requirePlatformOwnerApi()`. Nunca confía en que la llamada viene de `/admin`.
5. **Base de datos**: las RPC `admin_*` ya existentes en producción validan `es_super_admin()` internamente usando el JWT de la request (confirmado en Fase 1: rechazan tanto a `anon` como a una llamada hecha con la service role key, que no tiene usuario asociado). Por eso esas RPC se llaman siempre con el cliente de sesión (`@/lib/supabase/server`), nunca con el service role.

### 3.4 Clientes Supabase

- `src/lib/supabase/server.ts` — cliente atado a la sesión (cookies), usado para llamar RPC gateadas por `es_super_admin()`.
- `src/lib/supabase/service-role.ts` (`createServiceRoleClient`) — cliente privilegiado, con `import "server-only"` (agregado en Fase 2). Usado para lecturas/escrituras directas en tablas sin RPC equivalente (`notas_admin_negocio`, `pagos_manuales` al registrar uno nuevo, `planes_saas`, `sucursal_invitaciones`, `auditoria`, `perfiles_usuario`, y `auth.admin.listUsers()` para el módulo de usuarios).
- `src/lib/supabase/admin.ts` (`createAdminClient`) — duplicado histórico de `service-role.ts`, también con `server-only` agregado; el panel admin usa `service-role.ts` por ser el de mayor adopción en el resto del proyecto.

### 3.5 Auditoría

`src/lib/admin/audit.ts` → `registrarAuditoria()` inserta en la tabla `auditoria` (ya existente en producción, confirmada en Fase 1) desde toda Server Action que muta datos: cambiar plan, bloquear/desbloquear, aprobar/rechazar pago, registrar pago, agregar nota, editar plan, revocar invitación, exportar negocios/pagos. Nunca guarda contraseñas, tokens ni secretos. Un fallo al auditar no revierte la acción ya aplicada (se loguea en consola del servidor).

### 3.6 MFA / AAL2

El proyecto no implementa MFA hoy. Se dejó la variable opcional `ADMIN_REQUIRE_AAL2` documentada en `.env.example`, sin ningún flujo falso construido encima. Para habilitarla en el futuro: implementar MFA real vía Supabase Auth (TOTP), y agregar la verificación de `aal2` dentro de `requirePlatformOwner()` cuando `ADMIN_REQUIRE_AAL2=true`.

## 4. Variables de entorno

Ver `.env.example` (creado en Fase 2). Nuevas para el panel admin:

| Variable | Tipo | Descripción |
|---|---|---|
| `ADMIN_OWNER_USER_ID` | server-only, requerida | UUID de `auth.users` del propietario. Sin ella, `/admin` falla cerrado. |
| `ADMIN_REQUIRE_AAL2` | server-only, opcional | `true\|false`. No tiene efecto todavía (no hay MFA implementado); preparada para cuando exista. |

## 5. Consultas y RPC reutilizadas

Todas confirmadas existentes en producción por introspección de solo lectura en Fase 1 (ver progress.md para el método exacto). **Ninguna se creó de cero.**

| Objeto | Uso en el panel |
|---|---|
| `admin_obtener_negocios_resumen()` (RPC) | Fuente principal de Vista general, Negocios, Suscripciones, Renovaciones, Analítica |
| `admin_cambiar_plan_negocio(p_negocio_id, p_plan_clave, p_fecha_vencimiento?, p_notas?)` | Acción "Cambiar plan" |
| `admin_bloquear_negocio(p_negocio_id, p_motivo)` | Acción "Bloquear negocio" |
| `admin_desbloquear_negocio(p_negocio_id)` | Acción "Desbloquear negocio" |
| `admin_aprobar_pago_manual(p_pago_id, p_fecha_vencimiento, p_notas?)` | Acción "Aprobar pago" |
| `admin_rechazar_pago_manual(p_pago_id, p_notas?)` | Acción "Rechazar pago" |
| `es_super_admin()` | Usada internamente por las RPC de arriba; el panel no la llama directamente |
| `vista_admin_negocios_resumen` | Vista base de `admin_obtener_negocios_resumen()`; el panel no la consulta directo (sin grant a `anon`, y por diseño se prefiere pasar por la RPC) |
| Tablas leídas directo (service role): `negocios`, `suscripciones`, `pagos_manuales`, `planes_saas`, `notas_admin_negocio`, `solicitudes_cambio_plan`, `auditoria`, `sucursal_invitaciones`, `perfiles_usuario`, `negocio_usuarios`, `sucursal_usuarios` | Detalle de negocio, planes, invitaciones, auditoría, usuarios — sin RPC equivalente para estos casos de uso puntuales |
| `auth.admin.listUsers()` (GoTrue admin API) | `/admin/usuarios`, nunca expone hashes de contraseña |

RPC/tablas **no verificadas end-to-end** por esta sesión (ver riesgos en progress.md): el cuerpo interno de las RPC mutantes no se inspeccionó directamente (por prudencia, para no ejecutar mutaciones reales sin autorización); se confía en `requirePlatformOwner()` como garantía independiente.

## 6. Módulos funcionales

Ver el detalle fase por fase en `docs/admin-owner-panel-progress.md`. Resumen:

1. **Vista general** — 16 KPIs (negocios, suscripciones, pagos, ingresos, MRR/ARR estimados), alertas operativas, 4 gráficos.
2. **Negocios** — lista + detalle con acciones reales (cambiar plan, bloquear/desbloquear, pagos, notas).
3. **Suscripciones / Renovaciones** — vistas derivadas de la misma fuente de datos que Negocios, sin duplicar lógica de mutación (todas las acciones reales viven en el detalle del negocio).
4. **Pagos** — todos los pagos de la plataforma, aprobar/rechazar, export.
5. **Usuarios** — DTO seguro combinando `auth.users` + `perfiles_usuario` + accesos.
6. **Planes** — edición de precios/límites/visibilidad, con confirmación si afecta negocios activos.
7. **Invitaciones** — estado efectivo (incluye "expirada" calculada), revocar.
8. **Auditoría** — solo lectura, paginación real en SQL.
9. **Analítica** — series de 6/12/24 meses, uso, retención condicional (sin inventar cifras cuando falta historial).
10. **Alertas** — integradas en la Vista general, todas enlazan a su pantalla.

## 7. Métricas y fórmulas

- **Ingreso cobrado (mes/año)**: suma real de `pagos_manuales.monto_gs` con `estado='aprobado'`, agrupado por año/mes de `fecha_pago` en `America/Asuncion`. No es estimación.
- **MRR estimado**: suma de `planes_saas.precio_mensual_gs` (fallback a `precio_gs` legacy) de negocios con `suscripcion_estado='activa'` y plan no gratuito. Etiquetado como estimación porque no existe `ciclo_facturacion` todavía (se asume mensual).
- **ARR estimado**: `MRR estimado × 12`.
- **Suscripción vencida**: `suscripcion_estado='vencida'` OR (`activa` AND `dias_para_vencer < 0`) — cubre el caso real de que `marcar_suscripciones_vencidas()` no se ejecuta en cada request.
- **Formato de moneda**: `Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 })`.
- **Formato de fecha**: `Intl.DateTimeFormat` con `timeZone: "America/Asuncion"`.

## 8. Migraciones

- `supabase/patches/2026-07-admin-ciclo-facturacion.sql` — agrega `ciclo_facturacion` (`mensual|anual|manual`) a `suscripciones` y `pagos_manuales`. **Creada, no aplicada.** Requiere autorización explícita del propietario antes de ejecutarse contra producción (ver checklist).

No existe `supabase/migrations/` formal en este proyecto; las migraciones viven en `supabase/patches/*.sql` con cabecera indicando si fueron aplicadas.

## 9. Despliegue

1. Agregar `ADMIN_OWNER_USER_ID` (y opcionalmente `ADMIN_REQUIRE_AAL2`) a las variables de entorno del entorno de producción (Vercel/hosting), **nunca** commiteado.
2. Confirmar el UUID real del propietario en `auth.users` (Supabase Studio → Authentication → Users).
3. Ejecutar, con autorización explícita, un único `UPDATE` en `perfiles_usuario` para poner `rol_global='super_admin'` en la fila de ese usuario (por `id` o `usuario_id`, verificar cuál corresponde a esa cuenta antes de escribir).
4. (Opcional, cuando se autorice) aplicar `supabase/patches/2026-07-admin-ciclo-facturacion.sql`.
5. `npm run build` y desplegar normalmente — `/admin` no requiere configuración adicional de infraestructura (misma app Next.js).

## 10. Recuperación

- Si `/admin` empieza a devolver 404 para el propietario real: verificar que `ADMIN_OWNER_USER_ID` esté seteada en el entorno correcto y que coincida exactamente con `auth.users.id`; verificar `perfiles_usuario.rol_global='super_admin'` en la fila correcta (recordar la inconsistencia `id` vs `usuario_id` de Fase 1).
- Si una exportación falla: revisar logs del servidor (Route Handlers devuelven `NextResponse.json({error})` con el mensaje real de Supabase, no genérico).
- Si una Server Action falla silenciosamente: todas devuelven `{ok:false, error}` y la UI lo muestra vía `toast.error()` — revisar la consola del navegador/servidor si no aparece el toast.

## 11. Checklist antes de dar por operativo el panel

- [ ] `ADMIN_OWNER_USER_ID` configurada en producción con el UUID real.
- [ ] `perfiles_usuario.rol_global='super_admin'` aplicado a la fila correcta (autorizado explícitamente, no hecho por esta sesión).
- [ ] Probar manualmente, con la sesión real del propietario: entrar a `/admin`, cambiar un plan, bloquear/desbloquear un negocio de prueba, aprobar/rechazar un pago, exportar negocios y pagos.
- [ ] Confirmar que un usuario normal (o un `admin_global` de un negocio) recibe 404 al entrar a `/admin`.
- [ ] Aplicar `supabase/patches/2026-07-admin-ciclo-facturacion.sql` si se decide usar `ciclo_facturacion` (autorización explícita requerida).
- [ ] Generar `tests/.auth/superadmin.json` y `tests/.auth/admin.json` para poder correr `npm run test:admin` completo (hoy corre parcialmente, con 2 de 4 casos ejecutables sin credenciales).
