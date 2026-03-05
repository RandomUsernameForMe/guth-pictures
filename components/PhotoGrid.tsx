import Image from "next/image";
import { type GalleryPhoto, cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

type Props = {
  photos: GalleryPhoto[];
  locale: string;
};

export function PhotoGrid({ photos, locale }: Props) {
  if (photos.length === 0) {
    return (
      <p className="text-gray-500 text-center py-24">— zatím žádné fotky —</p>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
      {photos.map((photo) => (
        <figure key={photo.publicId} className="mb-4 bg-zinc-900 break-inside-avoid overflow-hidden">
          <Image
            src={cloudinaryUrl(photo.publicId)}
            alt={locale === "cs" ? photo.alt.cs : photo.alt.en}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={blurUrl(photo.publicId)}
            className="w-full object-cover hover:opacity-90 transition-opacity"
          />
        </figure>
      ))}
    </div>
  );
}
