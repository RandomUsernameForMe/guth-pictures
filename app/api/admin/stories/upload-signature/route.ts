import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-route";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    console.error("[stories/upload-signature] CLOUDINARY_API_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "stories";
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, secret);

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder,
  });
}
