import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { unstable_cache } from "next/cache";
import { type GalleryPhoto } from "./cloudinary-utils";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type CloudinaryResource = {
  public_id: string;
  width: number;
  height: number;
  context?: { alt_cs?: string; alt_en?: string; category?: GalleryPhoto["category"] };
  tags?: string[];
};

async function fetchGalleryPhotos(folder: string): Promise<GalleryPhoto[]> {
  const result = await cloudinary.search
    .expression(`folder:${folder}`)
    .with_field("context")
    .with_field("tags")
    .sort_by("created_at", "desc")
    .max_results(50)
    .execute();

  const altFallback: Record<GalleryPhoto["category"], { cs: string; en: string }> = {
    "portréty": { cs: "Portrétní fotografie — Guth Pictures", en: "Portrait photography — Guth Pictures" },
    svatby: { cs: "Svatební fotografie — Guth Pictures", en: "Wedding photography — Guth Pictures" },
    larpy: { cs: "Larpová fotografie — Guth Pictures", en: "Larp photography — Guth Pictures" },
  };

  return result.resources.map((r: CloudinaryResource) => {
    const category = r.context?.category ?? "portréty";
    return {
      publicId: r.public_id,
      width: r.width,
      height: r.height,
      alt: {
        cs: r.context?.alt_cs ?? altFallback[category].cs,
        en: r.context?.alt_en ?? altFallback[category].en,
      },
      category,
      selected: r.tags?.includes("selected_work") ?? false,
    };
  });
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
