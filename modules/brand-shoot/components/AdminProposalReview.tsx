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

const EDIT_FIELDS = [
  ["title", "Titul"],
  ["pitch", "Pitch"],
  ["why", "Proč"],
  ["mood", "Nálada"],
  ["wardrobe", "Oblečení"],
  ["location", "Místo"],
  ["lighting", "Světlo"],
  ["poseDirection", "Pózování"],
] as const;

type EditableField = (typeof EDIT_FIELDS)[number][0];

// Top-level (not nested in AdminProposalReview) so parent re-renders don't remount it mid-typing.
function ConceptEditForm({
  concept,
  busy,
  onSave,
  onCancel,
}: {
  concept: ProposalConcept;
  busy: boolean;
  onSave: (fields: Record<EditableField, string>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(
    () =>
      Object.fromEntries(EDIT_FIELDS.map(([k]) => [k, concept[k] ?? ""])) as Record<
        EditableField,
        string
      >
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="ml-4 space-y-2 border-l border-zinc-800 pl-4 py-2"
    >
      {EDIT_FIELDS.map(([k, label]) => (
        <label key={k} className="block text-xs text-gray-400">
          {label}
          <textarea
            value={draft[k]}
            onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
            rows={k === "title" ? 1 : 2}
            required={k === "title"}
            className="mt-0.5 w-full bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-white resize-y"
          />
        </label>
      ))}
      <div className="flex gap-2">
        <button disabled={busy} className="px-3 py-1 bg-white text-black text-xs font-medium disabled:opacity-40">
          Uložit texty
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs text-gray-400 hover:text-white">
          Zrušit
        </button>
      </div>
    </form>
  );
}

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
  const [editingConcept, setEditingConcept] = useState<string | null>(null);

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

  // Admin picks the one palette shown to the client for this concept.
  async function choosePalette(conceptId: string, paletteId: string) {
    setConcepts((prev) =>
      prev.map((c) => (c.id === conceptId ? { ...c, chosenPaletteId: paletteId } : c))
    );
    await patch({ action: "assign", patch: { chosenPalette: { [conceptId]: paletteId } } });
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

  // Approve every pending item in one PATCH — saves click-per-item on fresh syncs.
  async function approveAllPending(kind: "concepts" | "moodboard" | "poses") {
    if (kind === "concepts") {
      const pend = concepts.filter((c) => c.status === "pending");
      if (!pend.length) return;
      setConcepts((prev) => prev.map((c) => (c.status === "pending" ? { ...c, status: "approved" } : c)));
      await patch({
        action: "approvals",
        patch: { concepts: Object.fromEntries(pend.map((c) => [c.id, "approved"])) },
      });
      return;
    }
    const [items, setter] =
      kind === "moodboard" ? ([moodboard, setMoodboard] as const) : ([poses, setPoses] as const);
    const pend = items.filter((i) => i.status === "pending");
    if (!pend.length) return;
    setter((prev) => prev.map((i) => (i.status === "pending" ? { ...i, status: "approved" } : i)));
    await patch({
      action: "approvals",
      patch: { [kind]: Object.fromEntries(pend.map((i) => [i.cloudinaryId, "approved"])) },
    });
  }

  async function saveConceptEdit(conceptId: string, fields: Record<EditableField, string>) {
    if (await patch({ action: "editConcept", conceptId, fields })) {
      setConcepts((prev) =>
        prev.map((c) => (c.id === conceptId ? { ...c, ...fields, edited: true } : c))
      );
      setEditingConcept(null);
    }
  }

  // Assign an image to a concept (or unassign) — web-managed, persisted across re-syncs.
  async function assignImageConcept(
    kind: "moodboard" | "poses",
    img: ProposalImage,
    setter: typeof setMoodboard,
    concept: string | null
  ) {
    setter((prev) =>
      prev.map((x) =>
        x.cloudinaryId === img.cloudinaryId ? { ...x, concept: concept ?? undefined } : x
      )
    );
    await patch({ action: "assign", patch: { images: { [kind]: { [img.cloudinaryId]: { concept } } } } });
  }

  // Mark an image as its concept's lead/stage portrait (clears any previous hero in that concept).
  async function setImageHero(
    kind: "moodboard" | "poses",
    img: ProposalImage,
    setter: typeof setMoodboard,
    hero: boolean
  ) {
    setter((prev) =>
      prev.map((x) => {
        if (x.cloudinaryId === img.cloudinaryId) return { ...x, hero };
        if (hero && x.concept && x.concept === img.concept) return { ...x, hero: false };
        return x;
      })
    );
    await patch({ action: "assign", patch: { images: { [kind]: { [img.cloudinaryId]: { hero } } } } });
  }

  async function toggleFinalize() {
    const value = !finalized;
    if (await patch({ action: "finalize", finalized: value })) setFinalized(value);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      setMsg("Heslo min. 8 znaků");
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
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((img) => (
          <div key={img.cloudinaryId} className="space-y-1">
            <button
              onClick={() => toggleImage(kind, img, setter)}
              disabled={busy}
              className={`relative block w-full aspect-square overflow-hidden border ${badge[img.status]} group`}
              title={img.note}
            >
              <Image src={thumb(img.cloudinaryId)} alt={img.note ?? ""} fill className="object-cover" sizes="120px" />
              <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-xs bg-black/70 rounded-full">
                {mark[img.status]}
              </span>
              {img.hero && img.concept && (
                <span className="absolute top-1 left-1 px-1 text-[10px] font-medium bg-amber-400 text-black rounded">
                  HERO
                </span>
              )}
            </button>
            <select
              value={img.concept ?? ""}
              onChange={(e) => assignImageConcept(kind, img, setter, e.target.value || null)}
              disabled={busy}
              className="w-full bg-zinc-900 border border-zinc-700 px-1 py-1 text-xs focus:outline-none focus:border-white"
            >
              <option value="">— bez konceptu —</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.title}
                </option>
              ))}
            </select>
            <label
              className={`flex items-center gap-1 text-[11px] ${img.concept ? "text-gray-300" : "text-gray-600"}`}
            >
              <input
                type="checkbox"
                checked={!!img.hero}
                disabled={busy || !img.concept}
                onChange={(e) => setImageHero(kind, img, setter, e.target.checked)}
              />
              hero (titulní)
            </label>
          </div>
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
          {proposal.firstOpenedAt && (
            <p className="text-xs text-gray-500">
              klient otevřel {new Date(proposal.firstOpenedAt).toLocaleString("cs-CZ")}
            </p>
          )}
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

      {/* Client feedback */}
      {(proposal.feedback?.length ?? 0) > 0 && (
        <section className="border border-blue-500/20 p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
            Reakce klienta ({proposal.feedback!.length})
          </h2>
          {proposal.feedback!.map((f, i) => (
            <div key={i} className="text-sm border-l-2 border-blue-400/40 pl-3">
              <p className="text-xs text-gray-500">
                {new Date(f.createdAt).toLocaleString("cs-CZ")}
                {f.conceptId && (
                  <span className="ml-2 text-amber-300">
                    ♥ koncept {f.conceptId} — {concepts.find((c) => c.id === f.conceptId)?.title}
                  </span>
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-gray-200">{f.message}</p>
            </div>
          ))}
        </section>
      )}

      {/* Concepts (each with its own palettes) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Koncepty</h2>
          {concepts.some((c) => c.status === "pending") && (
            <button
              onClick={() => approveAllPending("concepts")}
              disabled={busy}
              className="text-xs px-2 py-1 border border-green-500/40 text-green-300 hover:bg-green-900/30"
            >
              Schválit vše ({concepts.filter((c) => c.status === "pending").length})
            </button>
          )}
        </div>
        <div className="space-y-4">
          {concepts.map((c) => (
            <div key={c.id} className="space-y-2">
              <button
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

              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => setEditingConcept(editingConcept === c.id ? null : c.id)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {editingConcept === c.id ? "Zavřít úpravy" : "Upravit texty"}
                </button>
                {c.edited && <span className="text-[10px] uppercase text-amber-400">upraveno</span>}
              </div>
              {editingConcept === c.id && (
                <ConceptEditForm
                  concept={c}
                  busy={busy}
                  onSave={(fields) => saveConceptEdit(c.id, fields)}
                  onCancel={() => setEditingConcept(null)}
                />
              )}

              {c.palettes.length > 0 && (
                <div className="ml-4 space-y-2 border-l border-zinc-800 pl-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Paleta (vyber jednu pro klienta)
                  </p>
                  {c.palettes.map((p) => {
                    const active = c.chosenPaletteId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => choosePalette(c.id, p.id)}
                        disabled={busy}
                        className={`w-full text-left border px-4 py-2 transition-colors ${
                          active
                            ? "bg-white/10 text-white border-white/60"
                            : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium flex items-center gap-2">
                            <span className="inline-flex rounded overflow-hidden border border-white/10">
                              {p.colors.slice(0, 6).map((col, i) => (
                                <span key={i} style={{ background: col, width: 18, height: 18 }} />
                              ))}
                            </span>
                            {active ? "◉" : "○"} {p.name}
                          </span>
                          {active && <span className="text-xs uppercase text-green-300">zvoleno</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Moodboard */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Moodboard</h2>
          {moodboard.some((i) => i.status === "pending") && (
            <button
              onClick={() => approveAllPending("moodboard")}
              disabled={busy}
              className="text-xs px-2 py-1 border border-green-500/40 text-green-300 hover:bg-green-900/30"
            >
              Schválit vše ({moodboard.filter((i) => i.status === "pending").length})
            </button>
          )}
        </div>
        <ImageGrid kind="moodboard" images={moodboard} setter={setMoodboard} />
      </section>

      {/* Poses */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Pózy</h2>
          {poses.some((i) => i.status === "pending") && (
            <button
              onClick={() => approveAllPending("poses")}
              disabled={busy}
              className="text-xs px-2 py-1 border border-green-500/40 text-green-300 hover:bg-green-900/30"
            >
              Schválit vše ({poses.filter((i) => i.status === "pending").length})
            </button>
          )}
        </div>
        <ImageGrid kind="poses" images={poses} setter={setPoses} />
      </section>

      <p className="text-xs text-gray-600">Klikem přepínáte: pending → approved → rejected → pending.</p>

      <button onClick={remove} disabled={busy} className="text-sm text-red-400 hover:text-red-300">
        Smazat návrh
      </button>
    </div>
  );
}
