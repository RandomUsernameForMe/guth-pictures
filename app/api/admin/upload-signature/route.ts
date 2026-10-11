import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isAuthenticated } from "@/lib/auth";
import { isGalleryCategory } from "@/lib/cloudinary-utils";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) {
    console.error("[upload-signature] CLOUDINARY_API_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let body: { altCs?: unknown; altEn?: unknown; category?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Strip Cloudinary context delimiter characters (| and =) to prevent context injection
  const sanitizeContext = (v: string) => v.replace(/[|=]/g, "");
  const altCs = sanitizeContext(typeof body.altCs === "string" ? body.altCs : "");
  const altEn = sanitizeContext(typeof body.altEn === "string" ? body.altEn : "");
  const category = body.category ?? "portréty";
  if (!isGalleryCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "portfolio";
    const context = `alt_cs=${altCs}|alt_en=${altEn}|category=${category}`;

    const signature = cloudinary.utils.api_sign_request(
      { folder, context, timestamp },
      secret
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      folder,
      context,
    });
  } catch (err) {
    console.error("[upload-signature] Failed to generate signature:", err);
    return NextResponse.json({ error: "Signature failed" }, { status: 500 });
  }
}
