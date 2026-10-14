import { requireAdmin } from "@/lib/admin-route";
import { getCatalogId, listAlbums } from "@/modules/gallery/lib/lightroom";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const catalogId = await getCatalogId();
    const albums = await listAlbums(catalogId);
    console.log("[albums] catalogId:", catalogId, "count:", albums.length);
    return NextResponse.json({ albums });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[albums] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
