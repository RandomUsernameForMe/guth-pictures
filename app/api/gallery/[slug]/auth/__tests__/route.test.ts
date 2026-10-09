// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/modules/gallery/lib/gallery", () => ({
  getGallery: vi.fn(),
  verifyGalleryPassword: vi.fn(),
  isExpired: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));

import { getGallery, verifyGalleryPassword, isExpired } from "@/modules/gallery/lib/gallery";
import { checkRateLimit } from "@/lib/rate-limit";
import { POST } from "../route";

function call(body: unknown, headers: Record<string, string> = {}) {
  const req = new NextRequest("http://localhost/api/gallery/test/auth", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
  return POST(req, { params: Promise.resolve({ slug: "test" }) });
}

describe("POST /api/gallery/[slug]/auth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getGallery).mockResolvedValue({} as Awaited<ReturnType<typeof getGallery>>);
    vi.mocked(isExpired).mockReturnValue(false);
    vi.mocked(checkRateLimit).mockResolvedValue(true);
  });

  it("returns 429 and skips password check when rate limited", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue(false);
    const res = await call({ password: "x" });
    expect(res.status).toBe(429);
    expect(verifyGalleryPassword).not.toHaveBeenCalled();
    expect(getGallery).not.toHaveBeenCalled();
  });

  it("keys the rate limit by slug and IP", async () => {
    vi.mocked(verifyGalleryPassword).mockResolvedValue(false);
    await call({ password: "x" }, { "x-vercel-forwarded-for": "1.2.3.4" });
    expect(checkRateLimit).toHaveBeenCalledWith("gallery-auth:test:1.2.3.4", 5, 900);
  });

  it("sets session cookie on correct password", async () => {
    vi.mocked(verifyGalleryPassword).mockResolvedValue(true);
    const res = await call({ password: "good" });
    expect(res.status).toBe(200);
    const cookie = res.cookies.get("gallery-session-test");
    expect(cookie?.value).toBeTruthy();
  });

  it("returns 401 without cookie on wrong password", async () => {
    vi.mocked(verifyGalleryPassword).mockResolvedValue(false);
    const res = await call({ password: "bad" });
    expect(res.status).toBe(401);
    expect(res.cookies.get("gallery-session-test")).toBeUndefined();
  });
});
