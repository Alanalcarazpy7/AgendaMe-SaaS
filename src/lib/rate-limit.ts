import "server-only";
import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

type RateLimitConfig = {
  supabase: SupabaseClient;
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();
let warnedAboutLocalFallback = false;

type PersistentRateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  retry_after_seconds: number;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("El servicio de proteccion de reservas no esta disponible.");
    this.name = "RateLimitUnavailableError";
  }
}

function prune(now: number) {
  if (store.size < 1000) return;

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  return (
    forwarded?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    cfIp?.trim() ||
    "unknown"
  );
}

function checkMemoryRateLimit({
  key,
  limit,
  windowMs,
}: Omit<RateLimitConfig, "supabase">) {
  const now = Date.now();
  prune(now);

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const entry = {
      count: 1,
      resetAt: now + windowMs,
    };

    store.set(key, entry);

    return {
      ok: true as const,
      remaining: Math.max(limit - 1, 0),
      resetAt: entry.resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= limit) {
    return {
      ok: false as const,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    ok: true as const,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  };
}

function hashKey(key: string) {
  const secret =
    process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new RateLimitUnavailableError();
  }

  return createHmac("sha256", secret)
    .update(`agendame:public-booking:${key}`)
    .digest("hex");
}

export async function checkRateLimit({
  supabase,
  key,
  limit,
  windowMs,
}: RateLimitConfig) {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_key_hash: hashKey(key),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  const row = (Array.isArray(data) ? data[0] : data) as
    | PersistentRateLimitRow
    | null;

  if (!error && row) {
    return {
      ok: row.allowed,
      remaining: Number(row.remaining),
      resetAt: new Date(row.reset_at).getTime(),
      retryAfterSeconds: Number(row.retry_after_seconds),
    };
  }

  if (process.env.NODE_ENV !== "production") {
    if (!warnedAboutLocalFallback) {
      console.warn(
        "consume_api_rate_limit no esta disponible; usando rate limit local solo en desarrollo."
      );
      warnedAboutLocalFallback = true;
    }

    return checkMemoryRateLimit({ key, limit, windowMs });
  }

  console.error("No se pudo consumir el rate limit persistente:", error?.message);
  throw new RateLimitUnavailableError();
}
