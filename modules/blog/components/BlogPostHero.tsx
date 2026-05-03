import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/modules/blog/lib/blog";

type Props = { post: BlogPost; locale: "cs" | "en" };

export function BlogPostHero({ post, locale }: Props) {
  const loc = post[locale];
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        locale === "cs" ? "cs-CZ" : "en-GB",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : "";

  return (
    <article className="group border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-border-sub)] transition-colors duration-300 bg-[var(--color-bg-elevated)]">
      <Link href={`/blog/${post.slug}`} className="flex flex-col">
        {post.coverImage ? (
          <div className="relative w-full h-72 sm:h-[420px] overflow-hidden">
            <Image
              src={cloudinaryUrl(post.coverImage, "w_1400,h_700,c_fill")}
              alt={loc.title}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent group-hover:from-black/30 transition-colors duration-300" />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-64 bg-[var(--color-bg-overlay)]" />
        )}

        <div className="p-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <time className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{date}</time>
            <span className="flex-1 border-t border-[var(--color-border)]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-[var(--color-text)] group-hover:text-[var(--color-text-muted)] transition-colors">
            {loc.title}
          </h2>

          {loc.excerpt && (
            <p className="text-[var(--color-text-muted)] leading-relaxed line-clamp-2 max-w-2xl">
              {loc.excerpt}
            </p>
          )}

          <span className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors duration-300 mt-2">
            {locale === "cs" ? "Číst dál" : "Read more"}
            <ArrowRight
              size={14}
              className="translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
