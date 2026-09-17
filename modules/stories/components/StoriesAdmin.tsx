"use client";

import { useEffect, useState, useCallback } from "react";
import type { GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft, StoryTextEntry, QueueItem } from "../lib/types";
import { DraftCard } from "./DraftCard";

type Tab = "drafts" | "queue" | "texts";

export function StoriesAdmin({ galleryPhotos }: { galleryPhotos: GalleryPhoto[] }) {
  const [tab, setTab] = useState<Tab>("drafts");
  const [drafts, setDrafts] = useState<StoryDraft[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [texts, setTexts] = useState<StoryTextEntry[]>([]);
  const [newText, setNewText] = useState({ template: "C", headline: "", sub: "", words: "", subHeadline: "" });

  const reload = useCallback(async () => {
    const [d, q, t] = await Promise.all([
      fetch("/api/admin/stories/drafts").then(r => r.json()),
      fetch("/api/admin/stories/queue").then(r => r.json()),
      fetch("/api/admin/stories/texts").then(r => r.json()),
    ]);
    setDrafts(d.drafts ?? []);
    setQueue(q.queue ?? []);
    setTexts(t.texts ?? []);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function addManualDraft() {
    await fetch("/api/admin/stories/drafts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: "C" }),
    });
    await reload();
  }

  async function addText() {
    const body = newText.template === "C"
      ? { template: "C", headline: newText.headline, sub: newText.sub }
      : { template: "D", words: newText.words.split(",").map(w => w.trim()).filter(Boolean), subHeadline: newText.subHeadline };
    await fetch("/api/admin/stories/texts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setNewText({ template: "C", headline: "", sub: "", words: "", subHeadline: "" });
    await reload();
  }

  async function updateText(text: StoryTextEntry) {
    await fetch("/api/admin/stories/texts", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
    });
    await reload();
  }

  const tabBtn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)}
      className={`px-4 py-2 text-sm font-medium ${tab === t ? "bg-white text-black" : "text-gray-400 border border-white/10 hover:text-white"}`}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex gap-1 mb-8">
        {tabBtn("drafts", `Návrhy (${drafts.length})`)}
        {tabBtn("queue", `Fronta (${queue.filter(q => q.status === "queued").length})`)}
        {tabBtn("texts", "Texty")}
      </div>

      {tab === "drafts" && (
        <div className="space-y-6">
          <button onClick={addManualDraft} className="text-sm border border-white/20 px-3 py-1.5 hover:border-white/50">
            + Nový návrh
          </button>
          {drafts.map(d => (
            <DraftCard key={d.id} draft={d} galleryPhotos={galleryPhotos} onChanged={reload} />
          ))}
          {drafts.length === 0 && <p className="text-gray-500 text-sm">Žádné návrhy. Cron je generuje v pondělí ráno.</p>}
        </div>
      )}

      {tab === "queue" && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500">
            <th className="py-2">Video</th><th>Publikace</th><th>Stav</th><th></th>
          </tr></thead>
          <tbody>
            {queue.map(item => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="py-2 font-mono text-xs">{item.videoPublicId}</td>
                <td>{new Date(item.publishAt).toLocaleString("cs-CZ")}</td>
                <td>
                  {item.status === "queued" && <span className="text-amber-400">ve frontě</span>}
                  {item.status === "published" && <span className="text-green-400">publikováno</span>}
                  {item.status === "failed" && <span className="text-red-400" title={item.error}>chyba: {item.error}</span>}
                </td>
                <td className="text-right space-x-2">
                  {item.status === "failed" && (
                    <button className="text-xs border border-white/20 px-2 py-1"
                      onClick={async () => {
                        await fetch("/api/admin/stories/queue", {
                          method: "PUT", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: item.id }),
                        });
                        await reload();
                      }}>
                      Znovu
                    </button>
                  )}
                  <button className="text-xs text-gray-500 hover:text-red-400"
                    onClick={async () => {
                      await fetch(`/api/admin/stories/queue?id=${item.id}`, { method: "DELETE" });
                      await reload();
                    }}>
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "texts" && (
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2 border border-white/10 p-4">
            <select value={newText.template} onChange={e => setNewText({ ...newText, template: e.target.value })}
              className="bg-zinc-900 border border-white/20 px-2 py-1 text-sm">
              <option value="C">Šablona C (headline)</option>
              <option value="D">Šablona D (slova)</option>
            </select>
            {newText.template === "C" ? (
              <>
                <input placeholder="Headline (\n = nový řádek)" value={newText.headline}
                  onChange={e => setNewText({ ...newText, headline: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
                <input placeholder="Podtitulek" value={newText.sub}
                  onChange={e => setNewText({ ...newText, sub: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
              </>
            ) : (
              <>
                <input placeholder="Slova oddělená čárkou (Portréty., Svatby., …)" value={newText.words}
                  onChange={e => setNewText({ ...newText, words: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
                <input placeholder="Podtitulek" value={newText.subHeadline}
                  onChange={e => setNewText({ ...newText, subHeadline: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
              </>
            )}
            <button onClick={addText} className="text-sm border border-white/20 px-3 py-1.5 hover:border-white/50">Přidat</button>
          </div>

          {texts.map(t => (
            <div key={t.id} className="flex items-center justify-between border-t border-white/10 py-2 text-sm">
              <div>
                <span className="text-gray-500 font-mono text-xs mr-2">[{t.template}{t.source === "ai" ? " · AI" : ""}]</span>
                {t.template === "C" ? `${t.headline?.replace("\n", " / ")} — ${t.sub}` : `${t.words?.join(" ")} — ${t.subHeadline}`}
              </div>
              <div className="space-x-2">
                {!t.approved && (
                  <button className="text-xs text-green-400" onClick={() => updateText({ ...t, approved: true })}>Schválit</button>
                )}
                <button className="text-xs text-gray-500 hover:text-red-400"
                  onClick={async () => {
                    await fetch(`/api/admin/stories/texts?id=${t.id}`, { method: "DELETE" });
                    await reload();
                  }}>
                  Smazat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
