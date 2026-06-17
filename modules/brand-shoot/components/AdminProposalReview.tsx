"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type {
  ProposalRecord,
  ProposalStatus,
  ProposalImage,
  ProposalConcept,
} from "@/modules/brand-shoot/lib/types";

type SafeProposal = Omit<ProposalRecord, "passwordHash">;

const next: Record<ProposalStatus, ProposalStatus> = {
  pending: "approved",
  approved: "rejected",
  rejected: "pending",
};

const badge: Record<ProposalStatus, string> = {
  approved: "bg-green-900/50 text-green-300 border-green-500/40",
  rejected: "bg-red-900/40 text-red-300 border-red-500/40",
  pending: "bg-white/5 text-gray-400 border-white/10",
};

const mark: Record<ProposalStatus, string> = { approved: "✓", rejected: "✗", pending: "•" };

export function AdminProposalReview({
  proposal,
  hasPassword,
}: {
  proposal: SafeProposal;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const [concepts, setConcepts] = useState(proposal.concepts);
  const [moodboard, setMoodboard] = useState(proposal.moodboard);
  const [poses, setPoses] = useState(proposal.poses);
  const [finalized, setFinalized] = useState(proposal.finalized);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/proposals/${proposal.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error ?? "Chyba");
        return false;
      }
      return true;
    } catch {
      setMsg("Chyba sítě");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function toggleConcept(c: ProposalConcept) {
    const status = next[c.status];
    setConcepts((prev) => prev.map((x) => (x.id === c.id ? { ...x, status } : x)));
    await patch({ action: "approvals", patch: { concepts: { [c.id]: status } } });
  }

  async function toggleImage(
    kind: "moodboard" | "poses",
    img: ProposalImage,
    setter: typeof setMoodboard
  ) {
    const status = next[img.status];
    setter((prev) =>
      prev.map((x) => (x.cloudinaryId === img.cloudinaryId ? { ...x, status } : x))
    );
    await patch({ action: "approvals", patch: { [kind]: { [img.cloudinaryId]: status } } });
  }

  async function toggleFinalize() {
    const value = !finalized;
    if (await patch({ action: "finalize", finalized: value })) setFinalized(value);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 4) {
      setMsg("Heslo min. 4 znaky");
      return;
    }
    if (await patch({ action: "password", password: pw })) {
      setPw("");
      setMsg("Heslo uloženo");
      router.refresh();
    }
  }

  async function remove() {
    if (!confirm(`Smazat návrh "${proposal.name}"? Nelze vrátit.`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/proposals/${proposal.slug}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/admin/navrhy");
  }

  function copyClientUrl() {
    const url = `${window.location.origin}/${proposal.locale}/navrh/${proposal.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const thumb = (id: string) => cloudinaryUrl(id, "c_fill,w_300,h_300,q_auto,f_auto");

  function ImageGrid({
    kind,
    images,
    setter,
  }: {
    kind: "moodboard" | "poses";
    images: ProposalImage[];
    setter: typeof setMoodboard;
  }) {
    if (!images.length) return <p className="text-sm text-gray-600">Žádné snímky.</p>;
    return (
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {images.map((img) => (
          <button
            key={img.cloudinaryId}
            onClick={() => toggleImage(kind, img, setter)}
            disabled={busy}
            className={`relative aspect-square overflow-hidden border ${badge[img.status]} group`}
            title={img.note}
          >
            <Image src={thumb(img.cloudinaryId)} alt={img.note ?? ""} fill className="object-cover" sizes="120px" />
            <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-xs bg-black/70 rounded-full">
              {mark[img.status]}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">{proposal.name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {proposal.slug} · {proposal.locale.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyClientUrl}
            className="px-3 py-1.5 text-sm border border-white/15 hover:border-white/40 transition-colors"
          >
            {copied ? "✓ zkopírováno" : "Kopírovat odkaz pro klienta"}
          </button>
          <button
            onClick={toggleFinalize}
            disabled={busy}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              finalized ? "bg-green-700 text-white hover:bg-green-600" : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {finalized ? "Finalizováno ✓" : "Finalizovat"}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-amber-300">{msg}</p>}

      {/* Password */}
      <section className="border border-white/10 p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          Heslo {hasPassword ? <span className="text-green-400">(nastaveno)</span> : <span className="text-yellow-400">(nenastaveno)</span>}
        </h2>
        <form onSubmit={savePassword} className="flex gap-2">
          <input
            type="text"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={hasPassword ? "Nové heslo…" : "Heslo pro klienta…"}
            className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
          />
          <button disabled={busy || !pw} className="px-4 bg-white text-black text-sm font-medium disabled:opacity-40">
            Uložit
          </button>
        </form>
      </section>

      {/* Concepts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Koncepty</h2>
        <div className="space-y-2">
          {concepts.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleConcept(c)}
              disabled={busy}
              className={`w-full text-left border px-4 py-3 transition-colors ${badge[c.status]}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {mark[c.status]} {c.id} — {c.title}
                </span>
                <span className="text-xs uppercase">{c.status}</span>
              </div>
              {c.pitch && <p className="text-xs opacity-80 mt-1">{c.pitch}</p>}
            </button>
          ))}
        </div>
      </section>

      {/* Moodboard */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Moodboard</h2>
        <ImageGrid kind="moodboard" images={moodboard} setter={setMoodboard} />
      </section>

      {/* Poses */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Pózy</h2>
        <ImageGrid kind="poses" images={poses} setter={setPoses} />
      </section>

      <p className="text-xs text-gray-600">Klikem přepínáte: pending → approved → rejected → pending.</p>

      <button onClick={remove} disabled={busy} className="text-sm text-red-400 hover:text-red-300">
        Smazat návrh
      </button>
    </div>
  );
}
