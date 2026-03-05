import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    const authenticated = request.cookies.get("admin_auth")?.value === "1";

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
