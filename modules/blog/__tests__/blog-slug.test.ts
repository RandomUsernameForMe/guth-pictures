import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/kv", () => ({ getKv: vi.fn() }));
vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn().mockResolvedValue(true), signToken: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getKv } from "@/lib/kv";
import { revalidatePath } from "next/cache";
import { getBlogPost, saveBlogPost, type BlogPost } from "@/modules/blog/lib/blog";
import { POST } from "@/app/api/admin/blog/route";

const ID1 = "11111111-1111-1111-1111-111111111111";
const ID2 = "22222222-2222-2222-2222-222222222222";

let store: Map<string, unknown>;
let index: Map<string, number>;

function makeKv() {
  return {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: unknown) => {
      store.set(k, v);
      return "OK";
    }),
    del: vi.fn(async (k: string) => (store.delete(k) ? 1 : 0)),
    zadd: vi.fn(async (_k: string, { score, member }: { score: number; member: string }) => {
      index.set(member, score);
      return 1;
    }),
    zrem: vi.fn(async (_k: string, m: string) => (index.delete(m) ? 1 : 0)),
    zrange: vi.fn(async () => [...index.keys()]),
  };
}

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: ID1,
    slug: "a",
    publishedAt: "2024-06-01T12:00:00.000Z",
    updatedAt: "2024-06-01T12:00:00.000Z",
    published: true,
    cs: { title: "Titulek", excerpt: "Ukázka", content: "Obsah" },
    en: { title: "Title", excerpt: "Excerpt", content: "Content" },
    ...overrides,
  };
}

function postRequest(body: string): NextRequest {
  return new NextRequest("http://localhost/api/admin/blog", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  store = new Map();
  index = new Map();
  vi.mocked(getKv).mockResolvedValue(makeKv() as any);
});

describe("změna slugu", () => {
  it("po změně slugu A → B vrací A null a B článek", async () => {
    await saveBlogPost(makePost({ slug: "a" }));
    const result = await saveBlogPost(makePost({ slug: "b" }));
    expect(result).toEqual({ ok: true, previousSlug: "a" });
    expect(await getBlogPost("a")).toBeNull();
    expect((await getBlogPost("b"))?.id).toBe(ID1);
  });

  it("POST revaliduje i starou cestu", async () => {
    await saveBlogPost(makePost({ slug: "a" }));
    const res = await POST(postRequest(JSON.stringify(makePost({ slug: "b" }))));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/cs/blog/a");
    expect(revalidatePath).toHaveBeenCalledWith("/en/blog/a");
  });
});

describe("kolize slugu", () => {
  it("jiné id se stejným slugem vrátí 409 a index se nezmění", async () => {
    await saveBlogPost(makePost({ id: ID1, slug: "a" }));
    const res = await POST(postRequest(JSON.stringify(makePost({ id: ID2, slug: "a" }))));
    expect(res.status).toBe(409);
    expect(store.get("blog:slug:a")).toBe(ID1);
    expect(store.has(`blog:post:${ID2}`)).toBe(false);
    expect(index.has(ID2)).toBe(false);
  });
});

describe("validace vstupu", () => {
  it("nevalidní JSON vrátí 400", async () => {
    const res = await POST(postRequest("{nope"));
    expect(res.status).toBe(400);
  });

  it("nevalidní publishedAt vrátí 400 a nic nezapíše", async () => {
    const res = await POST(postRequest(JSON.stringify(makePost({ publishedAt: "not-a-date" }))));
    expect(res.status).toBe(400);
    expect(store.size).toBe(0);
    expect(index.size).toBe(0);
  });
});
