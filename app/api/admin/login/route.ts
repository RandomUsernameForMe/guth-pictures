import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken, authCookieConfig } from "@/lib/auth";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 15 * 60;

// In-memory fallback for when KV is unavailable (local dev without KV)
const memAttempts = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = memAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    memAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_SEC * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return checkMemoryRateLimit(ip);
  }
  try {
    const { kv } = await import("@vercel/kv");
    const key = `ratelimit:login:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, RATE_LIMIT_WINDOW_SEC);
    return count <= RATE_LIMIT_MAX;
  } catch {
    return checkMemoryRateLimit(ip); // KV failure → in-memory fallback
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = body;
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Support both bcrypt hash (ADMIN_PASSWORD_HASH) and plaintext fallback (ADMIN_PASSWORD)
  // Set ADMIN_PASSWORD_HASH for production — generate with:
  //   node -e "const b=require('bcryptjs');b.hash(process.env.ADMIN_PASSWORD,12).then(console.log)"
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const passwordPlain = process.env.ADMIN_PASSWORD ?? "";

  const valid = passwordHash
    ? await compare(password, passwordHash)
    : password === passwordPlain;

  if (!valid) {
    console.error(`[auth] Failed login attempt from ${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookieConfig(token));
  return response;
}
