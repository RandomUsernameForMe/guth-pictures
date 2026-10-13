import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-route";

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { publicId } = await request.json();

  const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-/.]+$/;
  if (typeof publicId !== "string" || !publicId.trim() || !CLOUDINARY_ID_RE.test(publicId)) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
  }

  await cloudinary.uploader.destroy(publicId);
  console.log(`[delete] publicId=${publicId}`);
  return NextResponse.json({ ok: true });
}
