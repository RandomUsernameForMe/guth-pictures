import {
  getGallery,
  getGalleryPhotos,
  getGallerySelection,
  saveGallerySelection,
  isExpired,
} from "@/modules/gallery/lib/gallery";
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
  if (!(await verifySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const selection = await getGallerySelection(slug);
  return NextResponse.json({ selection });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isExpired(gallery)) {
    return NextResponse.json({ error: "Gallery expired — selection locked" }, { status: 410 });
  }

  if (!(await verifySession(slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { favorites?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!Array.isArray(body.favorites)) {
    return NextResponse.json({ error: "favorites must be array" }, { status: 400 });
  }

  const photos = await getGalleryPhotos(slug);
  const validIds = new Set(photos.map((p) => p.lrId));
  const favorites = (body.favorites as unknown[]).filter(
    (id): id is string => typeof id === "string" && validIds.has(id)
  );

  await saveGallerySelection(slug, favorites);
  return NextResponse.json({ ok: true, count: favorites.length });
}
