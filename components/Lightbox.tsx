"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { type GalleryPhoto, cloudinaryUrl } from "@/lib/cloudinary-utils";

type Props = {
  photos: GalleryPhoto[];
  currentIndex: number;
  locale: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function Lightbox({ photos, currentIndex, locale, onClose, onNavigate }: Props) {
  const photo = photos[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(Math.min(currentIndex + 1, photos.length - 1));
      if (e.key === "ArrowLeft") onNavigate(Math.max(currentIndex - 1, 0));
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate, currentIndex, photos.length]);

  const alt = locale === "cs" ? photo.alt.cs : photo.alt.en;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-6 text-white text-3xl leading-none hover:text-gray-300 transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Zavřít"
        >
          ×
        </button>

        {/* Prev */}
        {currentIndex > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-4xl leading-none z-10 px-2"
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
            aria-label="Předchozí"
          >
            ‹
          </button>
        )}

        {/* Next */}
        {currentIndex < photos.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors text-4xl leading-none z-10 px-2"
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
            aria-label="Další"
          >
            ›
          </button>
        )}

        <motion.div
          key={photo.publicId}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-5xl max-h-[90vh] w-full h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={cloudinaryUrl(photo.publicId, "w_1600,q_auto,f_auto")}
            alt={alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </motion.div>

        {alt && (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-sm">
            {alt}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
