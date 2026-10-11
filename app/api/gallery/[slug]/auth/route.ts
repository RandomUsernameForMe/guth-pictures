import { getGallery, verifyGalleryPassword, isExpired } from "@/modules/gallery/lib/gallery";
import { signGalleryToken, galleryCookieName } from "@/modules/gallery/lib/gallery-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  // x-vercel-forwarded-for is set by Vercel infrastructure and cannot be spoofed by clients
  const ip =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!(await checkRateLimit(`gallery-auth:${slug}:${ip}`, 5, 15 * 60))) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isExpired(gallery)) {
    return NextResponse.json({ error: "Gallery expired" }, { status: 410 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof body.password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const valid = await verifyGalleryPassword(slug, body.password);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await signGalleryToken(slug);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: galleryCookieName(slug),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
