import { isAuthenticated } from "@/lib/auth";
import {
  getGallery,
  getGalleryPhotos,
  getGallerySelection,
  deleteGallery,
} from "@/modules/gallery/lib/gallery";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [photos, selection] = await Promise.all([
    getGalleryPhotos(slug),
    getGallerySelection(slug),
  ]);

  return NextResponse.json({ gallery, photos, selection });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteGallery(slug);
  return NextResponse.json({ ok: true });
}
