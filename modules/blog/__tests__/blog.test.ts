import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BlogPost } from "@/modules/blog/lib/blog";

vi.mock("@/lib/kv", () => ({ getKv: vi.fn() }));

import { getKv } from "@/lib/kv";
import { getBlogPosts, getBlogPost, getBlogPostById, saveBlogPost, deleteBlogPost } from "@/modules/blog/lib/blog";

const mockKv = {
  zrange: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  zadd: vi.fn(),
  del: vi.fn(),
  zrem: vi.fn(),
};

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "test-post",
    publishedAt: "2024-06-01T12:00:00.000Z",
    updatedAt: "2024-06-01T12:00:00.000Z",
    published: true,
    cs: { title: "Testový post", excerpt: "Ukázka", content: "Obsah" },
    en: { title: "Test post", excerpt: "Sample", content: "Content" },
    ...overrides,
  };
}

describe("getBlogPosts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getKv).mockResolvedValue(mockKv as any);
  });

  it("vrátí [] pokud KV není nakonfigurováno", async () => {
    vi.mocked(getKv).mockResolvedValue(null);
    expect(await getBlogPosts()).toEqual([]);
  });

  it("vrátí [] pokud sorted set je prázdný", async () => {
    mockKv.zrange.mockResolvedValue([]);
    expect(await getBlogPosts()).toEqual([]);
  });

  it("vrátí posty seřazené dle indexu", async () => {
    const p1 = makePost({ id: "1" });
    const p2 = makePost({ id: "2" });
    mockKv.zrange.mockResolvedValue(["1", "2"]);
    mockKv.get.mockResolvedValueOnce(p1).mockResolvedValueOnce(p2);
    expect(await getBlogPosts()).toEqual([p1, p2]);
  });

  it("filtruje null hodnoty (zombie reference po smazání)", async () => {
    mockKv.zrange.mockResolvedValue(["1", "2"]);
    mockKv.get.mockResolvedValueOnce(makePost({ id: "1" })).mockResolvedValueOnce(null);
    const result = await getBlogPosts();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("vrátí [] při výjimce z KV (síťová chyba)", async () => {
    mockKv.zrange.mockRejectedValue(new Error("connection refused"));
    expect(await getBlogPosts()).toEqual([]);
  });
});

describe("getBlogPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getKv).mockResolvedValue(mockKv as any);
  });

  it("vrátí null pokud KV chybí", async () => {
    vi.mocked(getKv).mockResolvedValue(null);
    expect(await getBlogPost("slug")).toBeNull();
  });

  it("vrátí null pokud slug neexistuje v indexu", async () => {
    mockKv.get.mockResolvedValue(null);
    expect(await getBlogPost("neexistujici-slug")).toBeNull();
  });

  it("vrátí null pokud slug ukazuje na smazaný post (zombie reference)", async () => {
    // slug → id existuje, ale blog:post:id bylo smazáno
    mockKv.get.mockResolvedValueOnce("smazane-id").mockResolvedValueOnce(null);
    expect(await getBlogPost("zombie-slug")).toBeNull();
  });

  it("vrátí post při obou KV hitách", async () => {
    const post = makePost({ id: "abc", slug: "muj-post" });
    mockKv.get.mockResolvedValueOnce("abc").mockResolvedValueOnce(post);
    expect(await getBlogPost("muj-post")).toEqual(post);
  });

  it("vrátí null při výjimce z KV", async () => {
    mockKv.get.mockRejectedValue(new Error("KV timeout"));
    expect(await getBlogPost("slug")).toBeNull();
  });
});

describe("getBlogPostById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getKv).mockResolvedValue(mockKv as any);
  });

  it("vrátí null pokud KV chybí", async () => {
    vi.mocked(getKv).mockResolvedValue(null);
    expect(await getBlogPostById("id")).toBeNull();
  });

  it("vrátí null pokud post s daným id neexistuje", async () => {
    mockKv.get.mockResolvedValue(null);
    expect(await getBlogPostById("neexistujici-id")).toBeNull();
  });

  it("vrátí post pokud existuje", async () => {
    const post = makePost({ id: "abc" });
    mockKv.get.mockResolvedValue(post);
    expect(await getBlogPostById("abc")).toEqual(post);
    expect(mockKv.get).toHaveBeenCalledWith("blog:post:abc");
  });
});

describe("saveBlogPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getKv).mockResolvedValue(mockKv as any);
    mockKv.set.mockResolvedValue("OK");
    mockKv.zadd.mockResolvedValue(1);
  });

  it("hodí chybu pokud KV není nakonfigurováno", async () => {
    vi.mocked(getKv).mockResolvedValue(null);
    await expect(saveBlogPost(makePost())).rejects.toThrow("KV not configured");
  });

  it("zapíše post, slug index i sorted set", async () => {
    const post = makePost();
    await saveBlogPost(post);
    expect(mockKv.set).toHaveBeenCalledWith(`blog:post:${post.id}`, post);
    expect(mockKv.set).toHaveBeenCalledWith(`blog:slug:${post.slug}`, post.id);
    expect(mockKv.zadd).toHaveBeenCalledWith("blog:index", {
      score: new Date(post.publishedAt).getTime(),
      member: post.id,
    });
  });

  it("používá publishedAt timestamp jako score pro sorted set", async () => {
    const post = makePost({ publishedAt: "2024-01-15T12:00:00.000Z" });
    await saveBlogPost(post);
    expect(mockKv.zadd).toHaveBeenCalledWith("blog:index", {
      score: new Date("2024-01-15T12:00:00.000Z").getTime(),
      member: post.id,
    });
  });

  it("provede všechny 3 zápisy (set ×2, zadd ×1)", async () => {
    await saveBlogPost(makePost());
    expect(mockKv.set).toHaveBeenCalledTimes(2);
    expect(mockKv.zadd).toHaveBeenCalledTimes(1);
  });
});

describe("deleteBlogPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getKv).mockResolvedValue(mockKv as any);
    mockKv.del.mockResolvedValue(1);
    mockKv.zrem.mockResolvedValue(1);
  });

  it("hodí chybu pokud KV není nakonfigurováno", async () => {
    vi.mocked(getKv).mockResolvedValue(null);
    await expect(deleteBlogPost("id")).rejects.toThrow("KV not configured");
  });

  it("vrátí false pokud post neexistuje", async () => {
    mockKv.get.mockResolvedValue(null);
    expect(await deleteBlogPost("neexistujici-id")).toBe(false);
    // Žádné smazání by nemělo nastat
    expect(mockKv.del).not.toHaveBeenCalled();
    expect(mockKv.zrem).not.toHaveBeenCalled();
  });

  it("smaže blog:post, blog:slug i sorted set", async () => {
    const post = makePost({ id: "abc", slug: "slug-k-smazani" });
    mockKv.get.mockResolvedValue(post);
    await deleteBlogPost("abc");
    expect(mockKv.del).toHaveBeenCalledWith("blog:post:abc");
    expect(mockKv.del).toHaveBeenCalledWith("blog:slug:slug-k-smazani");
    expect(mockKv.zrem).toHaveBeenCalledWith("blog:index", "abc");
  });

  it("vrátí true po úspěšném smazání", async () => {
    mockKv.get.mockResolvedValue(makePost({ id: "abc" }));
    expect(await deleteBlogPost("abc")).toBe(true);
  });
});
