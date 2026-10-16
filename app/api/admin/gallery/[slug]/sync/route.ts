import { requireAdmin } from "@/lib/admin-route";
import { getGallery, getGalleryPhotos, pruneGallerySelection, setGalleryPhotos, updateGallerySyncState, type GalleryPhoto } from "@/modules/gallery/lib/gallery";
import { getAlbumAssets, getAssetRenditionStream } from "@/modules/gallery/lib/lightroom";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadStreamToCloudinary(
  stream: ReadableStream<Uint8Array>,
  publicId: string
): Promise<{ publicId: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No upload result"));
        resolve({ publicId: result.public_id, width: result.width, height: result.height });
      }
    );

    const reader = stream.getReader();
    function pump() {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            uploadStream.end();
            return;
          }
          uploadStream.write(value);
          pump();
        })
        .catch(reject);
    }
    pump();
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let assets;
  try {
    assets = await getAlbumAssets(gallery.catalogId, gallery.albumId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: `Lightroom fetch failed: ${msg}` }, { status: 500 });
  }

  const previousById = new Map((await getGalleryPhotos(slug)).map((p) => [p.lrId, p]));
  const CONCURRENCY = 4;
  const resultsById = new Map<string, GalleryPhoto>();
  let synced = 0;
  const errors: string[] = [];

  for (let i = 0; i < assets.length; i += CONCURRENCY) {
    const batch = assets.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (asset) => {
        const publicId = `client-galleries/${slug}/${asset.id}`;
        const stream = await getAssetRenditionStream(gallery.catalogId, asset.id, "2048");
        const uploaded = await uploadStreamToCloudinary(stream, publicId);
        return {
          lrId: asset.id,
          cloudinaryId: uploaded.publicId,
          filename: asset.filename,
          width: uploaded.width,
          height: uploaded.height,
        } satisfies GalleryPhoto;
      })
    );

    results.forEach((result, j) => {
      if (result.status === "fulfilled") {
        resultsById.set(batch[j].id, result.value);
        synced++;
        return;
      }
      errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
      const previous = previousById.get(batch[j].id);
      if (previous) resultsById.set(batch[j].id, previous);
    });
  }

  const photos = assets.flatMap((asset) => resultsById.get(asset.id) ?? []);

  await setGalleryPhotos(slug, photos);
  await pruneGallerySelection(slug, new Set(photos.map((p) => p.lrId)));
  await updateGallerySyncState(slug, photos.length);

  return NextResponse.json({
    synced,
    failed: errors.length,
    errors: errors.slice(0, 10),
  });
}
