// Klientsky bezpečné utility — žádný import cloudinary SDK

export type GalleryPhoto = {
  publicId: string;
  width: number;
  height: number;
  alt: { cs: string; en: string };
  category: "portréty" | "svatby" | "larpy";
};

export function cloudinaryUrl(publicId: string, transformation = ""): string {
  const base = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  return transformation ? `${base}/${transformation}/${publicId}` : `${base}/${publicId}`;
}

export function blurUrl(publicId: string): string {
  return cloudinaryUrl(publicId, "e_blur:1000,q_1,f_webp,w_20");
}
