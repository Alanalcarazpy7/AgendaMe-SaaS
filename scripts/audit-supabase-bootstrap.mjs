import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function loadEnv() {
  const env = {};

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(root, fileName);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(
        /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/
      );
      if (!match || env[match[1]]) continue;
      env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }

  return env;
}

const env = loadEnv();
const supabaseUrl =
  env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerId =
  env.ADMIN_OWNER_USER_ID ?? process.env.ADMIN_OWNER_USER_ID ?? null;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
  );
}

const requiredTables = [
  "api_rate_limits",
  "auditoria",
  "bloqueos_horario",
  "citas",
  "cliente_portal_tokens",
  "cliente_sucursales",
  "cliente_usuarios",
  "clientes",
  "configuracion_negocio",
  "empleado_servicios",
  "empleados",
  "historial_citas",
  "horarios_empleado",
  "horarios_negocio",
  "invitaciones_cliente",
  "negocio_usuarios",
  "negocios",
  "notas_admin_negocio",
  "pagos_manuales",
  "perfiles_usuario",
  "permisos",
  "planes_saas",
  "recordatorios_citas",
  "rol_permisos",
  "roles_negocio",
  "servicios",
  "solicitudes_cambio_plan",
  "sucursal_invitaciones",
  "sucursal_usuarios",
  "sucursales",
  "suscripciones",
  "uso_plan_mensual",
  "usuario_permisos_extra",
];

const requiredRpcs = [
  "admin_agregar_nota_negocio",
  "admin_aprobar_pago_manual",
  "admin_bloquear_negocio",
  "admin_cambiar_plan_negocio",
  "admin_desbloquear_negocio",
  "admin_editar_plan",
  "admin_obtener_negocios_resumen",
  "admin_rechazar_pago_manual",
  "admin_registrar_pago_manual",
  "admin_revocar_invitacion",
  "cancelar_solicitud_cambio_plan",
  "cita_cuenta_para_limite",
  "cliente_tiene_acceso",
  "consume_api_rate_limit",
  "empleado_horario_permite",
  "es_admin_negocio",
  "es_empleado_negocio",
  "es_miembro_negocio",
  "es_super_admin",
  "marcar_suscripciones_vencidas",
  "negocio_horario_permite",
  "negocio_puede_operar",
  "negocio_tiene_plan_activo",
  "obtener_o_crear_sucursal_principal",
  "puede_crear_cita",
  "puede_crear_cliente",
  "puede_crear_empleado",
  "puede_crear_servicio",
  "recalcular_uso_plan_mensual_citas",
  "resolver_acceso_dashboard",
  "storage_negocio_id",
  "tiene_permiso",
];

const expectedPlanKeys = ["gratis", "basico", "profesional", "empresarial"];
const expectedPermissionKeys = [
  "citas.crear",
  "citas.editar",
  "citas.ver_todas",
  "clientes.crear",
  "clientes.editar",
  "empleados.administrar",
  "servicios.administrar",
  "reportes.ver",
  "configuracion.editar",
  "plan.administrar",
];

const expectedBuckets = new Map([
  [
    "logos-negocios",
    { public: true, fileSizeLimit: null, mimeTypes: null },
  ],
  [
    "archivos-negocio",
    { public: false, fileSizeLimit: null, mimeTypes: null },
  ],
  [
    "service-images",
    {
      public: true,
      fileSizeLimit: 2097152,
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  ],
  [
    "business-branding",
    {
      public: true,
      fileSizeLimit: 3145728,
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
  ],
  [
    "avatars",
    {
      public: true,
      fileSizeLimit: 5242880,
      mimeTypes: ["image/gif", "image/jpeg", "image/png", "image/webp"],
    },
  ],
  [
    "payment-proofs",
    {
      public: false,
      fileSizeLimit: 5242880,
      mimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ],
    },
  ],
]);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};
const openApiResponse = await fetch(`${supabaseUrl}/rest/v1/`, { headers });

if (!openApiResponse.ok) {
  throw new Error(`No se pudo leer OpenAPI: HTTP ${openApiResponse.status}.`);
}

const openApi = await openApiResponse.json();
const definitions = Object.keys(openApi.definitions ?? {});
const rpcNames = Object.keys(openApi.paths ?? {})
  .filter((route) => route.startsWith("/rpc/"))
  .map((route) => route.slice(5));

const failures = [];
const warnings = [];

for (const table of requiredTables) {
  if (!definitions.includes(table)) failures.push(`Falta la tabla ${table}.`);
}

for (const rpc of requiredRpcs) {
  if (!rpcNames.includes(rpc)) failures.push(`Falta la RPC ${rpc}.`);
}

