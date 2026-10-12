import { getGallery, confirmGallerySelection, isExpired } from "@/modules/gallery/lib/gallery";
import { hasGallerySession } from "@/modules/gallery/lib/gallery-session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  if (!(await hasGallerySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isExpired(gallery)) {
    return NextResponse.json({ error: "Gallery expired — selection locked" }, { status: 410 });
  }

  const confirmedAt = await confirmGallerySelection(slug);
  if (!confirmedAt) {
    return NextResponse.json({ error: "Nothing to confirm" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, confirmedAt });
}
