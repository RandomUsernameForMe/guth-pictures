import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isAuthenticated } from "@/lib/auth";

export async function POST() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

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