async function selectKeys(table, column) {
  const result = await supabase.from(table).select(column);
  if (result.error) throw new Error(`${table}: ${result.error.message}`);
  return (result.data ?? []).map((row) => row[column]).sort();
}

const planKeys = await selectKeys("planes_saas", "clave");
const permissionKeys = await selectKeys("permisos", "clave");

for (const key of expectedPlanKeys) {
  if (!planKeys.includes(key)) failures.push(`Falta el plan ${key}.`);
}

for (const key of expectedPermissionKeys) {
  if (!permissionKeys.includes(key)) failures.push(`Falta el permiso ${key}.`);
}

const profilesResult = await supabase
  .from("perfiles_usuario")
  .select("id, usuario_id, rol_global");
if (profilesResult.error) throw new Error(profilesResult.error.message);

const profiles = profilesResult.data ?? [];
const superAdminCount = profiles.filter(
  (profile) => profile.rol_global === "super_admin"
).length;

let authPage = 1;
const authUsers = [];
while (true) {
  const result = await supabase.auth.admin.listUsers({
    page: authPage,
    perPage: 1000,
  });
  if (result.error) throw new Error(result.error.message);
  authUsers.push(...result.data.users);
  if (result.data.users.length < 1000) break;
  authPage += 1;
}

if (!ownerId) {
  failures.push("Falta ADMIN_OWNER_USER_ID.");
} else {
  if (!authUsers.some((user) => user.id === ownerId)) {
    failures.push("ADMIN_OWNER_USER_ID no existe en Auth.");
  }

  const ownerProfile = profiles.find(
    (profile) => profile.id === ownerId || profile.usuario_id === ownerId
  );
  if (!ownerProfile) {
    failures.push("El owner no tiene perfiles_usuario.");
  } else if (ownerProfile.rol_global !== "super_admin") {
    failures.push("El owner no tiene rol_global=super_admin.");
  }
}

const bucketsResult = await supabase.storage.listBuckets();
if (bucketsResult.error) throw new Error(bucketsResult.error.message);

const buckets = bucketsResult.data ?? [];
for (const [bucketId, expected] of expectedBuckets) {
  const bucket = buckets.find((item) => item.id === bucketId);
  if (!bucket) {
    failures.push(`Falta el bucket ${bucketId}.`);
    continue;
  }

  if (bucket.public !== expected.public) {
    failures.push(`${bucketId} debe ser ${expected.public ? "publico" : "privado"}.`);
  }

  if ((bucket.file_size_limit ?? null) !== expected.fileSizeLimit) {
    failures.push(`${bucketId} tiene un limite de archivo inesperado.`);
  }

  const actualMimeTypes = bucket.allowed_mime_types
    ? [...bucket.allowed_mime_types].sort()
    : null;
  if (JSON.stringify(actualMimeTypes) !== JSON.stringify(expected.mimeTypes)) {
    failures.push(`${bucketId} tiene tipos MIME inesperados.`);
  }
}

const countTables = [
  "negocios",
  "citas",
  "clientes",
  "empleados",
  "servicios",
  "sucursales",
  "suscripciones",
  "auditoria",
  "api_rate_limits",
  "roles_negocio",
  "rol_permisos",
];
const counts = {};

for (const table of countTables) {
  const result = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (result.error) {
    failures.push(`No se pudo contar ${table}: ${result.error.message}`);
  } else {
    counts[table] = result.count ?? 0;
  }
}

if ((counts.roles_negocio ?? 0) === 0) {
  warnings.push(
    "roles_negocio y rol_permisos estan vacios; es correcto para el modelo actual."
  );
}

const e2eUsers = authUsers.filter((user) =>
  /^e2e\..+@agendame\.test$/i.test(user.email ?? "")
).length;

console.log("Auditoria de bootstrap de Supabase");
console.log(`Proyecto: ${new URL(supabaseUrl).hostname.split(".")[0]}`);
console.log(`Tablas requeridas: ${requiredTables.length}`);
console.log(`RPC requeridas: ${requiredRpcs.length}`);
console.log(`Planes: ${planKeys.join(", ")}`);
console.log(`Permisos: ${permissionKeys.length}`);
console.log(`Usuarios Auth: ${authUsers.length} (${e2eUsers} E2E)`);
console.log(`Perfiles super_admin: ${superAdminCount}`);
console.log(`Buckets: ${buckets.map((bucket) => bucket.id).sort().join(", ")}`);
console.log("Datos operativos:");
for (const [table, count] of Object.entries(counts)) {
  console.log(`  ${table}: ${count}`);
}

for (const warning of warnings) console.warn(`AVISO: ${warning}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Resultado: bootstrap consistente.");
}
