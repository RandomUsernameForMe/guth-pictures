"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { type GalleryPhoto, cloudinaryUrl, blurUrl, getAlt } from "@/lib/cloudinary-utils";
import { Lightbox } from "@/components/Lightbox";

const CARD_W = 270;
const CARD_H = 370;
const GAP = 12;
const STEP = CARD_W + GAP;
const SPEED = 0.5; // px per rAF tick (~30px/s at 60fps)

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

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);

  // 3 copies — loop stays within sets 2→3, reset to set 2 seamlessly
  const track = [...displayed, ...displayed, ...displayed];

  useEffect(() => {
    if (displayed.length === 0) return;

    const totalSetW = displayed.length * STEP;
    // Start at beginning of set 2 so there's buffer on both sides
    offsetRef.current = totalSetW;

    function tick() {
      if (!pausedRef.current) {
        offsetRef.current += SPEED;
        // Reset when we've scrolled through one full set (seamless: set3 == set2 == set1)
        if (offsetRef.current >= 2 * totalSetW) {
          offsetRef.current -= totalSetW;
        }
      }

      const trackEl = trackRef.current;
      const containerEl = containerRef.current;
      if (!trackEl || !containerEl) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      trackEl.style.transform = `translateX(${-offsetRef.current}px)`;

      const containerW = containerEl.clientWidth;
      const viewCenter = containerW / 2;

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        // Visual center of this card
        const cardCenter = i * STEP + CARD_W / 2 - offsetRef.current;
        const dist = cardCenter - viewCenter;
        // Normalize: 0 = viewport center, ±1 = viewport edge
        const norm = dist / (containerW * 0.55);
        const clamped = Math.max(-1.4, Math.min(1.4, norm));
        const scale = 1 - Math.abs(clamped) * 0.18;
        const rotateY = clamped * 16;
        card.style.transform = `scale(${scale}) perspective(900px) rotateY(${rotateY}deg)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [displayed.length]);

  if (displayed.length === 0) return null;

  return (
    <>
      <section className="py-20" style={{ backgroundColor: "var(--color-bg)" }}>
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

        {/* Film strip */}
        <div
          ref={containerRef}
          className="max-w-6xl mx-auto overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        >
          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{ gap: GAP }}
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            {track.map((photo, i) => {
              const alt = getAlt(photo, locale);
              const indexInSet = i % displayed.length;
              return (
                <figure
                  key={`${photo.publicId}-${i}`}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className="group relative flex-shrink-0 overflow-hidden bg-[var(--color-surface)] cursor-zoom-in will-change-transform"
                  style={{ width: CARD_W, height: CARD_H, transformOrigin: "center center" }}
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
