import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { siteUrl } from "@/lib/config";
import { isServiceSlug, servicePages, serviceSlugs } from "../lib/service-pages";

vi.mock("@/modules/blog/lib/blog", () => ({ getBlogPosts: async () => [] }));

describe("service discovery", () => {
  it("accepts only published service slugs", () => {
    expect(isServiceSlug("portretni-foceni")).toBe(true);
    expect(isServiceSlug("brandove-foceni")).toBe(true);
    expect(isServiceSlug("unknown")).toBe(false);
    expect(isServiceSlug("toString")).toBe(false);
  });

  it("lists both languages and keeps business portraits in the sitemap", async () => {
    const entries = await sitemap();
    for (const locale of ["cs", "en"] as const) {
      for (const slug of serviceSlugs) {
        const entry = entries.find(({ url }) => url === `${siteUrl}/${locale}/sluzby/${slug}`);
        expect(entry?.alternates?.languages?.cs).toBe(`${siteUrl}/cs/sluzby/${slug}`);
        expect(entry?.alternates?.languages?.en).toBe(`${siteUrl}/en/sluzby/${slug}`);
        expect(servicePages[slug][locale].title).toBeTruthy();
        expect(servicePages[slug][locale].description).toBeTruthy();
      }
      expect(entries.some(({ url }) => url === `${siteUrl}/${locale}/firemni-portrety`)).toBe(true);
    }
  });
});
