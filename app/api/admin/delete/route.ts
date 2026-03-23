import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isAuthenticated } from "@/lib/auth";

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publicId } = await request.json();

  const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-/.]+$/;
  if (typeof publicId !== "string" || !publicId.trim() || !CLOUDINARY_ID_RE.test(publicId)) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
  }

  await cloudinary.uploader.destroy(publicId);
  return NextResponse.json({ ok: true });
}
