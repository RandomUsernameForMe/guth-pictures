import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { siteUrl } from "@/lib/config";
import type { BlogPost } from "@/modules/blog/lib/blog";
import { serviceSlugs } from "@/modules/homepage/lib/service-pages";

const { posts } = vi.hoisted(() => {
  const copy = { title: "t", excerpt: "e", content: "c" };
  const base = { publishedAt: "2026-01-01T00:00:00.000Z", cs: copy, en: copy };
  const posts: BlogPost[] = [
    { ...base, id: "1", slug: "publikovany", published: true, updatedAt: "2026-02-03T10:00:00.000Z" },
    { ...base, id: "2", slug: "koncept", published: false, updatedAt: "2026-03-04T10:00:00.000Z" },
  ];
  return { posts };
});

vi.mock("@/modules/blog/lib/blog", () => ({ getBlogPosts: async () => posts }));

const locales = ["cs", "en"] as const;
const staticPaths = [
  "",
  "/portfolio",
  "/sluzby",
  "/sluzby/eventy-a-svatby",
  "/firemni-portrety",
  "/o-mne",
  "/blog",
  "/foceni-101",
  ...serviceSlugs.map((slug) => `/sluzby/${slug}`),
];

const expectedAlternates = (path: string) => ({
  cs: `${siteUrl}/cs${path}`,
  en: `${siteUrl}/en${path}`,
  "x-default": `${siteUrl}/cs${path}`,
});

describe("sitemap", () => {
  it("has static and published blog entries for both locales", async () => {
    const entries = await sitemap();
    expect(entries).toHaveLength(staticPaths.length * 2 + 2);
  });

  it("lists static pages and services with alternates", async () => {
    const entries = await sitemap();
    for (const locale of locales) {
      for (const path of staticPaths) {
        const entry = entries.find(({ url }) => url === `${siteUrl}/${locale}${path}`);
        expect(entry?.alternates?.languages).toEqual(expectedAlternates(path));
      }
    }
  });

  it("includes only published posts with lastModified from updatedAt", async () => {
    const entries = await sitemap();
    for (const locale of locales) {
      const entry = entries.find(({ url }) => url === `${siteUrl}/${locale}/blog/publikovany`);
      expect(entry?.lastModified).toEqual(new Date("2026-02-03T10:00:00.000Z"));
      expect(entry?.alternates?.languages).toEqual(expectedAlternates("/blog/publikovany"));
    }
    expect(entries.some(({ url }) => url.includes("/blog/koncept"))).toBe(false);
  });
});
