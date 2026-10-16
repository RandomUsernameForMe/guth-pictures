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
  getGallery: vi.fn(async (): Promise<{ slug: string; createdAt: string; maxSelection?: number }> => ({ slug: "test", createdAt: "2026-01-01T00:00:00.000Z" })),
  getGalleryPhotos: vi.fn(async () => [{ lrId: "a" }, { lrId: "b" }, { lrId: "c" }]),
  isExpired: vi.fn(() => false),
}));
vi.mock("@/modules/gallery/lib/gallery-auth", () => ({
  verifyGalleryToken: vi.fn(async () => true),
  galleryCookieName: (slug: string) => `gallery-session-${slug}`,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "token" }) }),
}));

import { getGallery, type GalleryRecord } from "@/modules/gallery/lib/gallery";
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

describe("/api/gallery/[slug]/selection limit", () => {
  beforeEach(() => store.clear());

  it("rejects a selection over the limit and does not save it", async () => {
    vi.mocked(getGallery).mockResolvedValueOnce({ slug: "test", maxSelection: 2 } as GalleryRecord);
    const res = await post({ favorites: ["a", "b", "c"] });
    expect(res.status).toBe(400);
    expect(await getSelection()).toBeFalsy();
  });

  it("accepts a selection within the limit", async () => {
    vi.mocked(getGallery).mockResolvedValueOnce({ slug: "test", maxSelection: 2 } as GalleryRecord);
    const res = await post({ favorites: ["a", "b"] });
    expect(res.status).toBe(200);
  });

  it("counts duplicate ids once", async () => {
    vi.mocked(getGallery).mockResolvedValueOnce({ slug: "test", maxSelection: 2 } as GalleryRecord);
    const res = await post({ favorites: ["a", "a", "b", "b"] });
    expect(res.status).toBe(200);
    expect((await res.json()).count).toBe(2);
    expect((await getSelection()).favorites).toEqual(["a", "b"]);
  });

  it("has no limit when maxSelection is unset", async () => {
    const res = await post({ favorites: ["a", "b", "c"] });
    expect(res.status).toBe(200);
  });
});
