import { getGallery, getGalleryPhotos, isExpired } from "@/modules/gallery/lib/gallery";
import { hasGallerySession } from "@/modules/gallery/lib/gallery-session";
import { NextRequest, NextResponse } from "next/server";

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

  if (!(await hasGallerySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await getGalleryPhotos(slug);
  return NextResponse.json({ photos, maxSelection: gallery.maxSelection ?? null,
    delivered: gallery.delivered ?? false,
  });
}
