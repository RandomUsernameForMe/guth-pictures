// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthenticated: async () => true }));
vi.mock("@/modules/gallery/lib/gallery", () => ({
  getGallery: vi.fn(async (slug: string) => ({ slug, catalogId: "cat", albumId: "al" })),
  getGalleryPhotos: vi.fn(async () => [
    { lrId: "A", cloudinaryId: "old/A", filename: "a.jpg", width: 1, height: 1 },
    { lrId: "B", cloudinaryId: "old/B", filename: "b.jpg", width: 1, height: 1 },
  ]),
  setGalleryPhotos: vi.fn(),
  updateGallerySyncState: vi.fn(),
  pruneGallerySelection: vi.fn(),
}));
vi.mock("@/modules/gallery/lib/lightroom", () => ({
  getAlbumAssets: vi.fn(async () => [
    { id: "A", filename: "a.jpg" },
    { id: "B", filename: "b.jpg" },
  ]),
  getAssetRenditionStream: vi.fn(
    async () =>
      new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(new Uint8Array([1]));
          c.close();
        },
      })
  ),
}));
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: (
        opts: { public_id: string },
        cb: (err: Error | null, res?: { public_id: string; width: number; height: number }) => void
      ) => ({
        write() {},
        end() {
          if (opts.public_id.endsWith("/B")) cb(new Error("upload failed"));
          else cb(null, { public_id: opts.public_id, width: 2048, height: 1365 });
        },
      }),
    },
  },
}));

import { POST } from "../route";
import { setGalleryPhotos, updateGallerySyncState } from "@/modules/gallery/lib/gallery";

describe("POST /api/admin/gallery/[slug]/sync", () => {
  it("při selhání uploadu ponechá původní záznam fotky", async () => {
    const res = await POST(new NextRequest("http://x"), { params: Promise.resolve({ slug: "g" }) });
    const body = await res.json();

    expect(setGalleryPhotos).toHaveBeenCalledWith("g", [
      { lrId: "A", cloudinaryId: "client-galleries/g/A", filename: "a.jpg", width: 2048, height: 1365 },
      { lrId: "B", cloudinaryId: "old/B", filename: "b.jpg", width: 1, height: 1 },
    ]);
    expect(updateGallerySyncState).toHaveBeenCalledWith("g", 2);
    expect(body.failed).toBe(1);
    expect(body.synced).toBe(1);
  });
});
