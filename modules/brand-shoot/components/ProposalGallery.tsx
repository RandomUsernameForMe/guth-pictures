"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { ProposalImage } from "@/modules/brand-shoot/lib/types";

function url(id: string, w: number) {
  return cloudinaryUrl(id, `c_fill,w_${w},q_auto,f_auto`);
}

export function ProposalGallery({ images }: { images: ProposalImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft")
        setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length, close]);

  if (!images.length) return null;
  const active = open !== null ? images[open] : null;

  return (
    <>
      <div className="bsp-grid">
        {images.map((img, i) => (
          <button
            key={img.cloudinaryId}
            className="bsp-tile"
            onClick={() => setOpen(i)}
            aria-label={img.note ?? `Image ${i + 1}`}
          >
            <Image
              src={url(img.cloudinaryId, 600)}
              alt={img.note ?? ""}
              fill
              className="bsp-tile-img"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {img.note && <span className="bsp-tile-note">{img.note}</span>}
          </button>
        ))}
      </div>

      {active && (
        <div className="bsp-lightbox" onClick={close}>
          <button className="bsp-lb-close" onClick={close} aria-label="Close">
            ✕
          </button>
          {images.length > 1 && (
            <button
              className="bsp-lb-nav bsp-lb-prev"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
              }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          <div className="bsp-lb-stage" onClick={(e) => e.stopPropagation()}>
            <Image
              src={cloudinaryUrl(active.cloudinaryId, "c_fit,w_2048,q_auto,f_auto")}
              alt={active.note ?? ""}
              fill
              className="bsp-lb-img"
              sizes="100vw"
              priority
            />
            {active.note && <p className="bsp-lb-note">{active.note}</p>}
          </div>
          {images.length > 1 && (
            <button
              className="bsp-lb-nav bsp-lb-next"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((i) => (i === null ? i : (i + 1) % images.length));
              }}
              aria-label="Next"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
