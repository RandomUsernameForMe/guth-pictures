// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/middleware", () => ({ default: () => () => NextResponse.next() }));
vi.mock("@/lib/auth-edge", () => ({
  COOKIE: "admin_auth",
  verifyToken: async (token: string) => {
    if (token === "boom") throw new Error("bad");
    return token === "valid";
  },
}));

const { default: middleware } = await import("../middleware");

const request = (path: string, token?: string) => {
  const req = new NextRequest(`https://example.com${path}`);
  if (token) req.cookies.set("admin_auth", token);
  return req;
};

describe("middleware — admin protection", () => {
  it("rejects /api/admin without token with 401 JSON", async () => {
    const res = await middleware(request("/api/admin/photos"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("lets /api/admin through with a valid token", async () => {
    const res = await middleware(request("/api/admin/photos", "valid"));
    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets /api/admin/login through without token", async () => {
    const res = await middleware(request("/api/admin/login"));
    expect(res.status).not.toBe(401);
  });

  it("lets /api/admin/lightroom/callback through without token", async () => {
    const res = await middleware(request("/api/admin/lightroom/callback"));
    expect(res.status).not.toBe(401);
  });

  it("redirects /admin without token to login", async () => {
    const res = await middleware(request("/admin"));
    expect(res.headers.get("location")).toBe("https://example.com/admin/login");
  });

  it("redirects /admin/login with a valid token to /admin", async () => {
    const res = await middleware(request("/admin/login", "valid"));
    expect(res.headers.get("location")).toBe("https://example.com/admin");
  });

  it("shows /admin/login to anonymous visitors without redirect loop", async () => {
    const res = await middleware(request("/admin/login"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("treats a throwing verifyToken as unauthorized", async () => {
    const api = await middleware(request("/api/admin/photos", "boom"));
    expect(api.status).toBe(401);
    const page = await middleware(request("/admin", "boom"));
    expect(page.headers.get("location")).toBe("https://example.com/admin/login");
  });
});
