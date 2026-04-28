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
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(10,10,11,0.92)", backdropFilter: "blur(8px)" }}
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
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full text-white/70 hover:text-white transition-colors"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Zavřít"
        >
          <X size={14} strokeWidth={1.5} />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-4 z-10 font-mono text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>
          {String(currentIndex + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </div>

        {/* Prev */}
        {currentIndex > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
            aria-label="Předchozí"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
        )}

        {/* Next */}
        {currentIndex < photos.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
            aria-label="Další"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        )}

        <motion.div
          key={photo.publicId}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative max-w-5xl max-h-[84vh] w-full h-full"
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
          {/* Caption */}
          {alt && (
            <p className="absolute bottom-4 inset-x-4 text-center text-xs" style={{ color: "rgba(242,240,235,0.85)" }}>
              {alt}
            </p>
          )}
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
