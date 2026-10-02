// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/middleware", () => ({ default: () => () => NextResponse.next() }));
vi.mock("@/lib/auth-edge", () => ({ COOKIE: "admin_auth", verifyToken: async (token: string) => token === "valid" }));

const { default: middleware } = await import("../middleware");

const request = (path: string, token?: string) => {
  const req = new NextRequest(`https://example.com${path}`);
  if (token) req.cookies.set("admin_auth", token);
  return req;
};

describe("middleware — admin preview", () => {
  it("redirects anonymous visitors of the preview to login", async () => {
    const res = await middleware(request("/cs/nahled/home"));
    expect(res.headers.get("location")).toBe("https://example.com/admin/login");
  });

  it("lets an admin through", async () => {
    const res = await middleware(request("/en/nahled/eventy", "valid"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("leaves public pages alone", async () => {
    const res = await middleware(request("/cs/sluzby"));
    expect(res.headers.get("location")).toBeNull();
  });
});
