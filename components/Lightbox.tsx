"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { type GalleryPhoto, cloudinaryUrl, getAlt } from "@/lib/cloudinary-utils";

type Props = {
  photos: GalleryPhoto[];
  currentIndex: number;
  locale: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function Lightbox({ photos, currentIndex, locale, onClose, onNavigate }: Props) {
  const photo = photos[currentIndex];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) onNavigate(Math.min(currentIndex + 1, photos.length - 1));
    else onNavigate(Math.max(currentIndex - 1, 0));
  }

  useEffect(() => { closeRef.current?.focus(); }, []);

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

  const alt = getAlt(photo, locale);

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="dialog"
        aria-modal="true"
        aria-label="Prohlížeč fotografií"
      >
        {/* Close */}
        <button
          ref={closeRef}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Zavřít"
        >
          <X size={22} strokeWidth={1.5} />
        </button>

        {/* Prev */}
        {currentIndex > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
            aria-label="Předchozí"
          >
            <ChevronLeft size={32} strokeWidth={1.5} />
          </button>
        )}

        {/* Next */}
        {currentIndex < photos.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
            aria-label="Další"
          >
            <ChevronRight size={32} strokeWidth={1.5} />
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

      </motion.div>
    </AnimatePresence>
  );
}
