import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { BlogPost } from "@/lib/blog";

type Props = { post: BlogPost; locale: string };

export function BlogPostCard({ post, locale }: Props) {
  const loc = post[locale as "cs" | "en"];
  const date = new Date(post.publishedAt).toLocaleDateString(
    locale === "cs" ? "cs-CZ" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article className="group border border-white/10 rounded-lg overflow-hidden hover:border-white/25 transition-colors">
      <Link href={`/blog/${post.slug}`} className="flex flex-col sm:flex-row gap-0">
        {post.coverImage && (
          <div className="relative w-full sm:w-64 h-48 sm:h-auto flex-shrink-0">
            <Image
              src={cloudinaryUrl(post.coverImage, "w_512,h_384,c_fill")}
              alt={loc.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 256px"
            />
          </div>
        )}
        <div className="p-6 flex flex-col gap-3">
          <time className="text-xs text-gray-500">{date}</time>
          <h2 className="text-xl font-semibold group-hover:text-gray-200 transition-colors leading-snug">
            {loc.title}
          </h2>
          {loc.excerpt && (
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{loc.excerpt}</p>
          )}
        </div>
      </Link>
    </article>
  );
}
