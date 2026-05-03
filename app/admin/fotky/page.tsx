import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminDashboard } from "@/modules/admin/components/AdminDashboard";
import { AdminShell } from "@/modules/admin/components/AdminShell";

export default async function FotkyPage() {
  const photos = await getGalleryPhotos("portfolio");
  return (
    <AdminShell>
      <AdminDashboard photos={photos} />
    </AdminShell>
  );
}
