import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/blog";
import { BlogPostCard } from "@/components/BlogPostCard";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { cs: "/cs/blog", en: "/en/blog" },
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const allPosts = await getBlogPosts();
  const posts = allPosts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <main>
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-12">
        <h1 className="text-5xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-gray-400">{t("subtitle")}</p>
      </section>
      <section className="max-w-4xl mx-auto px-6 pb-24">
        {posts.length === 0 ? (
          <p className="text-gray-500 py-16 text-center">{t("empty")}</p>
        ) : (
          <div className="flex flex-col gap-8">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} locale={locale} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
