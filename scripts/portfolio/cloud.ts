import { v2 as cloudinary } from "cloudinary";
import type { Category, WebPhoto } from "./core";

const FOLDER = "portfolio";

export function configureCloudinary(): void {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Chybí CLOUDINARY_* v .env.local — spusť `vercel env pull .env.local`");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

type Resource = { public_id: string; context?: { shoot?: string } };

export async function listWebPhotos(): Promise<WebPhoto[]> {
  // ponytail: jedna stránka (500); přidej next_cursor, kdyby portfolio někdy přerostlo
  const res = await cloudinary.search
    .expression(`folder:${FOLDER}`)
    .with_field("context")
    .max_results(500)
    .execute();
  return res.resources.map((r: Resource) => ({ publicId: r.public_id, shoot: r.context?.shoot }));
}

export async function uploadPhoto(
  buf: Buffer,
  ctx: { shoot: string; category: Category; alt_cs: string; alt_en: string },
): Promise<string> {
  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: FOLDER, context: ctx }, (err, r) => (err || !r ? reject(err) : resolve(r)))
      .end(buf);
  });
  return result.public_id;
}
