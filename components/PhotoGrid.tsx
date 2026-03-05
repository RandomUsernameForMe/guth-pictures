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
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-2">
      {photos.map((photo) => (
        <div key={photo.publicId} className="mb-2 overflow-hidden">
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
        </div>
      ))}
    </div>
  );
}
