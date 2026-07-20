# Mapa del schema de Supabase — AgendaMe

> Generado a partir de: `schema.sql` (backup local del 2026-07-09 19:12, pg_dump completo con cuerpos de función, policies y grants) + introspección de solo lectura contra producción real (OpenAPI de PostgREST, API de Storage) + lectura del código fuente en `src/`. No contiene secretos, UUIDs reales de usuarios, ni datos de clientes. Ver `docs/admin-owner-panel-progress.md` para el registro cronológico de la auditoría que originó este documento.
>
> **El backup de `schema.sql` está desactualizado en al menos dos migraciones** (ver §9) — para RPC nuevas o columnas agregadas después del 2026-07-09, este documento usa la introspección en vivo, no el backup.

## 1. Resumen general

Base de datos PostgreSQL (Supabase) para un SaaS multi-tenant de reservas/citas. 32 tablas base en `public` (más `auth.users`, gestionado por Supabase Auth, fuera de este backup). Patrón dominante: cada tabla operativa cuelga de `negocios.id` vía FK `ON DELETE CASCADE`, aislando datos por tenant. La autorización se resuelve con funciones `SECURITY DEFINER` (`es_super_admin()`, `es_admin_negocio()`, `es_miembro_negocio()`, `es_empleado_negocio()`) reutilizadas tanto en RLS policies como en RPC.

## 2. Mapa de entidades principales

```
negocios (raíz del tenant)
 ├─ sucursales
 │   ├─ sucursal_usuarios (accesos de login por sucursal)
 │   ├─ sucursal_invitaciones (invitar personal, sin exponer token_hash)
 │   ├─ empleados (FK a sucursal_id, SIN cascade)
 │   │   ├─ horarios_empleado
 │   │   ├─ empleado_servicios
 │   │   └─ bloqueos_horario
 │   └─ horarios_negocio
 ├─ negocio_usuarios (accesos a nivel negocio; FK opcional a roles_negocio)
 │   └─ roles_negocio → rol_permisos → permisos
 │       └─ usuario_permisos_extra (permisos puntuales por negocio_usuario)
 ├─ clientes
 │   ├─ citas (FK a cliente/empleado/servicio con ON DELETE RESTRICT)
 │   │   ├─ historial_citas
 │   │   └─ recordatorios_citas
 │   ├─ cliente_sucursales, cliente_usuarios, cliente_portal_tokens
 │   └─ invitaciones_cliente
 ├─ servicios
 ├─ suscripciones → planes_saas
 ├─ pagos_manuales → planes_saas, suscripciones (SET NULL si se borra la suscripción)
 ├─ solicitudes_cambio_plan → planes_saas (plan_actual_id, plan_solicitado_id)
 ├─ auditoria
 ├─ notas_admin_negocio
 ├─ uso_plan_mensual (contador mensual de citas creadas, vía trigger)
 └─ configuracion_negocio
```

`perfiles_usuario` **no tiene FK real hacia `auth.users`** (tablas en schemas distintos) — el vínculo es solo por convención de que `perfiles_usuario.id` (o, en algunos registros, `usuario_id`) coincide con `auth.users.id`. El código de `requirePlatformOwner()` y de `obtenerUsuariosPlataforma()` busca por ambas columnas por esta razón. **Esta inconsistencia de claves no se corrigió en esta sesión** — sigue pendiente de decidir cuál es la convención definitiva.

## 3. Relaciones garantizadas por FK vs. solo por convención

**Garantizadas por FK** (confirmado en `schema.sql`, sección `ADD CONSTRAINT ... FOREIGN KEY`): todas las listadas en el diagrama de §2 excepto las siguientes, que son **solo convención de código**, sin FK real en la base:
- `auth.users` ↔ `perfiles_usuario` (por `id`/`usuario_id`, sin FK cross-schema).
- `negocio_usuarios.usuario_id` / `sucursal_usuarios.usuario_id` → `auth.users.id` (mismo motivo).
- `pagos_manuales.aprobado_por` / `rechazado_por` / `negocios.bloqueado_por` → `auth.users.id` (columnas `uuid` sueltas, sin FK, apuntan al admin que hizo la acción).

## 4. Tablas críticas

