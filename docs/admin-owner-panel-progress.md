# Panel Admin del Propietario — Progreso

> Este archivo se actualiza de forma acumulativa al final de cada sesión/fase. No borrar historial útil. Ver especificación completa en `AGENDAME_ADMIN_PANEL_PROMPT_MAESTRO.txt` (raíz del repo).

---

## Sesión 2026-07-20 — Auditoría de solo lectura + corrección de auditoría duplicada

> Sesión iniciada con auditoría completa de solo lectura (código, `schema.sql` de respaldo del 2026-07-09, introspección OpenAPI en vivo contra producción, API de Storage). Autorización explícita del propietario para leer `src/lib/supabase/**`, `src/app/api/admin/**`, `supabase/**`, `.env.local` (solo detección de variables, sin imprimir secretos) — alcance ampliado sobre la restricción "solo UI/UX" de `CLAUDE.md`, únicamente para esta auditoría. Ver `docs/supabase-schema-map.md` (nuevo, esta sesión) para el mapa completo de tablas/RPC/RLS/storage.

> **Continuación (mismo día)**: el propietario amplió la autorización para tocar código del panel admin sin pedir permiso archivo por archivo, dentro de un alcance ya delimitado (`src/app/admin/**`, `src/components/admin/**`, `src/lib/admin/**`, `src/app/api/admin/**`, `tests/admin*`, docs del panel, `supabase/patches/**`). Se corrigió un hallazgo adicional detectado en esta continuación y se actualizó `docs/admin-owner-panel.md` (§3.5 auditoría, §5 tabla de RPC, §8 migraciones, §10/11/12 nuevos) para que dejara de describir un estado ya superado.

> **Continuación (mismo día, tercera vuelta) — payment-proofs migrado a bucket privado**: en paralelo (trabajo de Codex, coordinado por el propietario), se implementó la migración de comprobantes de pago a URLs firmadas y **se pasó el bucket `payment-proofs` a privado en producción** (`APLICADO: 2026-07-20, por el propietario en Supabase Studio`, según la cabecera de `supabase/patches/2026-07-payment-proofs-private-bucket.sql`). Esta sesión verificó ese trabajo de solo lectura (no lo implementó): confirmó contra producción real que `payment-proofs` tiene hoy `public=false`; revisó `src/lib/payment-proofs.ts`, ambos Route Handlers (`src/app/api/admin/pagos/[pagoId]/comprobante/route.ts`, `src/app/api/dashboard/pagos/comprobante/route.ts`) y los 2 componentes que muestran el comprobante — el diseño es correcto: paths internos para subidas nuevas, fallback que sigue resolviendo URLs públicas viejas vía `extraerPaymentProofPath()`, sin `getPublicUrl()` restante en ningún código de `payment-proofs`, sin endpoints abiertos (ambos GET exigen su guard correspondiente, y el del dashboard además filtra por `negocio_id` del llamador). Se corrigió `docs/admin-owner-panel.md` §11/§12, que habían quedado desactualizados (seguían describiendo el bucket como público y el riesgo como sin corregir) — ver detalle completo en `docs/payment-proofs-private-migration.md`. **Pendiente real**: nadie probó todavía en navegador subir/ver un comprobante nuevo ni confirmar que uno viejo (pre-migración) sigue abriendo con datos reales — solo se verificó el código y el estado del bucket, no el flujo end-to-end.

> **Continuación (mismo día, cuarta vuelta) — feedback de uso real tras probar el panel**: el propietario probó manualmente (bloqueo/desbloqueo, pagos, auditoría, exportaciones — "todo funciona") y reportó 3 mejoras concretas, autorizadas explícitamente para implementar:
>
> 1. **"Cerca del límite" en `/admin/analitica` daba 0 con un negocio de prueba que sí estaba sobre límite** — diagnosticado: la métrica (y "Top 10 por uso del límite") solo comparaba el uso de **citas**, nunca empleados/servicios/clientes/sucursales. Un negocio bajado de Empresarial a Profesional con 2 sucursales (sobre el límite nuevo) no aparecía porque su uso de citas seguía bajo. **Corregido**: `calcularUsoLimitePlan()` (nuevo, `src/lib/admin/kpis.ts`) compara los 5 recursos y devuelve el peor caso; `obtenerConteoSucursalesPorNegocio()` (nuevo, `src/lib/admin/queries/negocio-detalle.ts`) trae el conteo de sucursales de todos los negocios en una sola consulta (evita N+1). `src/app/admin/analitica/page.tsx` usa esto para "Cerca del límite"/"Upgrade probable" y para "Top 10 por uso del límite" (ahora muestra también qué recurso es el más ajustado).
> 2. **Aprobar un pago no reusaba la fecha real de pago ni el ciclo (mensual/anual) que el negocio indicó al subir el comprobante** — el diálogo sugería siempre "hoy + 1 mes", y el `ciclo` que el formulario del dashboard captura (`comprobante-pago-form.tsx`) nunca se enviaba al backend (se perdía). **Corregido**: el formulario ahora envía `ciclo`; `src/app/api/dashboard/pagos/comprobante/route.ts` lo guarda en `pagos_manuales.ciclo_facturacion` (valida que sea `mensual`/`anual`, si no cae a `manual`, respetando el `CHECK` existente de la columna). Nueva función pura `calcularVencimientoSugerido()` (`src/lib/admin/formatters/date.ts`): prioriza `periodo_fin` si ya está cargado (ej. presets del panel admin), si no usa `fecha_pago + 1 o 12 meses` según `ciclo_facturacion` (preserva el mismo día del mes, no "30 días exactos"), si no cae al comportamiento anterior. `AprobarPagoDialog` (`src/components/admin/pagos/pago-acciones.tsx`) la usa y muestra una nota aclarando que es una sugerencia editable — sigue permitiendo cambiar la fecha a mano (ej. pagos por adelantado).
> 3. **Buscadores de admin no eran instantáneos** — `negocios-filtros.tsx`, `usuarios-filtros.tsx`, `auditoria-filtros.tsx` buscaban solo al perder el foco o presionar Enter. Se agregó debounce (350ms) vía `useEffect`, comparando contra el valor actual de la URL para no disparar una navegación redundante al montar. El buscador de `/admin/pagos` era un `<form>` nativo sin JS (dentro de un Server Component) — se extrajo a un Client Component nuevo, `src/components/admin/pagos/pagos-buscador.tsx`, con el mismo patrón. Los buscadores del dashboard de negocio (clientes, empleados, servicios, recordatorios, reservas) **ya eran instantáneos** (filtran un array ya cargado en cada `onChange`, sin ir al servidor) — se verificó por grep, no se tocaron.
>
> Explicado además, sin tocar código: qué es `admin_global` (el admin de cada negocio individual, no el propietario de la plataforma — ver `src/lib/dashboard/access-context.ts`), y qué mide cada tarjeta de `/admin/analitica`.
>
> Validado tras estos 3 cambios: `npx tsc --noEmit` sin errores nuevos, lint específico del panel admin en exit 0, `npm run build` exitoso (el error preexistente de un archivo de Codex ya no aparece — se resolvió en paralelo), Playwright (`admin-owner-access.spec.ts` + `admin-api-security.spec.ts`) en 17 passed / 2 skipped / 0 failed, sin regresión.
>
> **Pendiente real**: nadie probó todavía en navegador que el cálculo de fecha sugerida sea correcto con un pago real de ciclo mensual/anual, ni que "Cerca del límite" ahora sí detecte el negocio de prueba sobre límite de sucursales.

> **Continuación (mismo día, quinta vuelta) — feedback de la prueba de la cuarta vuelta**: el propietario probó lo anterior y reportó 3 ajustes más:
>
> 1. **Los 4 pills de arriba de `/admin/analitica` no tenían el tooltip de ayuda que sí tienen las tarjetas KPI grandes** — `AdminMetricPill` (`src/components/admin/admin-ui.tsx`) nunca soportó un prop `help`, a diferencia de `KpiCard`. Se agregó el mismo patrón de tooltip (icono con `group/help`, popover en hover/focus) y se completó el texto de ayuda de los 4 pills de Analítica.
> 2. **La fecha sugerida al aprobar un pago "no aparecía o estaba mal"** — causa raíz real encontrada: `calcularVencimientoSugerido()` (agregada en la vuelta anterior) usaba `Date.setMonth()` + `.toISOString().slice(0,10)`, que opera en UTC. Un pago hecho de noche en Paraguay (UTC-4) ya cae en el día siguiente en UTC, así que la fecha sugerida podía correrse un día — exactamente el tipo de corrimiento que el propietario pidió evitar ("no 30 días, siempre el mismo día"). **Corregido**: reescrito para trabajar enteramente con componentes de calendario (año/mes/día) extraídos en `America/Asuncion` vía `Intl.DateTimeFormat`, nunca con aritmética de `Date`/UTC. Conserva el mismo día del mes al sumar 1 o 12 meses, y si el mes destino no tiene ese día (ej. 31 de enero + 1 mes), lo ajusta al último día disponible de ese mes en vez de "desbordar" a marzo.
> 3. **El comprobante de pago, en el modal "Ver/adjuntar" del admin, no mostraba la imagen directo** — solo había un link "Abrir comprobante actual". Se agregó una previsualización `<img>` inline dentro del modal (con cache-busting cuando se reemplaza el archivo), con fallback a un mensaje si no es una imagen (ej. PDF), y se mantuvo además un link "Ver en tamaño completo" para abrirlo en una pestaña nueva.
>
> Validado: `npx tsc --noEmit` sin errores, lint específico del panel admin en exit 0 (tras corregir un error real de lint — `setState` síncrono dentro de un `useEffect` para resetear el estado de error de previsualización; se cambió al patrón de React recomendado de ajustar estado durante el render, comparando contra el valor anterior de la prop), `npm run build` exitoso, Playwright en 17 passed / 2 skipped / 0 failed.
>
> **Pendiente real**: nadie probó todavía en navegador que la previsualización de imagen funcione con un comprobante real, ni que la fecha sugerida sea exactamente correcta con un pago real (mensual y anual) tras esta segunda corrección.

> **Continuación (mismo día, sexta vuelta) — feedback tras la quinta vuelta**: el propietario confirmó que la vista previa de imagen "funcionó y está bien", y reportó 2 problemas más:
>
> 1. **Los popovers de ayuda de Analítica se recortaban por la mitad** — causa: `AdminMetricPill` vive dentro de `AdminPageHeader`, cuya sección envolvente tiene `overflow-hidden` (para recortar prolijamente la barra de gradiente decorativa de arriba). El popover se abría hacia abajo (`top-10`) y, al estar los pills cerca del borde inferior de esa sección, se cortaba justo en el límite. **Corregido**: el popover ahora se abre hacia arriba (`bottom-full`, con el mismo margen y animación), donde sí hay espacio libre (el título y la descripción quedan arriba de los pills dentro de la misma sección). Afecta a `AdminMetricPill` en general (usado también en Vista general, detalle de negocio, usuarios), no solo en Analítica — mismo beneficio en todos lados.
> 2. **La fecha sugerida al aprobar un pago estaba calculada mal en su lógica de negocio, no solo en el detalle técnico de zona horaria** — el propietario aclaró la regla real: la nueva fecha de vencimiento debe salir de **sumar el ciclo al vencimiento actual de la suscripción**, no a la fecha en que se subió el comprobante. Ejemplo: si la suscripción vence el 20/09 y el negocio paga el 18/09 (o el 22/09), el nuevo vencimiento debe seguir siendo 20/10 — pagar unos días antes o después no debe correr el ciclo. **Corregido**: `calcularVencimientoSugerido()` (`src/lib/admin/formatters/date.ts`) ahora prioriza `fechaVencimientoActual + ciclo` sobre `fecha_pago + ciclo` (este último queda solo como respaldo para el primer pago de un negocio sin suscripción previa). Se agregó el parámetro `fechaVencimientoActual` a `AprobarPagoDialog` y se conectó en sus dos puntos de uso: `NegocioPagosPanel` (recibe `resumen?.fecha_vencimiento` desde `/admin/negocios/[id]/page.tsx`, que ya lo tenía disponible) y `/admin/pagos/page.tsx` (se agregó `obtenerNegociosResumen()` en paralelo a `obtenerTodosPagos()` para armar un mapa `negocio_id -> fecha_vencimiento`).
>
> Validado: `npx tsc --noEmit` sin errores, lint específico del panel admin en exit 0, `npm run build` exitoso, Playwright en 17 passed / 2 skipped / 0 failed, sin regresión.
>
> **Pendiente real**: nadie probó todavía en navegador que la fecha sugerida ahora sea exactamente `vencimiento_actual + 1/12 meses` con un pago real, ni que los popovers ya no se recorten visualmente en los distintos anchos de pantalla.

> **Continuación (mismo día, séptima vuelta) — feature nueva: aviso de vencimiento en el dashboard del negocio**: el propietario preguntó si el negocio tiene dónde enterarse de cuándo vence su plan. Se confirmó que no: la fecha solo aparecía en texto simple dentro de `/dashboard/planes`, en ningún otro lado del dashboard, sin ningún color de urgencia. Se construyó, con umbrales y alcance confirmados explícitamente por el propietario:
>
> - `src/lib/planes/plan-vencimiento.ts` (nuevo): `obtenerVencimientoPlanNegocio()` trae la suscripción activa del negocio y calcula días para vencer (vía `diasEntreFechasAsuncion()`, nuevo helper en `src/lib/admin/formatters/date.ts`, mismo enfoque de calendario en America/Asuncion que `calcularVencimientoSugerido()` para no arrastrar el mismo bug de zona horaria). Umbrales pedidos: **mensual** amarillo 12-5 días restantes, rojo 4 días o menos (incluye vencido); **anual** amarillo último mes (<=30 días), rojo últimas 2 semanas (<=14 días, incluye vencido).
> - **Limitación documentada en el propio código**: `suscripciones.ciclo_facturacion` nunca se setea en ningún flujo (`admin_cambiar_plan_negocio` no lo recibe como parámetro), así que siempre queda en su default de columna (`'mensual'`) sin importar lo que el negocio pagó realmente. Como mejor aproximación disponible hoy, se usa el `ciclo_facturacion` del pago aprobado más reciente del negocio (`pagos_manuales`, que sí se captura correctamente desde el formulario del dashboard) para decidir qué tabla de umbrales aplicar. Si en el futuro se decide que `admin_cambiar_plan_negocio` también reciba y guarde el ciclo en `suscripciones`, se podría usar esa columna directamente y quitar esta aproximación — no se tocó esa RPC en esta vuelta (fuera del alcance autorizado, requiere migración).
> - `src/components/dashboard/dashboard-vencimiento-banner.tsx` (nuevo): banner con los 2 colores (amarillo/rojo), mensaje claro ("vence en X días" / "venció hace X días" / "vence hoy") y botón a `/dashboard/planes`. No se muestra si faltan más días de los umbrales de arriba (nada de aviso prematuro).
> - `src/app/dashboard/layout.tsx`: se agrega el banner arriba de todo el dashboard, mostrado **solo si `access.puedeGestionarPlanes`** (autorización explícita del propietario: solo `admin_global`, no gerentes/recepcionistas/empleados de sucursal, que no gestionan pagos).
>
> Validado: `npx tsc --noEmit` sin errores, lint de los archivos nuevos y del panel admin en exit 0, `npm run build` exitoso, Playwright en 17 passed / 2 skipped / 0 failed, sin regresión. **Pendiente real**: nadie probó todavía en navegador que el banner aparezca con los colores y umbrales correctos en un negocio de prueba real (mensual y anual), ni que la aproximación de `ciclo_facturacion` vía pagos_manuales dé el resultado esperado cuando el negocio nunca subió un comprobante con ciclo explícito.

### Hallazgo 7 — `negocio-notas-panel.tsx` leía un campo muerto (CORREGIDO)

