import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

type Props = { post: BlogPost; locale: "cs" | "en" };

export function BlogPostCard({ post, locale }: Props) {
  const loc = post[locale];
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        locale === "cs" ? "cs-CZ" : "en-GB",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : "";

  return (
    <article className="group border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors duration-300">
      <Link href={`/blog/${post.slug}`} className="flex flex-col">
        {/* Cover image */}
        {post.coverImage && (
          <div className="relative w-full h-56 overflow-hidden">
            <Image
              src={cloudinaryUrl(post.coverImage, "w_800,h_448,c_fill")}
              alt={loc.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Date + line */}
          <div className="flex items-center gap-3">
            <time className="text-xs text-white/35 whitespace-nowrap">{date}</time>
            <span className="flex-1 border-t border-white/10" />
          </div>

          <h2 className="text-xl font-semibold leading-snug group-hover:text-gray-200 transition-colors">
            {loc.title}
          </h2>

          {loc.excerpt && (
            <p className="text-white/50 text-sm leading-relaxed line-clamp-2">{loc.excerpt}</p>
          )}

          {/* Read more */}
          <span className="flex items-center gap-2 text-xs text-white/35 group-hover:text-white/70 transition-colors duration-300 mt-1">
            {locale === "cs" ? "Číst dál" : "Read more"}
            <ArrowRight
              size={12}
              className="translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