| Tabla | Por qué es crítica |
|---|---|
| `negocios` | Raíz de aislamiento multi-tenant; `estado` controla si opera o está bloqueado |
| `perfiles_usuario` | Contiene `rol_global='super_admin'`, la puerta de entrada a `/admin` |
| `suscripciones` | Fuente de verdad del plan activo de cada negocio; ahora con `ciclo_facturacion` |
| `pagos_manuales` | Dinero real declarado manualmente; ahora con `ciclo_facturacion` y `comprobante_url` |
| `auditoria` | Rastro de todas las acciones administrativas sensibles |
| `planes_saas` | Límites y precios que gatean toda la plataforma |

## 5. Vistas críticas

- `vista_admin_negocios_resumen` — base de `admin_obtener_negocios_resumen()`. Sin grant directo a `anon`/`authenticated` en el backup (solo `service_role`); el acceso real pasa por la RPC, que sí valida `es_super_admin()`.
- `vista_planes_publicos`, `vista_negocios_publicos`, `vista_servicios_publicos`, `vista_empleados_publicos`, `vista_horarios_*_publicos`, `vista_bloqueos_publicos`, `vista_configuracion_publica` — DTOs públicos para la reserva sin sesión; confirmadas expuestas en producción vía OpenAPI.

## 6. RPC críticas

### 6.1 Administrativas (panel `/admin`)

| RPC | Muta/Lee | SECURITY DEFINER | search_path fijo | Valida `es_super_admin()` | Audita en la misma transacción | Grants (según backup) |
|---|---|---|---|---|---|---|
| `admin_cambiar_plan_negocio` | Muta | ✅ | ✅ `'public'` | ✅ | ✅ (`plan_cambiado`) | anon, authenticated, service_role |
| `admin_bloquear_negocio` | Muta | ✅ | ✅ | ✅ | ✅ (`negocio_bloqueado`) | anon, authenticated, service_role |
| `admin_desbloquear_negocio` | Muta | ✅ | ✅ | ✅ | ✅ (`negocio_desbloqueado`) | anon, authenticated, service_role |
| `admin_aprobar_pago_manual` | Muta | ✅ | ✅ | ✅ | ✅ (`pago_manual_aprobado`) | anon, authenticated, service_role |
| `admin_rechazar_pago_manual` | Muta | ✅ | ✅ | ✅ | ✅ (`pago_manual_rechazado`) | anon, authenticated, service_role |
| `admin_obtener_negocios_resumen` | Solo lee | ✅ `STABLE` | ✅ | ✅ | n/a | anon, authenticated, service_role |
| `admin_agregar_nota_negocio` | Muta | (no verificado el cuerpo — creada por patch aplicado 2026-07-10) | — | por diseño del patch | por diseño del patch, en la misma transacción | EXECUTE revocado de PUBLIC por el propio patch |
| `admin_editar_plan` | Muta | ídem | — | ídem | ídem | ídem |
| `admin_registrar_pago_manual` | Muta | ídem | — | ídem | ídem | ídem |
| `admin_revocar_invitacion` | Muta | ídem | — | ídem | ídem | ídem |

Las 4 últimas se confirmaron **existentes en producción** por introspección OpenAPI en esta sesión, pero su cuerpo SQL exacto no está en el `schema.sql` local (es posterior al backup) — se documenta según lo que describe `supabase/patches/2026-07-admin-rpc-transaccionales.sql`, no verificado línea por línea contra producción.

Uso en código: todas se llaman desde `src/lib/admin/actions/{negocios,planes,invitaciones}.ts`, siempre con el cliente de sesión (`@/lib/supabase/server`), nunca con `service_role`.

### 6.2 De negocio/permisos (no administrativas, reutilizadas por el resto de la app)

`es_admin_negocio(negocio_id)`, `es_empleado_negocio(negocio_id)`, `es_miembro_negocio(negocio_id)`, `es_super_admin()`, `tiene_permiso`, `negocio_puede_operar`, `negocio_tiene_plan_activo`, `puede_crear_cita`, `puede_crear_cliente`, `puede_crear_empleado`, `puede_crear_servicio`, `cita_cuenta_para_limite`, `recalcular_uso_plan_mensual_citas`, `marcar_suscripciones_vencidas`, `cancelar_solicitud_cambio_plan`, `storage_negocio_id`, `obtener_o_crear_sucursal_principal`, `cliente_tiene_acceso`, `empleado_horario_permite`, `negocio_horario_permite`. Todas confirmadas expuestas en producción vía OpenAPI (30 RPC totales). No se auditó el cuerpo de estas en esta sesión (fuera del alcance autorizado: el foco fue el panel admin).

