import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getProposal, isExpired, toPublicProposal } from "@/modules/brand-shoot/lib/proposals";
import { verifyProposalToken, proposalCookieName } from "@/modules/brand-shoot/lib/proposal-auth";
import { ProposalGate } from "@/modules/brand-shoot/components/ProposalGate";
import { ProposalView } from "@/modules/brand-shoot/components/ProposalView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function hasSession(slug: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(proposalCookieName(slug))?.value;
  if (!token) return false;
  return verifyProposalToken(token, slug);
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const proposal = await getProposal(slug);
  if (!proposal) notFound();

  const t = await getTranslations({ locale, namespace: "brand-shoot" });

  if (isExpired(proposal)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-[var(--color-text)]">{t("expiredTitle")}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{t("expiredBody")}</p>
        </div>
      </main>
    );
  }

  if (!(await hasSession(slug))) {
    return <ProposalGate slug={slug} clientName={proposal.name} />;
  }

  return <ProposalView proposal={toPublicProposal(proposal)} />;
}
