import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";
import { type GalleryPhoto, toGalleryPhoto } from "./cloudinary-utils";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fetchGalleryPhotos(folder: string): Promise<GalleryPhoto[]> {
  const result = await cloudinary.search
    .expression(`folder:${folder}`)
    .with_field("context")
    .with_field("tags")
    .sort_by("created_at", "desc")
    .max_results(50)
    .execute();

  return result.resources.map(toGalleryPhoto);
}

export const getGalleryPhotos = unstable_cache(
  fetchGalleryPhotos,
  ["gallery-photos"],
  { revalidate: 300 }
);

// Keyed by publicId, so swapping the hero photo yields a fresh palette; failures throw and aren't cached.
export const getImageColors = unstable_cache(
  async (publicId: string): Promise<[string, number][]> =>
    (await cloudinary.api.resource(publicId, { colors: true })).colors ?? [],
  ["image-colors"],
);

export { cloudinary };
