import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getBlogPosts } from "@/modules/blog/lib/blog";
import { BlogPostCard } from "@/modules/blog/components/BlogPostCard";
import { BlogPostHero } from "@/modules/blog/components/BlogPostHero";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

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
    <EditorialSubpage active="blog" className="ed-secondary-blog">
      <section className="ed-secondary-hero">
        <p>{locale === "cs" ? "Poznámky a příběhy" : "Notes and stories"}</p>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </section>

      <section className="ed-blog-list">
        {posts.length === 0 ? (
          <p className="ed-secondary-empty">{t("empty")}</p>
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
    </EditorialSubpage>
  );
}
