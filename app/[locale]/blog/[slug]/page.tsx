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
import { siteUrl } from "@/lib/config";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

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
  const ogImageUrl = post.coverImage
    ? cloudinaryUrl(post.coverImage, "w_1200,h_630,c_fill,q_auto,f_jpg")
    : `${siteUrl}/og-image.jpg`;

  return {
    title: loc.title,
    description: loc.excerpt,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: { cs: `/cs/blog/${slug}`, en: `/en/blog/${slug}`, "x-default": `/cs/blog/${slug}` },
    },
    openGraph: {
      title: loc.title,
      description: loc.excerpt,
      url: `${siteUrl}/${locale}/blog/${slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: loc.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: loc.title,
      description: loc.excerpt,
      images: [ogImageUrl],
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: loc.title,
    description: loc.excerpt,
    ...(post.coverImage && {
      image: cloudinaryUrl(post.coverImage, "w_1200,h_630,c_fill,q_auto,f_jpg"),
    }),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: locale,
    author: { "@type": "Person", name: "Tomáš Guth Jarkovský", url: `${siteUrl}/${locale}/o-mne` },
    publisher: { "@id": `${siteUrl}/#business` },
    mainEntityOfPage: `${siteUrl}/${locale}/blog/${slug}`,
  };
  // JSON-LD: escape "<" so post content cannot close the script tag
  const jsonLdHtml = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <EditorialSubpage active="blog" className="ed-secondary-article">
      <article className="ed-article">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />
        <Link href="/blog" className="ed-article__back">← {t("back")}</Link>

        {post.coverImage && (
          <figure className="ed-article__image">
            <Image
              src={cloudinaryUrl(post.coverImage, "w_1200,h_630,c_fill")}
              alt={loc.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </figure>
        )}

        <div className="ed-article__meta">
          <time>{date}</time>
          <span aria-hidden>·</span>
          <span>{readLabel}</span>
        </div>

        <h1>{loc.title}</h1>
        <p className="ed-article__author">
          {locale === "cs" ? "Autor" : "Author"}: <Link href="/o-mne">Tomáš Guth Jarkovský</Link>
        </p>

        {loc.excerpt && <p className="ed-article__excerpt">{loc.excerpt}</p>}

        <div className="blog-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>{loc.content}</ReactMarkdown>
        </div>
      </article>
    </EditorialSubpage>
  );
}
