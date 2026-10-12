import { cookies } from "next/headers";
import { verifyGalleryToken, galleryCookieName } from "./gallery-auth";

export async function hasGallerySession(slug: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(galleryCookieName(slug))?.value;
  if (!token) return false;
  return verifyGalleryToken(token, slug);
}
