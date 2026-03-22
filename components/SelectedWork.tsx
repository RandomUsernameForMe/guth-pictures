"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { type GalleryPhoto, cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

type Props = {
  photos: GalleryPhoto[];
  locale: string;
  title: string;
  linkLabel: string;
};

export function SelectedWork({ photos, locale, title, linkLabel }: Props) {
  const displayed = photos.slice(0, 6);
  if (displayed.length === 0) return null;

  return (
    <section className="px-6 py-24 max-w-6xl mx-auto">
      <h2 className="text-4xl font-bold mb-12">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {displayed.map((photo, i) => {
          const alt = locale === "cs" ? photo.alt.cs : photo.alt.en;
          const isBig = i === 0;
          return (
            <motion.figure
              key={photo.publicId}
              className={`group relative overflow-hidden bg-zinc-900 cursor-pointer ${
                isBig ? "col-span-2 row-span-2 md:col-span-2 md:row-span-2" : ""
              }`}
              style={{ aspectRatio: isBig ? "16/10" : "4/3" }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Image
                src={cloudinaryUrl(photo.publicId, "w_900,q_auto")}
                alt={alt}
                fill
                sizes={isBig ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 50vw, 33vw"}
                placeholder="blur"
                blurDataURL={blurUrl(photo.publicId)}
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              {alt && (
                <p className="absolute bottom-0 left-0 right-0 px-4 py-3 text-sm text-white/80 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                  {alt}
                </p>
              )}
            </motion.figure>
          );
        })}
      </div>
      <div className="mt-8 text-right">
        <Link
          href="/portfolio"
          className="text-sm text-gray-400 hover:text-white transition-colors tracking-wide"
        >
          {linkLabel} →
        </Link>
      </div>
    </section>
  );
}
