"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { type GalleryPhoto, cloudinaryUrl, blurUrl, getAlt } from "@/lib/cloudinary-utils";
import { Lightbox } from "@/components/Lightbox";

const CARD_W = 270;
const CARD_H = 370;
const GAP = 12;
const SCROLL_DURATION = 36; // seconds for one full loop

type Props = {
  photos: GalleryPhoto[];
  locale: string;
  title: string;
  linkLabel: string;
};

export function SelectedWork({ photos, locale, title, linkLabel }: Props) {
  const selectedPhotos = photos.filter((p) => p.selected);
  const displayed = selectedPhotos.length > 0 ? selectedPhotos : photos.slice(0, 10);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (displayed.length === 0) return null;

  // Duplicate for seamless infinite loop (translateX -50% = one full set)
  const track = [...displayed, ...displayed];

  return (
    <>
    <section className="py-20" style={{ backgroundColor: 'var(--color-bg)' }}>
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

      {/* Film strip — edge fade via CSS mask, perspective for 3D depth */}
      <div
        className="max-w-6xl mx-auto overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          perspective: "1200px",
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
            const indexInSet = i % displayed.length;
            // Scale down cards near the edges of the visible window (based on position in duplicated track)
            const posInSet = i % displayed.length;
            const distFromCenter = Math.abs(posInSet - (displayed.length - 1) / 2) / ((displayed.length - 1) / 2);
            const scale = 1 - distFromCenter * 0.08;
            return (
              <figure
                key={`${photo.publicId}-${i}`}
                className="group relative flex-shrink-0 overflow-hidden bg-[var(--color-surface)] cursor-zoom-in"
                style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: 'center' }}
                onClick={() => setLightboxIndex(indexInSet)}
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
                  {String(indexInSet + 1).padStart(2, "0")}
                </span>
              </figure>
            );
          })}
        </div>
      </div>
    </section>

    {lightboxIndex !== null && (
      <Lightbox
        photos={displayed}
        currentIndex={lightboxIndex}
        locale={locale}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    )}
  </>
  );
}
