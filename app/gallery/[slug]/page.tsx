import { getGallery, isExpired } from "@/modules/gallery/lib/gallery";
import { GalleryClient } from "@/modules/gallery/components/GalleryClient";
import { notFound } from "next/navigation";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) notFound();

  const expired = isExpired(gallery);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {expired ? (
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Galerie vypršela</p>
            <p className="text-sm text-gray-500">
              Tato galerie již není dostupná. Kontaktujte fotografa.
            </p>
          </div>
        </div>
      ) : (
        <GalleryClient slug={slug} />
      )}
    </main>
  );
}
