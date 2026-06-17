import { AdminShell } from "@/modules/admin/components/AdminShell";
import { AdminProposalList } from "@/modules/brand-shoot/components/AdminProposalList";
import { listProposals } from "@/modules/brand-shoot/lib/proposals";

export const dynamic = "force-dynamic";

export default async function NavrhyPage() {
  const proposals = await listProposals();
  return (
    <AdminShell>
      <AdminProposalList
        proposals={proposals.map((p) => ({
          slug: p.slug,
          name: p.name,
          locale: p.locale,
          finalized: p.finalized,
          hasPassword: !!p.passwordHash,
          approvedConcepts: p.concepts.filter((c) => c.status === "approved").length,
          conceptCount: p.concepts.length,
          syncedAt: p.syncedAt,
        }))}
      />
    </AdminShell>
  );
}
