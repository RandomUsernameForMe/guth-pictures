import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function FotkyPage() {
  const photos = await getGalleryPhotos("portfolio");
  return (
    <AdminShell>
      <AdminDashboard photos={photos} />
    </AdminShell>
  );
}
