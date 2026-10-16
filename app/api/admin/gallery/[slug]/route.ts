import { requireAdmin } from "@/lib/admin-route";
import { cloudinary } from "@/lib/cloudinary";
import {
  getGallery,
  getGalleryPhotos,
  getGallerySelection,
  deleteGallery,
  setGalleryDelivered,
} from "@/modules/gallery/lib/gallery";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [photos, selection] = await Promise.all([
    getGalleryPhotos(slug),
    getGallerySelection(slug),
  ]);

  return NextResponse.json({ gallery, photos, selection });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.delivered !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await setGalleryDelivered(slug, body.delivered);
  return NextResponse.json({ ok: true });
}

async function deleteCloudinaryPrefix(prefix: string): Promise<void> {
  let partial = true;
  while (partial) {
    const result = await cloudinary.api.delete_resources_by_prefix(prefix);
    partial = Boolean(result?.partial);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await deleteCloudinaryPrefix(`client-galleries/${slug}/`);
  } catch (err) {
    console.error("Cloudinary delete failed", err);
    return NextResponse.json({ error: "Cloudinary delete failed" }, { status: 502 });
  }

  await deleteGallery(slug);
  return NextResponse.json({ ok: true });
}
