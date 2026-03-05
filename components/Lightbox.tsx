"use client";

import { useEffect } from "react";
import Image from "next/image";
import { type GalleryPhoto, cloudinaryUrl } from "@/lib/cloudinary-utils";

type Props = {
  photo: GalleryPhoto;
  locale: string;
  onClose: () => void;
};

export function Lightbox({ photo, locale, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const alt = locale === "cs" ? photo.alt.cs : photo.alt.en;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-6 text-white text-3xl leading-none hover:text-gray-300 transition-colors"
        onClick={onClose}
        aria-label="Zavřít"
      >
        ×
      </button>
      <div
        className="relative max-w-5xl max-h-[90vh] w-full h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={cloudinaryUrl(photo.publicId, "w_1600,q_auto")}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>
      {alt && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-sm">
          {alt}
        </p>
      )}
    </div>
  );
}
