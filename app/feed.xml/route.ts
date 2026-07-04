import { siteUrl } from "@/lib/config";
import { getBlogPosts } from "@/modules/blog/lib/blog";

export const revalidate = 3600;

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET() {
  const posts = (await getBlogPosts()).filter((p) => p.published);

  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.cs.title)}</title>
      <link>${siteUrl}/cs/blog/${p.slug}</link>
      <guid>${siteUrl}/cs/blog/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${esc(p.cs.excerpt)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Guth Pictures — Blog</title>
    <link>${siteUrl}/cs/blog</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Zápisky o fotografii, technice a zážitcích z focení.</description>
    <language>cs</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
