// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const destroy = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/cloudinary", () => ({ cloudinary: { uploader: { destroy: (...a: unknown[]) => destroy(...a) } } }));
vi.mock("@/lib/auth", () => ({ isAuthenticated: async () => true }));
vi.mock("next/cache", () => ({ revalidatePath: (...a: unknown[]) => revalidatePath(...a) }));
vi.mock("@/modules/admin/lib/content", async () => {
  const actual = await vi.importActual<typeof import("@/modules/admin/lib/content")>(
    "@/modules/admin/lib/content"
  );
  return {
    ...actual,
    getImages: async () => {
      const images = actual.normalizeImages({ profile: "profile-id" });
      images.editorial.home.hero.publicId = "used-hero";
      return images;
    },
  };
});

import { DELETE } from "../route";

const req = (body: string) =>
  new Request("http://localhost/api/admin/delete", { method: "DELETE", body });

describe("DELETE /api/admin/delete", () => {
  beforeEach(() => {
    destroy.mockReset();
    revalidatePath.mockReset();
  });

  it("vrátí 409 a nemaže fotku použitou v editorial.home.hero", async () => {
    const res = await DELETE(req(JSON.stringify({ publicId: "used-hero" })));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("editorial.home.hero");
    expect(destroy).not.toHaveBeenCalled();
  });

  it("smaže nepoužitou fotku a revaliduje layout", async () => {
    const res = await DELETE(req(JSON.stringify({ publicId: "free-photo" })));
    expect(res.status).toBe(200);
    expect(destroy).toHaveBeenCalledWith("free-photo");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("vrátí 400 při nevalidním JSON", async () => {
    const res = await DELETE(req("{nope"));
    expect(res.status).toBe(400);
    expect(destroy).not.toHaveBeenCalled();
  });
});
