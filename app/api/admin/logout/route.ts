import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: "admin_auth", value: "", maxAge: 0, path: "/" });
  return response;
}
