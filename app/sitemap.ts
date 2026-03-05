import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

const locales = ["cs", "en"] as const;
const pages = ["", "/portfolio"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${page}`,
      lastModified: new Date("2025-03-05"),
      alternates: {
        languages: {
          "x-default": `${siteUrl}/cs${page}`,
          ...Object.fromEntries(locales.map((l) => [l, `${siteUrl}/${l}${page}`])),
        },
      },
    }))
  );
}
