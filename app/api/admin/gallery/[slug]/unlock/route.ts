import { isAuthenticated } from "@/lib/auth";
import { getGallery, unlockGallerySelection } from "@/modules/gallery/lib/gallery";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await unlockGallerySelection(slug);
  return NextResponse.json({ ok: true });
}
