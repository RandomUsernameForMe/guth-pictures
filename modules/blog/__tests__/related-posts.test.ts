import { describe, it, expect } from "vitest";
import { pickRelatedPosts } from "../lib/related-posts";
import type { BlogPost } from "../lib/blog";

const make = (id: string, publishedAt: string, published = true): BlogPost => ({
  id,
  slug: id,
  publishedAt,
  updatedAt: publishedAt,
  published,
  cs: { title: id, excerpt: "", content: "" },
  en: { title: id, excerpt: "", content: "" },
});

describe("pickRelatedPosts", () => {
  it("vynechá aktuální i nepublikované články", () => {
    const posts = [make("a", "2026-01-01"), make("b", "2026-01-02"), make("c", "2026-01-03", false)];
    expect(pickRelatedPosts(posts, "a").map((p) => p.id)).toEqual(["b"]);
  });

  it("vrátí nejvýš 3 články od nejnovějšího", () => {
    const posts = [
      make("a", "2026-01-01"),
      make("b", "2026-01-04"),
      make("c", "2026-01-02"),
      make("d", "2026-01-03"),
      make("cur", "2026-01-05"),
    ];
    expect(pickRelatedPosts(posts, "cur").map((p) => p.id)).toEqual(["b", "d", "c"]);
  });

  it("pro jediný článek vrátí prázdné pole", () => {
    expect(pickRelatedPosts([make("a", "2026-01-01")], "a")).toEqual([]);
  });
});
