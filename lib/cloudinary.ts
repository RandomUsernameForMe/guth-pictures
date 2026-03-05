import "server-only";
import { v2 as cloudinary } from "cloudinary";
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
};

export async function getGalleryPhotos(folder = "portfolio"): Promise<GalleryPhoto[]> {
  const result = await cloudinary.search
    .expression(`folder:${folder}`)
    .with_field("context")
    .sort_by("created_at", "desc")
    .max_results(50)
    .execute();

  return result.resources.map((r: CloudinaryResource) => ({
    publicId: r.public_id,
    width: r.width,
    height: r.height,
    alt: {
      cs: r.context?.alt_cs ?? r.public_id,
      en: r.context?.alt_en ?? r.public_id,
    },
    category: r.context?.category ?? "portréty",
  }));
}

export { cloudinary };
