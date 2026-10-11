import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn(), signToken: vi.fn() }));
vi.mock("@/lib/cloudinary", () => ({
  cloudinary: { utils: { api_sign_request: vi.fn(() => "sig") } },
}));

import { isAuthenticated } from "@/lib/auth";
import { POST } from "@/app/api/admin/upload-signature/route";

const makeRequest = (body: unknown) =>
  new Request("http://localhost/api/admin/upload-signature", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/admin/upload-signature — kategorie", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    process.env.CLOUDINARY_API_SECRET = "secret";
  });

  it("vrátí 400 pro neplatnou kategorii", async () => {
    const res = await POST(makeRequest({ category: "eventy" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid category");
  });

  it("povolí platnou kategorii", async () => {
    const res = await POST(makeRequest({ category: "svatby" }));
    expect(res.status).toBe(200);
    expect((await res.json()).context).toContain("category=svatby");
  });

  it("bez kategorie použije portréty", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    expect((await res.json()).context).toContain("category=portréty");
  });
});
