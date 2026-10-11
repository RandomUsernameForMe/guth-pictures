// Klientsky bezpečné utility — žádný import cloudinary SDK

export const CATEGORIES = ["portréty", "svatby"] as const;
export type Category = (typeof CATEGORIES)[number];

export const GALLERY_CATEGORIES = ["portréty", "svatby", "larpy"] as const;
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export type GalleryPhoto = {
  publicId: string;
  width: number;
  height: number;
  alt: { cs: string; en: string };
  category: GalleryCategory;
  selected?: boolean;
};

export type CloudinaryResource = {
  public_id: string;
  width: number;
  height: number;
  context?: { alt_cs?: string; alt_en?: string; category?: string };
  tags?: string[];
};

const altFallback: Record<GalleryCategory, { cs: string; en: string }> = {
  "portréty": { cs: "Portrétní fotografie — Guth Pictures", en: "Portrait photography — Guth Pictures" },
  svatby: { cs: "Svatební fotografie — Guth Pictures", en: "Wedding photography — Guth Pictures" },
  larpy: { cs: "Larpová fotografie — Guth Pictures", en: "Larp photography — Guth Pictures" },
};

export function isGalleryCategory(v: unknown): v is GalleryCategory {
  return (GALLERY_CATEGORIES as readonly unknown[]).includes(v);
}

// Kategorie z Cloudinary contextu není validovaná — neznámá spadne na "portréty"
export function toGalleryPhoto(r: CloudinaryResource): GalleryPhoto {
  const category = isGalleryCategory(r.context?.category) ? r.context.category : "portréty";
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
}

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
