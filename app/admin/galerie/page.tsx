import { AdminShell } from "@/modules/admin/components/AdminShell";
import { GalerieList } from "@/modules/admin/components/GalerieList";
import { listGalleriesWithSelection } from "@/modules/gallery/lib/gallery";
import { getTokens } from "@/modules/gallery/lib/lightroom";

export default async function GaleriePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const [galleries, tokens, sp] = await Promise.all([
    listGalleriesWithSelection(),
    getTokens(),
    searchParams,
  ]);

  return (
    <AdminShell>
      <GalerieList
        galleries={galleries}
        lrConnected={!!tokens}
        flashConnected={sp.connected === "1"}
        flashError={sp.error}
      />
    </AdminShell>
  );
}
