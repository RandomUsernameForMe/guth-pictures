import { getGallery, getGalleryPhotos, isExpired } from "@/modules/gallery/lib/gallery";
import { verifyGalleryToken, galleryCookieName } from "@/modules/gallery/lib/gallery-auth";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function verifySession(slug: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(galleryCookieName(slug))?.value;
  if (!token) return false;
  return verifyGalleryToken(token, slug);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isExpired(gallery)) {
    return NextResponse.json({ error: "Gallery expired" }, { status: 410 });
  }

  if (!(await verifySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await getGalleryPhotos(slug);
  return NextResponse.json({ photos, maxSelection: gallery.maxSelection ?? null });
}
