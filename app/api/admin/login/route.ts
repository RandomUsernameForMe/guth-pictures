import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { signToken, authCookieConfig } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // x-vercel-forwarded-for is set by Vercel infrastructure and cannot be spoofed by clients
  const ip =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!(await checkRateLimit(`login:${ip}`, 5, 15 * 60))) {
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

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    console.error("[auth] ADMIN_PASSWORD_HASH not configured");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = await compare(password, passwordHash);

  if (!valid) {
    console.error(`[auth] Failed login attempt from ${ip}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookieConfig(token));
  return response;
}
