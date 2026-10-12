"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { GalleryPhoto } from "../lib/gallery";
import { stepPhoto } from "../lib/selection-filter";
import { watermarkedUrl } from "../lib/watermarked-url";
import { HeartIcon } from "./HeartIcon";

interface Props {
  photo: GalleryPhoto;
  photos: GalleryPhoto[];
  isFav: boolean;
  disabled?: boolean;
  onToggle: (lrId: string) => void;
  onChange: (photo: GalleryPhoto | null) => void;
  onClose: () => void;
}

export function ClientLightbox({ photo, photos, isFav, disabled, onToggle, onChange, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange(stepPhoto(photos, photo.lrId, 1));
      if (e.key === "ArrowLeft") onChange(stepPhoto(photos, photo.lrId, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, photos, onChange, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
        onClick={onClose}
        aria-label="Zavřít"
      >
        ✕
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
        onClick={(e) => {
          e.stopPropagation();
          onChange(stepPhoto(photos, photo.lrId, -1));
        }}
      >
        ‹
      </button>
      <div
        className="relative max-w-5xl max-h-screen w-full h-full p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={watermarkedUrl(photo.cloudinaryId, 2048)}
          alt={photo.filename}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(photo.lrId);
          }}
          disabled={disabled}
          className={`absolute bottom-20 right-20 w-12 h-12 flex items-center justify-center bg-black/60 border transition-colors disabled:opacity-40 ${
            isFav
              ? "border-white text-white"
              : "border-white/30 text-white/50 hover:border-white hover:text-white"
          }`}
        >
          <HeartIcon filled={isFav} className="w-6 h-6" />
        </button>
      </div>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
        onClick={(e) => {
          e.stopPropagation();
          onChange(stepPhoto(photos, photo.lrId, 1));
        }}
      >
        ›
      </button>
    </div>
  );
}
