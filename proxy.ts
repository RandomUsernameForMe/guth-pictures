import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { verifyToken, COOKIE } from "./lib/auth-edge";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const token = request.cookies.get(COOKIE)?.value ?? "";
    const authenticated = await verifyToken(token);

    if (!authenticated && !isLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (authenticated && isLogin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(cs|en)/:path*", "/admin/:path*", "/admin"],
};
