// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const store = new Map<string, unknown>();
let session = true;

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
  getGallery: vi.fn(async () => ({ slug: "test", createdAt: "2026-01-01T00:00:00.000Z" })),
  getGalleryPhotos: vi.fn(async () => [{ lrId: "a" }, { lrId: "b" }]),
  isExpired: vi.fn(() => false),
}));
vi.mock("@/modules/gallery/lib/gallery-auth", () => ({
  verifyGalleryToken: vi.fn(async () => session),
  galleryCookieName: (slug: string) => `gallery-session-${slug}`,
}));
vi.mock("@/lib/auth", () => ({ isAuthenticated: async () => true }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "token" }) }),
}));

import { POST as confirm } from "../route";
import { POST as saveSelection, GET as getSelection } from "../../route";
import { POST as unlock } from "@/app/api/admin/gallery/[slug]/unlock/route";

const params = { params: Promise.resolve({ slug: "test" }) };

function save(favorites: string[]) {
  return saveSelection(
    new NextRequest("http://localhost/api/gallery/test/selection", {
      method: "POST",
      body: JSON.stringify({ favorites }),
    }),
    params
  );
}

const doConfirm = () =>
  confirm(new NextRequest("http://localhost/api/gallery/test/selection/confirm", { method: "POST" }), params);

async function currentSelection() {
  const res = await getSelection(new NextRequest("http://localhost/api/gallery/test/selection"), params);
  return (await res.json()).selection;
}

describe("/api/gallery/[slug]/selection/confirm", () => {
  beforeEach(() => {
    store.clear();
    session = true;
  });

  it("returns 401 without a session", async () => {
    session = false;
    expect((await doConfirm()).status).toBe(401);
  });

  it("returns 400 for an empty or missing selection", async () => {
    expect((await doConfirm()).status).toBe(400);
    await save([]);
    expect((await doConfirm()).status).toBe(400);
  });

  it("locks the selection after confirm and allows saving after admin unlock", async () => {
    await save(["a"]);
    const res = await doConfirm();
    expect(res.status).toBe(200);
    expect((await res.json()).confirmedAt).toEqual(expect.any(String));

    expect((await save(["a", "b"])).status).toBe(409);
    expect((await currentSelection()).favorites).toEqual(["a"]);

    const unlocked = await unlock(
      new NextRequest("http://localhost/api/admin/gallery/test/unlock", { method: "POST" }),
      params
    );
    expect(unlocked.status).toBe(200);

    expect((await save(["a", "b"])).status).toBe(200);
    const sel = await currentSelection();
    expect(sel.favorites).toEqual(["a", "b"]);
    expect(sel.confirmedAt).toBeUndefined();
  });
});
