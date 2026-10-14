import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/admin-route";
import { isGalleryCategory } from "@/lib/cloudinary-utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 20 * 1024 * 1024;

function detectMimeType(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  return null;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const detectedType = detectMimeType(buffer);
  if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const folder = (formData.get("folder") as string) || "portfolio";
  const category = formData.get("category") ?? "portréty";
  if (!isGalleryCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  const altCs = (formData.get("alt_cs") as string) ?? "";
  const altEn = (formData.get("alt_en") as string) ?? "";

  const uploadOptions: Record<string, unknown> = { folder };
  if (folder === "portfolio") {
    uploadOptions.context = { alt_cs: altCs, alt_en: altEn, category };
  }

  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(uploadOptions, (err, result) => (err ? reject(err) : resolve(result!)))
      .end(buffer);
  });

  console.log(`[upload] publicId=${result.public_id}, size=${file.size}, type=${detectedType}`);
  return NextResponse.json({ publicId: result.public_id });
}
