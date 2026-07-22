import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function headers(apiKey) {
  return {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Faltan las variables de Supabase en .env.local.");
}

const keyHash = crypto
  .createHash("sha256")
  .update(`verify-rate-limit:${crypto.randomUUID()}`)
  .digest("hex");
const rpcUrl = `${supabaseUrl}/rest/v1/rpc/consume_api_rate_limit`;
const tableUrl = `${supabaseUrl}/rest/v1/api_rate_limits`;

async function consume() {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: headers(serviceRoleKey),
    body: JSON.stringify({
      p_key_hash: keyHash,
      p_limit: 2,
      p_window_seconds: 60,
    }),
  });

  if (!response.ok) {
    throw new Error(`La RPC con service_role respondio HTTP ${response.status}.`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload[0] : payload;
}

try {
  const attempts = [await consume(), await consume(), await consume()];
  const allowed = attempts.map((attempt) => attempt?.allowed);

  if (allowed.join(",") !== "true,true,false") {
    throw new Error(`Secuencia inesperada del rate limit: ${allowed.join(",")}.`);
  }

  const anonRpc = await fetch(rpcUrl, {
    method: "POST",
    headers: headers(anonKey),
    body: JSON.stringify({
      p_key_hash: keyHash,
      p_limit: 2,
      p_window_seconds: 60,
    }),
  });

  if (anonRpc.ok) {
    throw new Error("La RPC permite ejecucion con anon y debe estar revocada.");
  }

  const anonTable = await fetch(`${tableUrl}?select=key_hash&limit=1`, {
    headers: headers(anonKey),
  });

  if (anonTable.ok) {
    throw new Error("La tabla api_rate_limits permite lectura con anon.");
  }

  console.log("RPC service_role: OK (permitido, permitido, bloqueado)");
  console.log(`RPC anon: protegida (HTTP ${anonRpc.status})`);
  console.log(`Tabla anon: protegida (HTTP ${anonTable.status})`);
} finally {
  const cleanup = await fetch(`${tableUrl}?key_hash=eq.${keyHash}`, {
    method: "DELETE",
    headers: {
      ...headers(serviceRoleKey),
      Prefer: "return=minimal",
    },
  });

  if (!cleanup.ok) {
    console.warn(`No se pudo limpiar la clave de verificacion (HTTP ${cleanup.status}).`);
  }
}
