import { getGalleryPhotos } from "@/lib/cloudinary";
import { getImages } from "@/modules/admin/lib/content";
import { AdminDashboard } from "@/modules/admin/components/AdminDashboard";
import { AdminShell } from "@/modules/admin/components/AdminShell";

export default async function FotkyPage() {
  const [photos, images] = await Promise.all([
    getGalleryPhotos("portfolio"),
    getImages(),
  ]);
  return (
    <AdminShell>
      <AdminDashboard photos={photos} heroTriptych={images.heroTriptych} />
    </AdminShell>
  );
}
