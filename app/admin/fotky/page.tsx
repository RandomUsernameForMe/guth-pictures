import { getGalleryPhotos } from "@/lib/cloudinary";
import { getImages } from "@/modules/admin/lib/content";
import { AdminDashboard } from "@/modules/admin/components/AdminDashboard";
import { AdminShell } from "@/modules/admin/components/AdminShell";

function normalizeSlot(slot: unknown): string[] {
  return Array.isArray(slot) ? slot.filter((s): s is string => typeof s === "string") : [];
}

export default async function FotkyPage() {
  const [photos, images] = await Promise.all([
    getGalleryPhotos("portfolio"),
    getImages(),
  ]);
  const raw = images.heroTriptych as unknown;
  const heroTriptych: [string[], string[], string[]] | undefined =
    Array.isArray(raw) && raw.length === 3
      ? [normalizeSlot(raw[0]), normalizeSlot(raw[1]), normalizeSlot(raw[2])]
      : undefined;
  return (
    <AdminShell>
      <AdminDashboard photos={photos} heroTriptych={heroTriptych} />
    </AdminShell>
  );
}
