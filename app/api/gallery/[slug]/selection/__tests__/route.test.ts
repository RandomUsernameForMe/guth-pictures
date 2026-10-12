// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const store = new Map<string, unknown>();

vi.mock("@/lib/kv", () => ({
  getKv: async () => ({
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: unknown) => {
      store.set(k, v);
    },
  }),
}));
vi.mock("@/modules/gallery/lib/gallery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/gallery/lib/gallery")>()),
  getGallery: vi.fn(async () => ({ slug: "test" })),
  getGalleryPhotos: vi.fn(async () => [{ lrId: "a" }, { lrId: "b" }]),
  isExpired: vi.fn(() => false),
}));
vi.mock("@/modules/gallery/lib/gallery-auth", () => ({
  verifyGalleryToken: vi.fn(async () => true),
  galleryCookieName: (slug: string) => `gallery-session-${slug}`,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "token" }) }),
}));

import { GET, POST } from "../route";

const params = { params: Promise.resolve({ slug: "test" }) };

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/gallery/test/selection", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    params
  );
}

async function getSelection() {
  const res = await GET(new NextRequest("http://localhost/api/gallery/test/selection"), params);
  return (await res.json()).selection;
}

describe("/api/gallery/[slug]/selection note", () => {
  beforeEach(() => store.clear());

  it("saves a trimmed note and returns it from GET", async () => {
    const res = await post({ favorites: ["a"], note: "  Víc retuše  " });
    expect(res.status).toBe(200);
    expect(await getSelection()).toMatchObject({ favorites: ["a"], note: "Víc retuše" });
  });

  it("rejects a note longer than 1000 characters", async () => {
    const res = await post({ favorites: ["a"], note: "x".repeat(1001) });
    expect(res.status).toBe(400);
  });

  it("accepts a note of exactly 1000 characters", async () => {
    const res = await post({ favorites: ["a"], note: "x".repeat(1000) });
    expect(res.status).toBe(200);
  });

  it("rejects a non-string note", async () => {
    const res = await post({ favorites: ["a"], note: 123 });
    expect(res.status).toBe(400);
  });

  it("works without a note", async () => {
    const res = await post({ favorites: ["a", "b"] });
    expect(res.status).toBe(200);
    expect((await getSelection()).note).toBeUndefined();
  });

  it("keeps the existing note when note is omitted and clears it with an empty string", async () => {
    await post({ favorites: ["a"], note: "Ořez" });
    await post({ favorites: ["a", "b"] });
    expect(await getSelection()).toMatchObject({ favorites: ["a", "b"], note: "Ořez" });
    await post({ favorites: ["a", "b"], note: "   " });
    expect((await getSelection()).note).toBeUndefined();
  });
});