`agregarNotaAction` ya había sido migrada (en una sesión anterior a esta auditoría) a la RPC transaccional `admin_agregar_nota_negocio` y desde entonces nunca devuelve `auditWarning` — pero `src/components/admin/negocios/negocio-notas-panel.tsx` seguía con `if (result.auditWarning) toast.warning(...)`, código muerto que no se había detectado en la corrección anterior (el pedido original solo listaba 4 componentes puntuales; este es un quinto que se encontró grepeando `auditWarning` en todo `src/`). Se quitó ese chequeo. Se revisó también `src/components/admin/usuarios/sincronizar-perfil-button.tsx` y `src/components/admin/negocios/solicitud-plan-acciones.tsx`: ambos siguen leyendo `auditWarning` de acciones que **sí** siguen auditando en dos pasos (`sincronizarPerfilUsuarioAction`, `aprobarSolicitudCambioPlanAction`, `rechazarSolicitudCambioPlanAction` — ninguna llama a una RPC que audite internamente), así que no son código muerto y no se tocaron.

### Verificación adicional de guard y estructura

Se confirmó (grep sobre los 3 conjuntos de archivos) que **todas** las páginas bajo `src/app/admin/**`, **todos** los Route Handlers bajo `src/app/api/admin/**` y **todas** las Server Actions bajo `src/lib/admin/actions/**` llaman a `requirePlatformOwner()` / `requirePlatformOwnerApi()` / `getPlatformOwnerOrNull()` — ninguna depende solo del layout. Se releyó `src/lib/admin/guard.ts` y `src/lib/admin/api-guard.ts` completos: sin cambios necesarios, el diseño ya es correcto (falla cerrado, distingue 401 de "no autenticado" vs. 403/404 de "autenticado sin permiso", nunca revela el motivo exacto a quien no es el propietario).

### Documentación actualizada: `docs/admin-owner-panel.md`

Estaba desactualizado en varios puntos que ya no reflejaban la realidad (algunos desde sesiones anteriores a esta, no solo por los cambios de hoy):
- §3.5 (Auditoría) decía que *toda* Server Action que muta usa el patrón de dos pasos con `registrarAuditoria()` — falso desde que se crearon las 4 RPC transaccionales, y más falso todavía después de la corrección de esta sesión. Reescrito para distinguir los dos mecanismos reales (auditoría transaccional en la RPC vs. dos pasos con `auditWarning`).
- §5 (tabla de RPC reutilizadas) no listaba las 4 RPC nuevas, y su nota de cierre decía que el cuerpo de las RPC mutantes nunca se había inspeccionado — ya no es cierto, se inspeccionó en esta auditoría vía `schema.sql`.
- §8 (Migraciones) decía "creada, no aplicada" para `ciclo_facturacion` — ya está aplicada y reconfirmada. Se agregaron las entradas de las 4 RPC transaccionales, el patch de revoke nuevo, y la migración de sucursales pendiente.
- §11/§12 (antes solo §11): el checklist decía que `ADMIN_OWNER_USER_ID` y `rol_global='super_admin'` seguían sin configurarse — ya están (confirmado en una sesión anterior). Se agregó una sección nueva (§11) documentando el riesgo y plan de `payment-proofs`, tal como pidió el propietario.

### Pruebas ejecutadas esta continuación

`npx playwright test tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts --reporter=list` contra el servidor `next dev` que ya estaba corriendo en el entorno (proceso preexistente, no iniciado por esta sesión — se detectó por el warning "Another next dev server is already running" al intentar levantar uno propio, y no se lo tocó). Resultado: **17 passed, 2 skipped, 0 failed** — mismo resultado que antes de los cambios de esta sesión, confirmando que la corrección de auditoría duplicada no rompió el flujo de autenticación/autorización.

### Build y lint (verificación final de esta continuación)

- `npm run build`: **exitoso**.
- `npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts`: **exit code 0**.

### Hallazgo 1 — Auditoría duplicada en 5 acciones administrativas (CORREGIDO esta sesión)

Leyendo el cuerpo real de las 5 RPC administrativas originales en `schema.sql` (algo que sesiones anteriores no pudieron hacer por no tener acceso a ese backup), se confirmó que `admin_cambiar_plan_negocio`, `admin_bloquear_negocio`, `admin_desbloquear_negocio`, `admin_aprobar_pago_manual` y `admin_rechazar_pago_manual` **ya insertan su propia fila en `auditoria`** dentro de la misma transacción que la mutación (ej. `admin_bloquear_negocio` inserta `accion='negocio_bloqueado'`). Pero `src/lib/admin/actions/negocios.ts` llamaba además a `registrarAuditoria()` después de cada una de esas 5 RPC (ej. con `accion='bloquear_negocio'` para la misma acción) — usando `createServiceRoleClient()`, que bypasea RLS, así que ese segundo insert se ejecutaba con éxito. Resultado real (antes de esta corrección): **cada bloqueo/desbloqueo/cambio de plan/aprobación/rechazo de pago generaba 2 filas en `auditoria`**, no 1.

**Corrección aplicada** (autorizada explícitamente, alcance limitado a estas 5 funciones): se quitó la llamada a `registrarAuditoria()` de `cambiarPlanNegocioAction`, `bloquearNegocioAction`, `desbloquearNegocioAction`, `aprobarPagoAction` y `rechazarPagoAction` en `src/lib/admin/actions/negocios.ts` — ya no hace falta, la RPC audita atómicamente. Las 5 funciones ahora devuelven siempre `{ ok: true }` en éxito (nunca más `auditWarning`, porque ya no puede fallar esa segunda escritura si no existe). Se actualizó el comentario de cabecera del archivo para reflejar esto. Se quitaron los `if (result.auditWarning) toast.warning(...)` ahora muertos en `negocio-bloqueo-boton.tsx`, `negocio-cambiar-plan-dialog.tsx` y `pago-acciones.tsx` (`AprobarPagoDialog` y `RechazarPagoDialog`). `negocio-pagos-panel.tsx` no necesitó cambios: no lee `auditWarning` (usa `registrarPagoAction`, que ya usaba la RPC transaccional nueva desde una sesión anterior).

**No se tocó**: `aprobarSolicitudCambioPlanAction` y `rechazarSolicitudCambioPlanAction` siguen llamando a `registrarAuditoria()` — no llaman a ninguna de las 5 RPC de auditoría interna con el mismo `registro_id`/`tabla_afectada` (la solicitud es una entidad distinta de la suscripción), así que no tienen el mismo problema. `agregarNotaAction` y `registrarPagoAction` ya estaban corregidas desde antes (usan las 4 RPC transaccionales nuevas).

### Hallazgo 2 — GRANT a `anon`/`authenticated`/`service_role` en las 5 RPC originales (documentado, patch creado, NO aplicado)

Confirmado en `schema.sql` (backup 2026-07-09): las 5 RPC tienen `GRANT ALL ... TO anon, authenticated, service_role`. Como las 5 validan `es_super_admin()` como primera línea, un llamado no autorizado es rechazado igual — pero es una sola capa de defensa (la lógica interna), no dos, contradiciendo la recomendación explícita del prompt maestro de revocar `EXECUTE` de `PUBLIC` en RPC sensibles. Se creó `supabase/patches/2026-07-admin-revoke-public-execute-original-rpcs.sql` con el `REVOKE`/`GRANT` correctivo (marcado `APLICADO: NO` en su cabecera) — **no se ejecutó contra producción**. Requiere autorización explícita para aplicarse, y se recomienda antes verificar `pg_proc.proacl` en vivo (consulta incluida en el propio patch).

### Hallazgo 3 — Bucket `payment-proofs` es público (documentado, NO corregido)

Confirmado contra producción real (API de Storage, solo lectura): el bucket `payment-proofs` existe y tiene `public=true`. El endpoint `src/app/api/admin/pagos/[pagoId]/comprobante/route.ts` sube con una ruta que incluye un UUID aleatorio (no enumerable por fuerza bruta razonable) y guarda la URL pública resultante en `pagos_manuales.comprobante_url`. Cualquiera con esa URL exacta puede ver el comprobante sin sesión ni verificación de `super_admin` — es seguridad por oscuridad, no control de acceso real. **No se modificó el bucket ni el código** (fuera del alcance autorizado esta sesión). Plan de migración a URLs firmadas propuesto en `docs/supabase-schema-map.md` §10, pendiente de autorización para ejecutarse (incluye un `UPDATE storage.buckets` que requeriría permiso explícito aparte).

### Hallazgo 4 — `schema.sql` de respaldo desactualizado (resuelto, no era una discrepancia real)

El backup `schema.sql` (2026-07-09 19:12) no contenía `ciclo_facturacion` en `suscripciones`/`pagos_manuales` ni las 4 RPC nuevas (`admin_agregar_nota_negocio`, `admin_editar_plan`, `admin_registrar_pago_manual`, `admin_revocar_invitacion`). Se confirmó por introspección OpenAPI en vivo contra producción (esta sesión) que **las dos columnas y las 4 RPC SÍ existen hoy en producción** — coincide con lo que ya afirmaba una sesión anterior del progress.md. La explicación es simple: ambos patches se aplicaron el 2026-07-10 (un día después de la fecha del backup), según sus propios encabezados. El backup no es una fuente de verdad vigente para esas dos migraciones puntuales, pero sí lo sigue siendo para el resto del schema (tablas base, las 5 RPC originales, RLS) salvo que se demuestre lo contrario.

### Hallazgo 5 — Archivo temporal huérfano (ELIMINADO esta sesión)

`src/app/admin/usuarios/page.tsx.tmp.16676.bc5a9b008400` — comparado con el `page.tsx` real: era una versión vieja y ya superada de esa página (sin paginación, sin `AdminPageHeader`/`AdminTableShell`, sin `SincronizarPerfilButton`), claramente basura de editor (guardado atómico interrumpido). Confirmado que no tenía contenido útil no presente ya en el archivo real. **Borrado** con autorización explícita.

### Hallazgo 6 — Migración `2026-07-empleado-id-sucursal-usuarios.sql` sigue pendiente

No relacionada al panel admin. Su propio encabezado dice explícitamente "todavía NO fue aplicado". Solo se documenta acá para que quede registrado; no se tocó ni se aplicó.

### Verificación de esta sesión

- `git status` / `git diff`: ejecutados antes y después de los cambios (ver resultado en el cierre de esta sesión, más abajo de este archivo si se agregó, o en la respuesta final entregada al propietario).
- `npm run build`: ejecutado tras los cambios de código (ver resultado entregado al propietario).
- Lint específico del panel admin (`npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts`): ejecutado tras los cambios (ver resultado entregado al propietario).
- No se ejecutó ningún `UPDATE`/`INSERT`/`DELETE`/`ALTER`/`CREATE`/`DROP` contra Supabase producción. No se aplicó el patch de revoke de grants ni la migración `empleado-id-sucursal-usuarios`. No se cambió el bucket `payment-proofs`.

### Pendiente real (no verificado por esta sesión)

- Login real: propietario entra, usuario normal no entra, admin de negocio no entra — sigue sin probarse en navegador.
- Mutación real end-to-end con negocio de prueba (cambiar plan, bloquear, aprobar pago) — sigue sin probarse.
- Aplicar (con autorización) el patch de revoke de grants, tras verificar `pg_proc.proacl` en vivo.
- Decidir y ejecutar (con autorización) el plan de migración de `payment-proofs` a URLs firmadas.
- Aplicar (con autorización) `2026-07-empleado-id-sucursal-usuarios.sql` si se necesita esa funcionalidad.
- Resolver la inconsistencia `perfiles_usuario.id` vs `usuario_id` (conocida desde Fase 1, sigue sin decisión).

### Próximo paso recomendado

1. Probar en navegador, con sesión real del propietario: entrar a `/admin`, cambiar el plan de un negocio de prueba, bloquear/desbloquear, aprobar/rechazar un pago — confirmar que sigue quedando **una sola** fila en `auditoria` por acción (verificar el fix de esta sesión contra datos reales).
2. Con otra cuenta (usuario normal o admin de negocio), confirmar que `/admin` sigue devolviendo 404.
3. Revisar y decidir sobre el patch de revoke de grants y el plan de `payment-proofs`.

---

## Sesión 2026-07-09 (continuación) — Panel activado, migraciones aplicadas, `/admin/configuracion`

### Estado: **panel activado por el propietario**

El propietario confirmó que probó el panel con su sesión real: el flujo de "Cambiar plan" y las demás acciones **sí existen y funcionan** (su reporte inicial de "solo visualizar" fue no haber encontrado los botones, que viven en el detalle del negocio, no en la lista) — el propietario mismo lo confirmó ("es mi error... si que hay para cambiar plan"). Pendiente solo pulir la presentación visual más adelante (no se tocó diseño en esta sesión, fuera de alcance de esta corrección puntual).

### Migraciones — ahora sí **APLICADAS** (confirmado, no asumido)

El propietario pegó y ejecutó ambos patches directamente en Supabase Studio. Se verificó con introspección de solo lectura (OpenAPI de PostgREST) que:
- `suscripciones.ciclo_facturacion` y `pagos_manuales.ciclo_facturacion` **existen** en producción.
- Las 4 RPC nuevas existen y están expuestas: `admin_agregar_nota_negocio`, `admin_editar_plan`, `admin_registrar_pago_manual`, `admin_revocar_invitacion`.

Actualizado el estado en `supabase/patches/`: ambos archivos siguen documentando en su cabecera "NO fue aplicado" — **esto ya no es preciso**; se deja constancia acá en el progress.md como fuente de verdad más reciente en vez de reescribir los patches (los patches quedan como el registro histórico de lo que se pegó).

### Código actualizado para usar las 4 RPC transaccionales nuevas

Tal como preveía el propio patch SQL ("Después de aplicar... actualizar en el código"):

- `src/lib/admin/actions/negocios.ts`: `agregarNotaAction()` y `registrarPagoAction()` ahora llaman `supabase.rpc("admin_agregar_nota_negocio", ...)` / `admin_registrar_pago_manual(...)` con el cliente de sesión, en vez de `insert` directo + `registrarAuditoria()` en dos pasos. Se quitó el import de `createServiceRoleClient` (ya no se usa en este archivo).
- `src/lib/admin/actions/planes.ts`: `editarPlanAction()` reescrito para llamar `admin_editar_plan(...)` — ya no hace el `SELECT` previo del estado "antes" a mano (la RPC lo captura internamente antes del `UPDATE`, dentro de la misma transacción).
- `src/lib/admin/actions/invitaciones.ts`: `revocarInvitacionAction()` reescrito para llamar `admin_revocar_invitacion(...)`.
- Los `ActionResult` de estos 3 archivos volvieron a `{ok:true} | {ok:false, error}` (sin `auditWarning`) porque ya no puede pasar que la mutación se aplique sin su auditoría — ambas ocurren atómicamente en la misma función de Postgres. **`cambiarPlanNegocioAction`, `bloquearNegocioAction`, `desbloquearNegocioAction`, `aprobarPagoAction` y `rechazarPagoAction` siguen usando el patrón de dos pasos con `auditWarning`** porque siguen llamando a las 5 RPC `admin_*` originales, que no se tocaron (su cuerpo real sigue sin confirmarse — ver auditoría anterior).
- Componentes actualizados para dejar de leer `result.auditWarning` en las acciones que ya no lo devuelven: `plan-editar-dialog.tsx`, `invitacion-revocar-boton.tsx` (los de negocios — nota, registrar pago — usan `ActionResult` de `actions/negocios.ts`, que sigue teniendo `auditWarning` opcional para las otras 5 acciones, así que sus componentes no necesitaron cambios: el campo simplemente queda `undefined` para nota/pago).

### `/admin/configuracion` — nueva página (pedido explícito del propietario)

