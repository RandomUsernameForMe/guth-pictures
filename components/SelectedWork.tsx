"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { type GalleryPhoto, cloudinaryUrl, blurUrl, getAlt } from "@/lib/cloudinary-utils";

const CARD_W = 210;
const CARD_H = 290;
const GAP = 12;
const SCROLL_DURATION = 36; // seconds for one full loop

type Props = {
  photos: GalleryPhoto[];
  locale: string;
  title: string;
  linkLabel: string;
};

export function SelectedWork({ photos, locale, title, linkLabel }: Props) {
  const displayed = photos.slice(0, 10);
  if (displayed.length === 0) return null;

  // Duplicate for seamless infinite loop (translateX -50% = one full set)
  const track = [...displayed, ...displayed];

  return (
    <section className="py-20 bg-[var(--color-bg)]">
      {/* Header */}
      <div className="px-6 max-w-6xl mx-auto flex items-end justify-between mb-10">
        <h2 className="text-4xl font-bold text-[var(--color-text)]">{title}</h2>
        <Link
          href="/portfolio"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors tracking-wide pb-1"
        >
          {linkLabel} →
        </Link>
      </div>

      {/* Film strip — contained to max-width, edge fade via CSS mask */}
      <div className="max-w-6xl mx-auto overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <div
          className="flex"
          style={{
            gap: GAP,
            animation: `film-strip ${SCROLL_DURATION}s linear infinite`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "paused";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.animationPlayState = "running";
          }}
        >
          {track.map((photo, i) => {
            const alt = getAlt(photo, locale);
            return (
              <figure
                key={`${photo.publicId}-${i}`}
                className="group relative flex-shrink-0 overflow-hidden bg-[var(--color-surface)]"
                style={{ width: CARD_W, height: CARD_H }}
              >
                <Image
                  src={cloudinaryUrl(photo.publicId, `w_${CARD_W * 2},h_${CARD_H * 2},c_fill,q_auto,f_auto`)}
                  alt={alt}
                  fill
                  placeholder="blur"
                  blurDataURL={blurUrl(photo.publicId)}
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  sizes={`${CARD_W}px`}
                  priority={i < 4}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
                <span className="absolute top-3 right-3 font-mono text-[10px] text-white/35">
                  {String((i % displayed.length) + 1).padStart(2, "0")}
                </span>
                {alt && (
                  <p className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-white/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                    {alt}
                  </p>
                )}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
