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
 * Cloudinary duotone: strip colour, then map shadows to `shadow` and
 * highlights to `light`. Feed it theme tokens so the photo follows the preset.
 */
export function duotone(shadow: string, light: string): string {
  return `e_grayscale,e_tint:70:rgb:${shadow.slice(1)}:rgb:${light.slice(1)}`;
}

/** `extra` lets a graded image keep the same grade in its blur placeholder. */
export function blurUrl(publicId: string, extra = ""): string {
  return cloudinaryUrl(publicId, `e_blur:1000,q_1,f_webp,w_20${extra && `,${extra}`}`);
}

export function getAlt(photo: GalleryPhoto, locale: string): string {
  return locale === "cs" ? photo.alt.cs : photo.alt.en;
}