No existía (documentado en Fase 4 como "sin contenido específico que justificara construirlo"). El propietario pidió explícitamente: tema claro/oscuro, nombre, logo/foto — "básico nomás".

- `src/lib/admin/queries/perfil-propietario.ts` — `obtenerPerfilPropietario()`, mismo patrón de búsqueda dual `id`/`usuario_id` que `requirePlatformOwner()`.
- `src/lib/admin/schemas/perfil.ts`, `src/lib/admin/actions/perfil.ts` — `editarPerfilPropietarioAction()`, update directo (no hay ni necesita RPC: es una preferencia personal, no una operación administrativa sobre la plataforma — no se audita, igual que "mi cuenta" del lado tenant tampoco se audita).
- `src/components/admin/configuracion/perfil-propietario-form.tsx` — formulario: email (solo lectura), nombre, URL de foto/logo (campo de texto simple, sin subida de archivo — no se construyó upload a Storage por ser fuera de lo pedido: "no tocaré mucho"), selector de tema (sistema/claro/oscuro), con aplicación inmediata en el navegador al guardar.
- `src/app/admin/layout.tsx` y `src/components/admin/admin-shell.tsx`: ya no fuerzan `tema="sistema"` — el layout ahora lee `perfiles_usuario.tema`/`color_acento` reales del propietario (reutilizando las mismas columnas que ya usa el dashboard de negocios, vía `DashboardPreferencesApplier`, que ya existía y se reutilizó tal cual) y se los pasa a `AdminShell`.
- La ruta ya estaba en `ADMIN_NAV_ITEMS` desde Fase 3 (apuntaba a una página inexistente); ahora resuelve.

### Corrección de `npm run build` (bloqueado por trabajo en curso ajeno al panel, con autorización para tocarlo)

El propietario pidió explícitamente arreglar `npm run build`. Los 2 errores de tipos eran reales, en archivos que esta sesión no había tocado hasta ahora:

- `src/app/dashboard/reservas/page.tsx:112` — `.filter(Boolean)` no le prueba a TypeScript que se descartó `null` del tipo. Cambiado a un type predicate explícito: `.filter((cliente): cliente is ClienteReserva => cliente !== null)`. Cambio de un solo carácter de comportamiento (cero): produce exactamente el mismo resultado en runtime, solo ayuda al compilador.
- `tests/plan-limits-db.spec.ts:305-326` — `limite` seguía tipado `number | null | undefined` después de un `test.skip(typeof limite === "undefined", ...)`, porque TypeScript no sabe que `test.skip()` detiene la ejecución. Se agregó un `if (typeof limite === "undefined") return;` explícito e inofensivo (el `test.skip` ya cortaba en runtime; esto es solo para que el compilador lo entienda también). El `return` está dentro de un `try/finally`, así que la limpieza (`borrarNegocioPrueba`) se sigue ejecutando igual.

Confirmado con `npx tsc --noEmit`: **0 errores en todo el proyecto** después de estos 2 cambios.

### Verificación final de esta sesión

- `npm run build`: **exitoso**. `/admin/configuracion` aparece como ruta dinámica junto con el resto del panel.
- `npx tsc --noEmit`: **0 errores en todo el proyecto**.
- `npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts`: **exit code 0**.
- `npm run lint` (repo completo): sigue en 139 problemas preexistentes, sin relación con el panel admin ni con los 2 archivos corregidos para el build (confirmado: mismo conteo antes/después de esta sub-sesión).
- `npx playwright test tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts`: se agregó `/admin/configuracion` a la lista de rutas verificadas (ahora 15 casos en `admin-api-security.spec.ts`, antes 14). **15 + 2 = 17 passed, 2 skipped** (0 failed).

### Pendiente real (no verificado por esta sesión)

- Las 5 RPC `admin_*` originales (cambiar plan, bloquear, desbloquear, aprobar/rechazar pago) siguen sin confirmación de su cuerpo exacto — sigue pendiente la consulta a `pg_proc` del punto 1 de la auditoría anterior, si el propietario quiere cerrarlo del todo.
- No se probó en un navegador real la página `/admin/configuracion` nueva (cambiar tema, guardar nombre) — el propietario puede probarla directamente ahora que el panel está activo.
- Sigue sin haber pruebas Playwright con credenciales de super_admin/usuario normal reales (los 2 casos que siguen en skip).

---

## Sesión 2026-07-09 (continuación) — Auditoría final de producción, previa a activar al propietario

> El propietario proveyó su `auth.users.id` real y pidió una auditoría final antes de activar el panel, en vez de módulos nuevos. Esta sección documenta esa auditoría punto por punto. **El panel sigue sin activar**: no se escribió `ADMIN_OWNER_USER_ID` en ningún entorno, no se ejecutó ningún `UPDATE` en `perfiles_usuario`, y no se aplicó ninguna migración. El UUID real del propietario deliberadamente NO se escribe en este archivo (git-tracked) — solo se referencia como `<ADMIN_OWNER_USER_ID>`; el valor real se entregó al propietario directamente en la conversación, para no dejarlo en el historial de git.

### 1. Verificación de las 5 RPC mutantes contra producción

**Limitación reconocida primero**: no hay acceso a `pg_proc`/`pg_get_functiondef()` desde esta sesión (no existe conexión Postgres directa, ni `supabase` CLI vinculado, ni ningún RPC que exponga el cuerpo de una función — confirmado que ninguno de esos caminos existe, ver Fase 1). PostgREST no expone `SECURITY DEFINER`, `search_path` ni el cuerpo SQL vía su API REST/OpenAPI. Por lo tanto **no se pudo leer el código fuente literal** de estas funciones. Se dejó preparada la consulta de solo lectura para que el propietario la corra en el editor SQL de Supabase Studio y comparta el resultado (ver "Pendiente de verificación" más abajo).

**Lo que sí se hizo — evidencia empírica real, de solo lectura (cero riesgo de mutación real)**: se llamó a las 5 funciones con un UUID que no existe en la base (`00000000-0000-0000-0000-000000000000`), una vez con la clave `anon` y otra con la `service_role`, sin ninguna sesión de usuario real detrás. Si el chequeo de `super_admin` no existiera o se ejecutara después de tocar la fila, con un ID inexistente el resultado habría sido otro tipo de error (o incluso éxito silencioso con 0 filas afectadas). Resultado real observado:

| Función | anon | service_role |
|---|---|---|
| `admin_bloquear_negocio` | 401 `42501` "Solo un super_admin puede bloquear un negocio." | 403 `42501` (mismo mensaje) |
| `admin_desbloquear_negocio` | 401 `42501` "Solo un super_admin puede desbloquear un negocio." | 403 `42501` (mismo mensaje) |
| `admin_cambiar_plan_negocio` | 401 `42501` "Solo un super_admin puede cambiar el plan de un negocio." | 403 `42501` (mismo mensaje) |
| `admin_aprobar_pago_manual` | 401 `42501` "Solo un super_admin puede aprobar pagos manuales." | 403 `42501` (mismo mensaje) |
| `admin_rechazar_pago_manual` | 401 `42501` "Solo un super_admin puede rechazar pagos manuales." | 403 `42501` (mismo mensaje) |

Conclusiones que estas pruebas sí permiten afirmar con confianza:
- Las 5 funciones **rechazan la operación antes de tocar cualquier fila** (el ID no existe y aun así el error es de permisos, específico por función — no "no encontrado" ni un error genérico de Postgres). Esto es exactamente el patrón correcto: el chequeo de autorización es lo primero que hace cada función.
- Cada función tiene su **propio mensaje de error tailored**, lo que indica que el chequeo está escrito explícitamente en cada una (no es un accidente de un trigger genérico).
- El código `42501` es el código estándar de Postgres para `insufficient_privilege`, consistente con un `RAISE EXCEPTION ... USING ERRCODE = '42501'` deliberado.
- **EXECUTE no está revocado de `PUBLIC`/`anon`** a nivel de Postgres para estas 5 funciones (si lo estuviera, PostgREST devolvería un error distinto — típicamente "no se pudo encontrar la función" — en vez de llegar a ejecutar el cuerpo y lanzar la excepción de permisos). Esto **contradice la recomendación explícita del prompt maestro** ("revocar execute de PUBLIC si son sensibles"). El impacto práctico hoy es bajo porque el chequeo interno ya bloquea el acceso, pero no es defensa en profundidad completa — es una única capa (la lógica interna), no dos.

**Lo que esta evidencia NO permite confirmar** (requiere acceso a `pg_proc`, no disponible):
- Si son `SECURITY DEFINER` o `SECURITY INVOKER`.
- Si tienen `search_path` fijado explícitamente (relevante solo si son `SECURITY DEFINER`: un `search_path` no fijado en una función `SECURITY DEFINER` es un vector de ataque conocido de Postgres — "search_path hijacking").
- El cuerpo SQL exacto (por ejemplo, si además de todo esto ya escriben en `auditoria` internamente — ver punto 4).

**Pendiente de verificación — consulta lista para correr en Supabase Studio → SQL Editor** (100% de solo lectura, sin riesgo):

```sql
select
  p.proname as funcion,
  p.prosecdef as security_definer,
  p.proconfig as configuracion, -- acá aparece "search_path=..." si está fijado
  pg_get_functiondef(p.oid) as definicion_completa
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'admin_cambiar_plan_negocio',
    'admin_bloquear_negocio',
    'admin_desbloquear_negocio',
    'admin_aprobar_pago_manual',
    'admin_rechazar_pago_manual',
    'es_super_admin',
    'admin_obtener_negocios_resumen'
  );
```

Si el propietario corre esta consulta y comparte el resultado, se puede: (a) confirmar `SECURITY DEFINER`/`search_path` con certeza, (b) confirmar si ya escriben en `auditoria` (evitando duplicar auditoría si la app también lo hace), y (c) decidir si conviene un patch de `REVOKE ... FROM PUBLIC` + `GRANT ... TO authenticated` para estas 5 funciones (no se creó ese patch todavía porque no se sabe si romper el acceso de `anon` tiene algún efecto colateral no documentado — mejor confirmarlo primero).

**No se creó ningún patch de "corrección" para estas 5 funciones** porque la evidencia empírica no mostró ninguna que falle en validar `super_admin` — no había nada que corregir según lo que se pudo observar. Si la consulta de arriba revela lo contrario (por ejemplo, que el chequeo está mal escrito de una forma que esta prueba negativa no detectó), avisar para preparar el patch correctivo correspondiente.

### 2. (cubierto arriba, mismo punto que 1)

### 3. Comparación de límites antes de bajar de plan — bug real encontrado y corregido

**Hallazgo**: `NegocioCambiarPlanDialog` (`src/components/admin/negocios/negocio-cambiar-plan-dialog.tsx`) solo comparaba **citas**, tal como pide el prompt maestro comparar los 5 (citas, empleados, servicios, clientes, sucursales). Los otros 4 no se verificaban antes de confirmar un cambio de plan, y el botón de confirmar nunca exigía un acknowledgement explícito del exceso (solo mostraba un texto de advertencia, pero no bloqueaba el envío).

**Corrección aplicada**:
- El componente ahora recibe el uso real de los 5 recursos (`citas`, `empleados`, `servicios`, `clientes`, `sucursales`) y los 5 límites del plan candidato, y calcula **todos** los excesos, no solo citas.
- `vista_admin_negocios_resumen` (y por lo tanto `admin_obtener_negocios_resumen()`) no trae un conteo de sucursales — se confirmó revisando las columnas de la vista (Fase 1). Se agregó `contarSucursales(negocioId)` en `src/lib/admin/queries/negocio-detalle.ts` (un `count` simple sobre `sucursales`, sin RPC porque no hace falta una).
- Si hay cualquier exceso, se muestra la lista completa de recursos afectados (con el uso exacto y el límite exacto de cada uno) y se **exige un checkbox de confirmación explícito** antes de habilitar el botón "Confirmar cambio" — antes no había ningún gate, solo texto informativo.
- La sección "Consumo de límites" del detalle del negocio (`src/app/admin/negocios/[id]/page.tsx`) mostraba `null` como límite para empleados/servicios/clientes (nunca mostraba el número real del plan) y no mostraba sucursales en absoluto. Se corrigió: ahora busca el plan actual en la lista de planes y muestra el límite real de cada recurso, incluyendo sucursales.
- Sigue sin borrar ningún dato — nunca se propuso ni se implementó eliminación de registros al bajar de plan, tal como exige el prompt maestro.

Archivos modificados: `src/components/admin/negocios/negocio-cambiar-plan-dialog.tsx` (reescrito), `src/lib/admin/queries/negocio-detalle.ts` (+`contarSucursales`), `src/app/admin/negocios/[id]/page.tsx` (pasa uso/límites completos, corrige el conteo mostrado).

### 4. `registrarAuditoria()` — no transaccional, corregido en dos niveles

**Hallazgo confirmado**: la mutación real (llamada RPC o `update`/`insert` directo) y el registro en `auditoria` son dos llamadas de red separadas. Antes de esta auditoría, si `registrarAuditoria()` fallaba después de que la mutación ya se aplicó, el fallo solo se logueaba en la consola del servidor (`console.error`) — la UI mostraba éxito sin ninguna advertencia, y no había ninguna garantía de que la acción hubiera quedado auditada.

**Nivel 1 — aplicado ahora (sin tocar Supabase)**: `registrarAuditoria()` ahora devuelve `boolean` (antes `void`). Las 7 Server Actions que la usan (`cambiarPlanNegocioAction`, `bloquearNegocioAction`, `desbloquearNegocioAction`, `aprobarPagoAction`, `rechazarPagoAction`, `agregarNotaAction`, `registrarPagoAction` en `actions/negocios.ts`; `editarPlanAction` en `actions/planes.ts`; `revocarInvitacionAction` en `actions/invitaciones.ts`) ahora capturan ese resultado: si la auditoría falla, la acción sigue devolviendo `ok: true` (la mutación real sí se aplicó — revertirla sería peor, dejaría un dato real a medio aplicar) pero agrega `auditWarning` al resultado. Los 7 componentes cliente que llaman estas acciones (`negocio-bloqueo-boton.tsx`, `negocio-cambiar-plan-dialog.tsx`, `negocio-pagos-panel.tsx`, `pago-acciones.tsx`, `negocio-notas-panel.tsx`, `plan-editar-dialog.tsx`, `invitacion-revocar-boton.tsx`) ahora muestran `toast.warning(result.auditWarning)` además del toast de éxito cuando esto pasa. Ya no puede completarse una acción sensible sin que quede evidencia visible para el operador — antes era 100% silencioso.

**Nivel 2 — solución transaccional real, propuesta, NO aplicada**: se creó `supabase/patches/2026-07-admin-rpc-transaccionales.sql` con 4 funciones nuevas `SECURITY DEFINER` (`admin_agregar_nota_negocio`, `admin_registrar_pago_manual`, `admin_editar_plan`, `admin_revocar_invitacion`) que hacen el insert/update **y** el insert en `auditoria` dentro de la misma transacción de Postgres — si el insert en auditoria falla, la transacción entera hace rollback, así que la mutación tampoco queda aplicada. Cada una: reutiliza `es_super_admin()` (no reinventa el chequeo), fija `search_path = public, pg_temp` explícitamente (hardening estándar para `SECURITY DEFINER`), y revoca `EXECUTE` de `PUBLIC` (solo `authenticated` puede intentar llamarlas — más estricto que lo observado en las 5 RPC existentes, ver punto 1). **No se tocaron las 5 RPC `admin_*` existentes**: no se cuenta con su definición actual para reescribirlas de forma segura con `CREATE OR REPLACE` (ver punto 1 — pendiente la consulta de introspección). El patch documenta explícitamente qué cambios de código en `src/lib/admin/actions/` habría que hacer *después* de aplicarlo (no se tocó el código todavía, para no desincronizar la app de un patch sin aplicar).