## 7. Triggers críticos

- `trg_perfiles_usuario_proteger_rol_global` → `proteger_rol_global_perfil()`: impide que un usuario se auto-asigne `rol_global='super_admin'` o cambie su propio `rol_global` a menos que ya sea `super_admin`. Defensa adicional no documentada antes en `docs/admin-owner-panel.md`.
- `incrementar_uso_plan_mensual()`: mantiene `uso_plan_mensual` sincronizado con `citas` (insert/update), usado para los límites de plan.
- `proteger_campos_admin_negocio()`: protege campos administrativos de `negocios` (nombre exacto de la función sugiere que evita que un no-admin edite campos reservados al panel admin — no se leyó el cuerpo completo en esta sesión).
- `asignar_sucursal_empleado()`: asigna automáticamente `sucursal_id` a un empleado nuevo si no se especifica, y valida que la sucursal pertenezca al negocio.

## 8. RLS / policies críticas

| Tabla | RLS | Policies relevantes |
|---|---|---|
| `auditoria` | ✅ activado | `SELECT` solo si `es_super_admin()`. No se encontró policy de `INSERT` para `authenticated` — consistente con que solo se inserte vía RPC `SECURITY DEFINER` o `service_role` (ambos bypasean RLS). |
| `perfiles_usuario` | ✅ activado | Lectura/edición del propio perfil (`auth.uid() = id`), más `SELECT`/`UPDATE`/`INSERT` ampliados si `es_super_admin()`. |

No se hizo un relevamiento exhaustivo de las 32 tablas en esta sesión (quedó fuera del alcance autorizado, centrado en el panel admin) — se documentan solo las dos tablas directamente relevantes a `/admin`. **Pendiente**: mapear RLS del resto de tablas (`negocios`, `citas`, `clientes`, etc.) si se quiere un mapa completo.

## 9. Grants importantes

- Las 5 RPC administrativas originales (§6.1) tienen `GRANT ALL` a `anon`, `authenticated` y `service_role` según el backup del 2026-07-09. **No revocado todavía** — ver `supabase/patches/2026-07-admin-revoke-public-execute-original-rpcs.sql` (creado en esta sesión, **no aplicado**).
- Las 4 RPC nuevas (`admin_agregar_nota_negocio`, etc.) fueron creadas ya con `EXECUTE` revocado de `PUBLIC`, según describe su propio patch.
- `vista_admin_negocios_resumen`: solo `service_role` en el backup — no expuesta directamente a `anon`/`authenticated`.

## 10. Storage

Buckets confirmados en producción (vía API de Storage, solo lectura, hoy):

| Bucket | Público | Uso |
|---|---|---|
| `logos-negocios` | sí | Logos de negocios |
| `archivos-negocio` | **no** | Archivos privados de negocio |
| `service-images` | sí | Imágenes de servicios |
| `business-branding` | sí | Branding (banner, colores) |
| `avatars` | sí | Avatares de usuario |
| `payment-proofs` | **sí** | Comprobantes de pago manual del panel admin |

**Riesgo documentado**: `payment-proofs` es público. El endpoint `src/app/api/admin/pagos/[pagoId]/comprobante/route.ts` sube el archivo a una ruta `${negocio_id}/${pago_id}/${timestamp}-${crypto.randomUUID()}.${ext}` (no enumerable por fuerza bruta razonable) y guarda la URL pública resultante en `pagos_manuales.comprobante_url`. Cualquiera que obtenga esa URL exacta (por ejemplo, si queda expuesta en un log, en `auditoria.detalles` en texto plano, o compartida por error) puede ver el comprobante de pago —un documento financiero— sin sesión ni verificación de `super_admin`. Es seguridad por oscuridad (ruta aleatoria), no control de acceso real.

