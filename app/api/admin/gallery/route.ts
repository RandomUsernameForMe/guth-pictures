import { isAuthenticated } from "@/lib/auth";
import { listGalleriesWithSelection, createGallery } from "@/modules/gallery/lib/gallery";
import { getTokens, getCatalogId } from "@/modules/gallery/lib/lightroom";
import { NextRequest, NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const galleries = await listGalleriesWithSelection();
  return NextResponse.json({ galleries });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    slug?: unknown;
    albumId?: unknown;
    password?: unknown;
    expiryDays?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug, albumId, password, expiryDays } = body;

  if (
    typeof slug !== "string" ||
    typeof albumId !== "string" ||
    typeof password !== "string" ||
    typeof expiryDays !== "number"
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slugClean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!slugClean) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password too short (min 4 chars)" }, { status: 400 });
  }

  const tokens = await getTokens();
  if (!tokens) {
    return NextResponse.json({ error: "Lightroom not connected" }, { status: 400 });
  }

  let catalogId: string;
  try {
    catalogId = await getCatalogId();
  } catch {
    return NextResponse.json({ error: "Failed to reach Lightroom catalog" }, { status: 500 });
  }

  try {
    const gallery = await createGallery({
      slug: slugClean,
      albumId,
      catalogId,
      password,
      expiryDays: Math.max(1, Math.min(365, expiryDays)),
    });
    return NextResponse.json({ gallery }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 409 });
  }
}