**No se ejecutó ningún SQL remoto** — el patch queda listo, pendiente de autorización explícita.

### 5. Migración `ciclo_facturacion` — revisada, confirmada, no aplicada

Revisión de `supabase/patches/2026-07-admin-ciclo-facturacion.sql` (creada en Fase 4) contra los 5 puntos pedidos:

- **Tablas afectadas**: `public.suscripciones` y `public.pagos_manuales` únicamente. Confirmado, coincide con lo pedido.
- **Valores permitidos**: `CHECK (ciclo_facturacion IN ('mensual', 'anual', 'manual'))` en ambas tablas — 3 valores, sin espacio para valores libres/typos.
- **Comportamiento de registros históricos**: `ADD COLUMN ... NOT NULL DEFAULT 'mensual'` (suscripciones) / `DEFAULT 'manual'` (pagos_manuales) — Postgres aplica el default a todas las filas existentes automáticamente (operación de metadata, sin reescribir la tabla completa en Postgres 11+, que es lo que corre Supabase). No se sobrescribe ni se pierde ningún dato existente. El default distinto por tabla (mensual vs. manual) está justificado y documentado en los comentarios del propio patch: no se asume que un pago histórico registrado a mano fue necesariamente mensual.
- **Índices**: `idx_suscripciones_ciclo_facturacion` e `idx_pagos_manuales_ciclo_facturacion`, btree simples. Observación (no un error, una nota de eficiencia): con solo 3 valores posibles, un índice btree tiene selectividad baja y el planner de Postgres probablemente prefiera un seq scan en tablas chicas/medianas — no está mal tenerlo, pero tampoco aporta mucho al tamaño actual de la plataforma. Se deja la decisión de mantenerlo o quitarlo al propietario; no se modificó el patch por esto.
- **Compatibilidad con las consultas actuales**: confirmada. Ninguna consulta TypeScript del panel usa `select("*")` sobre `suscripciones` o `pagos_manuales` — todas listan columnas explícitas (`obtenerHistorialSuscripciones`, `obtenerPagosNegocio`, `obtenerPagosAprobadosRecientes`, `obtenerTodosPagos`, etc.), así que agregar esta columna no rompe ninguna consulta existente; simplemente no aparecerá hasta que se actualice el código para pedirla explícitamente. Los `insert` existentes (`registrarPagoAction`) no fijan `ciclo_facturacion`, así que las filas nuevas creadas por esa acción recibirán el DEFAULT `'manual'` automáticamente (garantizado por Postgres, no depende de conocer el cuerpo de ninguna función) — razonable, porque hoy el formulario de "Registrar pago" tampoco pregunta el ciclo. **Nota para más adelante**: si se aplica esta migración y se quiere que `ciclo_facturacion` sea útil para pagos *nuevos* (no solo históricos), habría que agregar un campo al formulario de "Registrar pago" para que el propietario lo indique — no se hizo en esta sesión porque no fue pedido y sería agregar alcance nuevo.

**Sigue sin aplicarse.** Requiere autorización explícita para ejecutarla contra producción.

### 6. Checklist exacto para activar al propietario

Ninguno de estos pasos se ejecutó. Se preparan acá con marcadores donde correspondería el UUID real (que no se escribe en este archivo por ser git-tracked — el propietario ya lo tiene).

**Paso 1 — localizar el perfil, por `id` Y por `usuario_id` (la Fase 1 detectó que el proyecto usa ambas convenciones en distintos lugares — hay que saber cuál aplica a esta cuenta antes de tocar nada):**

```sql
select id, usuario_id, nombre, nombre_completo, email, rol_global, tipo_cuenta, created_at, updated_at
from public.perfiles_usuario
where id = '<ADMIN_OWNER_USER_ID>'
   or usuario_id = '<ADMIN_OWNER_USER_ID>';
```

Resultados posibles y cómo interpretarlos:
- **0 filas**: no existe perfil para esta cuenta todavía (puede pasar si este usuario nunca completó el onboarding de negocio). Antes de continuar, decidir si corresponde un `INSERT` (fuera de este checklist, requeriría definir todos los campos obligatorios de `perfiles_usuario`) — avisar antes de improvisar uno.
- **1 fila**: caso esperado. Anotar si matcheó por `id`, por `usuario_id`, o por ambos en la misma fila (lo ideal).
- **2 filas distintas** (una matchea por `id`, otra por `usuario_id`): confirmaría en producción la inconsistencia que Fase 1 solo pudo sospechar por el código. **No actualizar ninguna de las dos a ciegas** — avisar para decidir cuál es la fila "real" antes de tocar `rol_global`.

**Paso 2 — variable de entorno:**

```
ADMIN_OWNER_USER_ID=<ADMIN_OWNER_USER_ID>
```

Agregar a `.env.local` (local) y a las variables de entorno del hosting de producción (Vercel u otro). **No se agregó todavía** — pendiente de tu confirmación para escribir el archivo local (no requiere tocar Supabase, es un cambio local reversible, pero se dejó pendiente igual porque pediste la auditoría "antes de activar").

**Paso 3 — UPDATE seguro (recién después de ver el resultado del Paso 1, usando la clave que realmente identificó la fila):**

Si el Paso 1 devolvió una única fila identificada por `id`:
```sql
update public.perfiles_usuario
set rol_global = 'super_admin', updated_at = now()
where id = '<ADMIN_OWNER_USER_ID>'
returning id, usuario_id, email, rol_global, updated_at;
```

Si en cambio la identificó por `usuario_id` (y no por `id`), reemplazar la condición del `where` por `usuario_id = '<ADMIN_OWNER_USER_ID>'`. **No usar `OR` entre ambas condiciones en el UPDATE** a menos que el Paso 1 haya confirmado que ambas apuntan a la misma fila — si apuntan a filas distintas, un `OR` actualizaría las dos, lo cual sería incorrecto.

Nota: si `rol_global` tiene un `CHECK` que no incluya `'super_admin'` como valor permitido (no se pudo verificar sin acceso a `pg_proc`, ver punto 1), este `UPDATE` fallará con un error de constraint — es un fallo seguro (no corrompe nada), simplemente indicaría que hay que ampliar el `CHECK` primero.

**Paso 4 — comprobación posterior:**

```sql
select id, usuario_id, email, rol_global, updated_at
from public.perfiles_usuario
where rol_global = 'super_admin';
```
Debe devolver **exactamente 1 fila** (la del propietario). Si devuelve 0 o más de 1, algo salió distinto a lo esperado — no continuar hasta entenderlo.

Comprobación funcional (con `ADMIN_OWNER_USER_ID` ya en el entorno donde se prueba): iniciar sesión real como `solvatech.dev@gmail.com` y entrar a `/admin` — debe mostrar el dashboard, no un 404. Con otra cuenta (o sin sesión), `/admin` debe seguir devolviendo login/404 como hasta ahora.

**Paso 5 — reversión (si algo sale mal):**

```sql
update public.perfiles_usuario
set rol_global = 'usuario', updated_at = now()
where id = '<ADMIN_OWNER_USER_ID>'
   or usuario_id = '<ADMIN_OWNER_USER_ID>'
returning id, usuario_id, email, rol_global;
```
(`'usuario'` es el único otro valor de `rol_global` observado en producción — Fase 1.) Además, quitar o vaciar `ADMIN_OWNER_USER_ID` del entorno revierte el acceso igual, incluso sin tocar la base: `requirePlatformOwner()` falla cerrado si la variable no está seteada, sin importar el valor de `rol_global`.

### 7. (esta sección)

### Estado de activación real (descubierto, no ejecutado por esta sesión)

Con autorización del propietario se corrió un único `SELECT` de solo lectura (vía REST, con la service role key, sin escritura) para localizar el perfil:

```sql
select id, usuario_id, nombre, nombre_completo, email, rol_global, tipo_cuenta, created_at, updated_at
from public.perfiles_usuario
where id = '<ADMIN_OWNER_USER_ID>' or usuario_id = '<ADMIN_OWNER_USER_ID>';
```

Resultado: **1 sola fila**, sin ambigüedad — `id` y `usuario_id` son el mismo valor en esa fila (el problema de claves duplicadas de Fase 1 no aplica a esta cuenta). `email = solvatech.dev@gmail.com` (coincide). **`rol_global` ya es `'super_admin'`**, con `updated_at` de hoy, posterior a `created_at` — es decir, **ya fue cambiado, pero no por esta sesión** (nunca se ejecutó ningún `UPDATE`). Además, se confirmó que `.env.local` **ya tiene** `ADMIN_OWNER_USER_ID` cargada (tampoco agregada por esta sesión).

Conclusión: las dos piezas de activación (rol_global y la variable de entorno local) ya están en su lugar, hechas fuera de esta sesión. Lo que sigue pendiente, sin verificar todavía:
- Que el servidor `next dev` en curso haya recargado `.env.local` después de que se agregó la variable (puede requerir reinicio).
- Agregar `ADMIN_OWNER_USER_ID` al entorno de **producción** (Vercel u otro hosting) — separado del `.env.local` local.
- La prueba real: iniciar sesión como `solvatech.dev@gmail.com` y confirmar que `/admin` carga el dashboard.
- Probar con una cuenta normal (o `admin_global` de un negocio) que siga recibiendo 404.
- Probar al menos una mutación real (cambiar plan, bloquear, aprobar pago) para confirmar que las RPC responden como se espera con una sesión real de super_admin — sigue sin hacerse.

### 8. Build y lint tras las correcciones

- **`npm run build` (proyecto completo): falla**, pero por un motivo **ajeno a esta sesión y al panel admin**: `src/app/dashboard/reservas/page.tsx` y `src/components/reservas/reservas-pendientes-panel.tsx` tienen cambios sin commitear (161 líneas, confirmado con `git diff --stat`) que **esta sesión nunca tocó** — son trabajo en curso, probablemente tuyo en paralelo en el IDE, con un error de tipos real (`Type '(ClienteReserva | null)[]' is not assignable to type 'ClienteReserva[]'`). No se modificó ni se intentó "arreglar" ese archivo: no es parte de esta auditoría y no se toca código ajeno sin que lo pidas.
- **`npx tsc --noEmit` (proyecto completo)**: confirma que hay exactamente **5 errores de tipos en todo el proyecto**, y **ninguno** está en `src/app/admin`, `src/components/admin`, `src/lib/admin` ni `src/app/api/admin`. 2 son los de `dashboard/reservas/page.tsx` (arriba) y 3 son preexistentes en `tests/plan-limits-db.spec.ts` (`'limite' is possibly 'undefined'`), archivo que tampoco tocó esta sesión.
- **Lint del panel admin** (`npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts`): **exit code 0**, sin errores, después de todas las correcciones de esta auditoría (incluye el diálogo de cambio de plan reescrito y los 9 archivos de acciones/componentes que ahora propagan `auditWarning`).
- **`npx playwright test tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts`**: **16 passed, 2 skipped** (0 failed) — mismo resultado que al cierre de Fase 7, confirmado de nuevo después de todos los cambios de esta auditoría (el diálogo de cambio de plan reescrito no rompió nada del flujo de autenticación/autorización).

**Conclusión honesta**: el panel admin en sí (código de esta sesión) compila sin errores de tipos y pasa su lint y sus pruebas de seguridad. El `npm run build` del repo completo no se puede reportar como "exitoso" ahora mismo porque depende de un archivo con trabajo en curso ajeno a este panel — hay que resolver o commitear ese cambio en `dashboard/reservas` (o revertirlo si fue accidental) antes de que `npm run build` vuelva a pasar en el repo completo.

---

## Sesión 2026-07-09 — FASE 7: Documentación final, pruebas, lint y build

### Resumen

Cierre de la implementación inicial del panel: documentación técnica completa, ampliación de las pruebas de seguridad (ahora cubren las 11 rutas de `/admin` + los 2 Route Handlers de exportación), y un bug real de semántica HTTP encontrado y corregido gracias a esas mismas pruebas.

### Archivos creados

- `docs/admin-owner-panel.md` — documentación técnica completa (arquitectura, rutas, seguridad, variables de entorno, RPC/consultas reutilizadas, módulos, fórmulas, migraciones, despliegue, recuperación, checklist).
- `tests/admin-api-security.spec.ts` — 14 casos ejecutables sin credenciales: las 11 rutas de página bajo `/admin` (incluyendo `/admin/negocios/[id]`) redirigen a `/login` sin sesión; los 2 Route Handlers de exportación devuelven 401 (no un archivo) sin sesión; el HTML de `/admin` no contiene `SUPABASE_SERVICE_ROLE_KEY` ni la palabra "service_role".

### Archivos modificados

- `src/lib/admin/guard.ts` — **bug real encontrado por las pruebas nuevas, corregido**: `getPlatformOwnerOrNull()` chequeaba `ADMIN_OWNER_USER_ID` antes que la sesión. Como esa variable no está configurada en este entorno (todavía no se le pidió el UUID al propietario), *cualquier* request — con o sin sesión — caía en `not_configured`, y `requirePlatformOwnerApi()` lo traducía a `403` incluso para un visitante totalmente anónimo (debería ser `401`, reservando `403` para "identificado pero sin permiso"). Se reordenó: ahora se resuelve el usuario autenticado primero; si no hay sesión, se devuelve `unauthenticated` (→ 401/login) sin importar si la env var está seteada. Esto no era un agujero de seguridad (el acceso se seguía negando correctamente en ambos casos), pero sí una imprecisión semántica que las pruebas automatizadas expusieron. Verificado con `npx playwright test` antes y después del fix (2 casos pasaron de fallar a pasar).
- `package.json` — `test:admin`/`test:admin:headed` ahora corren ambos specs (`admin-owner-access.spec.ts` + `admin-api-security.spec.ts`).

### Pruebas ejecutadas (resultado real, no asumido)

```
npx playwright test tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts --reporter=list
```
Resultado: **16 passed, 2 skipped** (0 failed). Los 2 casos que se saltan (`admin_global de negocio no entra al panel`, `propietario entra y ve el panel`) requieren `tests/.auth/admin.json` / `tests/.auth/superadmin.json` y `ADMIN_OWNER_USER_ID`, que no existen en este entorno — salto documentado, no inventado.

Nota: durante esta fase el servidor `next dev` que venía corriendo desde antes de la sesión dejó de responder brevemente (`ERR_CONNECTION_REFUSED`) y hubo que verificar que siguiera activo antes de repetir la corrida; no se identificó como un problema de código, sino del entorno de desarrollo local.

### Lint

- **Alcance completo (`npm run lint`)**: sigue en `exit code 1`, con **exactamente los mismos 142 problemas (122 errores, 20 warnings)** que ya existían antes de esta sesión (verificado comparando el conteo de Fase 2 con el de Fase 7 — es idéntico) — todos en archivos que esta sesión nunca tocó (confirmado de nuevo con `git status`). No es atribuible al panel admin.
- **Alcance del panel admin** (`npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin tests/admin-owner-access.spec.ts tests/admin-api-security.spec.ts`): **exit code 0, sin errores ni warnings**, en las 7 fases completas.

### Build

`npm run build` → exitoso. Las 11 rutas de página + 2 Route Handlers del panel admin aparecen como dinámicas (`ƒ`), sin prerender estático, consistente con el requisito de que todo `/admin` sea privado y dinámico.

### Riesgos conocidos que siguen abiertos al cierre de esta sesión

