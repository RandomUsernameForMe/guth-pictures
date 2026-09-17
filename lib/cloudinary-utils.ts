// Klientsky bezpečné utility — žádný import cloudinary SDK

export const CATEGORIES = ["portréty", "svatby"] as const;
export type Category = (typeof CATEGORIES)[number];

export type GalleryPhoto = {
  publicId: string;
  width: number;
  height: number;
  alt: { cs: string; en: string };
  category: "portréty" | "svatby" | "larpy";
  selected?: boolean;
};

export function cloudinaryUrl(publicId: string, transformation = ""): string {
  const base = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  return transformation ? `${base}/${transformation}/${publicId}` : `${base}/${publicId}`;
}

/**
 * Profile portrait. The original is warm and yellow, which fights the palette,
 * so it comes down a notch in saturation. Tune the number, not the pipeline.
 */
export const PROFILE_TRANSFORM = "w_560,c_fill,g_face,e_saturation:-30,q_auto,f_auto";

export function blurUrl(publicId: string): string {
  return cloudinaryUrl(publicId, "e_blur:1000,q_1,f_webp,w_20");
}

export function getAlt(photo: GalleryPhoto, locale: string): string {
  return locale === "cs" ? photo.alt.cs : photo.alt.en;
}
