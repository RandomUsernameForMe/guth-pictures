"use client";

import { useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft } from "../lib/types";
import { TemplateC } from "./story/TemplateC";
import { TemplateD } from "./story/TemplateD";
import { useExport } from "./story/useExport";
import type { Photo } from "./story/types";

const W = 1080;
const H = 1920;
const PREVIEW_SCALE = 420 / H;

export function DraftCard({ draft, galleryPhotos, onChanged }: {
  draft: StoryDraft;
  galleryPhotos: GalleryPhoto[];
  onChanged: () => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [publishAt, setPublishAt] = useState("");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportTick, setExportTick] = useState<number | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [chromePreview, setChromePreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportVideo } = useExport();

  const duration = d.durationMs ?? 2400;
  const lang = d.lang ?? "cs";

  const photos: Photo[] = d.photos.map(p => ({
    url: cloudinaryUrl(p.publicId, "w_1080,h_1920,c_fill,q_auto,f_jpg"),
    x: p.x, y: p.y,
  }));

  const slideCount = d.template === "C"
    ? Math.max(d.photos.length, 1)
    : Math.max(d.words.filter(Boolean).length, 1);

  const templateProps = { photos, duration, paused, lang, chrome: false };
  const previewProps = { ...templateProps, chrome: chromePreview };

  function patch(p: Partial<StoryDraft>) { setD(prev => ({ ...prev, ...p })); }

  async function save() {
    await fetch("/api/admin/stories/drafts", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: d }),
    });
    await onChanged();
  }

  async function remove() {
    await fetch(`/api/admin/stories/drafts?id=${d.id}`, { method: "DELETE" });
    await onChanged();
  }

  const setSlide = useCallback(async (i: number) => {
    flushSync(() => setExportTick(i));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, []);

  const canRender = d.photos.length > 0 && !exporting && !(d.template === "D" && d.words.filter(Boolean).length === 0);

  async function renderVideo(): Promise<Blob> {
    return exportVideo(exportRef.current!, {
      slideCount,
      photoCount: Math.max(photos.length, 1),
      slideDurationMs: duration,
      setSlide,
      onProgress: setProgress,
    });
  }

  async function downloadMp4() {
    if (!canRender) return;
    setExporting(true);
    try {
      const blob = await renderVideo();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-${d.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export selhal: ${err instanceof Error ? err.message : err}`);
    } finally {
      setExporting(false);
      setProgress(0);
      setExportTick(undefined);
    }
  }

  async function uploadFromDisk(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const sig = await fetch("/api/admin/stories/upload-signature", { method: "POST" }).then(r => r.json());
      const uploadedIds: string[] = [];
      for (const file of Array.from(files).slice(0, 6 - d.photos.length)) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: form },
        ).then(r => r.json());
        if (!res.public_id) throw new Error(res.error?.message ?? "Upload failed");
        uploadedIds.push(res.public_id);
      }
      patch({ photos: [...d.photos, ...uploadedIds.map(publicId => ({ publicId, x: 50, y: 50 }))] });
    } catch (err) {
      alert(`Nahrání selhalo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function approve() {
    if (!publishAt || !canRender) return;
    setExporting(true);
    try {
      // 1. render videa v prohlížeči
      const blob = await renderVideo();

      // 2. signed direct upload do Cloudinary (video)
      const sig = await fetch("/api/admin/stories/upload-signature", { method: "POST" }).then(r => r.json());
      const form = new FormData();
      form.append("file", blob, `story-${d.id}.mp4`);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      const uploaded = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`,
        { method: "POST", body: form },
      ).then(r => r.json());
      if (!uploaded.public_id) throw new Error(uploaded.error?.message ?? "Upload failed");

      // 3. přesun do fronty
      const res = await fetch("/api/admin/stories/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: d.id,
          videoPublicId: uploaded.public_id,
          publishAt: new Date(publishAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await onChanged();
    } catch (err) {
      alert(`Schválení selhalo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setExporting(false);
      setProgress(0);
      setExportTick(undefined);
    }
  }

  return (
    <div className="flex gap-6 border border-white/10 p-4">
      {/* preview */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-lg cursor-pointer"
          style={{ width: W * PREVIEW_SCALE, height: H * PREVIEW_SCALE }}
          onClick={() => setPaused(p => !p)} title="Kliknutím pauza/play">
          {d.template === "C"
            ? <TemplateC {...previewProps} headline={d.headline} sub={d.sub} scale={PREVIEW_SCALE} />
            : <TemplateD {...previewProps} words={d.words.filter(Boolean)} subHeadline={d.subHeadline} scale={PREVIEW_SCALE} />}
        </div>
      </div>

      {/* editace */}
      <div className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <select value={d.template} onChange={e => patch({ template: e.target.value as "C" | "D" })}
            className="bg-zinc-900 border border-white/20 px-2 py-1">
            <option value="C">Šablona C</option>
            <option value="D">Šablona D</option>
          </select>
          <select value={lang} onChange={e => patch({ lang: e.target.value as "cs" | "en" })}
            className="bg-zinc-900 border border-white/20 px-2 py-1">
            <option value="cs">CZ</option>
            <option value="en">EN</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={chromePreview} onChange={e => setChromePreview(e.target.checked)} />
            IG chrome (náhled)
          </label>
          {d.textSource === "ai" && <span className="text-xs text-purple-400">AI text</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Délka snímku · {duration} ms</span>
          <input type="range" min={800} max={5000} step={100} value={duration}
            onChange={e => patch({ durationMs: +e.target.value })} className="flex-1" />
        </div>

        {d.template === "C" ? (
          <>
            <textarea value={d.headline} onChange={e => patch({ headline: e.target.value })}
              placeholder="Headline" rows={2} className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
            <input value={d.sub} onChange={e => patch({ sub: e.target.value })}
              placeholder="Podtitulek" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
          </>
        ) : (
          <>
            <input value={d.words.join(", ")} onChange={e => patch({ words: e.target.value.split(",").map(w => w.trim()) })}
              placeholder="Slova oddělená čárkou" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
            <input value={d.subHeadline} onChange={e => patch({ subHeadline: e.target.value })}
              placeholder="Podtitulek" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
          </>
        )}

        {/* fotky: výměna + focal point */}
        <div className="space-y-2">
          {d.photos.map((p, i) => (
            <div key={`${p.publicId}-${i}`} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cloudinaryUrl(p.publicId, "w_64,h_64,c_fill,q_auto,f_auto")} alt="" className="w-8 h-8 object-cover" />
              <select value={p.publicId}
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, publicId: e.target.value } : pp) })}
                className="bg-zinc-900 border border-white/20 px-1 py-0.5 text-xs flex-1">
                {galleryPhotos.map(g => <option key={g.publicId} value={g.publicId}>{g.publicId}</option>)}
              </select>
              <label className="text-xs text-gray-500">x</label>
              <input type="range" min={0} max={100} value={p.x} className="w-16"
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, x: +e.target.value } : pp) })} />
              <label className="text-xs text-gray-500">y</label>
              <input type="range" min={0} max={100} value={p.y} className="w-16"
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, y: +e.target.value } : pp) })} />
              <button className="text-xs text-gray-500 hover:text-red-400"
                onClick={() => patch({ photos: d.photos.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          {d.photos.length < 6 && (
            <div className="flex gap-2">
              <button className="text-xs border border-white/20 px-2 py-1"
                disabled={galleryPhotos.length === 0}
                onClick={() => patch({ photos: [...d.photos, { publicId: galleryPhotos[0]?.publicId ?? "", x: 50, y: 50 }] })}>
                + z portfolia
              </button>
              <button className="text-xs border border-white/20 px-2 py-1"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Nahrávám…" : "+ z disku"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => uploadFromDisk(e.target.files)} />
            </div>
          )}
        </div>

        {/* akce */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
            className="bg-zinc-900 border border-white/20 px-2 py-1" />
          <button onClick={save} className="border border-white/20 px-3 py-1.5 hover:border-white/50">Uložit</button>
          <button onClick={downloadMp4} disabled={!canRender}
            className="border border-white/20 px-3 py-1.5 hover:border-white/50 disabled:opacity-30">
            ↓ MP4
          </button>
          <button onClick={approve} disabled={!publishAt || !canRender}
            className="bg-amber-500 text-black px-3 py-1.5 font-medium disabled:opacity-30">
            {exporting ? `Renderuji… ${Math.round(progress * 100)}%` : "Schválit + naplánovat"}
          </button>
          <button onClick={remove} className="text-gray-500 hover:text-red-400 ml-auto">Zamítnout</button>
        </div>
      </div>

      {/* skrytý full-res kontejner pro export */}
      <div ref={exportRef} style={{
        position: "fixed", top: "-9999px", left: "-9999px",
        width: W, height: H, pointerEvents: "none", overflow: "hidden",
      }}>
        {d.template === "C"
          ? <TemplateC {...templateProps} headline={d.headline} sub={d.sub} scale={1} exportTick={exportTick} />
          : <TemplateD {...templateProps} words={d.words.filter(Boolean)} subHeadline={d.subHeadline} scale={1} exportTick={exportTick} />}
      </div>
    </div>
  );
}