1. **Ninguna mutación fue probada end-to-end** (cambiar plan, bloquear/desbloquear negocio, aprobar/rechazar/registrar pago, agregar nota, editar plan, revocar invitación) porque no existe ningún usuario con `rol_global='super_admin'` en producción todavía, y no hay `ADMIN_OWNER_USER_ID` configurada en este entorno. Lo que sí se probó de verdad: que TODAS las rutas y Route Handlers rechazan correctamente a un visitante sin sesión (16 pruebas reales pasando).
2. **Las RPC mutantes** (`admin_cambiar_plan_negocio`, `admin_bloquear_negocio`, `admin_desbloquear_negocio`, `admin_aprobar_pago_manual`, `admin_rechazar_pago_manual`) no se probaron directamente contra producción (solo se confirmó el patrón de `admin_obtener_negocios_resumen()`, de solo lectura). Se asume el mismo patrón de validación interna por consistencia de diseño, pero `requirePlatformOwner()` es la garantía real independiente de esa suposición.
3. `ciclo_facturacion` sigue sin aplicarse a producción (migración creada, no ejecutada).
4. No se asignó `rol_global='super_admin'` a ningún usuario (requiere el UUID real del propietario y autorización explícita para el `UPDATE`).
5. No existe `/admin/configuracion` (no se identificó contenido real específico que justificara construirlo sin inventar funcionalidad).

### Próximo paso recomendado

1. El propietario indica su `auth.users.id` real.
2. Se agrega `ADMIN_OWNER_USER_ID` a `.env.local` (y al entorno de producción).
3. Con autorización explícita, se ejecuta el `UPDATE` que pone `rol_global='super_admin'` en la fila correcta de `perfiles_usuario`.
4. Sesión real de propietario: probar manualmente cada acción mutante (checklist en `docs/admin-owner-panel.md` §11) antes de operar el negocio real desde el panel.
5. Si se decide usar `ciclo_facturacion`, aplicar `supabase/patches/2026-07-admin-ciclo-facturacion.sql` con autorización explícita.
6. Generar `tests/.auth/admin.json` y `tests/.auth/superadmin.json` para poder correr `npm run test:admin` completo (hoy 16/18 casos corren de verdad).

### Comandos exactos para continuar

```bash
cd "e:\Documents\Portafolio-Paginas Web\26-AgendaMe-SaaS\AgendaMe-SaaS"
git status
git diff
npm run build
npm run lint
npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin
npm run test:admin
```

---

## Sesión 2026-07-09 — FASE 6: Analítica, alertas operativas, exportaciones adicionales

### Resumen

Panel de alertas operativas reales en la Vista General (Módulo 10), página `/admin/analitica` con series temporales configurables y métricas de uso, y una exportación XLSX adicional para Pagos.

### Archivos creados

- `src/lib/admin/alertas.ts` — `calcularAlertas()`, función pura que deriva alertas 100% reales (nunca ficticias) a partir de datos ya cargados: vencimientos ≤7 días, pagos pendientes, solicitudes de cambio de plan pendientes, negocios bloqueados, negocios activos sin suscripción activa, negocios sobre el límite de citas, invitaciones expiradas (calculado, no un estado de BD), usuarios sin perfil, negocios activos sin ningún usuario `admin_global`. Cada alerta trae su propio link a la pantalla correspondiente.
- `src/lib/admin/queries/solicitudes.ts` — `contarSolicitudesCambioPlanPendientes()`.
- `src/components/admin/alertas-panel.tsx` — UI de alertas (severidad info/warning/danger, cada una es un link).
- `src/app/admin/analitica/page.tsx` — selector de rango (6/12/24 meses), KPIs de negocios sin actividad / cerca del límite / % en plan pago, gráficos de ingresos y altas reutilizados de la Vista General, tabla "Top 10 por uso del límite", y una sección de retención que **muestra un mensaje explícito en vez de cifras cuando no hay suficiente historial** (umbral: 10 pagos aprobados) — no se inventan números de churn/conversión.
- `src/app/api/admin/pagos/exportar/route.ts` — exportación XLSX de pagos (respeta el filtro de estado activo), `requirePlatformOwnerApi()`, auditoría de la exportación.

### Archivos modificados

- `src/app/admin/page.tsx` — agrega `<AlertasPanel>` entre los KPIs y los gráficos; trae además `invitaciones`, `usuarios` y `solicitudesPendientes` para poder calcular las alertas.
- `src/app/admin/pagos/page.tsx` — botón "Exportar" hacia la nueva ruta, respetando el filtro de estado actual.

### Decisiones técnicas

1. Las alertas viven en la Vista General (no se creó una ruta `/admin/alertas` separada) porque el prompt maestro no la lista entre las rutas sugeridas y el propio Módulo 10 las describe como parte del dashboard, cada una enlazando a su pantalla — crear una ruta aparte hubiera duplicado esa información sin necesidad.
2. La sección de retención en `/admin/analitica` es deliberadamente conservadora: con el volumen de datos actual de la plataforma (muy temprano), no hay base para calcular churn o conversión de forma confiable. Se prefirió mostrar un mensaje honesto ("no hay historial suficiente") antes que un número que pudiera parecer preciso sin serlo, siguiendo la regla explícita del prompt maestro.

### Migraciones

- Ninguna en esta fase.

### Riesgos conocidos (nuevos en esta fase)

- La alerta "negocios sin administrador" compara `negocios` (de `admin_obtener_negocios_resumen()`) contra `usuarios[].negocios[].negocioId` (de `obtenerUsuariosPlataforma()`, que internamente lee `negocio_usuarios`) — son dos fuentes de datos distintas cruzadas en memoria; si una de las dos tarda más o falla parcialmente, la alerta podría ser inexacta por una request. No es persistente, se recalcula en cada carga.
- Igual que en fases anteriores, ninguna interacción nueva (los links de las alertas son solo navegación) requirió probar mutaciones — no hay riesgo nuevo de ese tipo en esta fase.

### Pruebas ejecutadas

- Ninguna prueba Playwright nueva específica de Fase 6 todavía (se agregan en Fase 7).

### Lint

`npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin` → exit code 0, sin errores.

### Build

`npm run build` → exitoso. Rutas nuevas (`/admin/analitica`, `/api/admin/pagos/exportar`) dinámicas.

### Próximo paso

FASE 7: `docs/admin-owner-panel.md` (documentación técnica completa), ampliar `tests/admin-owner-access.spec.ts` (o agregar specs nuevos) para cubrir Server Actions/Route Handlers sin sesión y con usuario normal, correr `npm run lint`/`npm run build`/`npm run test:admin` finales, y cerrar con el resumen de entrega.

---

## Sesión 2026-07-09 — FASE 5: Usuarios, planes, invitaciones, auditoría

### Resumen

Cuatro módulos nuevos, todos sobre datos reales: `/admin/usuarios` (combina `auth.users` vía GoTrue admin API + `perfiles_usuario` + `negocio_usuarios`/`sucursal_usuarios`, DTO seguro), `/admin/planes` (editar precios/límites/visibilidad de `planes_saas`), `/admin/invitaciones` (`sucursal_invitaciones`, sin exponer `token_hash`, con revocar), `/admin/auditoria` (solo lectura, paginación real en servidor).

### Archivos creados

**Lib:**
- `src/lib/admin/queries/usuarios.ts` — `obtenerUsuariosPlataforma()`. Usa `admin.auth.admin.listUsers()` (API admin de GoTrue vía el cliente service role) para traer `auth.users` de forma segura — nunca expone hashes de contraseña (la API de GoTrue no los devuelve nunca, por diseño). Pagina internamente de a 200 hasta agotar resultados (máx. 20 páginas = 4000 usuarios, como salvaguarda). Cruza por `id` **y** por `usuario_id` contra `perfiles_usuario` (misma cautela que en `requirePlatformOwner()`, por la inconsistencia de claves detectada en Fase 1).
- `src/lib/admin/schemas/planes.ts` — `editarPlanSchema` (precios y límites `>= 0`, nombre requerido).
- `src/lib/admin/actions/planes.ts` — `editarPlanAction()`: no hay RPC para editar `planes_saas` (confirmado en Fase 1), se actualiza directo con service role, gateado y auditado con estado anterior/nuevo. No ofrece "eliminar plan" (el prompt maestro pide preferir ocultar vía `visible_publico`).
- `src/lib/admin/queries/invitaciones.ts` — `obtenerInvitaciones()` (nunca selecciona `token_hash`), `estadoEfectivoInvitacion()` (deriva "expirada" cuando `estado='pendiente'` pero `expires_at` ya pasó, sin mutar nada).
- `src/lib/admin/schemas/invitaciones.ts`, `src/lib/admin/actions/invitaciones.ts` — `revocarInvitacionAction()`: no hay RPC, update directo con service role, solo afecta invitaciones que sigan `pendiente`, auditado.
- `src/lib/admin/queries/auditoria.ts` — `obtenerAuditoriaPaginada()`: a diferencia de la lista de negocios, acá la paginación **sí es real en SQL** (`.range()` de Supabase + `count: "exact"`), porque no depende de una RPC sin parámetros — se consulta la tabla `auditoria` directo con filtros server-side (fecha, acción, tabla, negocio).

**Componentes:**
- `src/components/admin/usuarios/usuarios-filtros.tsx` — búsqueda + filtro por rol global + con/sin negocio, en la URL.
- `src/components/admin/planes/plan-editar-dialog.tsx` — formulario de edición; si el plan tiene negocios activos, exige un checkbox de confirmación explícito antes de habilitar "Guardar" (cumple "confirmar cambios que afectan negocios activos" sin bloquear la operación ni borrar datos).
- `src/components/admin/invitaciones/invitacion-revocar-boton.tsx` — revocar con `window.confirm()` (confirmación simple, acción de bajo riesgo/reversible con una nueva invitación).
- `src/components/admin/auditoria/auditoria-filtros.tsx`, `auditoria-detalle-dialog.tsx` — filtros en URL + dialog con el JSON de `detalles`.

**Rutas:**
- `src/app/admin/usuarios/page.tsx` — KPIs (total, con negocio, sin perfil, super admins) + tabla.
- `src/app/admin/planes/page.tsx` — tarjetas por plan con conteo de negocios activos en ese plan (cruzando con `admin_obtener_negocios_resumen()`).
- `src/app/admin/invitaciones/page.tsx` — pestañas por estado efectivo (todas/pendientes/aceptadas/expiradas/revocadas).
- `src/app/admin/auditoria/page.tsx` — tabla paginada en servidor + dialog de detalle.

### Decisiones técnicas

1. **"Reenviar" invitación no se implementó**: se revisó el flujo existente del dashboard de negocio (`src/app/api/dashboard/sucursales/usuarios/route.ts`) y no hay envío de email — el token se genera y el negocio comparte el link manualmente (WhatsApp, etc.), no hay infraestructura de reenvío por correo que reutilizar. El prompt maestro marca "reenviar" como acción condicionada a "si existe soporte"; como no existe, se dejó afuera en vez de inventar un flujo de email nuevo. Se documenta acá para que quien continúe sepa por qué falta.
2. **Aprobar/rechazar solicitudes de cambio de plan** tampoco tiene acción dedicada (ver nota de Fase 4): se resuelven vía "Cambiar plan" en el detalle del negocio.
3. **Auditoría sí usa paginación SQL real** (a diferencia de Negocios, que pagina en memoria porque su única fuente es una RPC sin parámetros) — se prefirió consultar la tabla directamente porque no hay una función equivalente a `admin_obtener_negocios_resumen()` para auditoría, así que no hay razón para no paginar en SQL directamente.

### Migraciones

- Ninguna en esta fase.

### Riesgos conocidos (nuevos en esta fase)

- Igual que en Fase 4: **ninguna mutación de esta fase fue probada end-to-end** (editar plan, revocar invitación) por falta de sesión de propietario real.
- `obtenerUsuariosPlataforma()` no pagina en la UI (trae hasta 4000 usuarios en memoria del servidor); para el tamaño actual de la plataforma es más que suficiente, pero si crece mucho conviene paginar la tabla igual que se hizo con auditoría.
- Un error de TypeScript real se encontró y corrigió durante esta fase (`src/lib/admin/queries/usuarios.ts`: `Map<string, (typeof perfiles)[number]>` fallaba porque `perfiles` podía ser `null` — se reemplazó por un tipo `PerfilRow` explícito). Mencionado para que quede claro que el build se verificó de verdad, no solo se asumió.
- Se encontró y limpió, además, un archivo `.next/` corrupto por una carrera con el servidor `next dev` que quedó corriendo en paralelo (proceso preexistente, no iniciado por esta sesión) — se resolvió borrando `.next` y reconstruyendo; no afecta código fuente.

### Pruebas ejecutadas

- Ninguna prueba Playwright nueva específica de Fase 5 todavía (se agregan en Fase 7).

### Lint

`npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin` → exit code 0, sin errores.

### Build

`npm run build` → exitoso tras corregir el error de tipos en `usuarios.ts`. Todas las rutas de Fase 5 (`/admin/usuarios`, `/admin/planes`, `/admin/invitaciones`, `/admin/auditoria`) aparecen como dinámicas.

### Nota de entorno

A partir de esta fase, el tooling de Node/npm dejó de estar en el `PATH` de la shell Bash de este entorno (aparecía "node: command not found" a mitad de sesión, sin relación con el código). Se resolvió ejecutando `npm run build`/`lint` vía PowerShell en su lugar. Si un futuro agente ve el mismo error en Bash, no es un problema del proyecto: usar PowerShell o exportar `PATH="$PATH:/c/nvm4w/nodejs"` en Bash.

### Próximo paso

FASE 6: `/admin/analitica` (gráficos adicionales: negocios sin actividad, upgrades/downgrades, churn solo si hay historial suficiente), exportaciones adicionales (pagos, usuarios), y el módulo de alertas operativas (Módulo 10) enlazando a las pantallas ya construidas.

---

## Sesión 2026-07-09 — FASE 4: Negocios, detalle, suscripciones, renovaciones, pagos

### Resumen

Módulo de negocios completo (lista con filtros/paginación/export XLSX + detalle con acciones reales), y las vistas de Suscripciones, Renovaciones y Pagos, todas sobre datos reales. Todas las mutaciones pasan por `requirePlatformOwner()` de nuevo (nunca confían en el layout) y llaman las RPC `admin_*` ya verificadas en Fase 1, o insertan directamente (con service role) solo en las tablas sin RPC de escritura (`notas_admin_negocio`, `pagos_manuales` para registrar un pago nuevo en estado pendiente). Toda mutación registra una fila en `auditoria` vía `src/lib/admin/audit.ts`.

**Importante — no verificado end-to-end todavía**: como ningún usuario tiene `rol_global='super_admin'` en producción aún (ver Fase 1), no fue posible ejecutar ninguna mutación real (cambiar plan, bloquear, aprobar pago, etc.) en un navegador. Todo lo de esta fase está verificado a nivel de build/TypeScript/lint y revisión de código, no de ejecución real. Esto debe probarse con una sesión de propietario real antes de considerarlo "funcionando" en producción.

### Archivos creados

**Migración (no aplicada):**
- `supabase/patches/2026-07-admin-ciclo-facturacion.sql` — agrega `ciclo_facturacion` (`mensual|anual|manual`, default conservador documentado) a `suscripciones` y `pagos_manuales`, con índices. **No ejecutada contra producción.**

**Lib:**
- `src/lib/admin/audit.ts` — `registrarAuditoria()`, inserta en `auditoria` vía service role; nunca lanza (un fallo de auditoría no revierte la acción ya aplicada, pero queda en logs de servidor).
- `src/lib/admin/schemas/negocios.ts` — Zod: `cambiarPlanSchema`, `bloquearNegocioSchema`, `desbloquearNegocioSchema`, `aprobarPagoSchema`, `rechazarPagoSchema`, `agregarNotaSchema`, `registrarPagoSchema`.
- `src/lib/admin/actions/negocios.ts` — Server Actions (`"use server"`): `cambiarPlanNegocioAction`, `bloquearNegocioAction`, `desbloquearNegocioAction`, `aprobarPagoAction`, `rechazarPagoAction`, `agregarNotaAction`, `registrarPagoAction`. Cada una vuelve a llamar `requirePlatformOwner()`, valida con Zod, ejecuta la RPC (con el cliente de sesión, no service role — ver decisión técnica abajo) o el insert directo, y registra auditoría.
- `src/lib/admin/queries/negocio-detalle.ts` — `obtenerNegocioBase`, `obtenerHistorialSuscripciones`, `obtenerPagosNegocio`, `obtenerSolicitudesCambioPlan`, `obtenerNotasNegocio`, `obtenerAuditoriaNegocio` (todas service role, sobre tablas sin vista/RPC pública para el detalle de un negocio puntual).
- `src/lib/admin/negocios-table.ts` — `aplicarFiltrosNegocios()`, `paginar()`, `filtrarYPaginarNegocios()` (funciones puras, testeable sin I/O).

