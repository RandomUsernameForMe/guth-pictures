import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { verifyToken, COOKIE } from "./lib/auth-edge";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/login" && pathname !== "/api/admin/lightroom/callback") {
    const token = request.cookies.get(COOKIE)?.value ?? "";
    let authenticated = false;
    try {
      authenticated = await verifyToken(token);
    } catch {
      authenticated = false;
    }
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const token = request.cookies.get(COOKIE)?.value ?? "";
    let authenticated = false;
    try {
      authenticated = await verifyToken(token);
    } catch {
      authenticated = false;
    }

    if (!authenticated && !isLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (authenticated && isLogin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (/^\/(cs|en)\/nahled(\/|$)/.test(pathname)) {
    const authenticated = await verifyToken(request.cookies.get(COOKIE)?.value ?? "").catch(() => false);
    if (!authenticated) return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(cs|en)/:path*", "/admin/:path*", "/admin", "/api/admin/:path*"],
};
