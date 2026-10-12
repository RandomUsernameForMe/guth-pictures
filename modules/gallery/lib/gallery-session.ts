import { cookies } from "next/headers";
import { verifyGalleryToken, galleryCookieName } from "./gallery-auth";
import { getGallery } from "./gallery";

export async function hasGallerySession(slug: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(galleryCookieName(slug))?.value;
  if (!token) return false;
  const gallery = await getGallery(slug);
  if (!gallery) return false;
  return verifyGalleryToken(token, slug, Date.parse(gallery.createdAt));
}
