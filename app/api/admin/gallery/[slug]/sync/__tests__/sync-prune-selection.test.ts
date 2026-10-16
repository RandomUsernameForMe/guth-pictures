// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthenticated: async () => true }));
vi.mock("@/modules/gallery/lib/gallery", () => ({
  getGallery: vi.fn(async (slug: string) => ({ slug, catalogId: "cat", albumId: "al" })),
  getGalleryPhotos: vi.fn(async () => []),
  setGalleryPhotos: vi.fn(),
  updateGallerySyncState: vi.fn(),
  pruneGallerySelection: vi.fn(),
}));
vi.mock("@/modules/gallery/lib/lightroom", () => ({
  getAlbumAssets: vi.fn(async () => [{ id: "A", filename: "a.jpg" }]),
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
          cb(null, { public_id: opts.public_id, width: 2048, height: 1365 });
        },
      }),
    },
  },
}));

import { POST } from "../route";
import { pruneGallerySelection } from "@/modules/gallery/lib/gallery";

describe("POST /api/admin/gallery/[slug]/sync – výběr klienta", () => {
  it("po syncu odebere z výběru fotky, které v albu už nejsou", async () => {
    await POST(new NextRequest("http://x"), { params: Promise.resolve({ slug: "g" }) });

    expect(pruneGallerySelection).toHaveBeenCalledWith("g", new Set(["A"]));
  });
});
