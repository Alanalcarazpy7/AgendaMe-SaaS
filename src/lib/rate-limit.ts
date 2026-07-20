import "server-only";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

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

export function checkRateLimit({ key, limit, windowMs }: RateLimitConfig) {
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
