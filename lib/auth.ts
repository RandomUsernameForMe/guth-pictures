import { cookies } from "next/headers";

const COOKIE = "admin_auth";

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === "1";
}

export function authCookieOptions() {
  return {
    name: COOKIE,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hodin
  };
}