**Plan de migración propuesto para pasar a URLs firmadas (no aplicado, solo documentado, ver alcance autorizado de esta sesión)**:
1. Cambiar el bucket a `public: false` (requiere `UPDATE storage.buckets` — mutación en Supabase, requiere autorización explícita aparte).
2. En `route.ts`, reemplazar `getPublicUrl(path)` por `createSignedUrl(path, expiresInSeconds)` (por ejemplo, 5 minutos), generada bajo demanda cada vez que el propietario abre `PagoComprobanteDialog`, no una sola vez al subir.
3. Dejar de guardar una URL pública permanente en `pagos_manuales.comprobante_url`: guardar solo el `path` interno del objeto, y resolver la URL firmada en el momento de mostrarla (Server Component/Route Handler, con `requirePlatformOwner()`).
4. Migrar los `comprobante_url` ya existentes: son URLs públicas antiguas que seguirán siendo válidas hasta que se borre o rote el bucket; documentar que quedan expuestas hasta esa migración.
5. Probar que `PagoComprobanteDialog` (`src/components/admin/pagos/pago-comprobante-dialog.tsx`) siga funcionando con URLs firmadas de vida corta (revalidar antes de que expiren si el diálogo queda abierto mucho tiempo).
6. Solo después de validar el flujo, aplicar el `UPDATE storage.buckets` que pasa `payment-proofs` a privado.

## 11. Qué usa cada tabla/RPC en el código (mapa parcial, foco panel admin)

| Archivo | Tablas/RPC que usa |
|---|---|
| `src/lib/admin/guard.ts` | `perfiles_usuario` (lectura por `id`/`usuario_id`) |
| `src/lib/admin/actions/negocios.ts` | RPC `admin_cambiar_plan_negocio`, `admin_bloquear_negocio`, `admin_desbloquear_negocio`, `admin_aprobar_pago_manual`, `admin_rechazar_pago_manual`, `admin_agregar_nota_negocio`, `admin_registrar_pago_manual`; tablas `solicitudes_cambio_plan`, `planes_saas` |
| `src/lib/admin/actions/planes.ts` | RPC `admin_editar_plan` |
| `src/lib/admin/actions/invitaciones.ts` | RPC `admin_revocar_invitacion` |
| `src/lib/admin/audit.ts` | `auditoria` (insert directo, vía `service_role`) |
| `src/lib/admin/queries/usuarios.ts` | `auth.admin.listUsers()` (GoTrue admin API) + `perfiles_usuario` + `negocio_usuarios` + `sucursal_usuarios` |
| `src/app/api/admin/pagos/[pagoId]/comprobante/route.ts` | Storage bucket `payment-proofs`, tabla `pagos_manuales` |
| `src/app/api/admin/{negocios,pagos}/exportar/route.ts` | Lecturas privilegiadas + `auditoria` |

## 12. Riesgos detectados (ver detalle y prioridad en `docs/admin-owner-panel-progress.md`)

1. Doble registro de auditoría en 5 Server Actions — **corregido en esta sesión**.
2. `EXECUTE` no revocado de `anon`/`PUBLIC` en las 5 RPC administrativas originales — patch creado, **no aplicado**.
3. Bucket `payment-proofs` público — **documentado, no corregido** (requiere autorización explícita, ver §10).
4. Inconsistencia `perfiles_usuario.id` vs `usuario_id` — conocida desde antes, sigue sin resolver.
5. Migración `2026-07-empleado-id-sucursal-usuarios.sql` sigue sin aplicar.
6. RLS no relevada para el resto de las 32 tablas (fuera del alcance de esta sesión).

## 13. Pendientes antes de operar en producción con confianza total

- Probar login real: propietario entra, usuario normal no entra, admin de negocio no entra.
- Probar al menos una mutación real (cambiar plan, bloquear, aprobar pago) con un negocio de prueba.
- Confirmar que la auditoría (ahora sin duplicado) sigue registrando correctamente tras el fix de esta sesión.
- Decidir y ejecutar (con autorización) el patch de revoke de grants y el plan de `payment-proofs`.

## 14. Recomendaciones

- Aplicar el patch de revoke de grants (`2026-07-admin-revoke-public-execute-original-rpcs.sql`) después de la verificación de `pg_proc.proacl` sugerida en su propio encabezado.
- Priorizar la migración de `payment-proofs` a URLs firmadas antes de manejar volumen real de pagos con datos sensibles.
- Resolver de una vez la inconsistencia `id`/`usuario_id` de `perfiles_usuario` (fuera del alcance de esta sesión, pero es una fuente recurrente de código defensivo repetido en varios archivos).
