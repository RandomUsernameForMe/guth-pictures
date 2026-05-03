"use client";

import { useMotionValue, useAnimationFrame, motion } from "framer-motion";
import Image from "next/image";
import { type GalleryPhoto, cloudinaryUrl } from "@/lib/cloudinary-utils";

const CARD_W = 176; // w-44
const GAP = 8;      // gap-2
const SPEED = 55;   // px/s

type RowProps = {
  photos: GalleryPhoto[];
  direction: 1 | -1;
};

function Row({ photos, direction }: RowProps) {
  const trackW = photos.length * CARD_W + (photos.length - 1) * GAP;
  const doubled = [...photos, ...photos];
  const x = useMotionValue(direction === 1 ? -trackW : 0);

  useAnimationFrame((_, delta) => {
    let next = x.get() + direction * SPEED * (delta / 1000);
    if (next <= -trackW) next += trackW;
    if (next >= 0) next -= trackW;
    x.set(next);
  });

  return (
    <div className="overflow-hidden">
      <motion.div className="flex flex-nowrap gap-2" style={{ x }}>
        {doubled.map((photo, i) => (
          <div
            key={`${photo.publicId}-${i}`}
            className="relative flex-shrink-0 overflow-hidden"
            style={{ width: CARD_W, height: 112 }}
          >
            <Image
              src={cloudinaryUrl(photo.publicId, "w_352,h_224,c_fill,q_auto,f_auto")}
              alt=""
              fill
              className="object-cover"
              sizes="176px"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

type Props = { photos: GalleryPhoto[] };

export function ScrollVelocityStrip({ photos }: Props) {
  if (photos.length === 0) return null;

  return (
    <div className="relative py-4 space-y-2 overflow-hidden">
      {/* edge fade — matches page background color */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: "linear-gradient(to right, var(--color-bg) 0%, transparent 15%, transparent 85%, var(--color-bg) 100%)",
        }}
      />
      <Row photos={photos} direction={-1} />
      <Row photos={photos} direction={1} />
    </div>
  );
}
