import Image from "next/image";
import { cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";
import type { Testimonial } from "@/modules/admin/lib/content";

type Props = {
  testimonials: Testimonial[];
  locale: string;
  eyebrow: string;
  title: string;
};

export function Testimonials({ testimonials, locale, eyebrow, title }: Props) {
  void locale; // reserved for future localized fields; keeps API consistent with siblings
  if (testimonials.length === 0) return null;

  return (
    <section id="reference" className="max-w-4xl mx-auto px-6 py-32">
      <div className="hp-eyebrow">{eyebrow}</div>
      <h2 className="text-4xl font-bold">{title}</h2>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="relative border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 flex flex-col"
          >
            <blockquote className="text-[var(--color-text-muted)] text-lg leading-relaxed">
              {t.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-4">
              {t.photo && (
                <div className="w-12 h-12 relative overflow-hidden rounded-full shrink-0">
                  <Image
                    src={cloudinaryUrl(t.photo, "w_96,h_96,c_fill,g_face,q_auto,f_auto")}
                    alt={t.author}
                    fill
                    placeholder="blur"
                    blurDataURL={blurUrl(t.photo)}
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div>
                <div className="text-[var(--color-text)] font-semibold text-sm">{t.author}</div>
                {t.role && (
                  <div className="font-mono text-xs text-[var(--color-text-ghost)] tracking-wider mt-0.5">
                    {t.role}
                  </div>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
