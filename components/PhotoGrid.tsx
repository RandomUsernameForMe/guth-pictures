"use client";

import { useState } from "react";
import Image from "next/image";
import { type GalleryPhoto, cloudinaryUrl, blurUrl, getAlt } from "@/lib/cloudinary-utils";
import { Lightbox } from "./Lightbox";

type Props = {
  photos: GalleryPhoto[];
  locale: string;
};

export function PhotoGrid({ photos, locale }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <p className="text-gray-500 text-center py-24">— zatím žádné fotky —</p>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
        {photos.map((photo, i) => (
          <figure
            key={photo.publicId}
            className="group mb-4 bg-zinc-900 break-inside-avoid overflow-hidden cursor-pointer relative"
            onClick={() => setSelectedIndex(i)}
            tabIndex={0}
            role="button"
            aria-label={`Otevřít fotografii: ${getAlt(photo, locale)}`}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedIndex(i); } }}
          >
            <Image
              src={cloudinaryUrl(photo.publicId)}
              alt={getAlt(photo, locale)}
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={blurUrl(photo.publicId)}
              className="w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </figure>
        ))}
      </div>
      {selectedIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={selectedIndex}
          locale={locale}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </>
  );
}
