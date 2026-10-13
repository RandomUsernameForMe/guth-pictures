// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn(async () => false) }));
vi.mock("@/modules/gallery/lib/gallery", () => ({
  getGallery: vi.fn(),
  getGalleryPhotos: vi.fn(),
  getGallerySelection: vi.fn(),
  deleteGallery: vi.fn(),
  setGalleryDelivered: vi.fn(),
}));

import { PATCH } from "../route";

describe("PATCH /api/admin/gallery/[slug]", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await PATCH(
      new NextRequest("http://localhost/api/admin/gallery/test", {
        method: "PATCH",
        body: JSON.stringify({ delivered: true }),
      }),
      { params: Promise.resolve({ slug: "test" }) }
    );
    expect(res.status).toBe(401);
  });
});
