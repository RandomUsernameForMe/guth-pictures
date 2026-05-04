import { isAuthenticated } from "@/lib/auth";
import { getGallery, getGallerySelection } from "@/modules/gallery/lib/gallery";
import { addKeywordToAsset } from "@/modules/gallery/lib/lightroom";
import { NextRequest, NextResponse } from "next/server";

const KEYWORD = "client-selected";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const [gallery, selection] = await Promise.all([getGallery(slug), getGallerySelection(slug)]);

  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!selection?.favorites.length) {
    return NextResponse.json({ error: "No favorites to tag" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    selection.favorites.map((lrId) =>
      addKeywordToAsset(gallery.catalogId, lrId, KEYWORD)
    )
  );

  const tagged = results.filter((r) => r.status === "fulfilled").length;
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));

  return NextResponse.json({ tagged, failed: errors.length, errors: errors.slice(0, 10) });
}
