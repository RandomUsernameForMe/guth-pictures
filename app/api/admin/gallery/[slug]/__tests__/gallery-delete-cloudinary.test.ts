// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn(async () => true) }));
vi.mock("@/modules/gallery/lib/gallery", () => ({
  getGallery: vi.fn(),
  getGalleryPhotos: vi.fn(),
  getGallerySelection: vi.fn(),
  deleteGallery: vi.fn(),
  setGalleryDelivered: vi.fn(),
}));
vi.mock("@/lib/cloudinary", () => ({
  cloudinary: { api: { delete_resources_by_prefix: vi.fn() } },
}));

import { DELETE } from "../route";
import { getGallery, deleteGallery } from "@/modules/gallery/lib/gallery";
import { cloudinary } from "@/lib/cloudinary";

const del = vi.mocked(cloudinary.api.delete_resources_by_prefix);

function call() {
  return DELETE(
    new NextRequest("http://localhost/api/admin/gallery/test", { method: "DELETE" }),
    { params: Promise.resolve({ slug: "test" }) }
  );
}

describe("DELETE /api/admin/gallery/[slug] – Cloudinary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGallery).mockResolvedValue({ slug: "test" } as never);
  });

  it("maže prefix v Cloudinary a pak KV, opakuje při partial", async () => {
    del.mockResolvedValueOnce({ partial: true } as never).mockResolvedValueOnce({} as never);
    const res = await call();
    expect(res.status).toBe(200);
    expect(del).toHaveBeenCalledTimes(2);
    expect(del).toHaveBeenCalledWith("client-galleries/test/");
    expect(deleteGallery).toHaveBeenCalledWith("test");
  });

  it("při chybě Cloudinary vrátí 502 a nemaže KV", async () => {
    del.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await call();
    expect(res.status).toBe(502);
    expect(deleteGallery).not.toHaveBeenCalled();
  });

  it("neexistující galerie vrátí 404 bez volání Cloudinary", async () => {
    vi.mocked(getGallery).mockResolvedValue(null as never);
    const res = await call();
    expect(res.status).toBe(404);
    expect(del).not.toHaveBeenCalled();
  });
});
