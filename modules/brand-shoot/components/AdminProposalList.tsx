"use client";

import Link from "next/link";

interface ListItem {
  slug: string;
  name: string;
  locale: string;
  finalized: boolean;
  hasPassword: boolean;
  approvedConcepts: number;
  conceptCount: number;
  syncedAt?: string;
  feedbackCount: number;
  firstOpenedAt?: string;
  hasNewChanges: boolean;
}

export function AdminProposalList({ proposals }: { proposals: ListItem[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Návrhy focení</h1>
        <p className="text-sm text-gray-400 mt-1">
          Návrhy se sem nahrávají ze skillu brand-shoot-prep. Schvalte koncepty a snímky, nastavte
          heslo a předejte klientovi odkaz.
        </p>
      </div>

      {proposals.length === 0 ? (
        <p className="text-sm text-gray-500">
          Zatím žádné návrhy. Spusťte sync z brand-shoot-prep (<code>npm run sync &lt;slug&gt;</code>).
        </p>
      ) : (
        <div className="grid gap-3">
          {proposals.map((p) => (
            <Link
              key={p.slug}
              href={`/admin/navrhy/${p.slug}`}
              className="flex items-center justify-between border border-white/10 hover:border-white/30 px-4 py-3 transition-colors"
            >
              <div>
                <div className="font-medium flex items-center gap-2">
                  {p.name}
                  <span className="text-xs uppercase text-gray-500">{p.locale}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {p.approvedConcepts}/{p.conceptCount} konceptů schváleno
                  {p.syncedAt && ` · sync ${new Date(p.syncedAt).toLocaleDateString("cs-CZ")}`}
                  {p.firstOpenedAt &&
                    ` · klient otevřel ${new Date(p.firstOpenedAt).toLocaleDateString("cs-CZ")}`}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {p.hasNewChanges && (
                  <span className="px-2 py-0.5 bg-amber-900/40 text-amber-300">nové změny</span>
                )}
                {p.feedbackCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300">💬 {p.feedbackCount}</span>
                )}
                {p.hasPassword ? (
                  <span className="px-2 py-0.5 bg-white/10 text-gray-300">🔒 heslo</span>
                ) : (
                  <span className="px-2 py-0.5 bg-yellow-900/40 text-yellow-300">bez hesla</span>
                )}
                {p.finalized ? (
                  <span className="px-2 py-0.5 bg-green-900/40 text-green-300">finalizováno</span>
                ) : (
                  <span className="px-2 py-0.5 bg-white/5 text-gray-400">koncept</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
