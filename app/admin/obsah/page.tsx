import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminShell } from "@/modules/admin/components/AdminShell";
import { ContentEditor } from "@/modules/admin/components/ContentEditor";

export default async function ObsahPage() {
  const photos = await getGalleryPhotos("portfolio");
  return (
    <AdminShell>
      <ContentEditor photos={photos} />
    </AdminShell>
  );
}