**Componentes:**
- `src/components/admin/negocios/negocios-filtros.tsx` — búsqueda + filtros (plan, estado, vencimiento, orden) en la URL (`useSearchParams`/`router.push`), botón de exportar.
- `src/components/admin/negocios/negocios-tabla.tsx` — tabla con badges de estado/vencimiento, uso vs límite, paginación por links.
- `src/components/admin/negocios/negocio-bloqueo-boton.tsx` — bloquear (con motivo obligatorio) / desbloquear, con diálogo de confirmación.
- `src/components/admin/negocios/negocio-cambiar-plan-dialog.tsx` — cambia plan + vencimiento opcional; **advierte si el negocio ya excede el límite de citas del plan nuevo antes de confirmar** (tal como exige el prompt maestro), sin bloquear la acción ni borrar datos.
- `src/components/admin/negocios/negocio-pagos-panel.tsx` — tabla de pagos del negocio + registrar pago nuevo (pendiente).
- `src/components/admin/negocios/negocio-notas-panel.tsx` — notas internas (agregar + listar).
- `src/components/admin/pagos/pago-acciones.tsx` — `AprobarPagoDialog`/`RechazarPagoDialog` reutilizables (usados tanto en el detalle de negocio como en `/admin/pagos`, para no duplicar lógica).

**Rutas:**
- `src/app/admin/negocios/page.tsx` — lista con filtros/paginación. La RPC `admin_obtener_negocios_resumen()` no soporta filtros/paginación en el servidor (no tiene parámetros); se trae el resultado completo una sola vez en el Server Component y se filtra/pagina en memoria del servidor antes de renderizar — nada del dataset completo llega al navegador, solo la página actual ya filtrada. Documentado como decisión, no como limitación oculta.
- `src/app/admin/negocios/[id]/page.tsx` — detalle: datos del negocio, plan/suscripción + consumo de límites, historial de suscripciones, pagos, solicitudes de cambio de plan (solo lectura por ahora, se resuelven vía "Cambiar plan"), notas internas, auditoría relacionada.
- `src/app/admin/suscripciones/page.tsx` — vistas por pestañas (todas/activas/vencen 7-15-30/vencidas/sin vencimiento) sobre los mismos datos de `admin_obtener_negocios_resumen()`.
- `src/app/admin/renovaciones/page.tsx` — KPIs de vencimiento + tabla de próximos 30 días + lista de vencidas, con acceso directo al detalle del negocio para renovar/extender (reutiliza la acción "Cambiar plan", no duplica lógica de renovación aparte).
- `src/app/admin/pagos/page.tsx` — todos los pagos de todos los negocios (últimos 500), resumen (cobrado, ticket promedio, pendientes, rechazados), filtro por estado y aprobar/rechazar inline.
- `src/app/api/admin/negocios/exportar/route.ts` — exportación XLSX (ExcelJS) respetando los mismos filtros de la lista, límite de 5000 filas, `requirePlatformOwnerApi()`, auditoría de la exportación.

### Archivos modificados

- `src/lib/admin/queries/pagos.ts` — se agregó `obtenerTodosPagos()` (join con `negocios` y `planes_saas`) para `/admin/pagos`.

### Decisiones técnicas

1. **Las RPC mutantes (`admin_cambiar_plan_negocio`, `admin_bloquear_negocio`, `admin_desbloquear_negocio`, `admin_aprobar_pago_manual`, `admin_rechazar_pago_manual`) se llaman con el cliente de sesión** (`@/lib/supabase/server`), igual que `admin_obtener_negocios_resumen()` en Fase 3 — no se verificó explícitamente que su cuerpo interno valide `es_super_admin()` (solo se confirmó para la de lectura, para no arriesgar mutar datos reales en la introspección de Fase 1), pero por consistencia de diseño con el resto de RPC administrativas del proyecto se asume el mismo patrón. `requirePlatformOwner()` en la Server Action es la garantía real independiente de esto.
2. **No existe RPC para crear un pago** (`pagos_manuales`) ni para agregar una nota (`notas_admin_negocio`): se insertan directamente con el service role, siempre gateado por `requirePlatformOwner()` y siempre auditado.
3. **Paginación de negocios en memoria del servidor**, no en SQL, porque la RPC existente no acepta parámetros de filtro/paginación (ver Fase 1). Aceptable al volumen actual; si la tabla de negocios crece mucho, ver nota de riesgo.
4. **Solicitudes de cambio de plan**: se muestran de solo lectura en el detalle del negocio; no se creó una acción para "aprobar/rechazar" una solicitud puntual (no existe RPC ni se pidió explícitamente un flujo separado) — el propietario aplica el cambio con "Cambiar plan", que ya cubre el resultado funcional. Posible mejora futura: marcar automáticamente la solicitud relacionada como resuelta al cambiar el plan.

### Migraciones

- Creada: `supabase/patches/2026-07-admin-ciclo-facturacion.sql`.
- Aplicada: **ninguna**. Sigue pendiente de autorización explícita del propietario antes de ejecutarse contra producción.

### Riesgos conocidos (nuevos en esta fase)

- Ver arriba: **cero mutaciones probadas end-to-end** (bloquear, cambiar plan, aprobar/rechazar pago, registrar pago, agregar nota) por falta de una sesión de propietario real en este entorno. Antes de confiar en el panel para operar el negocio real, hay que probar cada acción manualmente una vez con `ADMIN_OWNER_USER_ID` configurado.
- `obtenerTodosPagos()` trae hasta 500 filas sin paginar en `/admin/pagos`; igual que en Fase 3, aceptable ahora, revisar si la tabla crece mucho.
- El campo `ciclo_facturacion` todavía no existe en producción: las vistas de Suscripciones no pueden filtrar por mensual/anual/manual hasta que se aplique la migración creada en esta fase.
- La tabla `vista_admin_negocios_resumen` no expone `precio_mensual_gs`/`precio_anual_gs` (solo `precio_gs` legacy); el detalle de negocio y las listas usan el nombre del plan, no un precio recalculado localmente, para no arriesgar mostrar un monto incorrecto.

### Pruebas ejecutadas

- Ninguna prueba Playwright nueva específica de Fase 4 todavía (se añadirán pruebas de seguridad para Server Actions/Route Handlers en Fase 7, siguiendo el mismo patrón de `tests/admin-owner-access.spec.ts`).
- Verificación manual: `npm run build` exitoso con todas las rutas nuevas (`/admin/negocios`, `/admin/negocios/[id]`, `/admin/suscripciones`, `/admin/renovaciones`, `/admin/pagos`, `/api/admin/negocios/exportar`) listadas como dinámicas (`ƒ`).

### Lint

`npx eslint src/app/admin src/components/admin src/lib/admin src/app/api/admin` → sin errores. (Mismo alcance/limitación que en Fase 3: el lint de todo el repo sigue fallando por archivos preexistentes no tocados por esta sesión.)

### Build

`npm run build` → exitoso.

### Próximo paso

FASE 5: `/admin/usuarios` (vista combinada de `auth.users` + `perfiles_usuario` + `negocio_usuarios`/`sucursal_usuarios`, solo DTO seguro, sin exponer `auth.users` completo), `/admin/planes` (editar precios/límites/visibilidad de `planes_saas`, con confirmación si hay negocios activos afectados), `/admin/invitaciones` (`sucursal_invitaciones`, sin exponer tokens), `/admin/auditoria` (solo lectura sobre la tabla `auditoria`, con filtros y detalle).

---

## Sesión 2026-07-09 — FASE 3: Layout, navegación y vista general (KPIs reales)

### Resumen

Layout visual propio del panel (sidebar + topbar responsive) y dashboard ejecutivo con KPIs y gráficos calculados a partir de datos reales (RPC `admin_obtener_negocios_resumen()` + tablas `pagos_manuales`/`planes_saas`). Cero datos inventados: donde falta información real (ciclo de facturación) se etiqueta explícitamente como estimación.

### Archivos creados

- `src/lib/admin/formatters/currency.ts` — `formatearGuaranies()` (Intl.NumberFormat es-PY/PYG, 0 decimales), `formatearNumero()`.
- `src/lib/admin/formatters/date.ts` — helpers de fecha con `timeZone: "America/Asuncion"`: `anioMesAsuncion()`, `anioMesActualAsuncion()`, `formatearFechaCorta/Hora()`, `ultimosMeses(n)`.
- `src/lib/admin/types/negocio.ts` — tipo `NegocioResumenRow` (columnas reales de `vista_admin_negocios_resumen`, confirmadas en Fase 1).
- `src/lib/admin/queries/negocios-resumen.ts` — `obtenerNegociosResumen()`. **Decisión importante**: llama `admin_obtener_negocios_resumen()` con el cliente de sesión (`@/lib/supabase/server`), NO con el service role. Se verificó en Fase 1 que la función valida `es_super_admin()` contra el JWT de la request — con la service role key (sin usuario asociado) la función también rechaza con 403, igual que a un anónimo. Usar el cliente de sesión del propietario ya autenticado es lo correcto.
- `src/lib/admin/queries/planes.ts` — `obtenerPlanes()`, lee `planes_saas` completo (service role, tabla de referencia interna, no hay RPC pública que la reemplace con todos los campos necesarios para MRR).
- `src/lib/admin/queries/pagos.ts` — `obtenerPagosAprobadosRecientes()`, `contarPagosPendientes()` (service role sobre `pagos_manuales`, sin RPC equivalente).
- `src/lib/admin/kpis.ts` — módulo puro (sin I/O): `calcularKpis()`, `calcularIngresosPorMes()`, `calcularNegociosNuevosPorMes()`, `calcularDistribucionPorPlan()`, `calcularDistribucionSuscripciones()`.
- `src/lib/admin/nav.ts` — configuración de las 11 rutas del panel (`ADMIN_NAV_ITEMS`).
- `src/components/admin/admin-shell.tsx` — layout propio (no reutiliza `DashboardShell` del tenant, tal como pide el prompt maestro): sidebar fija en desktop/tablet (`md:flex`), topbar + menú desplegable en mobile, reutiliza `SignOutButton` y `DashboardPreferencesApplier` (genéricos, ya existían) y `AgendaMeIcon` del sistema de marca.
- `src/components/admin/kpi-card.tsx` — tarjeta de KPI con tono (default/success/warning/danger).
- `src/components/admin/charts/admin-charts.tsx` — 4 gráficos Recharts: ingresos por mes (barra), negocios nuevos por mes (barra), distribución por plan (dona), suscripciones por estado (barra horizontal). Sigue el mismo patrón visual que `src/components/reportes/reportes-charts.tsx` (tooltips, `ag-report-chart`, tokens de color de `globals.css`), pero como módulo propio del panel admin.
- `src/app/admin/loading.tsx`, `src/app/admin/error.tsx` — skeleton y error recuperable (con botón "Reintentar"), en vez de spinner de pantalla completa.
- 5 primitivas shadcn agregadas vía `npx shadcn add` (no existían): `badge.tsx`, `skeleton.tsx`, `table.tsx`, `tabs.tsx`, `sonner.tsx`. Trajeron como dependencias nuevas `next-themes` y `sonner` (agregadas automáticamente a `package.json`). `sonner.tsx` usa `useTheme()` de `next-themes` sin `ThemeProvider` — es seguro (no lanza, devuelve `theme: "system"` por defecto) porque el color real lo resuelven las variables CSS existentes (`--popover`, etc.), no `next-themes`.

### Archivos modificados

- `src/app/admin/layout.tsx` — ahora envuelve `children` en `<AdminShell ownerEmail={owner.email}>`.
- `src/app/admin/page.tsx` — reemplazado el placeholder de Fase 2 por el dashboard ejecutivo real: 16 KPI cards + 4 gráficos, usando `requirePlatformOwner()` otra vez (no confía solo en el layout) + las queries/cálculos de arriba.
- `package.json` / `package-lock.json` — actualizados automáticamente por `shadcn add` (nuevas dependencias `next-themes`, `sonner`).

### Fórmulas y métricas (para que quede documentado, no solo en código)

- **Ingreso cobrado (mes/año)**: suma real de `pagos_manuales.monto_gs` donde `estado = 'aprobado'`, agrupado por año/mes de `fecha_pago` en huso `America/Asuncion`. No es estimación.
- **MRR estimado**: para cada negocio con `suscripcion_estado = 'activa'` y plan no gratuito, se suma `planes_saas.precio_mensual_gs` del plan asignado (fallback a `precio_gs` legacy si el plan no se encuentra). **Etiquetado como estimación** en la UI porque no existe todavía columna `ciclo_facturacion`: se asume mensual para todas las suscripciones activas (no se puede distinguir un cobro anual ya prorrateado).
- **ARR estimado**: `MRR estimado × 12`.
- **Suscripciones vencidas**: `suscripcion_estado = 'vencida'` OR (`suscripcion_estado = 'activa'` AND `dias_para_vencer < 0`) — cubre el caso real de que `marcar_suscripciones_vencidas()` no corre en cada request (tal como exige el prompt maestro), por lo que el estado en base puede no reflejar todavía un vencimiento reciente.
- **Negocios nuevos este mes**: `created_at` cae en el año/mes actual, calculado en `America/Asuncion`.

### Migraciones

- Ninguna en esta fase.

### Riesgos conocidos (nuevos en esta fase)

- El MRR/ARR son estimaciones reconocidas como tales en la propia UI (`hint` en la KpiCard); quedan sujetas a mejorar en cuanto exista `ciclo_facturacion` (Fase 4).
- Los ítems de navegación apuntan a `/admin/negocios`, `/admin/usuarios`, etc., que todavía no existen (se construyen en Fases 4-6) — hasta entonces esos enlaces dan 404, es esperado en construcción incremental por fases.
- `obtenerPagosAprobadosRecientes()` trae hasta 13 meses de pagos aprobados a memoria del servidor sin paginar; aceptable al volumen actual, pero si la tabla `pagos_manuales` crece mucho convendría agregar en SQL en vez de en JS (nota para Fase 6/optimización).

### Pruebas ejecutadas

```
npx playwright test tests/admin-owner-access.spec.ts --reporter=list
```
Resultado real: `2 passed, 2 skipped` (confirmado 2 veces; la primera corrida tras el cambio tuvo un timeout por compilación en frío de Turbopack en modo dev, no por una regresión — se repitió y pasó limpio en 24.9s).

### Lint

Aclaración importante: `npm run lint` a nivel de repo completo **falla (exit 1)**, pero por errores preexistentes en archivos que esta sesión no tocó: `src/lib/dashboard/access-context.ts`, `src/lib/dashboard/scope-helpers.ts`, `src/lib/reservas/disponibilidad.ts`, `src/components/servicios/servicio-dialog.tsx`, `src/components/servicios/servicios-imagenes-panel.tsx`, `src/components/sucursales/sucursal-empleados-panel.tsx`, `src/components/sucursales/sucursal-usuarios-panel.tsx`, `tests/api-security.spec.ts`, `tests/helpers/supabase-db.ts`, `tests/plan-limits-db.spec.ts` (confirmado con `git status`: ninguno de estos aparece como modificado). Se verificó por separado, lintando solo los archivos creados/modificados en Fases 2-3 (`npx eslint src/app/admin src/components/admin src/lib/admin src/lib/supabase/admin.ts src/lib/supabase/service-role.ts src/proxy.ts src/components/ui/badge.tsx src/components/ui/skeleton.tsx src/components/ui/sonner.tsx src/components/ui/table.tsx src/components/ui/tabs.tsx tests/admin-owner-access.spec.ts`): **exit code 0, sin errores ni warnings**. No se debe reportar "lint OK" a nivel de proyecto — es preexistente y fuera de alcance de este trabajo, pero tampoco se debe ocultar.

