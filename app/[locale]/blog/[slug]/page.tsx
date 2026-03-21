import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Link } from "@/i18n/navigation";
import { getBlogPost, getBlogPosts } from "@/lib/blog";
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

  return (
    <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
      <Link
        href="/blog"
        className="text-sm text-gray-400 hover:text-white transition-colors mb-10 inline-block"
      >
        ← {t("back")}
      </Link>

      {post.coverImage && (
        <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden mb-10">
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

      <time className="text-sm text-gray-500">{date}</time>
      <h1 className="text-4xl font-bold mt-3 mb-6 leading-tight">{loc.title}</h1>

      {loc.excerpt && (
        <p className="text-xl text-gray-300 mb-8 leading-relaxed">{loc.excerpt}</p>
      )}

      <div className="blog-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{loc.content}</ReactMarkdown>
      </div>
    </main>
  );
}
