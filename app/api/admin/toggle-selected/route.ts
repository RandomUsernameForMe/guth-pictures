import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-route";

const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-/.]+$/;

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { publicId, selected } = await request.json();

  if (typeof publicId !== "string" || !publicId.trim() || !CLOUDINARY_ID_RE.test(publicId)) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
  }
  if (typeof selected !== "boolean") {
    return NextResponse.json({ error: "Invalid selected" }, { status: 400 });
  }

  if (selected) {
    await cloudinary.uploader.add_tag("selected_work", [publicId]);
  } else {
    await cloudinary.uploader.remove_tag("selected_work", [publicId]);
  }

  return NextResponse.json({ ok: true });
}
