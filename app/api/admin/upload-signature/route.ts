import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { altCs, altEn, category } = await request.json();

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "portfolio";
  const context = `alt_cs=${altCs ?? ""}|alt_en=${altEn ?? ""}|category=${category ?? "portréty"}`;

  const signature = cloudinary.utils.api_sign_request(
    { folder, context, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder,
    context,
  });
}
