import { AdminShell } from "@/modules/admin/components/AdminShell";
import { GalerieDetail } from "@/modules/admin/components/GalerieDetail";
import { getGallery, getGalleryPhotos, getGallerySelection } from "@/modules/gallery/lib/gallery";
import { notFound } from "next/navigation";

export default async function GalerieDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [gallery, photos, selection] = await Promise.all([
    getGallery(slug),
    getGalleryPhotos(slug),
    getGallerySelection(slug),
  ]);

  if (!gallery) notFound();

  return (
    <AdminShell>
      <GalerieDetail gallery={gallery} photos={photos} selection={selection} />
    </AdminShell>
  );
}
