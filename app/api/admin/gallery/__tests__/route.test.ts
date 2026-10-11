// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const store = new Map<string, unknown>();
const auth = { ok: true };

vi.mock("@/lib/kv", () => ({
  getKv: async () => ({
    smembers: async (k: string) => (store.get(k) as string[]) ?? [],
    get: async (k: string) => store.get(k) ?? null,
  }),
}));
vi.mock("@/lib/auth", () => ({ isAuthenticated: async () => auth.ok }));
vi.mock("@/modules/gallery/lib/lightroom", () => ({
  getTokens: vi.fn(),
  getCatalogId: vi.fn(),
}));

import { GET } from "../route";

const record = (slug: string) => ({
  slug,
  albumId: "al",
  catalogId: "cat",
  passwordHash: "h",
  expiryDays: 30,
  expiresAt: "2030-01-01T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  photoCount: 3,
});

describe("GET /api/admin/gallery", () => {
  beforeEach(() => {
    auth.ok = true;
    store.clear();
    store.set("galleries:index", ["a", "b"]);
    store.set("gallery:a", record("a"));
    store.set("gallery:b", record("b"));
    store.set("gallery:a:selection", {
      favorites: ["x", "y"],
      lastUpdated: "2026-10-01T10:00:00.000Z",
    });
  });

  it("vrací souhrn výběru, nebo null bez výběru", async () => {
    const res = await GET();
    const { galleries } = await res.json();
    const bySlug = Object.fromEntries(galleries.map((g: { slug: string }) => [g.slug, g]));
    expect(bySlug.a.selection).toEqual({ count: 2, lastUpdated: "2026-10-01T10:00:00.000Z" });
    expect(bySlug.b.selection).toBeNull();
  });

  it("bez přihlášení vrací 401", async () => {
    auth.ok = false;
    expect((await GET()).status).toBe(401);
  });
});
