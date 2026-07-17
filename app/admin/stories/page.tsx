import { DM_Sans, DM_Mono } from "next/font/google";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminShell } from "@/modules/admin/components/AdminShell";
import { StoriesAdmin } from "@/modules/stories/components/StoriesAdmin";

const dmSans = DM_Sans({ subsets: ["latin"] });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"] });

export default async function StoriesPage() {
  const photos = await getGalleryPhotos("portfolio");
  return (
    <AdminShell>
      <div style={{
        "--story-font-sans": dmSans.style.fontFamily,
        "--story-font-mono": dmMono.style.fontFamily,
      } as React.CSSProperties}>
        <StoriesAdmin galleryPhotos={photos} />
      </div>
    </AdminShell>
  );
}
