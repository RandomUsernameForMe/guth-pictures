import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isAuthenticated } from "@/lib/auth";

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { publicId } = await request.json();
  await cloudinary.uploader.destroy(publicId);
  return NextResponse.json({ ok: true });
}
