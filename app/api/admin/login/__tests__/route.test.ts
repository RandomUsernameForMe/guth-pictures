// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/rate-limit", async (orig) => {
  const actual = await orig<typeof import("@/lib/rate-limit")>();
  return { checkRateLimit: vi.fn(actual.checkRateLimit) };
});
vi.mock("@/lib/auth", () => ({ signToken: vi.fn(), authCookieConfig: vi.fn() }));

import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "../route";

function call(body: unknown, ip: string) {
  return POST(
    new Request("http://localhost/api/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "x-vercel-forwarded-for": ip },
    })
  );
}

describe("POST /api/admin/login", () => {
  it("returns 401 on missing password and keys the rate limit by IP", async () => {
    const res = await call({}, "10.0.0.1");
    expect(res.status).toBe(401);
    expect(checkRateLimit).toHaveBeenCalledWith("login:10.0.0.1", 5, 900);
  });

  it("returns 429 on the 6th attempt from the same IP", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await call({}, "10.0.0.2")).status).toBe(401);
    }
    expect((await call({}, "10.0.0.2")).status).toBe(429);
  });
});
