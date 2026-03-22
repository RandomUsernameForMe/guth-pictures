"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { type GalleryPhoto, cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

const CARD_W = 380;
const CARD_H = 480;
const GAP = 16;

type Props = {
  photos: GalleryPhoto[];
  locale: string;
  title: string;
  linkLabel: string;
};

export function SelectedWork({ photos, locale, title, linkLabel }: Props) {
  const displayed = photos.slice(0, 8);

  const targetRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  const endX = -(displayed.length - 1) * (CARD_W + GAP);
  const x = useTransform(scrollYProgress, [0, 1], [0, endX]);

  if (displayed.length === 0) return null;

  return (
    <>
      {/* ── Desktop: horizontal scroll ── */}
      <section
        ref={targetRef}
        className="hidden md:block relative h-[300vh] bg-black"
      >
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center gap-8">
          {/* Header */}
          <div className="px-6 max-w-6xl mx-auto w-full flex items-end justify-between">
            <h2 className="text-4xl font-bold">{title}</h2>
            <Link
              href="/portfolio"
              className="text-sm text-gray-400 hover:text-white transition-colors tracking-wide pb-1"
            >
              {linkLabel} →
            </Link>
          </div>

          {/* Cards track */}
          <motion.div className="flex gap-4 pl-6" style={{ x }}>
            {displayed.map((photo, i) => {
              const alt = locale === "cs" ? photo.alt.cs : photo.alt.en;
              return (
                <figure
                  key={photo.publicId}
                  className="group relative flex-shrink-0 overflow-hidden bg-zinc-900 cursor-pointer"
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
                    priority={i < 3}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  {alt && (
                    <p className="absolute bottom-0 left-0 right-0 px-4 py-3 text-sm text-white/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                      {alt}
                    </p>
                  )}
                  {/* index number */}
                  <span className="absolute top-4 right-4 font-mono text-xs text-white/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </figure>
              );
            })}
          </motion.div>

          {/* Scroll hint */}
          <p className="px-6 text-xs text-white/20 tracking-widest uppercase max-w-6xl mx-auto w-full">
            ← scroll →
          </p>
        </div>
      </section>

      {/* ── Mobile: 2-col grid ── */}
      <section className="md:hidden px-4 py-16 bg-black">
        <div className="flex items-end justify-between mb-10 px-2">
          <h2 className="text-3xl font-bold">{title}</h2>
          <Link href="/portfolio" className="text-sm text-gray-400 hover:text-white transition-colors">
            {linkLabel} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {displayed.slice(0, 6).map((photo) => {
            const alt = locale === "cs" ? photo.alt.cs : photo.alt.en;
            return (
              <figure
                key={photo.publicId}
                className="relative overflow-hidden bg-zinc-900 aspect-[3/4]"
              >
                <Image
                  src={cloudinaryUrl(photo.publicId, "w_400,c_fill,q_auto")}
                  alt={alt}
                  fill
                  placeholder="blur"
                  blurDataURL={blurUrl(photo.publicId)}
                  className="object-cover"
                  sizes="50vw"
                />
              </figure>
            );
          })}
        </div>
      </section>
    </>
  );
}
