import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getBlogPosts } from "@/modules/blog/lib/blog";
import { BlogPostCard } from "@/modules/blog/components/BlogPostCard";
import { BlogPostHero } from "@/modules/blog/components/BlogPostHero";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/blog`,
      languages: { cs: "/cs/blog", en: "/en/blog", "x-default": "/cs/blog" },
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const loc = locale === "en" ? "en" : "cs";

  const allPosts = await getBlogPosts();
  const posts = allPosts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const [hero, ...rest] = posts;

  return (
    <main>
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-12">
        <h1 className="text-5xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">{t("subtitle")}</p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24">
        {posts.length === 0 ? (
          <p className="text-[var(--color-text-ghost)] py-16 text-center">{t("empty")}</p>
        ) : (
          <div className="flex flex-col gap-8">
            <BlogPostHero post={hero} locale={loc} />

            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {rest.map((post) => (
                  <BlogPostCard key={post.id} post={post} locale={loc} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
