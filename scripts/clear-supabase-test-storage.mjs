import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const execute = process.argv.includes("--execute");
const confirmation = process.argv.find((argument) =>
  argument.startsWith("--confirm=")
);
const confirmationValue = confirmation?.slice("--confirm=".length);

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
const ownerIds = (
  env.ADMIN_OWNER_USER_IDS ??
  process.env.ADMIN_OWNER_USER_IDS ??
  env.ADMIN_OWNER_USER_ID ??
  process.env.ADMIN_OWNER_USER_ID ??
  ""
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!supabaseUrl || !serviceRoleKey || ownerIds.length === 0) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o ADMIN_OWNER_USER_ID."
  );
}

if (execute && confirmationValue !== "DELETE_TEST_STORAGE") {
  throw new Error(
    "Para borrar agrega --confirm=DELETE_TEST_STORAGE. Sin esa confirmacion solo se audita."
  );
}

const resetBuckets = new Set([
  "logos-negocios",
  "archivos-negocio",
  "service-images",
  "business-branding",
  "avatars",
  "payment-proofs",
]);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function listFiles(bucketId, prefix = "") {
  const files = [];
  let offset = 0;

  while (true) {
    const result = await supabase.storage.from(bucketId).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (result.error) {
      throw new Error(`${bucketId}/${prefix}: ${result.error.message}`);
    }

    const entries = result.data ?? [];
    for (const entry of entries) {
      const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) {
        files.push(entryPath);
      } else {
        files.push(...(await listFiles(bucketId, entryPath)));
      }
    }

    if (entries.length < 100) break;
    offset += entries.length;
  }

  return files;
}

function isProtectedOwnerAvatar(bucketId, filePath) {
  if (bucketId !== "avatars") return false;
  return ownerIds.some((ownerId) => filePath.startsWith(`${ownerId}/`));
}

const bucketsResult = await supabase.storage.listBuckets();
if (bucketsResult.error) throw new Error(bucketsResult.error.message);

const summary = [];
for (const bucket of bucketsResult.data ?? []) {
  if (!resetBuckets.has(bucket.id)) continue;

  const files = await listFiles(bucket.id);
  const removable = files.filter(
    (filePath) => !isProtectedOwnerAvatar(bucket.id, filePath)
  );

  summary.push({
    bucketId: bucket.id,
    total: files.length,
    protected: files.length - removable.length,
    removable: removable.length,
  });

  if (!execute || removable.length === 0) continue;

  for (let index = 0; index < removable.length; index += 100) {
    const chunk = removable.slice(index, index + 100);
    const result = await supabase.storage.from(bucket.id).remove(chunk);
    if (result.error) {
      throw new Error(`${bucket.id}: ${result.error.message}`);
    }
  }
}

console.table(summary);
console.log(
  execute
    ? "Limpieza fisica de Storage completada."
    : "Solo auditoria. No se elimino ningun archivo."
);
