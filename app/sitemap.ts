import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { getBlogPosts } from "@/modules/blog/lib/blog";
import { serviceSlugs } from "@/modules/homepage/lib/service-pages";

const locales = ["cs", "en"] as const;
const pages = ["", "/portfolio", "/sluzby", "/sluzby/eventy-a-svatby", "/firemni-portrety", "/o-mne", "/blog", "/foceni-101"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = [...pages, ...serviceSlugs.map((slug) => `/sluzby/${slug}`)].flatMap((page) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${page}`,
      alternates: {
        languages: {
          "x-default": `${siteUrl}/cs${page}`,
          ...Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${page}`])),
        },
      },
    }))
  );

  const posts = await getBlogPosts();
  const blogEntries = posts
    .filter((p) => p.published)
    .flatMap((post) =>
      locales.map((locale) => ({
        url: `${siteUrl}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        alternates: {
          languages: {
            "x-default": `${siteUrl}/cs/blog/${post.slug}`,
            ...Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}/blog/${post.slug}`])),
          },
        },
      }))
    );

  return [...staticEntries, ...blogEntries];
}
