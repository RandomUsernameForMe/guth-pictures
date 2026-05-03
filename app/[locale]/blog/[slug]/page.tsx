import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Link } from "@/i18n/navigation";
import { getBlogPost, getBlogPosts } from "@/modules/blog/lib/blog";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  const locales = ["cs", "en"];
  return posts
    .filter((p) => p.published)
    .flatMap((p) => locales.map((locale) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  const loc = post[locale as "cs" | "en"] ?? post.cs;
  return {
    title: `${loc.title} — Guth Pictures`,
    description: loc.excerpt,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: { cs: `/cs/blog/${slug}`, en: `/en/blog/${slug}` },
    },
  };
}

function readingMinutes(content: string): number {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 200));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const post = await getBlogPost(slug);
  if (!post || !post.published) notFound();

  const loc = post[locale as "cs" | "en"] ?? post.cs;
  const date = new Date(post.publishedAt).toLocaleDateString(
    locale === "cs" ? "cs-CZ" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const minutes = readingMinutes(loc.content);
  const readLabel = locale === "cs" ? `${minutes} min čtení` : `${minutes} min read`;

  return (
    <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <Link
        href="/blog"
        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-10 inline-block"
      >
        ← {t("back")}
      </Link>

      {post.coverImage && (
        <div className="relative w-full h-64 sm:h-80 overflow-hidden mb-10">
          <Image
            src={cloudinaryUrl(post.coverImage, "w_1200,h_630,c_fill")}
            alt={loc.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <time className="text-sm text-[var(--color-text-ghost)]">{date}</time>
        <span className="border-l border-[var(--color-border)] h-3" />
        <span className="text-sm text-[var(--color-text-ghost)]">{readLabel}</span>
      </div>

      <h1 className="text-4xl font-bold mb-6 leading-tight text-[var(--color-text)]">{loc.title}</h1>

      {loc.excerpt && (
        <p className="text-xl text-[var(--color-text-muted)] mb-10 leading-relaxed border-l-2 border-[var(--color-accent)] pl-5">
          {loc.excerpt}
        </p>
      )}

      <div className="blog-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{loc.content}</ReactMarkdown>
      </div>
    </main>
  );
}