### Build

`npm run build` → exitoso tras agregar todo lo de Fase 3. `/admin` sigue como ruta dinámica.

### Próximo paso

FASE 4: `/admin/negocios` (tabla con filtros/paginación en servidor + export), `/admin/negocios/[id]` (detalle con acciones reales: cambiar plan, bloquear/desbloquear, registrar y aprobar/rechazar pagos usando las RPC ya verificadas), `/admin/suscripciones`, `/admin/renovaciones`, `/admin/pagos`. Incluye la migración aditiva de `ciclo_facturacion` (creación del archivo SQL; **no se aplica a producción sin autorización explícita**).

---

## Sesión 2026-07-09 — FASE 2: Guard del propietario y protección base

### Resumen

Implementado y verificado el guard central de seguridad del panel, sin construir todavía UI real (eso es Fase 3). Build y lint pasan. Pruebas Playwright ejecutables pasan; las que requieren credenciales de super_admin/tenant se saltan documentadamente (no existen storageState locales en este entorno).

### Archivos creados

- `src/lib/admin/guard.ts` — `getPlatformOwnerOrNull()` y `requirePlatformOwner()`. Verifica: (1) `ADMIN_OWNER_USER_ID` configurado (si no, falla cerrado), (2) usuario autenticado, (3) `user.id === ADMIN_OWNER_USER_ID`, (4) `perfiles_usuario.rol_global === 'super_admin'` para ese usuario (consulta por `id` primero, con fallback a `usuario_id` por la inconsistencia de claves detectada en Fase 1). No autenticado → `redirect("/login?next=/admin")`. Cualquier otro fallo (no configurado / no es el owner / no es super_admin) → `notFound()`, sin revelar el motivo exacto.
- `src/lib/admin/api-guard.ts` — `requirePlatformOwnerApi()`, variante para Route Handlers/Server Actions que devuelve `NextResponse.json(...)` con 401 (no autenticado) o 403 (autenticado pero no autorizado) en vez de redirigir.
- `src/app/admin/layout.tsx` — llama a `requirePlatformOwner()` antes de renderizar nada, `dynamic = "force-dynamic"`, `revalidate = 0`, `fetchCache = "force-no-store"` (mismo patrón que `src/app/dashboard/layout.tsx`).
- `src/app/admin/page.tsx` — placeholder real y mínimo (saluda al propietario autenticado, sin datos ficticios ni KPIs todavía). Se reemplaza en Fase 3 por el dashboard ejecutivo real.
- `.env.example` — no existía en el repo. Incluye las 5 variables ya usadas por el proyecto (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_CONTACT_WHATSAPP`) más las 2 nuevas (`ADMIN_OWNER_USER_ID`, `ADMIN_REQUIRE_AAL2`), sin valores reales.
- `tests/admin-owner-access.spec.ts` — 4 casos: visitante no autenticado redirigido a `/login` (✅ ejecutado), visitante no autenticado no ve contenido del panel (✅ ejecutado), tenant `admin_global` no entra al panel del propietario (⏭️ skip, falta `tests/.auth/admin.json`), propietario real entra y ve el panel (⏭️ skip, falta `tests/.auth/superadmin.json` y `ADMIN_OWNER_USER_ID`).

### Archivos modificados

- `src/lib/supabase/service-role.ts` — se agregó `import "server-only";` al inicio. Verificado que no rompe el build (36 usos existentes siguen compilando).
- `src/lib/supabase/admin.ts` — mismo cambio, mismo motivo.
- `src/proxy.ts` — se agregó `isAdmin = pathname.startsWith("/admin")` a las rutas que el middleware evalúa; si `(isDashboard || isAdmin) && !user`, redirige a `/login?next=<path>`. Esto es solo autenticación (defensa en profundidad); la autorización real (¿es el propietario?) sigue siendo responsabilidad exclusiva de `requirePlatformOwner()` en el layout/acciones — el middleware nunca decide autorización.
- `package.json` — se agregaron scripts `test:admin` y `test:admin:headed`. No se modificó ningún script existente.

### Migraciones

- Ninguna en esta fase (Fase 2 fue solo código de aplicación, sin tocar el esquema).

### Variables de entorno

- Igual que Fase 1 + `.env.example` ya creado (ver arriba). Sigue pendiente: el valor real de `ADMIN_OWNER_USER_ID` en `.env.local` (el propietario debe indicarlo) y la asignación de `rol_global='super_admin'` a esa fila en `perfiles_usuario` (requiere autorización explícita para escribir en producción, no se hizo).

### Decisiones técnicas

- `requirePlatformOwner()` consulta `perfiles_usuario` por `id` primero y hace fallback a `usuario_id`, en vez de asumir una sola convención, por la inconsistencia detectada en Fase 1 (onboarding escribe por `id`, el resto del código lee por `usuario_id`). Esto evita que el guard falle abierto o cerrado incorrectamente por esa ambigüedad preexistente.
- `notFound()` en vez de un mensaje "403 no autorizado" explícito para todo lo que no sea "no autenticado": evita confirmarle a un usuario autenticado cualquier información sobre la existencia/estructura del panel si no es el propietario.
- El middleware (`src/proxy.ts`) se mantiene deliberadamente simple (solo autenticación) — toda decisión de autorización vive en `requirePlatformOwner()`, siguiendo la regla del prompt maestro de que la seguridad no debe depender de la capa de rutas.

### Riesgos conocidos (nuevos en esta fase)

- El caso de prueba "tenant admin_global no entra al panel" y "propietario entra" no se ejecutaron de verdad (solo se dejaron preparados y documentados) por falta de storageState/credenciales en este entorno. **No se debe reportar esto como "verificado"** hasta correrlos con credenciales reales.
- Aún no hay ningún usuario con `rol_global='super_admin'` en producción — el panel es inaccesible para cualquiera hasta que el propietario confirme su `auth.users.id` y se autorice el `UPDATE` correspondiente.

### Pruebas ejecutadas

```
npx playwright test tests/admin-owner-access.spec.ts --reporter=list
```
Resultado real: `2 passed, 2 skipped` (servidor dev ya corría en localhost:3000; no se levantó uno nuevo).

### Lint

`npm run lint` → sin errores (exit code 0).

### Build

`npm run build` → exitoso. `/admin` aparece como ruta dinámica (`ƒ`) en la tabla de rutas, sin prerender estático, consistente con el requisito de que todo `/admin` sea privado y dinámico.

### Próximo paso

FASE 3: layout visual propio de `/admin` (sidebar, topbar, breadcrumbs), y reemplazar `src/app/admin/page.tsx` por el dashboard ejecutivo con KPIs reales (usando `admin_obtener_negocios_resumen()` y `vista_admin_negocios_resumen`, ya confirmados en producción).

---

## Sesión 2026-07-09 — FASE 1: Auditoría inicial

### 1. Estado actual

- No existe ningún panel `/admin` implementado. Cero archivos en `src/app/admin`, `src/components/admin`, `src/lib/admin`.
- **Nota de alcance:** `CLAUDE.md` (raíz) restringe el trabajo a "solo UI/UX" y prohíbe tocar `src/app/api/**`, `src/lib/supabase/**`, `src/lib/dashboard/**`, `src/lib/planes/**`, `tests/**`, `supabase/**`. El propietario autorizó explícitamente en esta sesión ejecutar el prompt maestro completo (auth, Supabase, RPC, migraciones, Server Actions, tests) **exclusivamente para construir el panel `/admin`**, sin tocar el dashboard de negocios existente salvo lo estrictamente necesario (p. ej. añadir guard en `src/lib/supabase/admin.ts`/`service-role.ts`). Cualquier agente que continúe debe respetar este alcance ampliado solo para `/admin`, no para el resto del proyecto.
- El propietario autorizó además una introspección de solo lectura contra la Supabase de **producción** (vía el endpoint OpenAPI de PostgREST y llamadas RPC/SELECT no mutantes) para verificar el esquema real, dado que el repo no contiene ni una sola migración versionada. Esa introspección ya se hizo (ver punto 6) y confirmó que **la mayoría del backend administrativo ya existe en producción**, aunque nunca fue capturado en git.
- No se ejecutó ninguna escritura/mutación contra Supabase. Todas las consultas fueron `SELECT`/RPC de solo lectura (`es_super_admin`, conteos con `limit=0`).

### 2. Qué ya funciona (confirmado, no asumido)

**Backend Supabase (verificado en producción vía introspección de solo lectura):**

- Tablas ya existentes y con RLS activo (confirmado: `anon` recibe `[]` vacío, no error, en `auditoria`, `pagos_manuales`, `notas_admin_negocio`, `perfiles_usuario`, `negocios`, `suscripciones`, `negocio_usuarios`):
  `auditoria`, `bloqueos_horario`, `citas`, `cliente_portal_tokens`, `cliente_sucursales`, `cliente_usuarios`, `clientes`, `configuracion_negocio`, `empleado_servicios`, `empleados`, `historial_citas`, `horarios_empleado`, `horarios_negocio`, `invitaciones_cliente`, `negocio_usuarios`, `negocios`, `notas_admin_negocio`, `pagos_manuales`, `perfiles_usuario`, `permisos`, `planes_saas`, `recordatorios_citas`, `rol_permisos`, `roles_negocio`, `servicios`, `solicitudes_cambio_plan`, `sucursal_invitaciones`, `sucursal_usuarios`, `sucursales`, `suscripciones`, `uso_plan_mensual`, `usuario_permisos_extra`.
- Vistas: `vista_admin_negocios_resumen` (sin grant a `anon`; PostgREST devuelve `401 permission denied for view`), `vista_bloqueos_publicos`, `vista_configuracion_publica`, `vista_empleado_servicios_publicos`, `vista_empleados_publicos`, `vista_horarios_empleado_publicos`, `vista_horarios_negocio_publicos`, `vista_negocios_publicos`, `vista_planes_publicos`, `vista_servicios_publicos`.
- RPCs administrativas **ya existen y ya están protegidas a nivel de función**:
  - `es_super_admin()` — sin parámetros, callable por `anon`, devuelve `boolean` (probado: `anon` → `false`). Internamente evalúa el usuario autenticado (probablemente `auth.uid()` + `perfiles_usuario.rol_global`), no expone datos.
  - `admin_obtener_negocios_resumen()` — sin parámetros. Probado con `anon`: **rechaza con 401** y mensaje `"Solo un super_admin puede consultar este resumen."` (código Postgres `42501`). Confirma que la función ya valida `super_admin` internamente antes de devolver datos.
  - `admin_cambiar_plan_negocio(p_negocio_id uuid, p_plan_clave text, p_fecha_vencimiento timestamptz opcional, p_notas text opcional)`
  - `admin_bloquear_negocio(p_negocio_id uuid, p_motivo text)`
  - `admin_desbloquear_negocio(p_negocio_id uuid)`
  - `admin_aprobar_pago_manual(p_pago_id uuid, p_fecha_vencimiento timestamptz, p_notas text opcional)`
  - `admin_rechazar_pago_manual(p_pago_id uuid, p_notas text opcional)`
  - `marcar_suscripciones_vencidas()` — sin parámetros.
  - **No se probaron las funciones mutantes** (`admin_cambiar_plan_negocio`, `admin_bloquear_negocio`, `admin_desbloquear_negocio`, `admin_aprobar_pago_manual`, `admin_rechazar_pago_manual`, `marcar_suscripciones_vencidas`) contra producción — solo se confirmaron sus firmas vía el esquema OpenAPI. No hay evidencia directa de que su cuerpo interno valide `es_super_admin()`; **hay que revisar/confirmar esto antes de exponerlas en el panel**, o volver a envolverlas con `requirePlatformOwner()` en el servidor como defensa en profundidad (nunca confiar solo en la RPC).
  - Otras RPC del dominio de negocio (no administrativas): `cancelar_solicitud_cambio_plan`, `cita_cuenta_para_limite`, `cliente_tiene_acceso`, `empleado_horario_permite`, `es_admin_negocio`, `es_empleado_negocio`, `es_miembro_negocio`, `negocio_horario_permite`, `negocio_puede_operar`, `negocio_tiene_plan_activo`, `obtener_o_crear_sucursal_principal`, `puede_crear_cita`, `puede_crear_cliente`, `puede_crear_empleado`, `puede_crear_servicio`, `recalcular_uso_plan_mensual_citas`, `storage_negocio_id`, `tiene_permiso`.
- Columnas confirmadas (vía OpenAPI de PostgREST) de las tablas clave — ver sección 8 más abajo (esquema efectivo real).
- **`rol_global` en `perfiles_usuario` existe y es texto libre.** Valor único observado en producción hasta ahora: `'usuario'` (0 filas con `'super_admin'`). Es decir: **nadie tiene todavía el rol de propietario asignado** — habrá que asignarlo manualmente una vez que el propietario confirme su `auth.users.id`.
- `negocios` ya tiene columnas de bloqueo: `estado`, `motivo_bloqueo`, `bloqueado_at`, `bloqueado_por` — es decir, `admin_bloquear_negocio`/`admin_desbloquear_negocio` tienen dónde escribir.
- `pagos_manuales` ya tiene `periodo_inicio`, `periodo_fin`, `monto_gs`, `metodo`, `estado`, `comprobante_url`, `aprobado_por/at`, `rechazado_por/at`, `notas_cliente`, `notas_admin`.
- `auditoria` ya existe con columnas `negocio_id, usuario_id, accion, tabla_afectada, registro_id, detalles (jsonb), origen, ip, user_agent, created_at` — lista para reutilizar como log de auditoría del panel admin (no hay que crearla).
- `notas_admin_negocio` ya existe (`negocio_id, admin_id, nota, created_at, updated_at`).

**Código de la app (dashboard de negocios, no tocar salvo lo indicado):**

- Autenticación de sesión: `@supabase/ssr`, cookies, `src/lib/supabase/server.ts` (cliente de servidor atado a la sesión del usuario) — reutilizable tal cual para leer el usuario autenticado en `/admin`.
- Cliente privilegiado ya existe, duplicado en dos archivos casi idénticos: `src/lib/supabase/admin.ts` (`createAdminClient`, usado en 1 archivo) y `src/lib/supabase/service-role.ts` (`createServiceRoleClient`, usado en 36 archivos). **Decisión: reutilizar `createServiceRoleClient` (el de mayor adopción) para el panel admin**, no crear un tercero.
- Patrón de guard de servidor ya existente y a imitar: `src/lib/dashboard/access-context.ts` (`resolveDashboardAccess`/`requireDashboardAccess`) + `src/lib/dashboard/api-access.ts` (`requireApiDashboardAccess`, para Route Handlers) + `src/lib/dashboard/api-guards.ts`. `requirePlatformOwner()` debe seguir esta misma forma (result object `{ok:true, owner}` / `{ok:false, reason}` + wrapper de API que devuelve `NextResponse.json` 401/403).
- Middleware activo real: **`src/proxy.ts`** (Next.js 16 renombró `middleware.ts` → `proxy.ts`, exporta función `proxy()`). Hoy solo protege `/dashboard`, `/login`, `/registro`; **no menciona `/admin`** — cualquier request a `/admin/*` pasa de largo sin chequeo (matcher lo incluye, pero el cuerpo de la función hace `return response` inmediato si no es dashboard/login/registro). Esto es aceptable según el prompt maestro ("la seguridad no debe depender de ocultar la ruta"), siempre que el guard de servidor (`requirePlatformOwner()`) se ejecute en el layout y en cada acción — pero conviene además añadir `/admin` al proxy como capa extra de defensa en profundidad (redirigir no-autenticados a `/login` antes de tocar el layout).
- Existe un archivo **muerto/no usado**: `src/lib/supabase/proxy.ts` (`updateSession`) que sí menciona `/admin` en su lista de rutas protegidas, pero no está importado en ningún lado (confirmado por grep). No se toca en esta fase; se documenta para evitar confusión futura sobre cuál es el middleware "real".

### 3. Qué falta

- Todo el frontend de `/admin` (0% implementado): layout, guard, las 11 rutas sugeridas, componentes, queries, formatters, schemas Zod.
- `requirePlatformOwner()` / `getPlatformOwnerOrNull()` — no existen.
- Variable de entorno `ADMIN_OWNER_USER_ID` — no existe en `.env.local` ni hay `.env.example` en el repo (no existe ningún `.env.example`, hay que crearlo desde cero).
- Variable opcional `ADMIN_REQUIRE_AAL2` — no existe. El proyecto no tiene MFA/AAL2 implementado en ningún lado (no hay `assurance_level`, `mfa`, `aal` en el código); por tanto, según la regla del prompt maestro, **no se debe inventar un flujo falso**: se dejará la variable opcional, sin exigencia por defecto, documentada como "pendiente de habilitar cuando el proyecto soporte MFA".
- Asignación real de `rol_global = 'super_admin'` al usuario propietario — pendiente porque requiere el UUID real del propietario (dato sensible que no se sube a git) y una escritura en Supabase, que **no se ejecuta sin autorización explícita adicional** cuando llegue el momento (Fase 2).
- Migración aditiva para `ciclo_facturacion` en `suscripciones` — **confirmado que la columna no existe hoy** ni en `suscripciones` ni en `pagos_manuales` (verificado en el esquema real, no solo por grep del código). Sí existen `periodo_inicio`/`periodo_fin` en `pagos_manuales` (no en `suscripciones`). Falta crear la migración aditiva propuesta por el prompt maestro (Fase 2/4, con valor conservador para filas históricas).
- Confirmar (antes de exponer botones de mutación en el panel) si las RPC mutantes (`admin_cambiar_plan_negocio`, `admin_bloquear_negocio`, `admin_desbloquear_negocio`, `admin_aprobar_pago_manual`, `admin_rechazar_pago_manual`) ya validan `es_super_admin()` internamente igual que `admin_obtener_negocios_resumen()`. No se probó por ser mutantes; se recomienda pedir al propietario el `CREATE OR REPLACE FUNCTION` real desde Supabase Studio, o revisarlo en Fase 2 antes de conectar botones reales.
- Pruebas Playwright (`test:admin`), documentación técnica (`docs/admin-owner-panel.md`).

### 4. Archivos creados (esta sesión)

- `docs/admin-owner-panel-progress.md` (este archivo).

### 5. Archivos modificados (esta sesión)

- Ninguno todavía. Fase 1 fue solo auditoría (código local) + introspección de solo lectura (producción, sin escrituras).

### 6. Migraciones creadas

- Ninguna todavía.
- Nota importante: el repo **no tiene carpeta `supabase/migrations`**, solo `supabase/patches/` con 2 archivos SQL (`2026-07-agendame-planes-comerciales.sql` — aplicado, `2026-07-empleado-id-sucursal-usuarios.sql` — **no aplicado**, agrega `empleado_id` a `sucursal_usuarios`/`sucursal_invitaciones`). Ningún patch existente toca objetos de administración. Se recomienda que las migraciones del panel admin usen el mismo estilo de `supabase/patches/*.sql` (con comentario de cabecera indicando si fue aplicado o no) hasta que el proyecto adopte `supabase/migrations` formal.

### 7. Migraciones aplicadas

- Ninguna (de esta sesión). Recordatorio: `2026-07-empleado-id-sucursal-usuarios.sql` sigue pendiente de aplicar (preexistente, no relacionado con el panel admin, no tocar sin autorización aparte).

### 8. Esquema real confirmado (introspección producción, solo lectura — 2026-07-09)

Columnas verificadas vía OpenAPI de PostgREST (fuente: `SUPABASE_SERVICE_ROLE_KEY`, sin exponer datos de clientes):

```
perfiles_usuario: id(uuid,pk), usuario_id(uuid), nombre, nombre_completo, telefono, email,
  avatar_url, rol_global(text), tipo_cuenta, cargo, tema, color_acento, idioma,
  recibir_notificaciones(bool), created_at, updated_at

negocios: id(uuid,pk), nombre, rubro, slug, descripcion, telefono, email, direccion,
  logo_url, banner_url, color_primario, color_secundario, color_acento, estado,
  motivo_bloqueo, bloqueado_at, bloqueado_por(uuid), intervalo_reserva_minutos,
  created_at, updated_at

negocio_usuarios: id(uuid,pk), negocio_id(fk negocios), usuario_id(uuid), rol,
  rol_negocio_id(fk roles_negocio), activo(bool), created_at, updated_at

suscripciones: id(uuid,pk), negocio_id(fk negocios), plan_id(fk planes_saas), estado,
  fecha_inicio, fecha_vencimiento, activado_por(uuid), notas, created_at, updated_at
  -- SIN ciclo_facturacion (confirmado ausente)

pagos_manuales: id(uuid,pk), negocio_id(fk), suscripcion_id(fk suscripciones),
  plan_id(fk planes_saas), monto_gs(numeric), metodo, estado, fecha_pago,
  periodo_inicio, periodo_fin, comprobante_url, notas_cliente, notas_admin,
  aprobado_por(uuid), aprobado_at, rechazado_por(uuid), rechazado_at,
  created_at, updated_at
  -- SIN ciclo_facturacion (confirmado ausente)

planes_saas: id(uuid,pk), clave, nombre, limite_citas_mensuales, limite_empleados,
  limite_servicios, limite_clientes, limite_sucursales, precio_gs(legacy),
  precio_mensual_gs, precio_anual_gs, ahorro_anual_meses, descripcion_corta,
  texto_destacado, visible_publico(bool), destacado(bool), orden,
  permite_reportes_avanzados, permite_reportes_basicos, permite_personalizacion,
  permite_exportacion_csv, permite_multiples_sucursales, permite_recordatorios_whatsapp,
  permite_soporte_prioritario, permite_funcionalidades_a_medida, features(jsonb),
  created_at, updated_at

auditoria: id(uuid,pk), negocio_id(fk negocios, nullable probable), usuario_id(uuid),
  accion, tabla_afectada, registro_id(uuid), detalles(jsonb), origen, ip, user_agent,
  created_at

notas_admin_negocio: id(uuid,pk), negocio_id(fk), admin_id(uuid), nota, created_at, updated_at

vista_admin_negocios_resumen: negocio_id(pk), nombre, rubro, slug, telefono, email,
  estado, created_at, plan_nombre, plan_clave, precio_gs, suscripcion_estado,
  fecha_inicio, fecha_vencimiento, citas_usadas_mes_actual, limite_citas_mensuales,
  clientes_total, empleados_total, servicios_total, citas_total, citas_mes_actual,
  ultimo_pago_estado, ultimo_pago_fecha, dias_para_vencer
  -- YA calcula casi todo lo necesario para el módulo de Negocios/KPIs.
  -- OJO: expone precio_gs (legacy), no precio_mensual_gs/precio_anual_gs — verificar
  -- si conviene ampliar la vista o calcular aparte para MRR/ARR reales.

solicitudes_cambio_plan: id(pk), negocio_id(fk), plan_actual_id(fk), plan_solicitado_id(fk),
  estado, mensaje, telefono_contacto, respondido_por(uuid), respondido_at,
  notas_admin, created_at, updated_at

recordatorios_citas: id(pk), negocio_id(fk), cita_id(fk), cliente_id(fk), canal, estado,
  fecha_programada, enviado_at, mensaje, created_at

uso_plan_mensual: id(pk), negocio_id(fk), anio, mes, citas_creadas, created_at, updated_at
```

Otras tablas confirmadas por existir pero no auditadas en detalle (no bloqueante para Fase 1): `bloqueos_horario`, `citas`, `cliente_portal_tokens`, `cliente_sucursales`, `cliente_usuarios`, `clientes`, `configuracion_negocio`, `empleado_servicios`, `empleados`, `historial_citas`, `horarios_empleado`, `horarios_negocio`, `invitaciones_cliente`, `permisos`, `rol_permisos`, `roles_negocio`, `servicios`, `sucursal_invitaciones`, `sucursal_usuarios`, `sucursales`, `usuario_permisos_extra`.

### 9. Variables de entorno requeridas

Existentes hoy (`.env.local`, no hay `.env.example` — se creará en Fase 2):
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CONTACT_WHATSAPP`

A agregar en Fase 2 (server-only, nunca `NEXT_PUBLIC_`):
- `ADMIN_OWNER_USER_ID` — UUID de `auth.users` del propietario. Sin esta variable el panel debe fallar cerrado. **Nunca subir el valor real a git** — solo se documenta la clave en `.env.example`.
- `ADMIN_REQUIRE_AAL2` (opcional, `true|false`, default `false` documentado) — el proyecto no tiene MFA hoy; no se inventa el flujo, solo se deja la bandera preparada y documentada.

### 10. Decisiones técnicas tomadas

1. Reutilizar `createServiceRoleClient()` (`src/lib/supabase/service-role.ts`) como cliente privilegiado del panel admin, en vez de `createAdminClient()` (duplicado, menor adopción) — evita triplicar el mismo cliente. Se le añadirá el import `"server-only"` en Fase 2 (hoy ninguno de los dos lo tiene) como refuerzo, ya que el prompt maestro exige "mantener módulos privilegiados con server-only".
2. `requirePlatformOwner()` se modelará como un módulo nuevo `src/lib/admin/guard.ts` que imita la forma de `access-context.ts`/`api-access.ts` (result object `{ok:true,...}|{ok:false,reason}`), no como una copia de la lógica de negocio (son conceptos distintos: propietario de la plataforma vs. rol dentro de un negocio).
3. Estructura de carpetas: dado que `src/lib/dashboard/` y `src/lib/planes/` son **planas** (sin subcarpetas `queries/actions/`), se seguirá esa misma convención plana para `src/lib/admin/` en los guards base, pero se permitirán subcarpetas (`queries/`, `actions/`, `schemas/`) solo si el volumen de archivos por módulo lo justifica (el prompt maestro lo sugiere explícitamente y el panel admin es sustancialmente más grande que `dashboard/`).
4. Las migraciones nuevas se escribirán como archivos SQL en `supabase/patches/` (mismo estilo que los 2 existentes, con cabecera indicando si fueron aplicadas), ya que el repo no tiene `supabase/migrations` formal. No se ejecutan contra producción sin autorización explícita adicional en el momento de crearlas.
5. El middleware (`src/proxy.ts`) se ampliará en Fase 2 para incluir `/admin` como ruta que exige sesión autenticada (redirección a `/login`), como defensa en profundidad — sin que esto reemplace nunca a `requirePlatformOwner()` en el layout/acciones, que sigue siendo la única fuente de verdad de autorización.

### 11. Riesgos o problemas conocidos

- **RPC mutantes no verificadas**: no se confirmó que `admin_cambiar_plan_negocio`, `admin_bloquear_negocio`, `admin_desbloquear_negocio`, `admin_aprobar_pago_manual`, `admin_rechazar_pago_manual` validen `es_super_admin()` internamente (solo se confirmó para `admin_obtener_negocios_resumen`). Mitigación planeada: envolver **toda** llamada desde el panel con `requirePlatformOwner()` en el servidor antes de invocar la RPC, sin importar lo que la RPC haga internamente (defensa en profundidad, tal como exige el prompt maestro).
- **Inconsistencia de clave en `perfiles_usuario`**: `src/app/api/onboarding/negocio/route.ts` hace upsert con `onConflict: "id"` y setea `id: user.id`, mientras que el resto del código (`access-context.ts`, `mi-cuenta`) lee/escribe por `usuario_id`. Ambas columnas existen (confirmado en el esquema real). No se toca en Fase 1; se investigará en Fase 2 si genera filas duplicadas antes de asignar `rol_global='super_admin'` a la fila correcta.
- **Middleware no cubre `/admin` hoy** — mitigado por diseño (guard de servidor en cada punto de entrada), pero se reforzará en Fase 2 igualmente.
- **Archivo muerto `src/lib/supabase/proxy.ts`** (`updateSession`, no usado) menciona `/admin` con lógica desactualizada — riesgo de que un futuro desarrollador lo confunda con el middleware real. Se documenta, no se borra en esta fase (fuera de alcance de Fase 1).
- **No hay `.env.example`** en el repo — se creará desde cero en Fase 2, sin asumir qué otras variables debería tener el proyecto más allá de las 5 confirmadas + las 2 nuevas de admin.
- **Nadie tiene `rol_global='super_admin'` todavía** — el panel no podrá ser usado por nadie hasta que el propietario confirme su `auth.users.id` y se ejecute (con autorización explícita) el `UPDATE` correspondiente.
- **Conflicto de gobernanza entre `CLAUDE.md` y el prompt maestro** (ver punto 1) — resuelto para esta sesión por autorización explícita del usuario, pero debe quedar claro para cualquier agente futuro que retome el trabajo.

### 12. Pruebas ejecutadas

- Ninguna prueba automatizada todavía (Fase 1 es solo auditoría). Se hicieron verificaciones manuales puntuales de solo lectura contra producción (documentadas en punto 2/8): `es_super_admin()` con `anon` → `false`; `admin_obtener_negocios_resumen()` con `anon` → `401` (correctamente rechazado); `SELECT` con `anon` sobre `auditoria`, `pagos_manuales`, `notas_admin_negocio`, `perfiles_usuario`, `negocios`, `suscripciones`, `negocio_usuarios` → `200` con `[]` (RLS activo, sin fuga de datos); `SELECT` con `anon` sobre `vista_admin_negocios_resumen` → `401 permission denied` (sin grant).

### 13. Resultado de lint

- No ejecutado en esta fase (no hubo cambios de código).

### 14. Resultado del build

- No ejecutado en esta fase (no hubo cambios de código).

### 15. Próximo paso recomendado

**FASE 2**: crear `src/lib/admin/guard.ts` (`requirePlatformOwner()` / `getPlatformOwnerOrNull()`), añadir `server-only` a los clientes privilegiados, crear `.env.example` con `ADMIN_OWNER_USER_ID` y `ADMIN_REQUIRE_AAL2`, extender `src/proxy.ts` para exigir sesión en `/admin`, y dejar una prueba Playwright mínima (`test:admin`) que confirme que un usuario no autenticado y un usuario normal no pueden entrar a `/admin`. **No se asignará `rol_global='super_admin'` a ningún usuario sin que el propietario indique explícitamente su `auth.users.id` y autorice el `UPDATE`.**

### 16. Comandos exactos para continuar

```bash
cd "e:\Documents\Portafolio-Paginas Web\26-AgendaMe-SaaS\AgendaMe-SaaS"
git status
git diff
cat docs/admin-owner-panel-progress.md   # este archivo, leer antes de continuar
cat AGENDAME_ADMIN_PANEL_PROMPT_MAESTRO.txt
npm run lint
npm run build
```

Para volver a verificar el esquema real de Supabase sin escribir nada (mismo método usado en esta sesión):
```bash
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
fetch(url + '/rest/v1/', { headers: { apikey: key, Authorization: 'Bearer ' + key, Accept: 'application/openapi+json' } })
  .then(r => r.text()).then(t => console.log(t));
"
```
