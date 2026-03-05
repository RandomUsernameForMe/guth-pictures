import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isAuthenticated } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const category = (formData.get("category") as string) ?? "portréty";
  const altCs = (formData.get("alt_cs") as string) ?? "";
  const altEn = (formData.get("alt_en") as string) ?? "";

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "portfolio",
          context: { alt_cs: altCs, alt_en: altEn, category },
        },
        (err, result) => (err ? reject(err) : resolve(result!))
      )
      .end(buffer);
  });

  return NextResponse.json({ publicId: result.public_id });
}
