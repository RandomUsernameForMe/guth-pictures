import { notFound } from "next/navigation";
import { AdminShell } from "@/modules/admin/components/AdminShell";
import { AdminProposalReview } from "@/modules/brand-shoot/components/AdminProposalReview";
import { getProposal, markReviewed } from "@/modules/brand-shoot/lib/proposals";

export const dynamic = "force-dynamic";

export default async function NavrhReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proposal = await getProposal(slug);
  if (!proposal) notFound();

  // Opening the review IS the review — clears the "nové změny" badge on the list.
  await markReviewed(slug);

  // Never ship the password hash to the client bundle.
  const { passwordHash, ...safe } = proposal;

  return (
    <AdminShell>
      <AdminProposalReview proposal={safe} hasPassword={!!passwordHash} />
    </AdminShell>
  );
}
