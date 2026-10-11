import "server-only";

// Fixed-window rate limit. KV-backed on Vercel; in-memory fallback for local dev.
// Production without working KV fails closed (better to block than bypass).
// Parameterized for reuse across routes.

const memAttempts = new Map<string, { count: number; resetAt: number }>();

function checkMemory(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  const entry = memAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    memAttempts.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export async function checkRateLimit(
  key: string,
  max = 5,
  windowSec = 15 * 60
): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    if (process.env.NODE_ENV === "production") return false;
    return checkMemory(key, max, windowSec);
  }
  try {
    const { kv } = await import("@vercel/kv");
    const kvKey = `ratelimit:${key}`;
    const count = await kv.incr(kvKey);
    if (count === 1) await kv.expire(kvKey, windowSec);
    return count <= max;
  } catch {
    if (process.env.NODE_ENV === "production") return false;
    return checkMemory(key, max, windowSec);
  }
}
