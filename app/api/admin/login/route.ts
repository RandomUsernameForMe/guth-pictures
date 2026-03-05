import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { signToken, authCookieConfig } from "@/lib/auth";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SEC = 15 * 60;

async function checkRateLimit(ip: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return true;
  try {
    const { kv } = await import("@vercel/kv");
    const key = `ratelimit:login:${ip}`;
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, RATE_LIMIT_WINDOW_SEC);
    return count <= RATE_LIMIT_MAX;
  } catch {
    return true; // KV selhání → neblokovat
  }
}

function passwordsMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!password || !passwordsMatch(String(password), adminPassword)) {
    console.error(`[auth] Failed login attempt from ${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookieConfig(token));
  return response;
}
