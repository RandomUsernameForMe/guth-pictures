// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/modules/gallery/lib/gallery", () => ({
  getGallery: vi.fn(),
  getGalleryPhotos: vi.fn(),
  getGallerySelection: vi.fn(),
  saveGallerySelection: vi.fn(),
  isExpired: vi.fn(),
}));
vi.mock("@/modules/gallery/lib/gallery-auth", () => ({
  verifyGalleryToken: vi.fn(),
  galleryCookieName: (slug: string) => `g_${slug}`,
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "tok" }) }),
}));

import {
  getGallery,
  getGalleryPhotos,
  saveGallerySelection,
  isExpired,
} from "@/modules/gallery/lib/gallery";
import { verifyGalleryToken } from "@/modules/gallery/lib/gallery-auth";
import { POST } from "../route";

const photos = ["a", "b", "c"].map((lrId) => ({
  lrId,
  cloudinaryId: lrId,
  filename: `${lrId}.jpg`,
  width: 1,
  height: 1,
}));

function call(favorites: unknown) {
  const req = new NextRequest("http://localhost/api/gallery/test/selection", {
    method: "POST",
    body: JSON.stringify({ favorites }),
  });
  return POST(req, { params: Promise.resolve({ slug: "test" }) });
}

function setGallery(maxSelection?: number) {
  vi.mocked(getGallery).mockResolvedValue({ slug: "test", maxSelection } as Awaited<
    ReturnType<typeof getGallery>
  >);
}

describe("POST /api/gallery/[slug]/selection limit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isExpired).mockReturnValue(false);
    vi.mocked(verifyGalleryToken).mockResolvedValue(true);
    vi.mocked(getGalleryPhotos).mockResolvedValue(photos);
  });

  it("nad limit vrátí 400 a výběr neuloží", async () => {
    setGallery(2);
    const res = await call(["a", "b", "c"]);
    expect(res.status).toBe(400);
    expect(saveGallerySelection).not.toHaveBeenCalled();
  });

  it("do limitu vrátí 200 a uloží", async () => {
    setGallery(2);
    const res = await call(["a", "b"]);
    expect(res.status).toBe(200);
    expect(saveGallerySelection).toHaveBeenCalledWith("test", ["a", "b"]);
  });

  it("bez limitu funguje jako dřív", async () => {
    setGallery(undefined);
    const res = await call(["a", "b", "c"]);
    expect(res.status).toBe(200);
    expect(saveGallerySelection).toHaveBeenCalledWith("test", ["a", "b", "c"]);
  });
});
