// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/kv", () => ({ getKv: async () => null }));
vi.mock("@/modules/gallery/lib/gallery", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/gallery/lib/gallery")>()),
  getGallery: vi.fn(),
  getGalleryPhotos: vi.fn(async () => []),
  isExpired: vi.fn(() => false),
}));
vi.mock("@/modules/gallery/lib/gallery-session", () => ({
  hasGallerySession: vi.fn(async () => true),
}));

import { getGallery, type GalleryRecord } from "@/modules/gallery/lib/gallery";
import { GET } from "../route";

const params = { params: Promise.resolve({ slug: "test" }) };

async function load(gallery: Partial<GalleryRecord>) {
  vi.mocked(getGallery).mockResolvedValueOnce({ slug: "test", ...gallery } as GalleryRecord);
  const res = await GET(new NextRequest("http://localhost/api/gallery/test/photos"), params);
  return res.json();
}

describe("/api/gallery/[slug]/photos delivered", () => {
  it("returns delivered: true for a delivered gallery", async () => {
    expect((await load({ delivered: true })).delivered).toBe(true);
  });

  it("returns delivered: false when the flag is missing", async () => {
    expect((await load({})).delivered).toBe(false);
  });
});
